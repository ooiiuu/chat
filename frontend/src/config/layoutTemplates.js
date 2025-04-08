/**
 * 预设布局模板配置
 * 定义不同风格的文本布局模板
 */

export const layoutTemplates = {
    /**
     * 经典样式 - 文字居中对齐，标准布局
     */
    classic: {
      name: "经典布局",
      description: "传统的居中文字布局，适合大多数公益海报",
      mainTitle: {
        relativeX: 0.5, // 水平居中
        relativeY: 0.2, // 靠上位置
        fontSizeRatio: 0.08, // 字体大小为图片宽度的8%
        maxFontSize: 60,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif'
      },
      slogan: {
        relativeX: 0.5,
        relativeY: 0.35,
        fontSizeRatio: 0.06,
        maxFontSize: 45,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif'
      },
      mainText: {
        relativeX: 0.5,
        relativeY: 0.5,
        fontSizeRatio: 0.04,
        maxFontSize: 30,
        textAlign: 'center',
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        maxWidth: 0.8 // 最大宽度为图片宽度的80%
      },
      subText: {
        relativeX: 0.5,
        relativeY: 0.65,
        fontSizeRatio: 0.03,
        maxFontSize: 24,
        textAlign: 'center',
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        maxWidth: 0.7
      },
      dataText: {
        relativeX: 0.5,
        relativeY: 0.8,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        maxWidth: 0.7
      }
    },
  
    /**
     * 现代样式 - 左对齐，现代简约风格
     */
    modern: {
      name: "现代左对齐",
      description: "左对齐设计，现代简约风格",
      mainTitle: {
        relativeX: 0.25, // 左侧
        relativeY: 0.2,
        fontSizeRatio: 0.08,
        maxFontSize: 60,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: '"Helvetica Neue", Arial, sans-serif'
      },
      slogan: {
        relativeX: 0.25,
        relativeY: 0.35,
        fontSizeRatio: 0.06,
        maxFontSize: 45,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: '"Helvetica Neue", Arial, sans-serif'
      },
      mainText: {
        relativeX: 0.25,
        relativeY: 0.5,
        fontSizeRatio: 0.04,
        maxFontSize: 30,
        textAlign: 'left',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        maxWidth: 0.5
      },
      subText: {
        relativeX: 0.25,
        relativeY: 0.65,
        fontSizeRatio: 0.03,
        maxFontSize: 24,
        textAlign: 'left',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        maxWidth: 0.5
      },
      dataText: {
        relativeX: 0.25,
        relativeY: 0.8,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'left',
        fontStyle: 'italic',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        maxWidth: 0.5
      }
    },
  
    /**
     * 极简风格 - 大标题，少元素
     */
    minimalist: {
      name: "极简设计",
      description: "简洁大气，主要突出标题与口号",
      mainTitle: {
        relativeX: 0.5,
        relativeY: 0.4, // 居中偏上
        fontSizeRatio: 0.1, // 更大的字体
        maxFontSize: 72,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Montserrat", "Segoe UI", sans-serif',
        letterSpacing: '0.05em' // 字间距增加
      },
      slogan: {
        relativeX: 0.5,
        relativeY: 0.6, // 居中偏下
        fontSizeRatio: 0.07,
        maxFontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Montserrat", "Segoe UI", sans-serif',
        letterSpacing: '0.03em'
      },
      mainText: {
        relativeX: 0.5,
        relativeY: 0.75,
        fontSizeRatio: 0.035,
        maxFontSize: 26,
        textAlign: 'center',
        fontFamily: '"Montserrat", "Segoe UI", sans-serif',
        maxWidth: 0.7,
        opacity: 0.9 // 稍微透明
      },
      subText: {
        relativeX: 0.5,
        relativeY: 0.85,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'center',
        fontFamily: '"Montserrat", "Segoe UI", sans-serif',
        maxWidth: 0.6,
        opacity: 0.8
      },
      dataText: {
        relativeX: 0.5,
        relativeY: 0.92,
        fontSizeRatio: 0.02,
        maxFontSize: 16,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: '"Montserrat", "Segoe UI", sans-serif',
        maxWidth: 0.5,
        opacity: 0.7
      }
    },
  
    /**
     * 戏剧风格 - 强对比，大胆设计
     */
    dramatic: {
      name: "戏剧化设计",
      description: "强烈对比，大胆排版，突出戏剧性效果",
      mainTitle: {
        relativeX: 0.5,
        relativeY: 0.3, // 偏上位置
        fontSizeRatio: 0.09,
        maxFontSize: 65,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Impact", "Arial Black", sans-serif',
        strokeWidth: 4, // 粗描边
        textTransform: 'uppercase' // 全大写
      },
      slogan: {
        relativeX: 0.5,
        relativeY: 0.7, // 偏下位置
        fontSizeRatio: 0.07,
        maxFontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Impact", "Arial Black", sans-serif',
        strokeWidth: 4,
        letterSpacing: '0.02em'
      },
      mainText: {
        relativeX: 0.5,
        relativeY: 0.5, // 居中
        fontSizeRatio: 0.045,
        maxFontSize: 32,
        textAlign: 'center',
        fontFamily: '"Georgia", serif',
        maxWidth: 0.7,
        opacity: 0.9
      },
      subText: {
        relativeX: 0.5,
        relativeY: 0.6,
        fontSizeRatio: 0.035,
        maxFontSize: 26,
        textAlign: 'center',
        fontFamily: '"Georgia", serif',
        maxWidth: 0.7,
        opacity: 0.8
      },
      dataText: {
        relativeX: 0.5,
        relativeY: 0.85,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: '"Georgia", serif',
        maxWidth: 0.6,
        opacity: 0.7
      }
    },
  
    /**
     * 分屏设计 - 左右分区布局
     */
    split: {
      name: "分屏设计",
      description: "左右分区布局，标题和口号在左，正文在右",
      mainTitle: {
        relativeX: 0.25, // 左侧
        relativeY: 0.3,
        fontSizeRatio: 0.08,
        maxFontSize: 60,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: '"Roboto", "Noto Sans SC", sans-serif'
      },
      slogan: {
        relativeX: 0.25,
        relativeY: 0.45,
        fontSizeRatio: 0.06,
        maxFontSize: 45,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: '"Roboto", "Noto Sans SC", sans-serif'
      },
      mainText: {
        relativeX: 0.75, // 右侧
        relativeY: 0.4,
        fontSizeRatio: 0.04,
        maxFontSize: 30,
        textAlign: 'right', // 右对齐
        fontFamily: '"Roboto", "Noto Sans SC", sans-serif',
        maxWidth: 0.4 // 宽度限制
      },
      subText: {
        relativeX: 0.75,
        relativeY: 0.6,
        fontSizeRatio: 0.03,
        maxFontSize: 24,
        textAlign: 'right',
        fontFamily: '"Roboto", "Noto Sans SC", sans-serif',
        maxWidth: 0.4
      },
      dataText: {
        relativeX: 0.75,
        relativeY: 0.8,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'right',
        fontStyle: 'italic',
        fontFamily: '"Roboto", "Noto Sans SC", sans-serif',
        maxWidth: 0.4
      }
    },
  
    /**
     * 上下结构 - 主标题在上，内容在下
     */
    vertical: {
      name: "上下结构",
      description: "主标题在上方，内容集中在下半部分",
      mainTitle: {
        relativeX: 0.5,
        relativeY: 0.15, // 顶部
        fontSizeRatio: 0.09,
        maxFontSize: 65,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Playfair Display", "SimSun", serif'
      },
      slogan: {
        relativeX: 0.5,
        relativeY: 0.3,
        fontSizeRatio: 0.07,
        maxFontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Playfair Display", "SimSun", serif'
      },
      mainText: {
        relativeX: 0.5,
        relativeY: 0.55,
        fontSizeRatio: 0.04,
        maxFontSize: 30,
        textAlign: 'center',
        fontFamily: '"Playfair Display", "SimSun", serif',
        maxWidth: 0.7
      },
      subText: {
        relativeX: 0.5,
        relativeY: 0.7,
        fontSizeRatio: 0.03,
        maxFontSize: 24,
        textAlign: 'center',
        fontFamily: '"Playfair Display", "SimSun", serif',
        maxWidth: 0.7
      },
      dataText: {
        relativeX: 0.5,
        relativeY: 0.85,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: '"Playfair Display", "SimSun", serif',
        maxWidth: 0.6
      }
    },
  
    /**
     * 对角线布局 - 从左上到右下
     */
    diagonal: {
      name: "对角线布局",
      description: "文字沿对角线排布，从左上到右下",
      mainTitle: {
        relativeX: 0.2, // 左上
        relativeY: 0.2,
        fontSizeRatio: 0.08,
        maxFontSize: 60,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: '"Ubuntu", "Hiragino Sans GB", sans-serif'
      },
      slogan: {
        relativeX: 0.35,
        relativeY: 0.35,
        fontSizeRatio: 0.06,
        maxFontSize: 45,
        fontWeight: 'bold',
        textAlign: 'left',
        fontFamily: '"Ubuntu", "Hiragino Sans GB", sans-serif'
      },
      mainText: {
        relativeX: 0.5,
        relativeY: 0.5,
        fontSizeRatio: 0.04,
        maxFontSize: 30,
        textAlign: 'center',
        fontFamily: '"Ubuntu", "Hiragino Sans GB", sans-serif',
        maxWidth: 0.6
      },
      subText: {
        relativeX: 0.65,
        relativeY: 0.65,
        fontSizeRatio: 0.03,
        maxFontSize: 24,
        textAlign: 'right',
        fontFamily: '"Ubuntu", "Hiragino Sans GB", sans-serif',
        maxWidth: 0.5
      },
      dataText: {
        relativeX: 0.8, // 右下
        relativeY: 0.8,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'right',
        fontStyle: 'italic',
        fontFamily: '"Ubuntu", "Hiragino Sans GB", sans-serif',
        maxWidth: 0.4
      }
    },
  
    /**
     * 正式风格 - 适合官方或正式场合
     */
    formal: {
      name: "正式风格",
      description: "适合官方或正式场合的布局，整齐规范",
      mainTitle: {
        relativeX: 0.5,
        relativeY: 0.25,
        fontSizeRatio: 0.07,
        maxFontSize: 55,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: '"Times New Roman", "SimSun", serif',
        letterSpacing: '0.03em'
      },
      slogan: {
        relativeX: 0.5,
        relativeY: 0.4,
        fontSizeRatio: 0.05,
        maxFontSize: 40,
        fontWeight: 'normal',
        textAlign: 'center',
        fontFamily: '"Times New Roman", "SimSun", serif',
        fontStyle: 'italic'
      },
      mainText: {
        relativeX: 0.5,
        relativeY: 0.55,
        fontSizeRatio: 0.035,
        maxFontSize: 28,
        textAlign: 'center',
        fontFamily: '"Times New Roman", "SimSun", serif',
        maxWidth: 0.7
      },
      subText: {
        relativeX: 0.5,
        relativeY: 0.7,
        fontSizeRatio: 0.03,
        maxFontSize: 22,
        textAlign: 'center',
        fontFamily: '"Times New Roman", "SimSun", serif',
        maxWidth: 0.6
      },
      dataText: {
        relativeX: 0.5,
        relativeY: 0.85,
        fontSizeRatio: 0.025,
        maxFontSize: 18,
        textAlign: 'center',
        fontStyle: 'normal',
        fontFamily: '"Times New Roman", "SimSun", serif',
        maxWidth: 0.6
      }
    }
  };
  
  /**
   * 获取所有可用模板
   * @returns {Array} 模板数组，包含id和名称
   */
  export function getAvailableTemplates() {
    return Object.entries(layoutTemplates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description
    }));
  }
  
  /**
   * 获取特定模板配置
   * @param {string} templateId - 模板ID
   * @returns {Object} 模板配置对象
   */
  export function getTemplateById(templateId) {
    return layoutTemplates[templateId] || layoutTemplates.classic;
  }
  
  /**
   * 根据模板ID和图片尺寸计算具体布局参数
   * @param {string} templateId - 模板ID
   * @param {number} width - 图片宽度
   * @param {number} height - 图片高度
   * @returns {Object} 计算后的布局参数
   */
  export function calculateLayout(templateId, width, height) {
    const template = getTemplateById(templateId);
    const layout = {};
    
    // 处理每个文本元素
    for (const [key, config] of Object.entries(template)) {
      if (key === 'name' || key === 'description') continue;
      
      // 计算字体大小
      const fontSize = Math.min(
        width * (config.fontSizeRatio || 0.05),
        config.maxFontSize || 40
      );
      
      // 计算位置
      layout[key] = {
        x: width * config.relativeX,
        y: height * config.relativeY,
        fontSize: fontSize,
        maxWidth: width * (config.maxWidth || 0.8),
        ...config
      };
    }
    
    return layout;
  }
  
  export default {
    layoutTemplates,
    getAvailableTemplates,
    getTemplateById,
    calculateLayout
  };