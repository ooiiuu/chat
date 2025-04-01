from flask import Flask, request, jsonify, Response, render_template, redirect, url_for, flash, current_app
from flask_cors import CORS
import re
import os
import uuid
from datetime import datetime
import json
import base64
import requests
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from wtforms.validators import Regexp
from openai import OpenAI
import io
load_dotenv()
URL = os.getenv("API_URL")
DEEP_API_KEY = os.getenv("DEEP_API_KEY")


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bytes):
            return obj.decode('utf-8')
        elif isinstance(obj, datetime):
            return obj.isoformat()  # 确保datetime以ISO格式返回
        return super().default(obj)

app = Flask(__name__)
CORS(app, supports_credentials=True)  # 启用跨域带凭证
app.json_encoder = CustomJSONEncoder
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/chat?charset=utf8mb4'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['TEMPLATES_AUTO_RELOAD'] = True

# 初始化扩展
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'


# ---------- 会话模型 ----------
class Conversation(db.Model):
    __tablename__ = 'conversations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(100), nullable=True)  # 修改这行，改为nullable=True
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

# ---------- 消息模型 ----------
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # 添加这行
    role = db.Column(db.String(20), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())
    has_image = db.Column(db.Boolean, default=None)
    image_data = db.Column(db.Text, nullable=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=True)


# ---------- 用户模型 ----------
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.current_timestamp())

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

# ---------- 表单类 ----------
class RegistrationForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(),
        Length(min=4, max=20)
    ])
    email = StringField('邮箱', validators=[
        DataRequired(), 
        Email()
    ])
    password = PasswordField('密码', validators=[
        DataRequired(),
        Length(min=8),
        Regexp(r'^(?=.*[A-Za-z])(?=.*\d)', message="必须包含字母和数字")
    ])
    confirm_password = PasswordField('确认密码', validators=[
        DataRequired(),
        EqualTo('password')
    ])
    submit = SubmitField('注册')

    def validate_username(self, field):
        if User.query.filter_by(username=field.data).first():
            raise ValidationError('用户名已被使用')

    def validate_email(self, field):
        if User.query.filter_by(email=field.data).first():
            raise ValidationError('邮箱已被注册')

class LoginForm(FlaskForm):
    username_or_email = StringField('用户名/邮箱', validators=[DataRequired()])
    password = PasswordField('密码', validators=[DataRequired()])
    submit = SubmitField('登录')

# ---------- 认证路由 ----------
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# @app.before_request
# def check_active_session():
#     if request.endpoint in ['login', 'register']:
#         return
#     if not current_user.is_authenticated:
#         return jsonify({"status": "error", "message": "未授权"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    # 手动验证数据
    errors = {}

    # 检查用户名是否重复
    if User.query.filter_by(username=data['username']).first():
        errors['username'] = ['该用户名已被使用']
    
    # 检查邮箱是否重复
    if User.query.filter_by(email=data['email']).first():
        errors['email'] = ['该邮箱已被注册']
    
    # 检查密码复杂度
    if not re.match(r'^(?=.*[A-Za-z])(?=.*\d)', data['password']):
        errors['password'] = ['必须包含字母和数字']
    
    # 确认密码匹配
    if data['password'] != data['confirm_password']:
        errors['confirm_password'] = ['两次密码不一致']

    if errors:
        return jsonify({
            "status": "error",
            "message": "验证失败",
            "errors": errors
        }), 400

    try:
        user = User(
            username=data['username'],
            email=data['email']
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": "注册成功"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter(
        (User.username == data['identifier']) |
        (User.email == data['identifier'])
    ).first()

    if not user:
        return jsonify({
            "status": "error",
            "message": "用户不存在"
        }), 401

    if not user.check_password(data['password']):
        return jsonify({
            "status": "error",
            "message": "密码错误"
        }), 401

    login_user(user)
    return jsonify({
        "status": "success",
        "message": "登录成功",
        "user": {
            "id": user.id,
            "username": user.username
        }
    })

@app.route('/logout')
def logout():
    if current_user.is_authenticated:
        logout_user()
        print("登出成功")
    return jsonify({"status": "success", "message": "登出成功"})

@app.route('/dashboard')
@login_required
def dashboard():
    return jsonify({"status": "success", "message": "欢迎进入仪表盘"})

def remove_think_block(text):
    # 去除think
    return re.sub(r'<think>\n.*?\n</think>\n\n', '', text, flags=re.DOTALL)

@app.route('/remove_think',methods=['POST'])
def remove_think():
    data = request.json
    message = data.get('message')
    return jsonify({"prompt":remove_think_block(message)})

