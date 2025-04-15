// src/utils/layoutUtils.js
/**
 * 布局工具函数
 * 用于自动分析图片和安排文字布局
 */

import { layoutTemplates } from '@/config/layoutTemplates';
import { estimateTextWidth } from '@/utils/textUtils';

/**
 * 根据样式名称获取布局配置
 * @param {string} styleName - 样式模板名称
 * @param {HTMLImageElement} image - 图片元素
 * @returns {Object} 布局配置
 */
export function getLayoutConfig(styleName, image) {
    const template = layoutTemplates[styleName] || layoutTemplates.classic;

    // 根据模板和图片尺寸计算具体布局
    return {
        mainTitle: {
            x: image.width * template.mainTitle.relativeX,
            y: image.height * template.mainTitle.relativeY,
            fontSize: Math.min(image.width * template.mainTitle.fontSizeRatio, template.mainTitle.maxFontSize),
            fontWeight: template.mainTitle.fontWeight || 'bold',
            textAlign: template.mainTitle.textAlign || 'center',
            fontFamily: template.mainTitle.fontFamily || 'Arial, sans-serif',
            maxWidth: image.width * (template.mainTitle.maxWidth || 0.8),
            opacity: template.mainTitle.opacity || 1,
            letterSpacing: template.mainTitle.letterSpacing || 'normal',
            textTransform: template.mainTitle.textTransform || 'none',
            strokeWidth: template.mainTitle.strokeWidth || 3
        },
        slogan: {
            x: image.width * template.slogan.relativeX,
            y: image.height * template.slogan.relativeY,
            fontSize: Math.min(image.width * template.slogan.fontSizeRatio, template.slogan.maxFontSize),
            fontWeight: template.slogan.fontWeight || 'bold',
            textAlign: template.slogan.textAlign || 'center',
            fontFamily: template.slogan.fontFamily || 'Arial, sans-serif',
            maxWidth: image.width * (template.slogan.maxWidth || 0.7),
            opacity: template.slogan.opacity || 1,
            letterSpacing: template.slogan.letterSpacing || 'normal',
            textTransform: template.slogan.textTransform || 'none',
            strokeWidth: template.slogan.strokeWidth || 3
        },
        mainText: {
            x: image.width * template.mainText.relativeX,
            y: image.height * template.mainText.relativeY,
            fontSize: Math.min(image.width * template.mainText.fontSizeRatio, template.mainText.maxFontSize),
            fontWeight: template.mainText.fontWeight || 'normal',
            textAlign: template.mainText.textAlign || 'center',
            fontFamily: template.mainText.fontFamily || 'Arial, sans-serif',
            maxWidth: image.width * (template.mainText.maxWidth || 0.6),
            opacity: template.mainText.opacity || 1,
            letterSpacing: template.mainText.letterSpacing || 'normal',
            textTransform: template.mainText.textTransform || 'none',
            strokeWidth: template.mainText.strokeWidth || 2
        },
        subText: {
            x: image.width * template.subText.relativeX,
            y: image.height * template.subText.relativeY,
            fontSize: Math.min(image.width * template.subText.fontSizeRatio, template.subText.maxFontSize),
            fontWeight: template.subText.fontWeight || 'normal',
            textAlign: template.subText.textAlign || 'center',
            fontFamily: template.subText.fontFamily || 'Arial, sans-serif',
            maxWidth: image.width * (template.subText.maxWidth || 0.6),
            opacity: template.subText.opacity || 1,
            letterSpacing: template.subText.letterSpacing || 'normal',
            textTransform: template.subText.textTransform || 'none',
            strokeWidth: template.subText.strokeWidth || 2
        },
        dataText: {
            x: image.width * template.dataText.relativeX,
            y: image.height * template.dataText.relativeY,
            fontSize: Math.min(image.width * template.dataText.fontSizeRatio, template.dataText.maxFontSize),
            fontWeight: template.dataText.fontWeight || 'normal',
            textAlign: template.dataText.textAlign || 'center',
            fontFamily: template.dataText.fontFamily || 'Arial, sans-serif',
            fontStyle: template.dataText.fontStyle || 'italic',
            maxWidth: image.width * (template.dataText.maxWidth || 0.6),
            opacity: template.dataText.opacity || 1,
            letterSpacing: template.dataText.letterSpacing || 'normal',
            textTransform: template.dataText.textTransform || 'none',
            strokeWidth: template.dataText.strokeWidth || 1
        }
    };
}

