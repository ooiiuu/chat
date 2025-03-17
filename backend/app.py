from flask import Flask, request, jsonify, Response
import requests
from flask_cors import CORS
import re
from PIL import Image
import base64
import io
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
load_dotenv() 

URL = os.getenv("API_URL")

app = Flask(__name__)
CORS(app)  # 允许所有来源访问所有路由

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



if __name__ == '__main__':
    pass
    app.run(debug=True)
    # image_test("marine conservation, ocean preservation, blue horizon, coral reef, biodiversity, sea turtle, dolphin, underwater exploration, sustainable fishing, coastal ecosystem, environmental protection")
