<template>
  <div class="editor-container">
    <div class="editor-header">
      <button @click="goBack" class="back-button">保存并返回</button>
      <button @click="cancel" class="cancel-button">取消</button>
    </div>

    <div id="tui-image-editor"></div>

    <!-- 文字添加控制面板在底部与编辑器同层 -->
    <div class="text-controls-bottom">
      <div class="text-controls-tabs">
        <div v-for="(tab, index) in ['文字1', '文字2', '文字3', '文字4', '文字5']" :key="index"
          :class="['tab', { active: activeTextTab === index }]" @click="activeTextTab = index">
          {{ tab }}
        </div>
      </div>

      <div class="text-control-content">
        <input v-model="textSettings[activeTextTab].content" placeholder="输入要添加的文字" class="text-input" />
        <div class="coordinates-inputs">
          <label>X: <input type="number" v-model.number="textSettings[activeTextTab].x" class="coord-input" /></label>
          <label>Y: <input type="number" v-model.number="textSettings[activeTextTab].y" class="coord-input" /></label>
          <label>字号: <input type="number" v-model.number="textSettings[activeTextTab].fontSize" min="10" max="200"
              class="size-input" /></label>
        </div>
        <button @click="addTextAtCoordinates" class="add-text-btn">添加文字{{ activeTextTab + 1 }}</button>
      </div>
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
      activeTextTab: 0,
      // 五段文字的设置，每段都有独立的内容、位置和字号
      textSettings: [
        { content: '公益海报主标题', x: 200, y: 100, fontSize: 50 },
        { content: '公益海报副标题', x: 200, y: 170, fontSize: 35 },
        { content: '宣传口号', x: 200, y: 250, fontSize: 30 },
        { content: '联系方式', x: 200, y: 400, fontSize: 20 },
        { content: '活动时间地点', x: 200, y: 450, fontSize: 18 }
      ]
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
      // 调整顶部工具栏位置
      document.querySelector('.tui-image-editor-header').style.top = '30px';

      // 调整画布位置
      document.querySelector('.tui-image-editor-main').style.marginTop = '60px';
      document.querySelector('.tui-image-editor-main').style.paddingBottom = '160px';  // 防止遮挡
      document.querySelector('.lower-canvas').style.paddingBottom = '160px';  // 针对画布层
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

    // 在指定坐标添加文字，使用当前选中的文字设置
    addTextAtCoordinates() {
      if (!this.instance) return;

      // 获取当前选中的文字设置
      const currentTextSetting = this.textSettings[this.activeTextTab];

      if (!currentTextSetting.content.trim()) {
        console.warn('文字内容不能为空');
        return;
      }

      // 停止所有绘图模式
      this.instance.stopDrawingMode();
      this.instance.changeSelectableAll(true);

      // 限制字体大小范围
      const fontSize = Math.min(Math.max(currentTextSetting.fontSize, 10), 200);

      // 文字样式配置
      const textOptions = {
        styles: {
          fill: '#ffffff',          // 文字颜色：白色
          fontSize: fontSize,       // 使用设置的字体大小
          fontWeight: 'bold',       // 粗体
          textAlign: 'center',      // 居中对齐
          stroke: '#000000',        // 描边颜色：黑色
          strokeWidth: 2            // 描边宽度
        },
        position: {
          x: currentTextSetting.x,  // 使用指定的X坐标
          y: currentTextSetting.y   // 使用指定的Y坐标
        }
      };

      // 添加文字到画布
      this.instance.addText(currentTextSetting.content, textOptions);
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
    },
    autoAddCopywritingToImage(imageData, copywritingText) {
      // 解析文案内容
      const textParts = extractCopywritingParts(copywritingText);

      // 加载图片
      const img = new Image();
      img.src = imageData;

      img.onload = () => {
        // 创建Canvas绘制图片和文字
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 获取文字布局
        const layout = autoLayoutText(img, textParts);

        // 绘制各部分文字
        this.drawText(ctx, textParts.mainTitle, layout.mainTitle);
        this.drawText(ctx, textParts.slogan, layout.slogan);
        this.drawText(ctx, textParts.mainText, layout.mainText);
        this.drawText(ctx, textParts.subText, layout.subText);
        this.drawText(ctx, textParts.dataText, layout.dataText);

        // 转换为DataURL并更新图片
        const resultImageData = canvas.toDataURL('image/png');
        this.updateFinalImage(resultImageData);
      };
    },

    // 绘制文字函数
    drawText(ctx, text, style) {
      if (!text) return;

      ctx.font = `${style.fontWeight || 'normal'} ${style.fontStyle || 'normal'} ${style.fontSize}px Arial, sans-serif`;
      ctx.fillStyle = style.color;
      ctx.textAlign = style.textAlign || 'left';
      ctx.textBaseline = 'middle';

      // 如果文字过长，自动换行
      if (style.maxWidth) {
        this.wrapText(ctx, text, style.x, style.y, style.maxWidth, style.fontSize * 1.2);
      } else {
        // 添加描边效果提高可读性
        ctx.strokeStyle = style.color === '#ffffff' ? '#000000' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(text, style.x, style.y);
        ctx.fillText(text, style.x, style.y);
      }
    },

    // 文字自动换行
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(' ');
      let line = '';
      let offsetY = 0;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          // 添加描边效果提高可读性
          ctx.strokeStyle = ctx.fillStyle === '#ffffff' ? '#000000' : '#ffffff';
          ctx.lineWidth = 3;
          ctx.strokeText(line, x, y + offsetY);
          ctx.fillText(line, x, y + offsetY);

          line = words[n] + ' ';
          offsetY += lineHeight;
        } else {
          line = testLine;
        }
      }

      // 绘制最后一行
      ctx.strokeText(line, x, y + offsetY);
      ctx.fillText(line, x, y + offsetY);
    },

    // 更新最终图片
    updateFinalImage(imageData) {
      // 更新到编辑器或保存结果
      this.finalImageData = imageData;
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
  height: calc(100vh - 60pxpx);
  /* 留出底部空间给控制面板 */
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

/* 底部文字控制面板样式 */
.text-controls-bottom {
  position: relative;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background-color: #f5f5f5;
  border-top: 1px solid #ddd;
  padding: 10px;
  height: 150px;
  display: flex;
  flex-direction: column;
}

.text-controls-tabs {
  display: flex;
  margin-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.tab {
  padding: 8px 15px;
  margin-right: 5px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  background-color: #f5f5f5;
  transition: all 0.2s;
}

.tab.active {
  background-color: #4CAF50;
  color: white;
}

.text-control-content {
  display: flex;
  align-items: center;
  gap: 10px;
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