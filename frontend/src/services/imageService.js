// src/services/imageService.js
/**
 * 图像处理服务
 * 负责图像加载、处理和文字合成等功能
 */

import { extractCopywritingParts } from '@/utils/textUtils';
import { autoLayoutText, getLayoutConfig, getTextEffects } from '@/utils/layoutUtils';

// 已绘制文字的边界框列表
let drawnTextBoundaries = [];

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
 * 计算文字边界框，增加额外的安全边距
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {Object} style - 文字样式
 * @returns {Object} 边界框 {left, top, right, bottom, width, height}
 */
function calculateTextBoundary(ctx, text, x, y, style) {
  // 获取文字测量值
  const metrics = ctx.measureText(text);

  // 计算文字高度
  const fontSize = style.fontSize || 16;
  const height = fontSize * 1.2;

  // 计算边界，考虑文字对齐方式
  let left, top, right, bottom;

  // 根据textAlign计算水平边界
  if (style.textAlign === 'left') {
    left = x;
    right = x + metrics.width;
  } else if (style.textAlign === 'right') {
    left = x - metrics.width;
    right = x;
  } else {
    // center是默认值
    left = x - metrics.width / 2;
    right = x + metrics.width / 2;
  }

  // 根据textBaseline计算垂直边界
  if (style.textBaseline === 'top') {
    top = y;
    bottom = y + height;
  } else if (style.textBaseline === 'bottom') {
    top = y - height;
    bottom = y;
  } else {
    // middle是默认值
    top = y - height / 2;
    bottom = y + height / 2;
  }

  // 添加边距，考虑描边和阴影，增加额外安全边距
  const baseMargin = (style.strokeWidth || 0) + (style.shadowBlur || 0);
  const safetyMargin = Math.max(10, fontSize * 0.2); // 至少10像素，或者字体大小的20%
  const margin = baseMargin + safetyMargin;

  left -= margin;
  top -= margin;
  right += margin;
  bottom += margin;

  return {
    left, top, right, bottom,
    width: right - left,
    height: bottom - top
  };
}

/**
 * 增强版：检查边界框是否在图像内，增加严格模式选项
 * @param {Object} boundary - 边界框
 * @param {number} imageWidth - 图像宽度
 * @param {number} imageHeight - 图像高度
 * @param {boolean} strict - 是否使用严格模式
 * @returns {boolean} 是否在图像内
 */
function isWithinImageBounds(boundary, imageWidth, imageHeight, strict = false) {
  strict = true; // 强制使用严格模式
  // 严格模式：完全在图像内
  if (strict) {
    return (
      boundary.left >= 0 &&
      boundary.top >= 0 &&
      boundary.right <= imageWidth &&
      boundary.bottom <= imageHeight
    );
  }

  // 非严格模式：允许小部分超出（适用于某些视觉效果）
  // 但至少80%的内容需要在图像内
  const boundaryWidth = boundary.right - boundary.left;
  const boundaryHeight = boundary.bottom - boundary.top;

  const leftOverlap = Math.max(0, -boundary.left);
  const rightOverlap = Math.max(0, boundary.right - imageWidth);
  const topOverlap = Math.max(0, -boundary.top);
  const bottomOverlap = Math.max(0, boundary.bottom - imageHeight);

  const xOverlapPercent = (leftOverlap + rightOverlap) / boundaryWidth;
  const yOverlapPercent = (topOverlap + bottomOverlap) / boundaryHeight;

  return xOverlapPercent <= 0.2 && yOverlapPercent <= 0.2;
}

/**
 * 检查两个边界框是否重叠
 * @param {Object} boundary1 - 第一个边界框
 * @param {Object} boundary2 - 第二个边界框
 * @param {number} tolerance - 重叠容忍度，允许部分重叠
 * @returns {boolean} 是否重叠
 */
