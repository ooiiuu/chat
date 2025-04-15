// src/utils/textUtils.js
/**
 * 文案处理工具函数
 * 用于解析和处理AI生成的公益海报文案
 */

/**
 * 提取文案中的各个组成部分
 * @param {string} copywritingText - AI生成的完整文案文本
 * @returns {object} 结构化的文案对象
 */
export function extractCopywritingParts(copywritingText) {
    // 如果输入为空，返回空对象
    if (!copywritingText) {
      return {
        mainTitle: '',
        slogan: '',
        visualMetaphor: '',
        mainText: '',
        subText: '',
        dataText: ''
      };
    }
  
    const parts = {
      mainTitle: '', // 主题凝练
      slogan: '',    // 震撼标语
      visualMetaphor: '', // 视觉隐喻
      mainText: '',  // 主文案
      subText: '',   // 副文案
      dataText: ''   // 数据支撑
    };
    
    try {
      // 提取[主题凝练]部分
      const mainTitleMatch = copywritingText.match(/\[主题凝练\](.*?)(?=\[|$)/s);
      if (mainTitleMatch) {
        parts.mainTitle = mainTitleMatch[1].trim();
      }
      
      // 提取[震撼标语]部分
      const sloganMatch = copywritingText.match(/\[震撼标语\](.*?)(?=\[|$)/s);
      if (sloganMatch) {
        parts.slogan = sloganMatch[1].trim();
      }
      
      // 提取[视觉隐喻]部分
      const visualMetaphorMatch = copywritingText.match(/\[视觉隐喻\](.*?)(?=\[|$)/s);
      if (visualMetaphorMatch) {
        parts.visualMetaphor = visualMetaphorMatch[1].trim();
      }
      
      // 提取[分层文案]部分
      const layeredTextSection = copywritingText.match(/\[分层文案\](.*?)(?=\[|$)/s);
      if (layeredTextSection) {
        const layeredText = layeredTextSection[1];
        
        // 提取主文案
        const mainTextMatch = layeredText.match(/主[：:](.*?)(?=副[：:]|数据[：:]|$)/s);
        if (mainTextMatch) {
          parts.mainText = mainTextMatch[1].trim();
        }
        
        // 提取副文案
        const subTextMatch = layeredText.match(/副[：:](.*?)(?=主[：:]|数据[：:]|$)/s);
        if (subTextMatch) {
          parts.subText = subTextMatch[1].trim();
        }
        
        // 提取数据支撑
        const dataTextMatch = layeredText.match(/数据[：:](.*?)(?=主[：:]|副[：:]|$)/s);
        if (dataTextMatch) {
          parts.dataText = dataTextMatch[1].trim();
        }
      } else {
        // 尝试直接匹配主文案、副文案和数据（没有[分层文案]标记的情况）
        const mainTextMatch = copywritingText.match(/主[：:](.*?)(?=副[：:]|数据[：:]|$)/s);
        if (mainTextMatch) {
          parts.mainText = mainTextMatch[1].trim();
        }
        
        const subTextMatch = copywritingText.match(/副[：:](.*?)(?=主[：:]|数据[：:]|$)/s);
        if (subTextMatch) {
          parts.subText = subTextMatch[1].trim();
        }
        
        const dataTextMatch = copywritingText.match(/数据[：:](.*?)(?=主[：:]|副[：:]|$)/s);
        if (dataTextMatch) {
          parts.dataText = dataTextMatch[1].trim();
        }
      }
      
      // 清理文本中可能包含的emoji和特殊符号（保留基本的感叹号等）
      for (const key in parts) {
        if (parts[key]) {
          // 去除多余的空格、换行符等
          parts[key] = parts[key].replace(/\s+/g, ' ').trim();
        }
      }
    } catch (error) {
      console.error('解析文案时出错:', error);
    }
    
    return parts;
  }
  
  /**
   * 格式化文案以便于显示
   * @param {object} textParts - 已结构化的文案对象
   * @returns {string} 格式化后的文案文本
   */
  export function formatCopywriting(textParts) {
    let formatted = '';
    
    if (textParts.mainTitle) {
      formatted += `【${textParts.mainTitle}】\n\n`;
    }
    
    if (textParts.slogan) {
      formatted += `${textParts.slogan}\n\n`;
    }
    
    if (textParts.mainText) {
      formatted += `${textParts.mainText}\n\n`;
    }
    
    if (textParts.subText) {
      formatted += `${textParts.subText}\n\n`;
    }
    
    if (textParts.dataText) {
      formatted += `${textParts.dataText}`;
    }
    
    return formatted;
  }
  
  /**
   * 从文本中提取表情符号
   * @param {string} text - 要分析的文本
   * @returns {string} 提取的表情符号
   */
  export function extractEmoji(text) {
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}❗️❓‼️]/gu;
    const matches = text.match(emojiRegex);
    
    if (matches && matches.length > 0) {
      return matches.join('');
    }
    
    return '';
  }
  
  /**
   * 判断文案的情感基调
   * @param {string} text - 要分析的文本
   * @returns {string} 情感基调（positive, negative, neutral）
   */
  export function determineTextMood(text) {
    // 积极情绪关键词
    const positiveWords = ['希望', '美好', '未来', '行动', '保护', '拯救', '改变', '共建', '携手'];
    
    // 消极情绪关键词
    const negativeWords = ['危机', '灾难', '濒危', '消失', '破坏', '污染', '威胁', '灭绝', '死亡'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    // 检查积极词
    positiveWords.forEach(word => {
      const regex = new RegExp(word, 'g');
      const matches = text.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    });
    
    // 检查消极词
    negativeWords.forEach(word => {
      const regex = new RegExp(word, 'g');
      const matches = text.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    });
    
    // 判断情感基调
    if (positiveCount > negativeCount * 1.5) {
      return 'positive';
    } else if (negativeCount > positiveCount * 1.5) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * 生成文案的简短摘要
   * @param {object} textParts - 结构化的文案对象
   * @param {number} maxLength - 摘要的最大长度
   * @returns {string} 生成的摘要
   */
  export function generateSummary(textParts, maxLength = 50) {
    let summary = textParts.mainTitle || '';
    
    if (!summary && textParts.slogan) {
      summary = textParts.slogan;
    } else if (summary && textParts.slogan) {
      summary += ` - ${textParts.slogan}`;
    }
    
    if (!summary && textParts.mainText) {
      summary = textParts.mainText;
    }
    
    // 截断长摘要
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }
    
    return summary;
  }
  
  /**
   * 估计文本在指定字体大小下的渲染宽度
   * @param {string} text - 要测量的文本
   * @param {string} font - CSS字体描述（例如："bold 20px Arial"）
   * @returns {number} 估计的宽度（像素）
   */
  export function estimateTextWidth(text, font) {
    // 创建临时画布用于测量文本
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }
  
  /**
   * 根据文本长度自动调整字体大小
   * @param {string} text - 要显示的文本
   * @param {number} maxWidth - 容器最大宽度
   * @param {number} initialFontSize - 初始字体大小
   * @param {string} fontFamily - 字体系列
   * @returns {number} 调整后的字体大小
   */
  export function autoAdjustFontSize(text, maxWidth, initialFontSize, fontFamily = 'Arial') {
    let fontSize = initialFontSize;
    let textWidth = estimateTextWidth(text, `bold ${fontSize}px ${fontFamily}`);
    
    // 如果文本太长，逐步减小字体大小
    while (textWidth > maxWidth && fontSize > 10) {
      fontSize -= 1;
      textWidth = estimateTextWidth(text, `bold ${fontSize}px ${fontFamily}`);
    }
    
    return fontSize;
  }
  
  /**
   * 将长文本拆分为多行
   * @param {string} text - 原始文本
   * @param {number} maxCharsPerLine - 每行最大字符数
   * @returns {string[]} 拆分后的文本行数组
   */
  export function splitTextIntoLines(text, maxCharsPerLine) {
    if (!text) return [];
    
    // 如果文本包含换行符，按换行符拆分
    if (text.includes('\n')) {
      return text.split('\n');
    }
    
    // 按空格拆分单词
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      // 尝试添加下一个单词
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      // 检查长度是否超过限制
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        // 如果当前行不为空，添加到行数组
        if (currentLine) {
          lines.push(currentLine);
        }
        
        // 检查单个单词是否超过最大长度
        if (word.length > maxCharsPerLine) {
          // 拆分长单词
          let i = 0;
          while (i < word.length) {
            lines.push(word.substr(i, maxCharsPerLine));
            i += maxCharsPerLine;
          }
          currentLine = '';
        } else {
          currentLine = word;
        }
      }
    });
    
    // 添加最后一行
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  export default {
    extractCopywritingParts,
    formatCopywriting,
    extractEmoji,
    determineTextMood,
    generateSummary,
    estimateTextWidth,
    autoAdjustFontSize,
    splitTextIntoLines
  };