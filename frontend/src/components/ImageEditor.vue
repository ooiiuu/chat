<template>
  <div>
    <button @click="goBack" class="back-button">返回</button>
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
    // console.log('Received imageSrc:', route.params.imageSrc);

    return {
      imageSrc: route.params.imageSrc
    }
  },
  props: ['imageSrc'],
  data() {
    return {
      instance: null,
    };
  },
  mounted() {
    // console.log('Received imageSrc:', this.imageSrc);
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
            // ... 其他配置保持不变
            initMenu: "draw",
            menuBarPosition: "bottom",
            locale: locale_zh,
          },
          // ... 其他配置保持不变
          cssMaxWidth: window.innerWidth,
          cssMaxHeight: window.innerHeight - 100,
        }
      );
      // 使用 nextTick 确保 DOM 已更新
      this.$nextTick(() => {
        // 延迟一小段时间再加载实际图片
        setTimeout(() => {
          this.instance.loadImageFromURL(decodedImageSrc, 'SampleImage').then(() => {
            console.log('Image loaded successfully');
            // 确保图片加载后再调整UI
            document.getElementsByClassName("tui-image-editor-main")[0].style.top = "45px";
          }).catch(err => {
            console.error('Failed to load image:', err);
          });
        }, 100);
      });
    },
    // ... 其他方法
    goBack() {
      this.$router.push({ name: 'Chat' });
    }
  }
};

</script>

<style scoped>
div {
  height: 100vh;
  width: 100%;
}

#tui-image-editor {
  height: 100%;
  width: 100%;
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
</style>