function doBoxesOverlap(boundary1, boundary2, tolerance = 0) {
  // 允许一定程度的重叠
  return !(
    boundary1.right - tolerance < boundary2.left + tolerance ||
    boundary1.left + tolerance > boundary2.right - tolerance ||
    boundary1.bottom - tolerance < boundary2.top + tolerance ||
    boundary1.top + tolerance > boundary2.bottom - tolerance
  );
}

/**
 * 检查边界框是否与任何已绘制的文字重叠
 * @param {Object} boundary - 边界框
 * @param {number} tolerance - 重叠容忍度
 * @returns {boolean} 是否重叠
 */
function doesOverlapWithExisting(boundary, tolerance = 0) {
  for (const existingBoundary of drawnTextBoundaries) {
    if (doBoxesOverlap(boundary, existingBoundary, tolerance)) {
      return true;
    }
  }
  return false;
}

/**
 * 计算文本是否需要截断
 * @param {string} text - 原文本
 * @param {number} maxWidth - 最大宽度
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @returns {string} 截断后的文本
 */
function truncateTextIfNeeded(text, maxWidth, ctx) {
  if (!text || !maxWidth || !ctx) return text;

  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) return text;

  // 需要截断
  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  const availableWidth = maxWidth - ellipsisWidth;

  // 如果可用宽度太小，无法显示任何文本加省略号
  if (availableWidth <= 0) return ellipsis;

  // 二分查找法寻找合适的截断点
  let low = 0;
  let high = text.length;
  let mid = 0;

  while (low < high) {
    mid = Math.floor((low + high) / 2);
    const truncatedText = text.substring(0, mid);
    const truncatedWidth = ctx.measureText(truncatedText).width;

    if (truncatedWidth <= availableWidth) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  // 使用找到的位置减1，确保宽度不会超过
  const safeIndex = Math.max(0, low - 1);
  return text.substring(0, safeIndex) + ellipsis;
}

/**
 * 扩展的位置搜索，确保文字在图像内
 * @param {Object} boundary - 原始边界框
 * @param {number} imageWidth - 图像宽度
 * @param {number} imageHeight - 图像高度
 * @param {string} textType - 文本类型，用于优化位置选择
 * @returns {Object|null} 调整后的位置 {x, y} 或 null（如果无法调整）
 */