# @app.route('/chat', methods=['POST'])
# def chat():
#     headers={"ngrok-skip-browser-warning":"122131"}
#     data = request.json
#     message = data.get('message')
#     option = data.get('option')
#     if option == "文案":
#         api_url = URL+"/generateCopywritingPromptWithThinkStream"
#     else:
#         api_url = URL+"/generateImagePromptWithThinkStream"
#     response = requests.post(api_url, json={'message': message}, stream=True,headers=headers)
    
#     def generate():
#         for chunk in response.iter_content(chunk_size=None):
#             if chunk:
#                 yield chunk.decode('utf-8')
    
#     return Response(generate(), content_type='text/plain')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message_content = data.get('message')
    option = data.get('option')
    user_id = data.get('user_id')
    conversation_id = data.get('conversation_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    # 检查会话是否存在且归属于指定用户
    if conversation_id:
        conversation = Conversation.query.filter_by(
            id=conversation_id, 
            user_id=user_id
        ).first()
        
        if not conversation:
            return jsonify({
                "status": "error",
                "message": "无效的会话ID"
            }), 400
    else:
        # 如果没有提供会话ID，创建新会话
        conversation = Conversation(
            user_id=user_id,
            title=f"会话 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        db.session.add(conversation)
        db.session.commit()
        conversation_id = conversation.id
    
    # 保存用户消息到数据库
    user_message = Message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="user",
        content=message_content
    )
    db.session.add(user_message)
    
    # 更新会话的更新时间
    conversation.updated_at = datetime.now()
    db.session.commit()
    
    # 处理聊天逻辑
    if option == "文案":
        message = f"""
【{message_content}】主题公益海报创作
Think环节要求：

分析主题核心痛点，提取3个最具传播力的关键词

结合受众心理设计情感共鸣点（恐惧/希望/责任三选一）

参照经典公益广告结构设计叙事逻辑

匹配不同传播场景（线上/线下）调整语言风格

Output格式：
[主题凝练] 用5字以内提炼核心主张
[震撼标语] 15字内押韵口号+❗️表情强调
[视觉隐喻] 提供2个符号化视觉元素建议（如：断裂的冰柱象征生态危机）
[分层文案]
主文案：30字内故事化叙述
副文案：12字内行动呼吁
数据支撑：1组相关权威数据（2020年后）

使用示例：
输入：请生成冰川保护的公益文案
输出：
[主题凝练] 冰封倒计时
[震撼标语] 每一滴融化，都在改写未来❗️
[视觉隐喻] 沙漏中的冰川/温度计形状的裂缝
[分层文案]
主：当格陵兰岛的冰盖消退速度比预期快3倍，我们的时间刻度正在失效
副：降温行动需要57亿双手
数据：NASA2023报告显示北极海冰面积较1980s减少40%
"""
    else:
        note = """要求：
1. 精简关键词
提取核心关键词，避免冗长的句子。Stable Diffusion 对关键词更敏感，不需要完整的句子。
示例：
不好："A beautiful and detailed image of a futuristic cityscape at sunset with flying cars and neon lights."
好："futuristic cityscape, sunset, flying cars, neon lights"
2. 使用具体描述
虽然需要简洁，但描述越具体，生成的图片越符合你的期望。可以使用逗号分隔多个关键词，避免使用长句。
示例：
不好："A picture of a cat sitting on a windowsill."
好："cat, sitting, windowsill, sunny afternoon"
3. 避免冗余信息
确保提示词中没有重复或冗余的内容。每个关键词或短语都应该提供独特的信息。
示例：
不好："sustainable agriculture, sustainable farming, environmental balance, ecological balance"
好："sustainable agriculture, environmental balance"
4. 控制标记数量
检查提示词的标记数量，确保不超过 77 个标记。
5. 使用逗号分隔关键词
逗号是分隔关键词的好方法，它可以帮助模型更好地理解每个概念。
示例：
不好："A detailed image of a cat sitting on a windowsill with a view of the city."
好："cat, sitting, windowsill, city view"
6. 避免使用否定词
Stable Diffusion 对否定词（如"不"）处理不佳。尽量使用肯定的描述。
示例：
不好："A cat that is not sitting."
好："cat, standing"
7. 使用细节描述
虽然需要简洁，但适当的细节描述可以帮助模型生成更高质量的图片。
示例：
不好："A cat."
好："cat, fluffy fur, green eyes, sitting"
8、直接输出提升词
在你的正式回答中直接输出提示词
比如直接输入"futuristic cityscape, sunset, flying cars, neon lights"
9、使用英文
使用英文的提示词，而不是中文
示例：
不好："猫， 坐着， 窗台， 城市景观"
好："cat, sitting, windowsill, city view"
"""
        message = f"根据文案'{message_content}'体现出主题用英文给StableDiffusion写一段prompt提示词用于生产公益海报的背景,{note}"
    
    client = OpenAI(api_key=DEEP_API_KEY, base_url="https://api.deepseek.com")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": message},
        ],
        stream=True  # 启用流式输出
    )
    
    def generate():
        accumulated_response = ""
        with app.app_context():  # 添加上下文
            for chunk in response:
                content = chunk.choices[0].delta.content
                if content is not None:
                    accumulated_response += content
                    yield content

            # 保存AI回复到数据库
            assistant_message = Message(
                user_id=user_id,
                conversation_id=conversation_id,
                role="assistant",
                content=accumulated_response,
                has_image=False
            )
            db.session.add(assistant_message)
            print("assistant_message", assistant_message)
            conversation.updated_at = datetime.now()
            db.session.commit()
    
    return Response(generate(), content_type='text/plain')

