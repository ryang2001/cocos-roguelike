/**
 * 实体尺寸配置
 * 统一管理所有游戏实体的尺寸比例
 * 确保与地图瓦片的比例协调
 */

import { Vec3 } from 'cc';

/**
 * 实体尺寸配置
 * 所有尺寸基于64x64的标准瓦片
 */
export const ENTITY_SIZE_CONFIG = {
    // 基准瓦片尺寸
    BASE_TILE_SIZE: 64,
    
    // 等距视角下的瓦片尺寸
    ISO_TILE_WIDTH: 64,
    ISO_TILE_HEIGHT: 32,
    
    // 实体尺寸（像素）
    PLAYER: {
        WIDTH: 48,      // 玩家宽度
        HEIGHT: 64,     // 玩家高度（比瓦片高，表示站立）
        ANCHOR_Y: 0.2,  // 锚点Y偏移（脚底对齐瓦片中心）
    },
    
    MONSTER: {
        // 普通怪物
        NORMAL: {
            WIDTH: 40,
            HEIGHT: 48,
            ANCHOR_Y: 0.15,
        },
        // 精英怪物
        ELITE: {
            WIDTH: 56,
            HEIGHT: 64,
            ANCHOR_Y: 0.15,
        },
        // Boss
        BOSS: {
            WIDTH: 96,
            HEIGHT: 128,
            ANCHOR_Y: 0.1,
        },
    },
    
    TOWER: {
        WIDTH: 48,
        HEIGHT: 56,
        ANCHOR_Y: 0.2,
    },
    
    CASTLE: {
        WIDTH: 128,     // 城堡比普通瓦片大
        HEIGHT: 160,
        ANCHOR_Y: 0.15,
    },
    
    ITEM: {
        WIDTH: 32,
        HEIGHT: 32,
        ANCHOR_Y: 0.5,
    },
    
    // 特效尺寸
    EFFECT: {
        ATTACK: { WIDTH: 64, HEIGHT: 64 },
        EXPLOSION: { WIDTH: 128, HEIGHT: 128 },
    },
};

/**
 * 获取实体在等距视角中的渲染位置偏移
 * 用于将实体脚底对齐到瓦片中心
 * 
 * @param entityHeight 实体高度
 * @param anchorY 锚点Y位置
 * @returns Y轴偏移量
 */
export function getEntityYOffset(entityHeight: number, anchorY: number = 0.5): number {
    // 实体脚底应该对齐瓦片中心
    // 偏移量 = 实体高度 * (1 - anchorY) - 瓦片高度的一半
    const tileHalfHeight = ENTITY_SIZE_CONFIG.ISO_TILE_HEIGHT / 2;
    return entityHeight * (1 - anchorY) - tileHalfHeight;
}

/**
 * 计算实体的深度值
 * 实体的深度应该比它所在的瓦片稍微靠前
 * 
 * @param cartY 笛卡尔Y坐标
 * @param cartX 笛卡尔X坐标
 * @param entityHeight 实体高度（用于微调深度）
 * @returns 深度值
 */
export function calculateEntityDepth(cartY: number, cartX: number, entityHeight: number = 0): number {
    // 基础深度
    const baseDepth = cartY + cartX * 0.001;
    // 实体高度微调（越高的实体越靠前）
    const heightOffset = entityHeight * 0.01;
    return baseDepth + heightOffset;
}

/**
 * 获取实体的缩放比例
 * 根据Y坐标计算透视缩放（可选功能）
 * 
 * @param cartY 笛卡尔Y坐标
 * @param minY 地图最小Y
 * @param maxY 地图最大Y
 * @returns 缩放比例
 */
export function getEntityScale(
    cartY: number,
    minY: number = -1500,
    maxY: number = 1500
): Vec3 {
    // 简单的透视缩放：远处的物体稍小
    const normalizedY = (cartY - minY) / (maxY - minY);
    const scale = 0.9 + normalizedY * 0.2; // 0.9 ~ 1.1
    return new Vec3(scale, scale, 1);
}

console.log('[EntitySizeConfig] 实体尺寸配置已加载');
