<template>
    <div class="template-generator">
        <div class="template-header">
            <h2>海报模板生成器</h2>
            <p>根据文案与主题自动生成多样化的海报设计</p>
        </div>

        <div class="template-form">
            <div class="form-group">
                <label>主题类型</label>
                <select v-model="selectedTheme">
                    <option value="business">商务/企业</option>
                    <option value="education">教育/学习</option>
                    <option value="social">社交媒体</option>
                    <option value="event">活动/会议</option>
                    <option value="promotion">促销/营销</option>
                    <option value="holiday">节日/庆典</option>
                </select>
            </div>

            <div class="form-group">
                <label>海报尺寸</label>
                <select v-model="posterSize">
                    <option value="square">方形 (1:1)</option>
                    <option value="portrait">竖版 (3:4)</option>
                    <option value="landscape">横版 (4:3)</option>
                    <option value="story">故事版 (9:16)</option>
                    <option value="banner">横幅 (16:9)</option>
                </select>
            </div>

            <div class="form-group">
                <label>文案内容</label>
                <textarea v-model="copyText" placeholder="输入您的文案内容，系统将根据文案生成匹配的设计..." rows="4"></textarea>
            </div>

            <div class="form-group">
                <label>风格偏好</label>
                <div class="style-options">
                    <label v-for="(style, index) in styleOptions" :key="index" class="style-option">
                        <input type="checkbox" v-model="selectedStyles" :value="style.value">
                        <span>{{ style.label }}</span>
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label>颜色方案</label>
                <div class="color-schemes">
                    <div v-for="(scheme, index) in colorSchemes" :key="index" class="color-scheme"
                        :class="{ active: selectedColorScheme === scheme.value }"
                        @click="selectedColorScheme = scheme.value">
                        <div class="color-preview" :style="{ background: scheme.preview }"></div>
                        <span>{{ scheme.label }}</span>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button @click="generateTemplate" :disabled="isGenerating || !copyText.trim()" class="generate-btn">
                    <span v-if="!isGenerating">生成模板</span>
                    <span v-else>生成中...</span>
                </button>
            </div>
        </div>

        <div v-if="isGenerating" class="generation-progress">
            <div class="progress-steps">
                <div class="step" :class="{ active: generationStep >= 1, completed: generationStep > 1 }">
                    <div class="step-number">1</div>
                    <div class="step-label">分析文案</div>
                </div>
                <div class="step" :class="{ active: generationStep >= 2, completed: generationStep > 2 }">
                    <div class="step-number">2</div>
                    <div class="step-label">生成背景</div>
                </div>
                <div class="step" :class="{ active: generationStep >= 3, completed: generationStep > 3 }">
                    <div class="step-number">3</div>
                    <div class="step-label">生成图标</div>
                </div>
                <div class="step" :class="{ active: generationStep >= 4, completed: generationStep > 4 }">
                    <div class="step-number">4</div>
                    <div class="step-label">排版布局</div>
                </div>
            </div>
        </div>

        <div v-if="templates.length > 0" class="template-results">
            <h3>生成的模板 ({{ templates.length }})</h3>
            <div class="template-grid">
                <div v-for="(template, index) in templates" :key="index" class="template-item"
                    @click="selectTemplate(template)">
                    <div class="template-preview" :style="getTemplatePreviewStyle(template)">
                        <div class="template-background"
                            :style="{ backgroundImage: `url(${template.backgroundImage})` }"></div>
                        <div v-if="template.icon" class="template-icon" :style="getIconStyle(template)">
                            <img :src="template.icon" alt="Icon">
                        </div>
                        <div class="template-text" :style="getTextStyle(template)">
                            {{ truncateText(template.text) }}
                        </div>
                    </div>
                    <div class="template-actions">
                        <button @click.stop="editTemplate(template)">编辑</button>
                        <button @click.stop="downloadTemplate(template)">下载</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            selectedTheme: 'social',
            posterSize: 'square',
            copyText: '',
            isGenerating: false,
            generationStep: 0,
            templates: [],
            selectedStyles: ['modern'],
            selectedColorScheme: 'auto',
            styleOptions: [
                { label: '现代简约', value: 'modern' },
                { label: '复古风格', value: 'vintage' },
                { label: '手绘插画', value: 'handdrawn' },
                { label: '极简主义', value: 'minimalist' },
                { label: '渐变色彩', value: 'gradient' },
                { label: '几何图形', value: 'geometric' }
            ],
            colorSchemes: [
                { label: '自动选择', value: 'auto', preview: 'linear-gradient(to right, #3498db, #e74c3c, #2ecc71, #f39c12)' },
                { label: '蓝色系', value: 'blue', preview: 'linear-gradient(to right, #2980b9, #3498db, #85c1e9, #d6eaf8)' },
                { label: '绿色系', value: 'green', preview: 'linear-gradient(to right, #1e8449, #27ae60, #58d68d, #abebc6)' },
                { label: '红色系', value: 'red', preview: 'linear-gradient(to right, #922b21, #e74c3c, #f1948a, #fadbd8)' },
                { label: '黄色系', value: 'yellow', preview: 'linear-gradient(to right, #b7950b, #f1c40f, #f7dc6f, #fcf3cf)' },
                { label: '紫色系', value: 'purple', preview: 'linear-gradient(to right, #6c3483, #8e44ad, #bb8fce, #e8daef)' },
                { label: '黑白系', value: 'bw', preview: 'linear-gradient(to right, #17202a, #2c3e50, #85929e, #eaecee)' }
            ]
        };
    },
    methods: {
        async generateTemplate() {
            try {
                this.isGenerating = true;
                this.generationError = null;

                const response = await fetch('http://127.0.0.1:5000/generate-template', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        theme: this.theme,
                        copyText: this.copyText,
                        size: this.size,
                        styles: this.selectedStyles,
                        colorScheme: this.colorScheme
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === 'success') {
                    this.$store.commit('setCurrentTemplate', data.template);
                    this.$router.push(`/template-editor/${data.template.id}`);
                } else {
                    throw new Error(data.message || '模板生成失败');
                }
            } catch (error) {
                console.error('Template generation error:', error);
                this.generationError = error.message;
            } finally {
                this.isGenerating = false;
            }
        },

        async generateBackgrounds(designPrompt) {
            // 调用后端API生成背景图像
            try {
                const response = await fetch('http://127.0.0.1:5000/generate_background', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: designPrompt,
                        size: this.getPosterDimensions(),
                        count: 3, // 生成3个不同背景选项
                        style: this.selectedStyles.join(','),
                        colorScheme: this.selectedColorScheme
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to generate backgrounds');
                }

                const data = await response.json();
                return data.backgrounds; // 返回背景图像URL数组

            } catch (error) {
                console.error('Error generating backgrounds:', error);
                throw error;
            }
        },

        async generateIcons(designPrompt) {
            // 调用后端API生成图标
            try {
                const response = await fetch('http://127.0.0.1:5000/generate_icon', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: designPrompt,
                        style: this.selectedStyles.join(','),
                        transparent: true
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to generate icons');
                }

                const data = await response.json();
                return data.icons; // 返回图标URL数组

            } catch (error) {
                console.error('Error generating icons:', error);
                throw error;
            }
        },

        async createLayouts(backgrounds, icons) {
            // 根据背景和图标生成布局方案
            // 这里可以使用预定义的布局模板或调用API生成布局

            // 简单示例：为每个背景生成不同的布局选项
            return backgrounds.map((_, index) => {
                return {
                    textPosition: ['top', 'center', 'bottom'][index % 3],
                    iconPosition: ['top-right', 'center', 'bottom-left'][index % 3],
                    textSize: ['large', 'medium', 'small'][index % 3],
                    textColor: this.getContrastColor(index)
                };
            });
        },

        createTemplates(backgrounds, icons, layouts) {
            // 组合背景、图标和布局创建完整模板
            const templates = [];

            // 为每个背景创建一个模板
            backgrounds.forEach((background, index) => {
                const icon = icons[index % icons.length];
                const layout = layouts[index % layouts.length];

                templates.push({
                    id: Date.now() + index,
                    backgroundImage: background,
                    icon: icon,
                    text: this.copyText,
                    layout: layout,
                    size: this.posterSize,
                    theme: this.selectedTheme,
                    styles: [...this.selectedStyles],
                    colorScheme: this.selectedColorScheme
                });
            });

            return templates;
        },

        getPosterDimensions() {
            // 根据选择的海报尺寸返回宽高比
            const sizeMap = {
                square: { width: 1080, height: 1080 },
                portrait: { width: 1080, height: 1440 },
                landscape: { width: 1440, height: 1080 },
                story: { width: 1080, height: 1920 },
                banner: { width: 1920, height: 1080 }
            };

            return sizeMap[this.posterSize] || sizeMap.square;
        },

        getContrastColor(index) {
            // 根据背景生成对比色文本
            // 简单示例
            const colors = ['#FFFFFF', '#000000', '#FFFFFF'];
            return colors[index % colors.length];
        },

        getTemplatePreviewStyle(template) {
            // 根据模板尺寸设置预览样式
            const aspectRatio = {
                square: '1/1',
                portrait: '3/4',
                landscape: '4/3',
                story: '9/16',
                banner: '16/9'
            }[template.size];

            return {
                aspectRatio: aspectRatio
            };
        },

        getIconStyle(template) {
            // 根据布局设置图标位置
            const positions = {
                'top-right': { top: '10%', right: '10%', left: 'auto', bottom: 'auto' },
                'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                'bottom-left': { bottom: '10%', left: '10%', top: 'auto', right: 'auto' }
            };

            return positions[template.layout.iconPosition];
        },

        getTextStyle(template) {
            // 根据布局设置文本样式
            const positions = {
                'top': { top: '10%', left: '50%', transform: 'translateX(-50%)' },
                'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                'bottom': { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }
            };

            const sizes = {
                'large': '24px',
                'medium': '18px',
                'small': '14px'
            };

            return {
                ...positions[template.layout.textPosition],
                fontSize: sizes[template.layout.textSize],
                color: template.layout.textColor
            };
        },

        truncateText(text) {
            // 截断长文本用于预览
            return text.length > 50 ? text.substring(0, 47) + '...' : text;
        },

        selectTemplate(template) {
            // 选择模板进行编辑
            this.$router.push({
                name: 'TemplateEditor',
                params: { templateId: template.id },
                state: { template }
            });
        },

        editTemplate(template) {
            // 编辑选定的模板
            this.$router.push({
                name: 'TemplateEditor',
                params: { templateId: template.id },
                state: { template }
            });
        },

        downloadTemplate(template) {
            // 下载模板为图像
            // 这里需要实现将模板渲染为图像并下载的逻辑
            alert('下载功能将在后续版本中实现');
        }
    }
};
</script>