@app.route('/image', methods=['POST'])
def image():
    data = request.json
    prompt = data.get('message')
    user_id = data.get('user_id')
    conversation_id = data.get('conversation_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    # 验证会话归属
    if conversation_id:
        conversation = Conversation.query.filter_by(
            id=conversation_id, 
            user_id=user_id
        ).first()
        
        if not conversation:
            return jsonify({
                "status": "error",
                "message": "无效的会话ID"
            }), 400
    
    # 调用图像生成API
    api_url = URL+"/image"
    headers = {
        "ngrok-skip-browser-warning": "122131"
    }
    response = requests.post(api_url, headers=headers,json={'prompt': prompt})
    # print("response.text", response.text)
    # print("response.status_code", response.status_code)
    respond_data = response.json()
    
    if response.status_code == 200 and respond_data.get("status") == "success":
        # 保存图像数据到数据库
        if conversation_id:
            image_message = Message(
                user_id=user_id,
                conversation_id=conversation_id,
                role="assistant",
                content="生成的图片",
                has_image=True,
                image_data=respond_data["respond"]["img_base64"]
            )
            db.session.add(image_message)
            
            # 更新会话的更新时间
            conversation.updated_at = datetime.now()
            db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Image generated successfully",
            "respond": {
              "img_base64": respond_data["respond"]["img_base64"]
            }
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Failed to generate image"
        }), 500

# 以下还没测试   
# @app.route('/image', methods=['POST'])
# def image():
#     data = request.json
#     message = data.get('message')
    
#     # 从环境变量获取API密钥
#     stability_api_key = os.getenv("STABILITY_API_KEY")
    
#     if not stability_api_key:
#         app.logger.error("Stability API key not configured")
#         return jsonify({
#             "status": "error",
#             "message": "API key not configured"
#         }), 500
    
#     # 使用新的v2beta API endpoint
#     api_url = "https://api.stability.ai/v2beta/stable-image/generate/core"
    
#     headers = {
#         "Authorization": f"{stability_api_key}",
#         "Accept": "application/json"
#     }
    
#     files = {
#         "none": ''
#     }
#     data = {
#         "prompt": message,
#         "output_format": "png"
#     }
    
#     try:
#         response = requests.post(api_url, headers=headers, files=files,data=data)
        
#         if response.status_code == 200:
#             # img_byte_arr = io.BytesIO()
#             # img_byte_arr.write(response.content)
#             # img_byte_arr = img_byte_arr.getvalue()
#             img_base64 = base64.b64encode(response.content).decode('utf-8')
#             return jsonify({
#                 "status": "success",
#                 "message": "Image generated successfully",
#                 "respond": {
#                     "img_base64": img_base64
#                 }
#             })
#         else:
#             error_message = f"Stability API error: {response.status_code}"
#             try:
#                 error_detail = response.json()
#                 error_message += f", {json.dumps(error_detail)}"
#             except:
#                 error_message += f", {response.text}"
            
#             app.logger.error(error_message)
#             return jsonify({
#                 "status": "error",
#                 "message": "Failed to generate image",
#                 "details": response.text
#             }), 500
#     except Exception as e:
#         app.logger.error(f"Exception in image generation: {str(e)}")
#         return jsonify({
#             "status": "error",
#             "message": f"Failed to generate image: {str(e)}"
#         }), 500

