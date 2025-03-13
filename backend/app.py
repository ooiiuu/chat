from flask import Flask, request, jsonify, Response
import requests
from flask_cors import CORS
import re
from PIL import Image
import base64
import io
import os
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
    
    # 调用API并流式返回响应
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
    
def image_test(prompt):
    api_url = URL+"/image"
    response = requests.post(api_url, json={'prompt': prompt})
    if response.status_code == 200:
        img = Image.open(io.BytesIO(base64.b64decode(response.json()['respond']['img_base64'])))
        img.show()
    else:
        print(jsonify({
            "status": "error",
            "message": "Failed to generate image"
        })) 

if __name__ == '__main__':
    pass
    app.run(debug=True)
    # image_test("marine conservation, ocean preservation, blue horizon, coral reef, biodiversity, sea turtle, dolphin, underwater exploration, sustainable fishing, coastal ecosystem, environmental protection")