/**
 * 分析图片区域的亮度和颜色特征
 * @param {HTMLImageElement} image - 要分析的图片元素
 * @returns {Object} 图片分析结果
 */
export function analyzeImage(image) {
    // 创建临时canvas来分析图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });;

    // 设置canvas尺寸为图片尺寸
    canvas.width = image.width;
    canvas.height = image.height;

    // 在canvas上绘制图片
    ctx.drawImage(image, 0, 0);

    // 划分图片为9个区域进行分析
    const regions = [
        // 上方区域(左、中、右)
        { x: 0, y: 0, width: image.width / 3, height: image.height / 3 },
        { x: image.width / 3, y: 0, width: image.width / 3, height: image.height / 3 },
        { x: 2 * image.width / 3, y: 0, width: image.width / 3, height: image.height / 3 },

        // 中间区域(左、中、右)
        { x: 0, y: image.height / 3, width: image.width / 3, height: image.height / 3 },
        { x: image.width / 3, y: image.height / 3, width: image.width / 3, height: image.height / 3 },
        { x: 2 * image.width / 3, y: image.height / 3, width: image.width / 3, height: image.height / 3 },

        // 下方区域(左、中、右)
        { x: 0, y: 2 * image.height / 3, width: image.width / 3, height: image.height / 3 },
        { x: image.width / 3, y: 2 * image.height / 3, width: image.width / 3, height: image.height / 3 },
        { x: 2 * image.width / 3, y: 2 * image.height / 3, width: image.width / 3, height: image.height / 3 }
    ];

    // 分析每个区域
    const regionAnalysis = regions.map(region => {
        // 获取区域像素数据
        const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
        const pixels = imageData.data;

        let totalBrightness = 0;
        let totalR = 0, totalG = 0, totalB = 0;
        let pixelCount = pixels.length / 4; // RGBA每像素4个值

        // 计算区域平均亮度和颜色
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // 计算像素亮度 (简化的亮度计算)
            const brightness = (r + g + b) / 3 / 255;

            totalBrightness += brightness;
            totalR += r;
            totalG += g;
            totalB += b;
        }

        // 计算平均值
        const avgBrightness = totalBrightness / pixelCount;
        const avgR = totalR / pixelCount;
        const avgG = totalG / pixelCount;
        const avgB = totalB / pixelCount;

        // 判断区域适合深色还是浅色文字
        const suitForDarkText = avgBrightness > 0.6;

        return {
            region,
            avgBrightness,
            avgColor: { r: avgR, g: avgG, b: avgB },
            suitForDarkText
        };
    });

    // 计算整体图片分析
    const overallBrightness = regionAnalysis.reduce((sum, r) => sum + r.avgBrightness, 0) / regionAnalysis.length;

    // 找出适合放置文字的区域(较亮或较暗的区域)
    const suitableRegions = regionAnalysis
        .map((r, index) => ({ ...r, index }))
        .sort((a, b) => {
            // 亮度越接近极值（0或1）越适合作为文本背景
            const aDiff = Math.max(a.avgBrightness, 1 - a.avgBrightness);
            const bDiff = Math.max(b.avgBrightness, 1 - b.avgBrightness);
            return bDiff - aDiff;
        });

    return {
        size: { width: image.width, height: image.height },
        overallBrightness,
        regionAnalysis,
        suitableRegions,
        isDarkImage: overallBrightness < 0.5
    };
}

/**
 * 根据图片分析结果确定文字颜色
 * @param {Object} imageAnalysis - 图片分析结果
 * @param {string} textType - 文本类型(title, slogan, mainText等)
 * @returns {Object} 文字样式对象(颜色、描边等)
 */
export function determineTextColor(imageAnalysis, textType) {
    // 默认样式
    const defaultStyle = {
        color: '#ffffff', // 白色
        strokeColor: 'rgba(0, 0, 0, 0.8)',
        strokeWidth: 3
    };

    if (!imageAnalysis) return defaultStyle;

    // 根据图片亮度调整文字颜色
    if (imageAnalysis.isDarkImage) {
        // 暗色图片使用白色文字
        return {
            color: '#ffffff', // 白色
            strokeColor: 'rgba(0, 0, 0, 0.8)',
            strokeWidth: 3
        };
    } else {
        // 亮色图片使用深色文字
        return {
            color: '#000000', // 黑色
            strokeColor: 'rgba(255, 255, 255, 0.8)',
            strokeWidth: 2
        };
    }
}