function findNonOverlappingPosition(boundary, imageWidth, imageHeight, textType = 'default') {
  // 原始位置
  const originalX = (boundary.left + boundary.right) / 2;
  const originalY = (boundary.top + boundary.bottom) / 2;

  // 如果文本宽度超过图像宽度的80%，则考虑强制置中
  const textWidth = boundary.right - boundary.left;
  const textHeight = boundary.bottom - boundary.top;

  // 对过宽的文本特殊处理
  if (textWidth > imageWidth * 0.8) {
    // 对于数据文本，考虑底部位置
    if (textType === 'dataText') {
      const bottomY = imageHeight - textHeight / 2 - 15;
      return { x: imageWidth / 2, y: bottomY };
    }

    // 对于其他文本，考虑中央位置
    return { x: imageWidth / 2, y: originalY };
  }

  // 尝试的方向和距离
  const directions = [
    { dx: 0, dy: -1 },  // 上
    { dx: 0, dy: 1 },   // 下
    { dx: -1, dy: 0 },  // 左
    { dx: 1, dy: 0 },   // 右
    { dx: 1, dy: -1 },  // 右上
    { dx: 1, dy: 1 },   // 右下
    { dx: -1, dy: 1 },  // 左下
    { dx: -1, dy: -1 }  // 左上
  ];

  // 对于特定类型的文本，优先考虑某些方向
  if (textType === 'dataText') {
    // 对于数据文本，优先考虑底部位置
    directions.sort((a, b) => Math.abs(b.dy) - Math.abs(a.dy));
  } else if (textType === 'mainTitle' || textType === 'slogan') {
    // 对于标题和口号，优先考虑顶部位置
    directions.sort((a, b) => Math.abs(a.dy) - Math.abs(b.dy));
  }

  // 增加步长和尝试次数
  const stepSizes = [20, 40, 60, 80, 100, 120, 150, 180, 210, 240, 270];

  // 尝试不同方向和步长
  for (const stepSize of stepSizes) {
    for (const dir of directions) {
      const newX = originalX + dir.dx * stepSize;
      const newY = originalY + dir.dy * stepSize;

      // 针对长文本的特殊处理
      let verticalAdjustment = 0;
      if (textType === 'dataText' && dir.dy !== 0) {
        verticalAdjustment = dir.dy * 30; // 额外的垂直移动
      }

      // 平移边界框
      const offsetX = newX - originalX;
      const offsetY = newY - originalY + verticalAdjustment;

      const newBoundary = {
        left: boundary.left + offsetX,
        top: boundary.top + offsetY,
        right: boundary.right + offsetX,
        bottom: boundary.bottom + offsetY,
        width: boundary.width,
        height: boundary.height
      };

      // 检查是否在图像内且不与现有文字重叠
      // 对数据文本使用宽松的边界检查
      const strictCheck = textType !== 'dataText';
      const tolerance = textType === 'dataText' ? 10 : 0;

      if (isWithinImageBounds(newBoundary, imageWidth, imageHeight, strictCheck) &&
        !doesOverlapWithExisting(newBoundary, tolerance)) {
        return { x: newX, y: newY + verticalAdjustment };
      }
    }
  }

  // 特殊位置尝试 - 对于数据文本
  if (textType === 'dataText') {
    // 尝试底部中央位置
    const bottomY = imageHeight - textHeight / 2 - 15;
    const bottomBoundary = {
      left: imageWidth / 2 - textWidth / 2,
      top: bottomY - textHeight / 2,
      right: imageWidth / 2 + textWidth / 2,
      bottom: bottomY + textHeight / 2,
      width: textWidth,
      height: textHeight
    };

    if (isWithinImageBounds(bottomBoundary, imageWidth, imageHeight, false) &&
      !doesOverlapWithExisting(bottomBoundary, 10)) {
      return { x: imageWidth / 2, y: bottomY };
    }

    // 尝试底部右侧位置
    const bottomRightY = imageHeight - textHeight / 2 - 15;
    const bottomRightX = imageWidth - textWidth / 2 - 15;
    const bottomRightBoundary = {
      left: bottomRightX - textWidth / 2,
      top: bottomRightY - textHeight / 2,
      right: bottomRightX + textWidth / 2,
      bottom: bottomRightY + textHeight / 2,
      width: textWidth,
      height: textHeight
    };

    if (isWithinImageBounds(bottomRightBoundary, imageWidth, imageHeight, false) &&
      !doesOverlapWithExisting(bottomRightBoundary, 10)) {
      return { x: bottomRightX, y: bottomRightY };
    }

    // 尝试底部左侧位置
    const bottomLeftY = imageHeight - textHeight / 2 - 15;
    const bottomLeftX = textWidth / 2 + 15;
    const bottomLeftBoundary = {
      left: bottomLeftX - textWidth / 2,
      top: bottomLeftY - textHeight / 2,
      right: bottomLeftX + textWidth / 2,
      bottom: bottomLeftY + textHeight / 2,
      width: textWidth,
      height: textHeight
    };

    if (isWithinImageBounds(bottomLeftBoundary, imageWidth, imageHeight, false) &&
      !doesOverlapWithExisting(bottomLeftBoundary, 10)) {
      return { x: bottomLeftX, y: bottomLeftY };
    }
  }

  // 如果无法找到合适的位置，返回null
  return null;
}

/**
 * 智能型文本自动调整
 * @param {string} text - 文本内容
 * @param {Object} style - 原始样式
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} imageWidth - 图像宽度
 * @param {number} imageHeight - 图像高度
 * @param {string} textType - 文本类型
 * @returns {Object} 调整后的样式和文本
 */
