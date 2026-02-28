/**
 * 等距坐标转换工具
 * 用于2.5D斜45度视角的坐标转换
 * 类似饥荒游戏的视角效果
 */

import { Vec3 } from 'cc';

/**
 * 等距投影配置
 */
export const ISOMETRIC_CONFIG = {
    TILE_WIDTH: 64,      // 瓦片原始宽度
    TILE_HEIGHT: 64,     // 瓦片原始高度
    ISO_SCALE_X: 1.0,    // X轴缩放
    ISO_SCALE_Y: 0.5,    // Y轴缩放（sin(30°) ≈ 0.5，用于模拟深度）
    DEPTH_SCALE: 0.001   // 深度排序的次级权重
};

/**
 * 笛卡尔坐标 → 等距坐标
 * 将2D俯视坐标转换为斜45度视角坐标
 * @param cartX 笛卡尔X坐标
 * @param cartY 笛卡尔Y坐标
 * @returns 等距坐标 Vec3
 */
export function cartesianToIsometric(cartX: number, cartY: number): Vec3 {
    // 等距投影公式
    // isoX = (x - y) * cos(45°)
    // isoY = (x + y) * sin(45°) * 0.5（垂直压缩以模拟视角）
    const isoX = (cartX - cartY) * 0.5 * ISOMETRIC_CONFIG.ISO_SCALE_X;
    const isoY = (cartX + cartY) * 0.25 * ISOMETRIC_CONFIG.ISO_SCALE_Y;

    return new Vec3(isoX, isoY, 0);
}

/**
 * 等距坐标 → 笛卡尔坐标
 * 用于将屏幕点击位置转换回游戏逻辑坐标
 * @param isoX 等距X坐标
 * @param isoY 等距Y坐标
 * @returns 笛卡尔坐标 Vec3
 */
export function isometricToCartesian(isoX: number, isoY: number): Vec3 {
    // 反向转换公式
    // cartX = isoX + isoY * 2
    // cartY = isoY * 2 - isoX
    const cartX = (isoX / (0.5 * ISOMETRIC_CONFIG.ISO_SCALE_X) + isoY / (0.25 * ISOMETRIC_CONFIG.ISO_SCALE_Y)) / 2;
    const cartY = (isoY / (0.25 * ISOMETRIC_CONFIG.ISO_SCALE_Y) - isoX / (0.5 * ISOMETRIC_CONFIG.ISO_SCALE_X)) / 2;

    return new Vec3(cartX, cartY, 0);
}

/**
 * 计算深度值
 * 用于确定渲染顺序（Y坐标越大，越靠前渲染）
 * @param cartY 笛卡尔Y坐标
 * @param cartX 笛卡尔X坐标（次级排序）
 * @returns 深度值（越小越靠后渲染）
 */
export function calculateDepth(cartY: number, cartX: number = 0): number {
    // 主要按Y排序，X作为次级排序
    // 返回负值是因为在Cocos中z坐标越大越靠前
    return -(cartY + cartX * ISOMETRIC_CONFIG.DEPTH_SCALE);
}

/**
 * 计算瓦片的等距位置
 * @param tileX 瓦片X索引
 * @param tileY 瓦片Y索引
 * @param tileSize 瓦片大小
 * @param mapWidth 地图宽度（瓦片数）
 * @param mapHeight 地图高度（瓦片数）
 * @returns 等距坐标
 */
export function getTileIsometricPosition(
    tileX: number,
    tileY: number,
    tileSize: number,
    mapWidth: number,
    mapHeight: number
): Vec3 {
    // 计算笛卡尔世界坐标（以地图中心为原点）
    const worldWidth = mapWidth * tileSize;
    const worldHeight = mapHeight * tileSize;
    const cartX = tileX * tileSize - worldWidth / 2 + tileSize / 2;
    const cartY = tileY * tileSize - worldHeight / 2 + tileSize / 2;

    // 转换为等距坐标
    return cartesianToIsometric(cartX, cartY);
}

/**
 * 深度排序比较函数
 * 用于Array.sort()对游戏实体进行排序
 * @param a 实体A的位置
 * @param b 实体B的位置
 * @returns 排序值
 */
export function depthSortCompare(a: Vec3, b: Vec3): number {
    const depthA = calculateDepth(a.y, a.x);
    const depthB = calculateDepth(b.y, b.x);
    return depthA - depthB;
}

/**
 * 获取瓦片的渲染顺序索引
 * 用于设置节点的siblingIndex
 * @param tileX 瓦片X索引
 * @param tileY 瓦片Y索引
 * @param mapWidth 地图宽度
 * @param mapHeight 地图高度
 * @returns 渲染顺序索引
 */
export function getTileRenderOrder(
    tileX: number,
    tileY: number,
    mapWidth: number,
    mapHeight: number
): number {
    // 从左上到右下渲染（确保深度正确）
    // 使用 (y * width + x) 计算顺序
    return tileY * mapWidth + tileX;
}

/**
 * 调整瓦片锚点以适应等距视角
 * 在等距视角下，瓦片需要调整锚点来正确对齐
 * @param tileSize 瓦片大小
 * @returns 锚点偏移量
 */
export function getTileAnchorOffset(tileSize: number): { x: number, y: number } {
    // 菱形瓦片的锚点应该在中心
    return {
        x: 0.5,
        y: 0.5
    };
}

console.log('[IsometricUtils] 等距坐标工具已加载');
