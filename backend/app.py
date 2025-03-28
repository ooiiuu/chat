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

app = Flask(__name__)
CORS(app, supports_credentials=True)  # 启用跨域带凭证
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/chat'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['TEMPLATES_AUTO_RELOAD'] = True

# 初始化扩展
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

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
    message = data.get('message')
    option = data.get('option')
    if option == "文案":
        message = f"""
【{message}】主题公益海报创作
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
Stable Diffusion 对否定词（如“不”）处理不佳。尽量使用肯定的描述。
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
        message = f"根据文案'{message}'体现出主题用英文给StableDiffusion写一段prompt提示词用于生产公益海报的背景,{note}"
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
        for chunk in response:
            content = chunk.choices[0].delta.content
            if content is not None:
                yield content
    return Response(generate(), content_type='text/plain')

@app.route('/image', methods=['POST'])
def image():
    data = request.json
    message = data.get('message')
    
    # 调用图像生成API
    api_url = URL+"/image"
    response = requests.post(api_url, json={'prompt': message})
    respond_data = response.json()
    if response.status_code == 200:
        return jsonify({
            "status": "success",
            "message": "Data received successfully",
            "respond": {
              "img_base64":respond_data["respond"]["img_base64"]
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

@app.route('/generate-template', methods=['POST'])
def generate_template():
    data = request.json
    theme = data.get('theme')
    text = data.get('copyText')
    size = data.get('size')
    styles = data.get('styles', [])
    color_scheme = data.get('colorScheme')
    
    try:
        # 生成背景图像
        background_prompt = f"Create a background image for a poster with theme: {theme}, text content: {text}, style: {', '.join(styles)}, color scheme: {color_scheme}"
        background_response = requests.post(URL+"/image", json={'prompt': background_prompt})
        background_data = background_response.json()
        
        # 生成图标
        icon_prompt = f"Create a simple icon related to: {theme}, {text}, style: minimalist, single color"
        icon_response = requests.post(URL+"/image", json={'prompt': icon_prompt})
        icon_data = icon_response.json()
        
        # 构建模板数据
        template = {
            "id": str(uuid.uuid4()),
            "theme": theme,
            "size": size,
            "backgroundImage": background_data["respond"]["img_base64"],
            "icon": icon_data["respond"]["img_base64"],
            "text": text,
            "styles": styles,
            "colorScheme": color_scheme,
            "created": datetime.now().isoformat()
        }
        
        return jsonify({
            "status": "success",
            "template": template
        })
    except Exception as e:
        app.logger.error(f"模板生成错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"模板生成失败: {str(e)}"
        }), 500

@app.route('/generate-template-variations', methods=['POST'])
def generate_template_variations():
    data = request.json
    base_template = data.get('template')
    variation_count = data.get('count', 3)
    
    try:
        variations = []
        
        for i in range(variation_count):
            # 生成不同背景
            background_prompt = f"Create a different background image for a poster with theme: {base_template['theme']}, text content: {base_template['text']}, style: {', '.join(base_template['styles'])}, color scheme: {base_template['colorScheme']}, variation {i+1}"
            background_response = requests.post(URL+"/image", json={'prompt': background_prompt})
            background_data = background_response.json()
            
            # 生成不同图标
            icon_prompt = f"Create a different simple icon related to: {base_template['theme']}, {base_template['text']}, style: minimalist, single color, variation {i+1}"
            icon_response = requests.post(URL+"/image", json={'prompt': icon_prompt})
            icon_data = icon_response.json()
            
            # 构建变体模板
            variation = {
                "id": str(uuid.uuid4()),
                "theme": base_template['theme'],
                "size": base_template['size'],
                "backgroundImage": background_data["respond"]["img_base64"],
                "icon": icon_data["respond"]["img_base64"],
                "text": base_template['text'],
                "styles": base_template['styles'],
                "colorScheme": base_template['colorScheme'],
                "created": datetime.now().isoformat()
            }
            
            variations.append(variation)
        
        return jsonify({
            "status": "success",
            "variations": variations
        })
    except Exception as e:
        app.logger.error(f"模板变体生成错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"模板变体生成失败: {str(e)}"
        }), 500

@app.route('/generate-background', methods=['POST'])
def generate_background():
    data = request.json
    theme = data.get('theme')
    text = data.get('text')
    styles = data.get('styles', [])
    color_scheme = data.get('colorScheme')
    
    try:
        # 生成背景图像
        background_prompt = f"Create a background image for a poster with theme: {theme}, text content: {text}, style: {', '.join(styles)}, color scheme: {color_scheme}"
        background_response = requests.post(URL+"/image", json={'prompt': background_prompt})
        background_data = background_response.json()
        
        return jsonify({
            "status": "success",
            "backgroundImage": background_data["respond"]["img_base64"]
        })
    except Exception as e:
        app.logger.error(f"背景生成错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"背景生成失败: {str(e)}"
        }), 500

@app.route('/generate-icon', methods=['POST'])
def generate_icon():
    data = request.json
    theme = data.get('theme')
    text = data.get('text')
    
    try:
        # 生成图标
        icon_prompt = f"Create a simple icon related to: {theme}, {text}, style: minimalist, single color"
        icon_response = requests.post(URL+"/image", json={'prompt': icon_prompt})
        icon_data = icon_response.json()
        
        return jsonify({
            "status": "success",
            "icon": icon_data["respond"]["img_base64"]
        })
    except Exception as e:
        app.logger.error(f"图标生成错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"图标生成失败: {str(e)}"
        }), 500

@app.route('/save-template', methods=['POST'])
def save_template():
    data = request.json
    template = data.get('template')
    
    try:
        # 这里可以添加保存到数据库的逻辑
        # 简单起见，这里只返回成功
        return jsonify({
            "status": "success",
            "message": "模板保存成功",
            "templateId": template.get('id')
        })
    except Exception as e:
        app.logger.error(f"模板保存错误: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"模板保存失败: {str(e)}"
        }), 500



# ---------- 初始化应用 ----------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