@app.route('/save-edited-image', methods=['POST'])
def save_edited_image():
    data = request.json
    user_id = data.get('user_id')
    conversation_id = data.get('conversation_id')
    image_data = data.get('image_data')
    
    if not user_id or not conversation_id or not image_data:
        return jsonify({"status": "error", "message": "缺少必要参数"}), 400
    
    # 验证会话归属
    conversation = Conversation.query.filter_by(
        id=conversation_id, 
        user_id=user_id
    ).first()
    
    if not conversation:
        return jsonify({
            "status": "error",
            "message": "无效的会话ID"
        }), 400
    
    # 保存编辑后的图片到数据库
    edited_image_message = Message(
        user_id=user_id,
        conversation_id=conversation_id,
        role="assistant",
        content="编辑后的图片",
        has_image=True,
        image_data=image_data
    )
    db.session.add(edited_image_message)
    conversation.updated_at = datetime.now()
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "编辑后的图片已保存"
    })



# 获取用户历史会话列表
@app.route('/api/conversations', methods=['GET'])
def get_conversations():
    # 从请求中获取用户ID
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    # 查询用户的所有会话，按更新时间排序
    conversations = Conversation.query.filter_by(user_id=user_id).order_by(Conversation.updated_at.desc()).all()
    
    result = []
    for conv in conversations:
        # 获取每个会话的最后一条消息作为预览
        last_message = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc()).first()
        preview = last_message.content[:50] + "..." if last_message and len(last_message.content) > 50 else (last_message.content if last_message else "")
        
        result.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "preview": preview
        })
    
    return jsonify({"status": "success", "conversations": result})

# 获取特定会话的所有消息
@app.route('/api/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id):
    # 从请求中获取用户ID
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    # 验证会话属于当前用户
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"status": "error", "message": "会话不存在或无权访问"}), 404
    
    # 获取会话中的所有消息，按时间排序
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
    
    result = []
    for msg in messages:
        message_data = {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at
        }
        
        # 如果消息包含图片
        if msg.has_image and msg.image_data:
            message_data["has_image"] = True
            # 处理bytes类型数据
            if isinstance(msg.image_data, bytes):
                message_data["image_data"] = msg.image_data.decode('utf-8')
            else:
                message_data["image_data"] = msg.image_data
        
        result.append(message_data)
    
    return jsonify({
        "status": "success", 
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
            "messages": result
        }
    })

# 创建新会话
@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    data = request.get_json()
    user_id = data.get('user_id')
    title = data.get('title', f"会话 {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    conversation = Conversation(
        user_id=user_id,
        title=title
    )
    
    db.session.add(conversation)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "会话创建成功",
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at
        }
    })

# 更新会话标题
@app.route('/api/conversations/<int:conversation_id>', methods=['PUT'])
def update_conversation(conversation_id):
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"status": "error", "message": "会话不存在或无权访问"}), 404
    
    if 'title' in data:
        conversation.title = data['title']
        conversation.updated_at = datetime.now()
        db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "会话更新成功",
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "updated_at": conversation.updated_at
        }
    })

# 删除会话
@app.route('/api/conversations/<int:conversation_id>', methods=['DELETE'])
def delete_conversation(conversation_id):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"status": "error", "message": "会话不存在或无权访问"}), 404
    
    # 首先删除关联的所有消息
    Message.query.filter_by(conversation_id=conversation_id).delete()
    
    # 然后删除会话本身
    db.session.delete(conversation)
    db.session.commit()
    
    return jsonify({
        "status": "success",
        "message": "会话删除成功"
    })

# 搜索历史会话和消息
@app.route('/api/search', methods=['GET'])
def search_history():
    user_id = request.args.get('user_id')
    query = request.args.get('q', '')
    
    if not user_id:
        return jsonify({"status": "error", "message": "缺少用户ID"}), 400
    
    if not query or len(query) < 2:
        return jsonify({"status": "error", "message": "搜索关键词太短"}), 400
    
    # 搜索会话标题
    conversations = Conversation.query.filter(
        Conversation.user_id == user_id,
        Conversation.title.like(f'%{query}%')
    ).all()
    
    # 搜索消息内容
    messages = Message.query.join(Conversation).filter(
        Conversation.user_id == user_id,
        Message.content.like(f'%{query}%')
    ).all()
    
    # 组织搜索结果
    conversation_results = []
    for conv in conversations:
        conversation_results.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "match_type": "title"
        })
    
    message_results = []
    conv_ids = set()
    for msg in messages:
        if msg.conversation_id not in conv_ids:
            conv = Conversation.query.get(msg.conversation_id)
            message_results.append({
                "conversation_id": msg.conversation_id,
                "conversation_title": conv.title,
                "message_preview": msg.content[:100] + "..." if len(msg.content) > 100 else msg.content,
                "created_at": msg.created_at,
                "match_type": "content"
            })
            conv_ids.add(msg.conversation_id)
    
    return jsonify({
        "status": "success",
        "results": {
            "conversations": conversation_results,
            "messages": message_results
        }
    })

# ---------- 初始化应用 ----------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