<style scoped>
.template-generator {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.template-header {
    text-align: center;
    margin-bottom: 30px;
}

.template-header h2 {
    font-size: 28px;
    color: #2c3e50;
    margin-bottom: 10px;
}

.template-header p {
    color: #7f8c8d;
    font-size: 16px;
}

.template-form {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #34495e;
}

select,
textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    font-family: inherit;
}

select:focus,
textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

textarea {
    resize: vertical;
    min-height: 100px;
}

.style-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.style-option {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.style-option input {
    margin-right: 6px;
}

.color-schemes {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
}

.color-scheme {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s;
}

.color-scheme.active {
    background: #e3f2fd;
    box-shadow: 0 0 0 2px #2196f3;
}

.color-preview {
    width: 60px;
    height: 30px;
    border-radius: 4px;
    margin-bottom: 6px;
}

.form-actions {
    display: flex;
    justify-content: center;
    margin-top: 30px;
}

.generate-btn {
    background: #2196f3;
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.generate-btn:hover:not(:disabled) {
    background: #1976d2;
}

.generate-btn:disabled {
    background: #b0bec5;
    cursor: not-allowed;
}

.generation-progress {
    margin: 30px 0;
}

.progress-steps {
    display: flex;
    justify-content: space-between;
    position: relative;
}

.progress-steps::before {
    content: '';
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    height: 2px;
    background: #e0e0e0;
    z-index: 1;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
}

.step-number {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    transition: all 0.3s;
}

.step.active .step-number {
    background: #2196f3;
    color: white;
}

.step.completed .step-number {
    background: #4caf50;
    color: white;
}

.step-label {
    font-size: 14px;
    color: #757575;
}

.step.active .step-label,
.step.completed .step-label {
    color: #212121;
    font-weight: 500;
}

.template-results {
    margin-top: 40px;
}

.template-results h3 {
    font-size: 22px;
    margin-bottom: 20px;
    color: #2c3e50;
}

.template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
}

.template-item {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
}

.template-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.template-preview {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 100%;
    /* Default for square */
    overflow: hidden;
}

.template-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}

.template-icon {
    position: absolute;
    width: 60px;
    height: 60px;
}

.template-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.template-text {
    position: absolute;
    max-width: 80%;
    text-align: center;
    padding: 10px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 6px;
    backdrop-filter: blur(5px);
    word-break: break-word;
}

.template-actions {
    display: flex;
    padding: 12px;
    background: #f5f5f5;
}

.template-actions button {
    flex: 1;
    padding: 8px 0;
    border: none;
    background: #2196f3;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    margin: 0 5px;
    transition: background 0.2s;
}

.template-actions button:hover {
    background: #1976d2;
}

@media (max-width: 768px) {
    .template-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }

    .style-options,
    .color-schemes {
        gap: 8px;
    }

    .color-preview {
        width: 40px;
        height: 20px;
    }
}
</style>