/**
 * 根据图片分析为不同文本元素找出最佳位置
 * @param {Object} imageAnalysis - 图片分析结果
 * @param {Object} textParts - 结构化的文案对象
 * @returns {Object} 每个文本元素的位置信息
 */
export function findOptimalTextPositions(imageAnalysis, textParts) {
    if (!imageAnalysis || !textParts) return {};

    const { size, regionAnalysis, suitableRegions } = imageAnalysis;
    const { width, height } = size;

    // 文本元素的布局优先级和所需区域大小
    const textElements = [
        {
            key: 'mainTitle',
            content: textParts.mainTitle,
            priority: 1,
            preferredRegions: [1, 4, 7], // 中上、正中、中下
            yOffset: -0.1 // 位置上移 10%
        },
        {
            key: 'slogan',
            content: textParts.slogan,
            priority: 2,
            preferredRegions: [1, 4], // 偏向上部
            yOffset: 0.05 // 位置下移 5%
        },
        {
            key: 'mainText',
            content: textParts.mainText,
            priority: 3,
            preferredRegions: [4, 7], // 中部或下部
            yOffset: 0
        },
        {
            key: 'subText',
            content: textParts.subText,
            priority: 4,
            preferredRegions: [7], // 下部
            yOffset: 0
        },
        {
            key: 'dataText',
            content: textParts.dataText,
            priority: 5,
            preferredRegions: [7, 8], // 下部靠右
            yOffset: 0.1 // 位置下移 10%
        }
    ];

    // 根据内容长度对元素排序，确保重要且长的文字优先获得好位置
    const sortedElements = [...textElements]
        .filter(e => e.content) // 只处理有内容的元素
        .sort((a, b) => a.priority - b.priority);

    // 已分配区域跟踪
    const assignedRegions = new Set();

    // 为每个文本元素分配位置
    const positions = {};

    sortedElements.forEach(element => {
        const { key, preferredRegions, yOffset } = element;

        // 尝试在首选区域找到合适位置
        let bestRegion = null;

        // 首先检查首选区域
        for (const regionIndex of preferredRegions) {
            if (!assignedRegions.has(regionIndex)) {
                bestRegion = regionAnalysis[regionIndex];
                assignedRegions.add(regionIndex);
                break;
            }
        }

        // 如果首选区域都已分配，找其他可用区域
        if (!bestRegion) {
            for (const { index } of suitableRegions) {
                if (!assignedRegions.has(index)) {
                    bestRegion = regionAnalysis[index];
                    assignedRegions.add(index);
                    break;
                }
            }
        }

        // 如果没有可用区域，使用全图居中
        if (!bestRegion) {
            positions[key] = {
                x: width / 2,
                y: height / 2 + (height * yOffset || 0),
                regionIndex: -1,
                suitForDarkText: imageAnalysis.isDarkImage
            };
            return;
        }

        // 计算区域中心点
        const region = bestRegion.region;
        // 定义一个临时变量或直接使用-1表示未找到
        let regionIndexPosition = -1;
        if (bestRegion && typeof bestRegion.index !== 'undefined') {
            regionIndexPosition = preferredRegions.indexOf(bestRegion.index);
        }

        positions[key] = {
            x: region.x + region.width / 2,
            y: region.y + region.height / 2 + (height * yOffset || 0),
            regionIndex: regionIndexPosition,
            suitForDarkText: bestRegion.suitForDarkText
        };
    });

    return positions;
}

/**
 * 自动生成文本布局配置
 * @param {HTMLImageElement} image - 图片元素
 * @param {Object} textParts - 结构化的文案对象
 * @param {string} styleTemplate - 样式模板名称
 * @returns {Object} 完整的文本布局配置
 */
