<!-- src/components/ImageEditor.vue -->
<template>
  <div class="editor-container">
    <div class="editor-header">
      <button @click="goBack" class="back-button">保存并返回</button>
      <button @click="cancel" class="cancel-button">取消</button>
    </div>

    <div id="tui-image-editor"></div>
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
      instance: null
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

            uiSize: {
              width: '100%',
              height: '100%'
            },

            theme: {
              'header.display': 'none',      
              'loadButton.display': 'none',  
              'downloadButton.display': 'none' 
            }
          },
          cssMaxWidth: window.innerWidth,
          cssMaxHeight: window.innerHeight - 60,
          text: {
            styles: {
              fill: '#ffffff',      
              stroke: '#000000',    
              strokeWidth: 2,       
              fontSize: 40,         
              fontWeight: 'bold',   
            }
          }
        }
      );
      
      document.querySelector('.tui-image-editor-header').style.top = '30px';
      document.querySelector('.tui-image-editor-main').style.marginTop = '60px';
      document.querySelector('.tui-image-editor-main').style.paddingBottom = '160px';
      document.querySelector('.lower-canvas').style.paddingBottom = '160px';

      this.$nextTick(() => {
        setTimeout(() => {
          this.instance.loadImageFromURL(decodedImageSrc, 'SampleImage').then(() => {
            console.log('Image loaded successfully');
            document.getElementsByClassName("tui-image-editor-main")[0].style.top = "0";
          }).catch(err => {
            console.error('Failed to load image:', err);
          });
        }, 100);
      });
    },

    goBack() {
      if (this.instance) {
        const dataUrl = this.instance.toDataURL();
        const base64Data = dataUrl.split(',')[1];
        const userId = this.$store.getters['auth/currentUser']?.id;
        const conversationId = this.$route.query.conversationId;

        if (userId && conversationId) {
          fetch('http://127.0.0.1:5000/save-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              conversation_id: conversationId,
              image_data: base64Data,
              content: '编辑后的图片'
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
  height: calc(100vh - 60px);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #ddd;
}

.back-button {
  padding: 5px 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  padding: 5px 10px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

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