<template>
    <div class="template-editor">
        <div class="editor-header">
            <button @click="goBack" class="back-button">返回</button>
            <h2>编辑海报模板</h2>
            <div class="actions">
                <button @click="saveTemplate" class="save-button">保存</button>
                <button @click="downloadTemplate" class="download-button">下载</button>
            </div>
        </div>

        <div class="editor-container">
            <div class="editor-canvas-container">
                <div class="editor-canvas" ref="canvas" :style="getCanvasStyle()">
                    <!-- 背景层 -->
                    <div class="canvas-background" :style="backgroundStyle"></div>

                    <!-- 图标层 -->
                    <div v-if="template.icon" class="canvas-icon" :style="iconStyle"
                        @mousedown="startDrag($event, 'icon')">
                        <img :src="template.icon" alt="Icon">
                        <div class="resize-handle" @mousedown.stop="startResize($event, 'icon')"></div>
                    </div>

                    <!-- 文本层 -->
                    <div class="canvas-text" :style="textStyle" @mousedown="startDrag($event, 'text')">
                        <div class="editable-text" contenteditable="true" @input="updateText" ref="editableText">{{
                            template.text }}</div>
                        <div class="resize-handle" @mousedown.stop="startResize($event, 'text')"></div>
                    </div>
                </div>
            </div>

            <div class="editor-controls">
                <div class="control-section">
                    <h3>背景设置</h3>
                    <div class="control-group">
                        <label>更换背景</label>
                        <button @click="regenerateBackground" class="control-button" :disabled="isGenerating">
                            {{ isGeneratingBackground ? '生成中...' : '重新生成背景' }}
                        </button>
                    </div>
                    <div class="control-group">
                        <label>背景滤镜</label>
                        <select v-model="backgroundFilter" @change="updateBackgroundStyle">
                            <option value="none">无滤镜</option>
                            <option value="blur(5px)">模糊</option>
                            <option value="brightness(1.2)">增亮</option>
                            <option value="contrast(1.2)">对比度</option>
                            <option value="grayscale(1)">灰度</option>
                            <option value="sepia(0.5)">复古</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>背景透明度</label>
                        <input type="range" v-model="backgroundOpacity" min="0.1" max="1" step="0.1"
                            @input="updateBackgroundStyle">
                        <span>{{ Math.round(backgroundOpacity * 100) }}%</span>
                    </div>
                </div>

                <div class="control-section">
                    <h3>图标设置</h3>
                    <div class="control-group">
                        <label>更换图标</label>
                        <button @click="regenerateIcon" class="control-button" :disabled="isGenerating">
                            {{ isGeneratingIcon ? '生成中...' : '重新生成图标' }}
                        </button>
                    </div>
                    <div class="control-group">
                        <label>图标大小</label>
                        <input type="range" v-model="iconSize" min="20" max="200" @input="updateIconStyle">
                        <span>{{ iconSize }}px</span>
                    </div>
                    <div class="control-group">
                        <label>图标位置</label>
                        <div class="position-grid">
                            <div v-for="position in positions" :key="position.value" class="position-cell"
                                :class="{ active: iconPosition === position.value }"
                                @click="setIconPosition(position.value)">
                                <div class="position-indicator"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="control-section">
                    <h3>文本设置</h3>
                    <div class="control-group">
                        <label>字体</label>
                        <select v-model="fontFamily" @change="updateTextStyle">
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="'Courier New', monospace">Courier New</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Segoe UI', sans-serif">Segoe UI</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>字体大小</label>
                        <input type="range" v-model="fontSize" min="12" max="72" @input="updateTextStyle">
                        <span>{{ fontSize }}px</span>
                    </div>
                    <div class="control-group">
                        <label>字体颜色</label>
                        <input type="color" v-model="textColor" @input="updateTextStyle">
                    </div>
                    <div class="control-group">
                        <label>文本样式</label>
                        <div class="text-style-buttons">
                            <button @click="toggleTextStyle('bold')" :class="{ active: textStyles.bold }"
                                class="style-button">
                                B
                            </button>
                            <button @click="toggleTextStyle('italic')" :class="{ active: textStyles.italic }"
                                class="style-button">
                                I
                            </button>
                            <button @click="toggleTextStyle('underline')" :class="{ active: textStyles.underline }"
                                class="style-button">
                                U
                            </button>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>文本背景</label>
                        <div class="text-bg-options">
                            <button @click="toggleTextBackground(false)" :class="{ active: !textBackground }"
                                class="style-button">
                                无
                            </button>
                            <button @click="toggleTextBackground(true)" :class="{ active: textBackground }"
                                class="style-button">
                                有
                            </button>
                        </div>
                    </div>
                    <div class="control-group" v-if="textBackground">
                        <label>背景颜色</label>
                        <input type="color" v-model="textBackgroundColor" @input="updateTextStyle">
                        <div class="control-group">
                            <label>背景透明度</label>
                            <input type="range" v-model="textBackgroundOpacity" min="0.1" max="1" step="0.1"
                                @input="updateTextStyle">
                            <span>{{ Math.round(textBackgroundOpacity * 100) }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 提示消息 -->
        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';
import html2canvas from 'html2canvas';
import axios from 'axios';

export default {
    name: 'TemplateEditor',
    props: {
        templateId: {
            type: String,
            default: null
        }
    },
    data() {
        return {
            template: null,

            // 背景设置
            backgroundFilter: 'none',
            backgroundOpacity: 1,

            // 图标设置
            iconSize: 80,
            iconPosition: 'center',
            isDragging: false,
            isResizing: false,
            currentElement: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            elementX: 0,
            elementY: 0,

            // 文本设置
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            textColor: '#ffffff',
            textStyles: {
                bold: false,
                italic: false,
                underline: false
            },
            textBackground: true,
            textBackgroundColor: '#000000',
            textBackgroundOpacity: 0.5,

            // 位置选项
            positions: [
                { value: 'top-left', label: '左上' },
                { value: 'top-center', label: '上中' },
                { value: 'top-right', label: '右上' },
                { value: 'middle-left', label: '左中' },
                { value: 'center', label: '中心' },
                { value: 'middle-right', label: '右中' },
                { value: 'bottom-left', label: '左下' },
                { value: 'bottom-center', label: '下中' },
                { value: 'bottom-right', label: '右下' }
            ],

            // 画布尺寸
            canvasWidth: 600,
            canvasHeight: 600,

            // 生成状态
            isGeneratingBackground: false,
            isGeneratingIcon: false,

            // 提示消息
            toast: {
                show: false,
                message: '',
                type: 'info',
                timeout: null
            }
        };
    },
    computed: {
        isGenerating() {
            return this.isGeneratingBackground || this.isGeneratingIcon;
        },
        backgroundStyle() {
            return {
                backgroundImage: `url(${this.template?.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: this.backgroundFilter !== 'none' ? this.backgroundFilter : '',
                opacity: this.backgroundOpacity
            };
        },
        iconStyle() {
            if (!this.template) return {};

            const style = {
                width: `${this.iconSize}px`,
                height: `${this.iconSize}px`,
                position: 'absolute'
            };

            // 根据位置设置坐标
            if (this.template.iconPosition) {
                style.left = `${this.template.iconPosition.x}px`;
                style.top = `${this.template.iconPosition.y}px`;
            } else {
                // 默认位置
                this.setIconPosition(this.iconPosition);
            }

            return style;
        },
        textStyle() {
            if (!this.template) return {};

            const style = {
                position: 'absolute',
                fontFamily: this.fontFamily,
                fontSize: `${this.fontSize}px`,
                color: this.textColor,
                fontWeight: this.textStyles.bold ? 'bold' : 'normal',
                fontStyle: this.textStyles.italic ? 'italic' : 'normal',
                textDecoration: this.textStyles.underline ? 'underline' : 'none'
            };

            if (this.textBackground) {
                style.backgroundColor = this.hexToRgba(this.textBackgroundColor, this.textBackgroundOpacity);
                style.padding = '10px';
                style.borderRadius = '4px';
            }

            // 根据位置设置坐标
            if (this.template.textPosition) {
                style.left = `${this.template.textPosition.x}px`;
                style.top = `${this.template.textPosition.y}px`;
            } else {
                // 默认位置
                style.left = '50%';
                style.top = '50%';
                style.transform = 'translate(-50%, -50%)';
            }

            return style;
        }
    },
    created() {
        this.loadTemplate();
    },
    mounted() {
        // 添加拖拽和调整大小的事件监听器
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    },
    beforeUnmount() {
        // 移除事件监听器
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        // 清除任何活动的超时
        if (this.toast.timeout) {
            clearTimeout(this.toast.timeout);
        }
    },
    methods: {
        ...mapActions([
            'updateCurrentTemplate',
            'addTemplate'
        ]),
        ...mapMutations([
            'SET_CURRENT_TEMPLATE'
        ]),

        loadTemplate() {
            if (this.templateId) {
                // 从本地存储加载模板
                const templates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
                const template = templates.find(t => t.id === this.templateId);

                if (template) {
                    this.template = JSON.parse(JSON.stringify(template)); // 深拷贝
                    this.initTemplateData();
                } else {
                    // 如果找不到模板，创建一个新的
                    this.createNewTemplate();
                }
            } else {
                // 创建新模板
                this.createNewTemplate();
            }

            // 设置画布尺寸
            this.setCanvasSize();
        },

        createNewTemplate() {
            this.template = {
                id: Date.now().toString(),
                theme: '通用',
                text: '请输入文本',
                backgroundImage: 'https://via.placeholder.com/600x600/f5f5f5/333333?text=背景图片',
                icon: 'https://via.placeholder.com/80x80/333333/ffffff?text=图标',
                size: 'square',
                created: new Date().toISOString()
            };
        },

        initTemplateData() {
            if (!this.template) return;

            // 初始化文本样式
            if (this.template.textStyle) {
                this.fontSize = this.template.textStyle.fontSize || 24;
                this.fontFamily = this.template.textStyle.fontFamily || 'Arial, sans-serif';
                this.textColor = this.template.textStyle.color || '#ffffff';
                this.textStyles.bold = this.template.textStyle.bold || false;
                this.textStyles.italic = this.template.textStyle.italic || false;
                this.textStyles.underline = this.template.textStyle.underline || false;
                this.textBackground = this.template.textStyle.background !== undefined ? this.template.textStyle.background : true;
                this.textBackgroundColor = this.template.textStyle.backgroundColor || '#000000';
                this.textBackgroundOpacity = this.template.textStyle.backgroundOpacity || 0.5;
            }

            // 初始化图标大小
            if (this.template.iconSize) {
                this.iconSize = this.template.iconSize;
            }

            // 初始化背景设置
            if (this.template.backgroundStyle) {
                this.backgroundFilter = this.template.backgroundStyle.filter || 'none';
                this.backgroundOpacity = this.template.backgroundStyle.opacity || 1;
            }
        },

        setCanvasSize() {
            if (!this.template) return;

            // 根据模板尺寸设置画布大小
            switch (this.template.size) {
                case 'square':
                    this.canvasWidth = 600;
                    this.canvasHeight = 600;
                    break;
                case 'portrait':
                    this.canvasWidth = 450;
                    this.canvasHeight = 600;
                    break;
                case 'landscape':
                    this.canvasWidth = 600;
                    this.canvasHeight = 450;
                    break;
                case 'story':
                    this.canvasWidth = 337;
                    this.canvasHeight = 600;
                    break;
                case 'banner':
                    this.canvasWidth = 600;
                    this.canvasHeight = 337;
                    break;
                default:
                    this.canvasWidth = 600;
                    this.canvasHeight = 600;
            }
        },

        getCanvasStyle() {
            return {
                width: `${this.canvasWidth}px`,
                height: `${this.canvasHeight}px`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
            };
        },

        updateBackgroundStyle() {
            if (!this.template) return;

            // 更新模板数据
            this.template.backgroundStyle = {
                filter: this.backgroundFilter,
                opacity: this.backgroundOpacity
            };
        },

        updateIconStyle() {
            if (!this.template) return;

            // 更新模板数据
            this.template.iconSize = this.iconSize;
        },

        updateTextStyle() {
            if (!this.template) return;

            // 更新模板数据
            this.template.textStyle = {
                fontSize: this.fontSize,
                fontFamily: this.fontFamily,
                color: this.textColor,
                bold: this.textStyles.bold,
                italic: this.textStyles.italic,
                underline: this.textStyles.underline,
                background: this.textBackground,
                backgroundColor: this.textBackgroundColor,
                backgroundOpacity: this.textBackgroundOpacity
            };
        },

        toggleTextStyle(style) {
            this.textStyles[style] = !this.textStyles[style];
            this.updateTextStyle();
        },

        toggleTextBackground(value) {
            this.textBackground = value;
            this.updateTextStyle();
        },

        setIconPosition(position) {
            if (!this.template) return;

            // 根据位置名称设置图标位置
            let x, y;

            switch (position) {
                case 'top-left':
                    x = 20;
                    y = 20;
                    break;
                case 'top-center':
                    x = this.canvasWidth / 2 - this.iconSize / 2;
                    y = 20;
                    break;
                case 'top-right':
                    x = this.canvasWidth - this.iconSize - 20;
                    y = 20;
                    break;
                case 'middle-left':
                    x = 20;
                    y = this.canvasHeight / 2 - this.iconSize / 2;
                    break;
                case 'center':
                    x = this.canvasWidth / 2 - this.iconSize / 2;
                    y = this.canvasHeight / 2 - this.iconSize / 2;
                    break;
                case 'middle-right':
                    x = this.canvasWidth - this.iconSize - 20;
                    y = this.canvasHeight / 2 - this.iconSize / 2;
                    break;
                case 'bottom-left':
                    x = 20;
                    y = this.canvasHeight - this.iconSize - 20;
                    break;
                case 'bottom-center':
                    x = this.canvasWidth / 2 - this.iconSize / 2;
                    y = this.canvasHeight - this.iconSize - 20;
                    break;
                case 'bottom-right':
                    x = this.canvasWidth - this.iconSize - 20;
                    y = this.canvasHeight - this.iconSize - 20;
                    break;
                default:
                    x = this.canvasWidth / 2 - this.iconSize / 2;
                    y = this.canvasHeight / 2 - this.iconSize / 2;
            }

            this.iconPosition = position;
            this.template.iconPosition = { x, y };
        },

        startDrag(event, elementType) {
            if (this.isResizing) return;

            this.isDragging = true;
            this.currentElement = elementType;

            const element = event.currentTarget;
            const rect = element.getBoundingClientRect();

            this.startX = event.clientX;
            this.startY = event.clientY;

            if (elementType === 'icon') {
                this.elementX = this.template.iconPosition.x;
                this.elementY = this.template.iconPosition.y;
            } else if (elementType === 'text') {
                this.elementX = this.template.textPosition ? this.template.textPosition.x : rect.left - this.$refs.canvas.getBoundingClientRect().left;
                this.elementY = this.template.textPosition ? this.template.textPosition.y : rect.top - this.$refs.canvas.getBoundingClientRect().top;

                // 如果没有位置信息，创建一个
                if (!this.template.textPosition) {
                    this.template.textPosition = { x: this.elementX, y: this.elementY };
                }
            }

            event.preventDefault();
        },

        startResize(event, elementType) {
            this.isResizing = true;
            this.currentElement = elementType;

            const element = event.currentTarget.parentElement;
            const rect = element.getBoundingClientRect();

            this.startX = event.clientX;
            this.startY = event.clientY;
            this.startWidth = rect.width;
            this.startHeight = rect.height;

            event.preventDefault();
        },

        onMouseMove(event) {
            if (this.isDragging) {
                const dx = event.clientX - this.startX;
                const dy = event.clientY - this.startY;

                const newX = this.elementX + dx;
                const newY = this.elementY + dy;

                // 限制在画布内
                const maxX = this.canvasWidth - (this.currentElement === 'icon' ? this.iconSize : 100);
                const maxY = this.canvasHeight - (this.currentElement === 'icon' ? this.iconSize : 100);

                const boundedX = Math.max(0, Math.min(newX, maxX));
                const boundedY = Math.max(0, Math.min(newY, maxY));

                if (this.currentElement === 'icon') {
                    this.template.iconPosition = { x: boundedX, y: boundedY };
                } else if (this.currentElement === 'text') {
                    this.template.textPosition = { x: boundedX, y: boundedY };
                }
            } else if (this.isResizing) {
                const dx = event.clientX - this.startX;
                const dy = event.clientY - this.startY;

                if (this.currentElement === 'icon') {
                    const newSize = Math.max(20, this.startWidth + dx);
                    this.iconSize = Math.min(newSize, 200);
                    this.template.iconSize = this.iconSize;
                } else if (this.currentElement === 'text') {
                    // 文本大小调整通过字体大小控制
                    const newSize = Math.max(12, this.fontSize + dx / 4);
                    this.fontSize = Math.min(newSize, 72);
                    this.updateTextStyle();
                }
            }
        },

        onMouseUp() {
            this.isDragging = false;
            this.isResizing = false;
            this.currentElement = null;
        },

        updateText(event) {
            if (!this.template) return;
            this.template.text = event.target.innerText;
        },

        hexToRgba(hex, opacity) {
            // 将十六进制颜色转换为rgba
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        },

        async regenerateBackground() {
            if (this.isGenerating) return;

            this.isGeneratingBackground = true;

            try {
                // 显示加载提示
                this.showToast('正在生成背景...', 'info');

                // 调用API生成新背景
                const response = await axios.post('/generate-background', {
                    theme: this.template.theme,
                    text: this.template.text,
                    styles: this.template.styles || [],
                    colorScheme: this.template.colorScheme || 'default'
                });

                if (response.data.status === 'success') {
                    this.template.backgroundImage = response.data.backgroundImage;
                    this.showToast('背景生成成功', 'success');
                } else {
                    throw new Error(response.data.message || '背景生成失败');
                }
            } catch (error) {
                console.error('Error generating background:', error);
                this.showToast('背景生成失败: ' + (error.response?.data?.message || error.message), 'error');
            } finally {
                this.isGeneratingBackground = false;
            }
        },

        async regenerateIcon() {
            if (this.isGenerating) return;

            this.isGeneratingIcon = true;

            try {
                // 显示加载提示
                this.showToast('正在生成图标...', 'info');

                // 调用API生成新图标
                const response = await axios.post('/generate-icon', {
                    theme: this.template.theme,
                    text: this.template.text
                });

                if (response.data.status === 'success') {
                    this.template.icon = response.data.icon;
                    this.showToast('图标生成成功', 'success');
                } else {
                    throw new Error(response.data.message || '图标生成失败');
                }
            } catch (error) {
                console.error('Error generating icon:', error);
                this.showToast('图标生成失败: ' + (error.response?.data?.message || error.message), 'error');
            } finally {
                this.isGeneratingIcon = false;
            }
        },

        async saveTemplate() {
            try {
                // 更新模板的最后修改时间
                this.template.lastModified = new Date().toISOString();

                // 保存到Vuex
                this.updateCurrentTemplate(this.template);

                // 如果是新模板，添加到模板列表
                if (!this.templateId) {
                    this.addTemplate(this.template);
                }

                // 保存到本地存储
                const templates = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
                const index = templates.findIndex(t => t.id === this.template.id);

                if (index !== -1) {
                    templates[index] = this.template;
                } else {
                    templates.push(this.template);
                }

                localStorage.setItem('savedTemplates', JSON.stringify(templates));

                this.showToast('模板保存成功', 'success');

                // 延迟返回，让用户看到成功消息
                setTimeout(() => {
                    this.$router.push('/templates');
                }, 1500);
            } catch (error) {
                console.error('Error saving template:', error);
                this.showToast('保存模板失败', 'error');
            }
        },

        async downloadTemplate() {
            try {
                // 显示加载提示
                this.showToast('正在生成图片...', 'info');

                // 使用html2canvas捕获画布内容
                const canvas = await html2canvas(this.$refs.canvas, {
                    useCORS: true,
                    scale: 2, // 提高导出图片质量
                    allowTaint: true,
                    backgroundColor: null
                });

                const dataUrl = canvas.toDataURL('image/png');

                // 创建下载链接
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `poster-${this.template.theme}-${Date.now()}.png`;
                link.click();

                this.showToast('海报下载成功', 'success');
            } catch (error) {
                console.error('Error downloading template:', error);
                this.showToast('下载海报失败', 'error');
            }
        },

        goBack() {
            this.$router.push('/templates');
        },

        showToast(message, type = 'info') {
            // 清除任何现有的超时
            if (this.toast.timeout) {
                clearTimeout(this.toast.timeout);
            }

            // 设置新的提示消息
            this.toast.show = true;
            this.toast.message = message;
            this.toast.type = type;

            // 设置超时自动隐藏
            this.toast.timeout = setTimeout(() => {
                this.toast.show = false;
            }, 3000);
        }
    }
};
</script>

<style scoped>
.template-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button, .save-button, .download-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.back-button {
  background-color: #f5f5f5;
  color: #333;
}

.back-button:hover {
  background-color: #e0e0e0;
}

.save-button {
  background-color: #4caf50;
  color: white;
  margin-right: 10px;
}

.save-button:hover {
  background-color: #388e3c;
}

.download-button {
  background-color: #2196f3;
  color: white;
}

.download-button:hover {
  background-color: #1976d2;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background-color: #e9e9e9;
  overflow: auto;
}

.editor-canvas {
  background-color: white;
  border-radius: 4px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.canvas-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.canvas-icon {
  z-index: 2;
  cursor: move;
  position: absolute;
}

.canvas-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.canvas-text {
  z-index: 3;
  cursor: move;
  max-width: 80%;
  position: absolute;
}

.editable-text {
  outline: none;
  min-width: 50px;
  min-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
}

.resize-handle {
  position: absolute;
  bottom: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  background-color: #2196f3;
  border-radius: 50%;
  cursor: nwse-resize;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.editor-controls {
  width: 300px;
  background-color: white;
  border-left: 1px solid #ddd;
  overflow-y: auto;
  padding: 20px;
}

.control-section {
  margin-bottom: 25px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.control-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.control-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.control-group {
  margin-bottom: 15px;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.control-button {
  width: 100%;
  padding: 8px 12px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.control-button:hover {
  background-color: #1976d2;
}

.control-button:disabled {
  background-color: #b0bec5;
  cursor: not-allowed;
}

select, input[type="range"], input[type="color"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
}

input[type="color"] {
  height: 40px;
  padding: 2px;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.position-cell {
  aspect-ratio: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.position-cell:hover {
  background-color: #f5f5f5;
}

.position-cell.active {
  border-color: #2196f3;
  background-color: rgba(33, 150, 243, 0.1);
}

.position-indicator {
  width: 8px;
  height: 8px;
  background-color: #555;
  border-radius: 50%;
}

.text-style-buttons, .text-bg-options {
  display: flex;
  gap: 5px;
}

.style-button {
  flex: 1;
  padding: 8px 0;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.style-button:hover {
  background-color: #e0e0e0;
}

.style-button.active {
  background-color: #2196f3;
  color: white;
  border-color: #1976d2;
}

/* Toast notification */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s, transform 0.3s;
  max-width: 80%;
}

.toast.info {
  background-color: #2196f3;
}

.toast.success {
  background-color: #4caf50;
}

.toast.error {
  background-color: #f44336;
}

.toast.warning {
  background-color: #ff9800;
}

.toast.hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Loading overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
  }
  
  .editor-controls {
    width: 100%;
    border-left: none;
    border-top: 1px solid #ddd;
  }
  
  .editor-header h2 {
    font-size: 18px;
  }
  
  .back-button, .save-button, .download-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