export function autoLayoutText(image, textParts, styleTemplate = 'auto') {
    // 分析图片
    const imageAnalysis = analyzeImage(image);

    // 获取最佳文本位置
    const positions = findOptimalTextPositions(imageAnalysis, textParts);

    // 根据图片尺寸计算字体大小
    const baseFontSize = Math.min(image.width, image.height) * 0.04;

    // 创建布局配置
    const layout = {
        // 主标题
        mainTitle: {
            x: positions.mainTitle?.x || image.width * 0.5,
            y: positions.mainTitle?.y || image.height * 0.2,
            fontSize: baseFontSize * 2,
            ...determineTextColor(imageAnalysis, 'mainTitle'),
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: image.width * 0.8
        },

        // 震撼标语
        slogan: {
            x: positions.slogan?.x || image.width * 0.5,
            y: positions.slogan?.y || image.height * 0.35,
            fontSize: baseFontSize * 1.5,
            ...determineTextColor(imageAnalysis, 'slogan'),
            fontWeight: 'bold',
            textAlign: 'center',
            maxWidth: image.width * 0.7
        },

        // 主文案
        mainText: {
            x: positions.mainText?.x || image.width * 0.5,
            y: positions.mainText?.y || image.height * 0.5,
            fontSize: baseFontSize * 1.2,
            ...determineTextColor(imageAnalysis, 'mainText'),
            textAlign: 'center',
            maxWidth: image.width * 0.6
        },

        // 副文案
        subText: {
            x: positions.subText?.x || image.width * 0.5,
            y: positions.subText?.y || image.height * 0.65,
            fontSize: baseFontSize,
            ...determineTextColor(imageAnalysis, 'subText'),
            textAlign: 'center',
            maxWidth: image.width * 0.6
        },

        // 数据文案
        dataText: {
            x: positions.dataText?.x || image.width * 0.5,
            y: positions.dataText?.y || image.height * 0.8,
            fontSize: baseFontSize * 0.8,
            ...determineTextColor(imageAnalysis, 'dataText'),
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: image.width * 0.7
        }
    };

    // 根据文本长度自动调整字体大小
    Object.keys(layout).forEach(key => {
        const text = textParts[key.replace('Text', '')];
        if (text && text.length > 30) {
            // 长文本减小字体大小
            const reduction = Math.min(1, 30 / text.length);
            layout[key].fontSize *= reduction;
        }
    });

    return layout;
}

/**
 * 检测文本是否与其他文本元素重叠
 * @param {Object} textElement - 当前文本元素
 * @param {Array} otherElements - 其他文本元素
 * @returns {boolean} 是否存在重叠
 */
export function detectTextOverlap(textElement, otherElements) {
    const { x, y, width, height } = textElement;

    // 扩展区域，增加一点缓冲空间
    const buffer = 10;
    const rect1 = {
        left: x - width / 2 - buffer,
        right: x + width / 2 + buffer,
        top: y - height / 2 - buffer,
        bottom: y + height / 2 + buffer
    };

    // 检查与其他元素是否重叠
    for (const other of otherElements) {
        const rect2 = {
            left: other.x - other.width / 2 - buffer,
            right: other.x + other.width / 2 + buffer,
            top: other.y - other.height / 2 - buffer,
            bottom: other.y + other.height / 2 + buffer
        };

        // 检测矩形重叠
        if (rect1.left < rect2.right && rect1.right > rect2.left &&
            rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
            return true;
        }
    }

    return false;
}

/**
 * 添加光晕或阴影效果使文字更易读
 * @param {CanvasRenderingContext2D} ctx - Canvas上下文
 * @param {string} textColor - 文字颜色
 * @returns {Object} 阴影或光晕配置
 */
export function getTextEffects(ctx, textColor) {
    // 判断文字颜色是浅色还是深色
    const isLightText = textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === 'white';

    if (isLightText) {
        // 为浅色文字添加暗色阴影
        return {
            shadowColor: 'rgba(0, 0, 0, 0.7)',
            shadowBlur: 3,
            shadowOffsetX: 1,
            shadowOffsetY: 1
        };
    } else {
        // 为深色文字添加浅色阴影
        return {
            shadowColor: 'rgba(255, 255, 255, 0.7)',
            shadowBlur: 3,
            shadowOffsetX: 1,
            shadowOffsetY: 1
        };
    }
}

export default {
    analyzeImage,
    determineTextColor,
    findOptimalTextPositions,
    autoLayoutText,
    detectTextOverlap,
    getTextEffects,
    getLayoutConfig  // 添加到导出的函数列表中
};