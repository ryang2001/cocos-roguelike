/**
 * 等距视角配置 - Camera旋转方案
 * 
 * 核心思路：
 * - 瓦片放在XY平面上（正常2D布局）
 * - Camera在上方倾斜俯视地图
 * - Camera绕Z轴旋转45度产生等距效果
 * 
 * 优势：
 * 1. 坐标系统简单（直接使用笛卡尔坐标）
 * 2. 碰撞检测简单（2D碰撞）
 * 3. 深度排序简单（按Y坐标排序）
 * 4. 更符合3D引擎的设计理念
 */

import { Vec3, Quat, math } from 'cc';

/**
 * 等距视角配置
 */
export const ISOMETRIC_CONFIG = {
    // Camera旋转角度（欧拉角，度数）
    CAMERA_ROTATION_X: -45,     // 绕X轴旋转-45度（俯视角度，负值表示向下看）
    CAMERA_ROTATION_Y: 0,       // 绕Y轴旋转0度
    CAMERA_ROTATION_Z: 45,      // 绕Z轴旋转45度（产生等距效果）
    
    // Camera高度（距离地面的垂直距离）
    CAMERA_HEIGHT: 800,
    
    // 瓦片尺寸（平面正方形）
    TILE_SIZE: 64,              // 瓦片边长
    
    // 深度排序系数
    DEPTH_SCALE: 0.001,
};

/**
 * 获取Camera的旋转四元数
 * Camera绕Z轴旋转45度，然后绕X轴旋转俯视
 */
export function getCameraRotation(): Quat {
    const rotation = new Quat();
    
    // 使用欧拉角创建旋转
    // 顺序：先绕Z轴旋转（等距），再绕X轴旋转（俯视）
    Quat.fromEuler(rotation, 
        ISOMETRIC_CONFIG.CAMERA_ROTATION_X,
        ISOMETRIC_CONFIG.CAMERA_ROTATION_Y,
        ISOMETRIC_CONFIG.CAMERA_ROTATION_Z
    );
    
    return rotation;
}

/**
 * 获取Camera的位置
 * Camera在目标点的正上方
 * 
 * @param targetX 目标点X坐标（默认0）
 * @param targetY 目标点Y坐标（默认0）
 */
export function getCameraPosition(targetX: number = 0, targetY: number = 0): Vec3 {
    // Camera在目标点的正上方
    // 由于Camera有旋转，它会自动看向正确的方向
    return new Vec3(targetX, targetY, ISOMETRIC_CONFIG.CAMERA_HEIGHT);
}

/**
 * 计算深度值（用于渲染排序）
 * 在Camera旋转方案中，深度排序更简单
 * 
 * @param y 笛卡尔Y坐标
 * @param x 笛卡尔X坐标（次级排序）
 * @returns 深度值
 */
export function calculateDepth(y: number, x: number = 0): number {
    // 简单的Y坐标排序，X作为次级排序
    return y + x * ISOMETRIC_CONFIG.DEPTH_SCALE;
}

/**
 * 笛卡尔坐标 → 屏幕坐标
 * 在Camera旋转方案中，这个函数主要用于UI显示
 * 
 * @param x 笛卡尔X坐标
 * @param y 笛卡尔Y坐标
 * @returns 屏幕坐标（近似）
 */
export function cartesianToScreen(x: number, y: number): Vec3 {
    // 简化的等距转换（用于UI计算）
    const rotZ = ISOMETRIC_CONFIG.CAMERA_ROTATION_Z * Math.PI / 180;
    const cosZ = Math.cos(rotZ);
    const sinZ = Math.sin(rotZ);
    
    // 旋转后的屏幕坐标
    const screenX = (x - y) * cosZ;
    const screenY = (x + y) * sinZ * 0.5;  // 0.5 是俯视角度的压缩
    
    return new Vec3(screenX, screenY, 0);
}

/**
 * 屏幕坐标 → 笛卡尔坐标
 * 用于将点击位置转换回世界坐标
 * 
 * @param screenX 屏幕X坐标
 * @param screenY 屏幕Y坐标
 * @returns 笛卡尔坐标
 */
export function screenToCartesian(screenX: number, screenY: number): Vec3 {
    const rotZ = ISOMETRIC_CONFIG.CAMERA_ROTATION_Z * Math.PI / 180;
    const cosZ = Math.cos(rotZ);
    const sinZ = Math.sin(rotZ);
    
    // 反向转换
    const x = (screenX / cosZ + screenY / (sinZ * 0.5)) / 2;
    const y = (screenY / (sinZ * 0.5) - screenX / cosZ) / 2;
    
    return new Vec3(x, y, 0);
}

/**
 * 获取瓦片的世界位置
 * 在Camera旋转方案中，瓦片直接使用笛卡尔坐标
 * 
 * @param tileX 瓦片X索引
 * @param tileY 瓦片Y索引
 * @param mapWidth 地图宽度（瓦片数）
 * @param mapHeight 地图高度（瓦片数）
 * @returns 世界坐标
 */
export function getTileWorldPosition(
    tileX: number,
    tileY: number,
    mapWidth: number,
    mapHeight: number
): Vec3 {
    const tileSize = ISOMETRIC_CONFIG.TILE_SIZE;
    
    // 以地图中心为原点
    const worldX = (tileX - mapWidth / 2 + 0.5) * tileSize;
    const worldY = (tileY - mapHeight / 2 + 0.5) * tileSize;
    
    return new Vec3(worldX, worldY, 0);
}

/**
 * 深度排序比较函数
 */
export function depthSortCompare(a: Vec3, b: Vec3): number {
    const depthA = calculateDepth(a.y, a.x);
    const depthB = calculateDepth(b.y, b.x);
    return depthA - depthB;
}

console.log('[IsometricUtils] Camera旋转方案已加载');
console.log(`  - Camera旋转: X=${ISOMETRIC_CONFIG.CAMERA_ROTATION_X}°, Z=${ISOMETRIC_CONFIG.CAMERA_ROTATION_Z}°`);
console.log(`  - Camera高度: ${ISOMETRIC_CONFIG.CAMERA_HEIGHT}`);
