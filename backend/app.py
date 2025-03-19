from flask import Flask, request, jsonify, Response, render_template, redirect, url_for, flash, current_app
from flask_cors import CORS
import re
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo, ValidationError
from wtforms.validators import Regexp

load_dotenv()
URL = os.getenv("API_URL")

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

@app.before_request
def check_active_session():
    if request.endpoint in ['login', 'register']:
        return
    if not current_user.is_authenticated:
        return jsonify({"status": "error", "message": "未授权"}), 401

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

@app.route('/chat', methods=['POST'])
def chat():
    headers={"ngrok-skip-browser-warning":"122131"}
    data = request.json
    message = data.get('message')
    option = data.get('option')
    if option == "文案":
        api_url = URL+"/generateCopywritingPromptWithThinkStream"
    else:
        api_url = URL+"/generateImagePromptWithThinkStream"
    response = requests.post(api_url, json={'message': message}, stream=True,headers=headers)
    
    def generate():
        for chunk in response.iter_content(chunk_size=None):
            if chunk:
                yield chunk.decode('utf-8')
    
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
@login_required
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
