<template>
  <div class="editor-container">
    <button @click="goBack" class="back-button">保存并返回</button>
    <button @click="cancel" class="cancel-button">取消</button>
    
    <div id="tui-image-editor"></div>
    
    <!-- 文字添加控制面板移到底部，增加字体大小控制 -->
    <div class="text-controls-bottom">
      <input v-model="textContent" placeholder="输入要添加的文字" class="text-input" />
      <div class="coordinates-inputs">
        <label>X: <input type="number" v-model.number="textX" class="coord-input" /></label>
        <label>Y: <input type="number" v-model.number="textY" class="coord-input" /></label>
        <!-- 添加字体大小控制 -->
        <label>字号: <input type="number" v-model.number="fontSize" min="10" max="200" class="size-input" /></label>
      </div>
      <button @click="addTextAtCoordinates" class="add-text-btn">添加文字</button>
    </div>
  </div>
</template>

<script>
import "tui-image-editor/dist/tui-image-editor.css";
import "tui-color-picker/dist/tui-color-picker.css";
import ImageEditor from "tui-image-editor";

const locale_zh = {
  // ... 保持原有的本地化配置 ...
  ZoomIn: "放大",
  ZoomOut: "缩小",
  Hand: "手掌",
  History: '历史',
  Resize: '调整宽高',
  Crop: "裁剪",
  DeleteAll: "全部删除",
  Delete: "删除",
  Undo: "撤销",
  Redo: "反撤销",
  Reset: "重置",
  Flip: "镜像",
  Rotate: "旋转",
  Draw: "画",
  Shape: "形状标注",
  Icon: "图标标注",
  Text: "文字标注",
  Mask: "遮罩",
  Filter: "滤镜",
  Bold: "加粗",
  Italic: "斜体",
  Underline: "下划线",
  Left: "左对齐",
  Center: "居中",
  Right: "右对齐",
  Color: "颜色",
  "Text size": "字体大小",
  Custom: "自定义",
  Square: "正方形",
  Apply: "应用",
  Cancel: "取消",
  "Flip X": "X 轴",
  "Flip Y": "Y 轴",
  Range: "区间",
  Stroke: "描边",
  Fill: "填充",
  Circle: "圆",
  Triangle: "三角",
  Rectangle: "矩形",
  Free: "曲线",
  Straight: "直线",
  Arrow: "箭头",
  "Arrow-2": "箭头2",
  "Arrow-3": "箭头3",
  "Star-1": "星星1",
  "Star-2": "星星2",
  Polygon: "多边形",
  Location: "定位",
  Heart: "心形",
  Bubble: "气泡",
  "Custom icon": "自定义图标",
  "Load Mask Image": "加载蒙层图片",
  Grayscale: "灰度",
  Blur: "模糊",
  Sharpen: "锐化",
  Emboss: "浮雕",
  "Remove White": "除去白色",
  Distance: "距离",
  Brightness: "亮度",
  Noise: "噪音",
  "Color Filter": "彩色滤镜",
  Sepia: "棕色",
  Sepia2: "棕色2",
  Invert: "负片",
  Pixelate: "像素化",
  Threshold: "阈值",
  Tint: "色调",
  Multiply: "正片叠底",
  Blend: "混合色",
  Width: "宽度",
  Height: "高度",
  "Lock Aspect Ratio": "锁定宽高比例",
};
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    return {
      imageSrc: route.params.imageSrc
    }
  },
  props: ['imageSrc'],
  data() {
    return {
      instance: null,
      textContent: '公益海报文字123',  // 默认文字内容
      textX: 100,                 // 默认X坐标
      textY: 100,                 // 默认Y坐标
      fontSize: 40,               // 默认字体大小
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      if (!this.imageSrc) {
        console.error('No image source provided');
        return;
      }

      const decodedImageSrc = decodeURIComponent(this.imageSrc);

      this.instance = new ImageEditor(
        document.querySelector("#tui-image-editor"),
        {
          includeUI: {
            loadImage: {
              path: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // 使用一个1x1像素的透明图片
              name: "SampleImage",
            },
            initMenu: "draw",
            menuBarPosition: "bottom",
            locale: locale_zh,
            
            // 添加这些配置选项来隐藏顶部的工具栏
            uiSize: {
              width: '100%',
              height: '100%'
            },
            
            // 隐藏顶部的标题和图标
            theme: {
              'header.display': 'none',      // 隐藏整个顶部标题栏
              'loadButton.display': 'none',  // 隐藏加载按钮
              'downloadButton.display': 'none' // 隐藏下载按钮  
            }
          },
          cssMaxWidth: window.innerWidth,
          cssMaxHeight: window.innerHeight - 60, // 减小高度，为底部控制面板留出空间
          text: {
            styles: {
              fill: '#ffffff',      // 默认文字颜色：白色
              stroke: '#000000',    // 默认描边颜色：黑色
              strokeWidth: 2,       // 默认描边宽度
              fontSize: 40,         // 默认字体大小
              fontWeight: 'bold',   // 默认粗体
            }
          }
        }
      );
      
      // 使用 nextTick 确保 DOM 已更新
      this.$nextTick(() => {
        // 延迟一小段时间再加载实际图片
        setTimeout(() => {
          this.instance.loadImageFromURL(decodedImageSrc, 'SampleImage').then(() => {
            console.log('Image loaded successfully');
            // 确保图片加载后再调整UI
            document.getElementsByClassName("tui-image-editor-main")[0].style.top = "0";
          }).catch(err => {
            console.error('Failed to load image:', err);
          });
        }, 100);
      });
    },
    
    // 在指定坐标添加文字，使用用户指定的字体大小
    addTextAtCoordinates() {
      if (!this.instance || !this.textContent.trim()) return;
      
      // 停止所有绘图模式
      this.instance.stopDrawingMode();
      this.instance.changeSelectableAll(true);
      
      // 限制字体大小范围
      const fontSize = Math.min(Math.max(this.fontSize, 10), 200);
      
      // 文字样式配置
      const textOptions = {
        styles: {
          fill: '#ffffff',          // 文字颜色：白色
          fontSize: fontSize,       // 使用用户设置的字体大小
          fontWeight: 'bold',       // 粗体
          textAlign: 'center',      // 居中对齐
          stroke: '#000000',        // 描边颜色：黑色
          strokeWidth: 2            // 描边宽度
        },
        position: {
          x: this.textX,            // 使用指定的X坐标
          y: this.textY             // 使用指定的Y坐标
        }
      };
      
      // 添加文字到画布
      this.instance.addText(this.textContent, textOptions);
    },
    
    goBack() {
      if (this.instance) {
        const dataUrl = this.instance.toDataURL();

        // 从 dataUrl 中提取 base64 数据（去掉前缀如 "data:image/png;base64,"）
        const base64Data = dataUrl.split(',')[1];

        // 获取用户 ID 和会话 ID
        const userId = this.$store.getters['auth/currentUser']?.id;
        const conversationId = this.$route.query.conversationId;

        if (userId && conversationId) {
          // 发送请求保存编辑后的图片到数据库
          fetch('http://127.0.0.1:5000/save-edited-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              conversation_id: conversationId,
              image_data: base64Data
            })
          })
            .then(response => response.json())
            .then(data => {
              console.log('保存编辑后图片成功:', data);
            })
            .catch(error => {
              console.error('保存编辑后图片失败:', error);
            });
        }

        // 使用 Vuex 存储编辑后的图片（用于前端显示）
        this.$store.dispatch('setEditedImage', dataUrl);
        this.$router.push({ name: 'Chat' });
      } else {
        this.$router.push({ name: 'Chat' });
      }
    },
    
    cancel() {
      this.$router.push({ name: 'Chat' });
    }
  }
};
</script>

<style scoped>
.editor-container {
  position: relative;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

#tui-image-editor {
  flex: 1;
  width: 100%;
  height: calc(100vh - 60px); /* 减去底部控制面板的高度 */
}

.back-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  padding: 5px 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 底部文字控制面板样式 */
.text-controls-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.95);
  padding: 10px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  height: 50px;
}

.text-input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
}

.coordinates-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.coord-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.size-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.add-text-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-text-btn:hover {
  background-color: #45a049;
}

/* 添加深度选择器强制隐藏顶部元素 */
:deep(.tui-image-editor-header) {
  display: none !important;
}

:deep(.tui-image-editor-main) {
  top: 0 !important;
  padding-top: 0 !important;
}

:deep(.tie-btn-load) {
  display: none !important;
}

:deep(.tie-btn-download) {
  display: none !important;
}
</style>