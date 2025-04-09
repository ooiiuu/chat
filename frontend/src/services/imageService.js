/**
 * 图像处理服务
 * 负责图像加载、处理和文字合成等功能
 */

import { extractCopywritingParts } from '@/utils/textUtils';
import { autoLayoutText, getLayoutConfig, getTextEffects } from '@/utils/layoutUtils';

/**
 * 加载图像
 * @param {string} src - 图像源URL
 * @returns {Promise<HTMLImageElement>} - 加载完成的图像元素
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域加载
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`图像加载失败: ${e.message}`));
    img.src = src;
  });
}

/**
 * 给图像添加文字
 * @param {HTMLImageElement} image - 图像元素
 * @param {Object} textParts - 文本内容对象
 * @param {Object} options - 配置选项
 * @returns {Promise<string>} - 处理后的图像数据URL
 */
export async function addTextToImage(image, textParts, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // 创建Canvas
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      
      const ctx = canvas.getContext('2d');
      
      // 绘制原始图像
      ctx.drawImage(image, 0, 0, image.width, image.height);
      
      // 获取布局配置
      const styleTemplate = options.styleTemplate || 'classic';
      const layout = options.useAutoLayout 
        ? autoLayoutText(image, textParts, styleTemplate)
        : getLayoutConfig(styleTemplate, image);
      
      // 绘制各部分文字
      if (textParts.mainTitle) {
        drawText(ctx, textParts.mainTitle, layout.mainTitle);
      }
      
      if (textParts.slogan) {
        drawText(ctx, textParts.slogan, layout.slogan);
      }
      
      if (textParts.mainText) {
        drawText(ctx, textParts.mainText, layout.mainText);
      }
      
      if (textParts.subText) {
        drawText(ctx, textParts.subText, layout.subText);
      }
      
      if (textParts.dataText) {
        drawText(ctx, textParts.dataText, layout.dataText);
      }
      
      // 转换为数据URL并返回
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 绘制文字到Canvas上
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {Object} style - 文字样式
 */
function drawText(ctx, text, style) {
  if (!text || !ctx) return;
  
  // 保存当前状态
  ctx.save();
  
  // 设置文字样式
  ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily || 'Arial, sans-serif'}`;
  ctx.textAlign = style.textAlign || 'center';
  ctx.textBaseline = 'middle';
  
  // 设置不透明度
  if (style.opacity !== undefined && style.opacity < 1) {
    ctx.globalAlpha = style.opacity;
  }
  
  // 应用字母间距
  if (style.letterSpacing && style.letterSpacing !== 'normal') {
    ctx.letterSpacing = style.letterSpacing;
  }
  
  // 应用文本变换
  if (style.textTransform === 'uppercase') {
    text = text.toUpperCase();
  } else if (style.textTransform === 'lowercase') {
    text = text.toLowerCase();
  }
  
  // 确定颜色
  let fillColor = style.color || '#ffffff';
  let strokeColor = style.strokeColor || 'rgba(0, 0, 0, 0.8)';
  
  // 为文字添加光晕效果
  const textEffects = getTextEffects(ctx, fillColor);
  ctx.shadowColor = textEffects.shadowColor;
  ctx.shadowBlur = textEffects.shadowBlur;
  ctx.shadowOffsetX = textEffects.shadowOffsetX;
  ctx.shadowOffsetY = textEffects.shadowOffsetY;
  
  // 如果文本长度超过maxWidth，就需要自动换行处理
  if (style.maxWidth && ctx.measureText(text).width > style.maxWidth) {
    drawWrappedText(ctx, text, style.x, style.y, fillColor, strokeColor, style);
  } else {
    // 绘制描边
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(text, style.x, style.y);
    }
    
    // 绘制填充
    ctx.fillStyle = fillColor;
    ctx.fillText(text, style.x, style.y);
  }
  
  // 恢复状态
  ctx.restore();
}

/**
 * 绘制自动换行的文字
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} fillColor - 填充颜色
 * @param {string} strokeColor - 描边颜色
 * @param {Object} style - 样式配置
 */
function drawWrappedText(ctx, text, x, y, fillColor, strokeColor, style) {
  const maxWidth = style.maxWidth;
  const lineHeight = style.fontSize * 1.2;
  
  // 分割文本，尝试按空格分词
  const words = text.includes(' ') ? text.split(' ') : text.split('');
  let line = '';
  const lines = [];
  
  // 构建每一行
  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  // 计算总高度以确定起始位置
  const totalHeight = lines.length * lineHeight;
  let startY = y;
  
  // 根据textAlign调整起始Y位置
  if (style.textBaseline === 'middle' || !style.textBaseline) {
    startY = y - (totalHeight / 2) + (lineHeight / 2);
  }
  
  // 绘制每一行
  for (let i = 0; i < lines.length; i++) {
    const lineY = startY + (i * lineHeight);
    
    // 根据对齐方式确定x坐标
    let lineX = x;
    if (style.textAlign === 'left') {
      // 保持x不变
    } else if (style.textAlign === 'right') {
      // 保持x不变，right对齐由ctx.textAlign处理
    } else {
      // center是默认值，保持x不变
    }
    
    // 绘制描边
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(lines[i], lineX, lineY);
    }
    
    // 绘制填充
    ctx.fillStyle = fillColor;
    ctx.fillText(lines[i], lineX, lineY);
  }
}

/**
 * 处理图像与文案的组合
 * @param {string} imageData - 图像数据URL
 * @param {string} copywritingText - 文案文本
 * @param {string} styleTemplate - 布局样式模板
 * @returns {Promise<string>} - 处理后的图像数据URL
 */
export async function processImageWithText(imageData, copywritingText, styleTemplate = 'classic') {
  try {
    // 提取文案结构
    const textParts = extractCopywritingParts(copywritingText);
    
    // 加载图片
    const image = await loadImage(imageData);
    
    // 配置选项
    const options = {
      styleTemplate: styleTemplate,
      useAutoLayout: styleTemplate === 'auto'  // 根据styleTemplate决定是否使用自动布局
    };
    
    // 处理图像添加文字
    return await addTextToImage(image, textParts, options);
  } catch (error) {
    console.error('处理图像与文案时出错:', error);
    throw error;
  }
}

/**
 * 将图像保存到本地
 * @param {string} dataUrl - 图像数据URL
 * @param {string} fileName - 文件名
 */
export function saveImageToLocal(dataUrl, fileName = 'public-poster.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

/**
 * 创建缩略图
 * @param {string} imageData - 图像数据URL
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxHeight - 最大高度
 * @returns {Promise<string>} - 缩略图数据URL
 */
export async function createThumbnail(imageData, maxWidth = 300, maxHeight = 200) {
  try {
    const image = await loadImage(imageData);
    
    // 计算缩放比例
    let width = image.width;
    let height = image.height;
    
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }
    
    if (height > maxHeight) {
      const ratio = maxHeight / height;
      height = maxHeight;
      width = width * ratio;
    }
    
    // 创建Canvas并绘制缩略图
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', 0.7); // 使用JPEG格式，质量0.7
  } catch (error) {
    console.error('创建缩略图失败:', error);
    throw error;
  }
}

export default {
  loadImage,
  addTextToImage,
  processImageWithText,
  saveImageToLocal,
  createThumbnail
};