function smartTextAdjustment(text, style, ctx, imageWidth, imageHeight, textType) {
  let adjustedStyle = { ...style };
  let adjustedText = text;

  // 最大宽度约束
  const maxAllowedWidth = imageWidth * 0.9; // 不允许超过图片宽度的90%

  // 基于文本长度和类型设置最大宽度
  if (!adjustedStyle.maxWidth || adjustedStyle.maxWidth > maxAllowedWidth) {
    adjustedStyle.maxWidth = maxAllowedWidth;
  }

  // 根据文本长度自动调整字体大小
  if (text.length > 20) {
    // 长文本减小字体
    const lengthFactor = Math.min(1, 1.5 * (20 / text.length));
    adjustedStyle.fontSize = Math.max(adjustedStyle.fontSize * lengthFactor, 12);
  }

  // 针对不同文本类型的调整
  if (textType === 'dataText') {
    // 数据文本可以使用更小的字体
    adjustedStyle.fontSize = Math.min(adjustedStyle.fontSize, 16);
    if (text.length > 25) {
      adjustedStyle.fontSize = Math.min(adjustedStyle.fontSize, 14);
    }

    // 长数据文本优先尝试换行而不是截断
    if (text.length > 40) {
      adjustedStyle.maxWidth = Math.min(adjustedStyle.maxWidth, imageWidth * 0.75);
    }

    // 数据文本优先放在底部
    if (adjustedStyle.y < imageHeight * 0.6) {
      adjustedStyle.y = imageHeight * 0.85;
    }
  } else if (textType === 'mainTitle') {
    // 确保主标题够大够醒目
    adjustedStyle.fontSize = Math.max(adjustedStyle.fontSize, 24);
    // 主标题如果太长，可以适当缩小
    if (text.length > 10) {
      const titleFactor = Math.min(1, 1.2 * (10 / text.length));
      adjustedStyle.fontSize = Math.max(adjustedStyle.fontSize * titleFactor, 20);
    }
  } else if (textType === 'slogan') {
    // 口号需要醒目但次于标题
    adjustedStyle.fontSize = Math.max(adjustedStyle.fontSize, 20);
    if (text.length > 15) {
      const sloganFactor = Math.min(1, 1.2 * (15 / text.length));
      adjustedStyle.fontSize = Math.max(adjustedStyle.fontSize * sloganFactor, 18);
    }
  }

  // 根据当前字体大小检查文本宽度
  ctx.font = `${adjustedStyle.fontStyle || 'normal'} ${adjustedStyle.fontWeight || 'normal'} ${adjustedStyle.fontSize}px ${adjustedStyle.fontFamily || 'Arial, sans-serif'}`;
  const metrics = ctx.measureText(text);

  // 如果文本宽度超过最大宽度且不允许换行，则截断文本
  if (metrics.width > adjustedStyle.maxWidth &&
    (textType === 'mainTitle' || textType === 'slogan')) {
    adjustedText = truncateTextIfNeeded(text, adjustedStyle.maxWidth, ctx);
  }

  return {
    style: adjustedStyle,
    text: adjustedText
  };
}

/**
 * 绘制文字到Canvas上，确保文字不会超出边界
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {Object} style - 文字样式
 * @param {number} imageWidth - 图像宽度
 * @param {number} imageHeight - 图像高度
 * @param {string} textType - 文本类型
 * @returns {boolean} 是否成功绘制
 */
function drawText(ctx, text, style, imageWidth, imageHeight, textType = 'default') {
  if (!text || !ctx) return false;

  // 保存原始样式用于可能的回退
  const originalStyle = { ...style };
  const originalText = text;

  // 智能调整文本和样式
  const adjustment = smartTextAdjustment(text, style, ctx, imageWidth, imageHeight, textType);
  text = adjustment.text;
  Object.assign(style, adjustment.style);

  // 计算文字边界框
  let boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);

  // 检查是否在图像内
  const strictCheck = textType !== 'dataText';
  const isWithinBounds = isWithinImageBounds(boundary, imageWidth, imageHeight, strictCheck);

  // 检查是否与现有文字重叠
  const tolerance = textType === 'dataText' ? 5 : 0; // 数据文本允许轻微重叠
  const doesOverlap = doesOverlapWithExisting(boundary, tolerance);

  // 如果不在图像内或重叠，尝试调整位置
  if (!isWithinBounds || doesOverlap) {
    const newPosition = findNonOverlappingPosition(boundary, imageWidth, imageHeight, textType);

    // 如果找到新位置，更新坐标
    if (newPosition) {
      style.x = newPosition.x;
      style.y = newPosition.y;
      // 重新计算边界框
      boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
    } else {
      // 如果没有找到合适的位置，尝试缩小字体
      if (style.fontSize > 10) {
        // 逐步减小字体
        const reductionSteps = [0.8, 0.7, 0.6, 0.5, 0.4];
        let foundSolution = false;

        for (const factor of reductionSteps) {
          const smallerFontSize = Math.max(10, originalStyle.fontSize * factor);
          style.fontSize = smallerFontSize;

          // 如果是长文本，同时减小maxWidth
          if (text.length > 30 && style.maxWidth) {
            style.maxWidth = Math.min(originalStyle.maxWidth * factor, imageWidth * 0.9);
          }

          // 尝试截断文本
          if (textType !== 'dataText' && text.length > 20) {
            const tempCtx = ctx.save();
            ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily || 'Arial, sans-serif'}`;
            text = truncateTextIfNeeded(originalText, style.maxWidth, ctx);
            ctx.restore();
          }

          // 重新计算边界并检查
          const newBoundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
          if (isWithinImageBounds(newBoundary, imageWidth, imageHeight, strictCheck) &&
            !doesOverlapWithExisting(newBoundary, tolerance)) {
            boundary = newBoundary;
            foundSolution = true;
            break;
          }

          // 尝试调整位置
          const newPosition = findNonOverlappingPosition(newBoundary, imageWidth, imageHeight, textType);
          if (newPosition) {
            style.x = newPosition.x;
            style.y = newPosition.y;
            boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
            foundSolution = true;
            break;
          }
        }

        if (!foundSolution) {
          // 最后的尝试：将数据文本放在最底部
          if (textType === 'dataText') {
            style.fontSize = Math.max(10, originalStyle.fontSize * 0.3);
            style.y = imageHeight - 20;
            style.x = imageWidth / 2; // 居中
            style.maxWidth = imageWidth * 0.9;
            style.textAlign = 'center';

            // 对于极长的数据文本，可能需要截断
            ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily || 'Arial, sans-serif'}`;
            if (ctx.measureText(text).width > style.maxWidth) {
              text = truncateTextIfNeeded(text, style.maxWidth, ctx);
            }

            boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);

            if (!isWithinImageBounds(boundary, imageWidth, imageHeight, false)) {
              console.warn('无法适配数据文本，使用最小字体放置于底部');
              // 最后的兜底策略
              style.fontSize = 10;
              style.y = imageHeight - 12;
              text = truncateTextIfNeeded(text, imageWidth * 0.9, ctx);
              boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
            }
          } else if (textType === 'mainTitle' || textType === 'slogan') {
            // 对于标题类文本，保持在原位置但减小字体并截断
            console.warn(`无法适配${textType}，缩小并截断文本:`, text);
            style.fontSize = Math.max(10, originalStyle.fontSize * 0.5);
            style.x = originalStyle.x;
            style.y = originalStyle.y;
            ctx.font = `${style.fontStyle || 'normal'} ${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily || 'Arial, sans-serif'}`;
            text = truncateTextIfNeeded(originalText, Math.min(imageWidth * 0.8, style.maxWidth || imageWidth * 0.8), ctx);
            boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
          } else {
            // 对于其他文本，尝试最小字体
            console.warn('无法适配文字，使用原始位置:', text);
            style.fontSize = Math.max(10, originalStyle.fontSize * 0.4);
            style.x = originalStyle.x;
            style.y = originalStyle.y;
            boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
          }
        }
      } else {
        console.warn('无法适配文字，使用原始位置:', text);
        // 恢复原始位置，保持最小字体
        style.x = originalStyle.x;
        style.y = originalStyle.y;
        boundary = calculateTextBoundary(ctx, text, style.x, style.y, style);
      }
    }
  }

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

  // 最后检查文本是否需要换行
  if (style.maxWidth && ctx.measureText(text).width > style.maxWidth) {
    drawWrappedText(ctx, text, style.x, style.y, fillColor, strokeColor, style, imageWidth, imageHeight, textType);
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

  // 将边界框添加到已绘制列表
  drawnTextBoundaries.push(boundary);

  // 恢复状态
  ctx.restore();

  return true;
}

/**
 * 增强的文本分行算法，适合中英文混合文本
 * @param {string} text - 文本内容
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {number} maxWidth - 最大宽度
 * @param {string} textType - 文本类型
 * @returns {string[]} 分行后的文本数组
 */
function enhancedTextWrapping(text, ctx, maxWidth, textType) {
  // 极短文本或空文本不需要换行
  if (!text || text.length <= 1 || ctx.measureText(text).width <= maxWidth) {
    return [text];
  }

  // 中文和英文的分行策略不同
  const isMostlyChinese = /[\u4e00-\u9fa5]/.test(text) && text.length - text.replace(/[\u4e00-\u9fa5]/g, '').length > text.length * 0.5;

  // 如果是数据文本，尝试在标点符号处断行
  if ((textType === 'dataText' || isMostlyChinese) && text.length > 15) {
    // 寻找合适的断点
    const breakPoints = [
      '，', ',', '。', '；', ';', '：', ':', '！', '!', '?', '？',
      '年', '月', '日', '%', '、', '）', ')', ']', '》', '」', '"', '\'', ' '
    ];

    // 优先选择中文句号
    const primaryBreakPoints = ['。', '！', '？', '；', '：', '…'];

    // 查找优先断点
    for (const point of primaryBreakPoints) {
      const index = text.indexOf(point);
      if (index !== -1 && index > 0 && index < text.length - 1) {
        const firstPart = text.substring(0, index + 1);
        if (ctx.measureText(firstPart).width <= maxWidth) {
          const secondPart = text.substring(index + 1);
          // 递归处理后半部分
          if (ctx.measureText(secondPart).width > maxWidth) {
            return [firstPart, ...enhancedTextWrapping(secondPart, ctx, maxWidth, textType)];
          } else {
            return [firstPart, secondPart];
          }
        }
      }
    }

    // 如果没有找到优先断点，再寻找次要断点
    let bestBreakIndex = -1;
    let bestBreakWidth = 0;

    // 查找最接近中间的断点
    for (const point of breakPoints) {
      let lastIndex = -1;
      let currentIndex = 0;

      // 查找所有断点位置
      while ((currentIndex = text.indexOf(point, lastIndex + 1)) !== -1) {
        const partWidth = ctx.measureText(text.substring(0, currentIndex + 1)).width;

        // 如果这个断点位置的宽度小于maxWidth且大于之前找到的最佳宽度
        if (partWidth <= maxWidth && partWidth > bestBreakWidth) {
          bestBreakWidth = partWidth;
          bestBreakIndex = currentIndex;
        }

        lastIndex = currentIndex;
      }
    }

    // 如果找到了合适的断点
    if (bestBreakIndex !== -1) {
      const firstPart = text.substring(0, bestBreakIndex + 1);
      const secondPart = text.substring(bestBreakIndex + 1);

      // 递归处理后半部分
      if (ctx.measureText(secondPart).width > maxWidth) {
        return [firstPart, ...enhancedTextWrapping(secondPart, ctx, maxWidth, textType)];
      } else {
        return [firstPart, secondPart];
      }
    }
  }

  // 如果是英文文本或上面的方法失效，则按照单词分割
  if (text.includes(' ')) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  // 对于不含空格的长文本（如中文或无空格英文），逐字符分割
  let currentLine = '';
  let lines = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;

    if (ctx.measureText(testLine).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        // 如果单个字符就超出了最大宽度，我们没有选择，只能把它放在一行
        lines.push(char);
        currentLine = '';
      }
    } else {
      currentLine += char;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 绘制自动换行的文字，确保不会超出边界
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {string} fillColor - 填充颜色
 * @param {string} strokeColor - 描边颜色
 * @param {Object} style - 样式配置
 * @param {number} imageWidth - 图像宽度
 * @param {number} imageHeight - 图像高度
 * @param {string} textType - 文本类型
 */
function drawWrappedText(ctx, text, x, y, fillColor, strokeColor, style, imageWidth, imageHeight, textType = 'default') {
  const maxWidth = style.maxWidth;
  const lineHeight = style.fontSize * 1.2;

  // 使用增强的文本分行
  const lines = enhancedTextWrapping(text, ctx, maxWidth, textType);

  // 计算总高度以确定起始位置
  const totalHeight = lines.length * lineHeight;
  let startY = y;

  // 根据textBaseline调整起始Y位置
  if (style.textBaseline === 'middle' || !style.textBaseline) {
    startY = y - (totalHeight / 2) + (lineHeight / 2);
  }

  // 计算整个文本块的边界
  const lineMetrics = [];
  for (let i = 0; i < lines.length; i++) {
    const lineY = startY + (i * lineHeight);
    const metrics = ctx.measureText(lines[i]);
    lineMetrics.push({
      text: lines[i],
      width: metrics.width,
      y: lineY
    });
  }

  // 计算文本块的边界框
  let left = x, right = x, top = startY - lineHeight / 2, bottom = startY + totalHeight - lineHeight / 2;

  if (style.textAlign === 'left') {
    right = x + Math.max(...lineMetrics.map(m => m.width));
  } else if (style.textAlign === 'right') {
    left = x - Math.max(...lineMetrics.map(m => m.width));
  } else { // center
    const maxLineWidth = Math.max(...lineMetrics.map(m => m.width));
    left = x - maxLineWidth / 2;
    right = x + maxLineWidth / 2;
  }

  const blockBoundary = {
    left: left - (style.strokeWidth || 0) - (style.shadowBlur || 0) - 5,
    top: top - (style.strokeWidth || 0) - (style.shadowBlur || 0) - 5,
    right: right + (style.strokeWidth || 0) + (style.shadowBlur || 0) + 5,
    bottom: bottom + (style.strokeWidth || 0) + (style.shadowBlur || 0) + 5,
    width: right - left + 2 * ((style.strokeWidth || 0) + (style.shadowBlur || 0) + 5),
    height: bottom - top + 2 * ((style.strokeWidth || 0) + (style.shadowBlur || 0) + 5)
  };

  // 确保整个文本块在图像内
  const strictCheck = textType !== 'dataText';
  const tolerance = textType === 'dataText' ? 10 : 0;

  if (!isWithinImageBounds(blockBoundary, imageWidth, imageHeight, strictCheck) ||
    doesOverlapWithExisting(blockBoundary, tolerance)) {

    // 尝试调整位置
    const newPosition = findNonOverlappingPosition(blockBoundary, imageWidth, imageHeight, textType);

    if (newPosition) {
      // 更新坐标
      const offsetX = newPosition.x - x;
      const offsetY = newPosition.y - y;
      x = newPosition.x;
      y = newPosition.y;
      startY = startY + offsetY;
    } else {
      // 如果找不到合适位置，尝试减小字体
      if (style.fontSize > 10) {
        style.fontSize = Math.max(10, style.fontSize * 0.7);

        // 重新计算行高
        const newLineHeight = style.fontSize * 1.2;

        // 递归调用自身，用较小的字体再试一次
        drawWrappedText(
          ctx, text, x, y, fillColor, strokeColor,
          { ...style, fontSize: style.fontSize, lineHeight: newLineHeight },
          imageWidth, imageHeight, textType
        );
        return;
      } else if (textType === 'dataText') {
        // 数据文本最后尝试：极小字体，居中放置在底部
        style.fontSize = 10;
        y = imageHeight - ((lines.length * lineHeight) / 2) - 10;
        startY = y - ((lines.length * lineHeight) / 2) + (lineHeight / 2);
        x = imageWidth / 2; // 居中
        style.textAlign = 'center';
      } else {
        // 其他文本：无法适应，直接截断处理
        const truncatedText = truncateTextIfNeeded(text, maxWidth, ctx);
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;

        if (style.strokeWidth > 0) {
          ctx.lineWidth = style.strokeWidth;
          ctx.strokeText(truncatedText, x, y);
        }

        ctx.fillText(truncatedText, x, y);
        return;
      }
    }
  }

  // 检查起始位置是否在图像内
  if (startY < 10) {
    startY = 10 + lineHeight / 2;
  } else if (startY + totalHeight > imageHeight - 10) {
    startY = imageHeight - 10 - totalHeight + lineHeight / 2;
  }

  // 绘制每一行
  for (let i = 0; i < lines.length; i++) {
    const lineY = startY + (i * lineHeight);

    // 确保每一行单独都在图像内
    if (lineY < 10 || lineY > imageHeight - 10) {
      continue; // 跳过不在图像内的行
    }

    // 绘制描边
    if (style.strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(lines[i], x, lineY);
    }

    // 绘制填充
    ctx.fillStyle = fillColor;
    ctx.fillText(lines[i], x, lineY);
  }

  // 将边界框添加到已绘制列表
  drawnTextBoundaries.push(blockBoundary);
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
      // 重置已绘制文字的边界框列表
      drawnTextBoundaries = [];

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

      // 添加一个确保maxWidth合理的逻辑
      Object.keys(layout).forEach(key => {
        if (layout[key] && !layout[key].maxWidth) {
          layout[key].maxWidth = Math.min(image.width * 0.8,
            (layout[key].fontSize || 20) * 20); // 默认允许约20个字符宽度
        }
      });

      // 绘制各部分文字，优先级从高到低 - 按照重要性顺序处理
      if (textParts.mainTitle) {
        drawText(ctx, textParts.mainTitle, layout.mainTitle, image.width, image.height, 'mainTitle');
      }

      if (textParts.slogan) {
        drawText(ctx, textParts.slogan, layout.slogan, image.width, image.height, 'slogan');
      }

      if (textParts.mainText) {
        drawText(ctx, textParts.mainText, layout.mainText, image.width, image.height, 'mainText');
      }

      if (textParts.subText) {
        drawText(ctx, textParts.subText, layout.subText, image.width, image.height, 'subText');
      }

      // 数据文本放在最后处理，因为它通常可以更灵活地调整位置
      if (textParts.dataText) {
        drawText(ctx, textParts.dataText, layout.dataText, image.width, image.height, 'dataText');
      }

      // 转换为数据URL并返回
      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error('处理图像与文案时出错:', error);
      reject(error);
    }
  });
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
  createThumbnail,
  calculateTextBoundary,
  isWithinImageBounds,
  doBoxesOverlap,
  doesOverlapWithExisting,
  enhancedTextWrapping,
  truncateTextIfNeeded
};