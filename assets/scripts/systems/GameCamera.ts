/**
 * 游戏摄像机 - 完全模仿 Archero 设计
 * 
 * 核心设计：
 * 1. Camera 使用透视投影，俯视45° + 侧视45°
 * 2. Camera 在玩家斜上方，保持固定高度
 * 3. 跟随时只移动 XZ，保持 Y 不变
 * 
 * Camera 配置（来自 Archero fight.scene）：
 * - 位置: (-12.126, 22.792, 12.126)
 * - 旋转: (-45, -45, 0)
 * - FOV: 45°
 * - 透视投影
 */

import { _decorator, Component, Node, Vec3, Camera, Quat } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameCamera')
export class GameCamera extends Component {
    // ==================== 编辑器属性 ====================
    
    /** 跟随目标 */
    @property({ type: Node, displayName: '跟随目标' })
    followTarget: Node | null = null;
    
    /** 平滑系数 (0-1, 越大跟随越快) */
    @property({ displayName: '平滑系数', range: [0.01, 1, 0.01] })
    lerpFactor: number = 0.5;
    
    /** Camera 高度偏移 */
    @property({ displayName: '高度偏移' })
    heightOffset: number = 22.792;
    
    /** Camera 水平距离 */
    @property({ displayName: '水平距离' })
    horizontalDistance: number = 17.145; // sqrt(12.126^2 + 12.126^2)

    // ==================== 私有属性 ====================
    
    /** 初始相机世界坐标 */
    private _originPos: Vec3 = new Vec3();
    
    /** 目标相机世界坐标（插值用） */
    private _targetPos: Vec3 = new Vec3();
    
    /** 当前相机世界坐标 */
    private _currentPos: Vec3 = new Vec3();
    
    /** Camera 组件 */
    private _camera: Camera | null = null;

    // ==================== 生命周期 ====================
    
    onLoad() {
        this._camera = this.node.getComponent(Camera);
        
        // 设置 Camera 初始配置（模仿 Archero）
        this.setupCamera();
    }
    
    start() {
        // 记录初始位置
        this._originPos = this.node.worldPosition.clone();
    }
    
    lateUpdate(deltaTime: number) {
        if (!this.followTarget || !this.followTarget.isValid || !this.followTarget.active) {
            return;
        }
        
        this.updateFollow();
    }

    // ==================== Camera 配置 ====================
    
    /**
     * 设置 Camera（模仿 Archero 配置）
     */
    private setupCamera(): void {
        if (!this._camera) {
            this._camera = this.node.addComponent(Camera);
        }
        
        // 透视投影
        this._camera.projection = Camera.ProjectionType.PERSPECTIVE;
        
        // FOV 45度
        this._camera.fov = 45;
        
        // 近远裁剪面
        this._camera.near = 1;
        this._camera.far = 1000;
        
        // 设置旋转（俯视45° + 侧视45°）
        const rotation = new Quat();
        Quat.fromEuler(rotation, -45, -45, 0);
        this.node.setRotation(rotation);
        
        console.log('[GameCamera] Camera 配置完成（模仿 Archero）');
        console.log(`  - 投影: 透视`);
        console.log(`  - FOV: 45°`);
        console.log(`  - 旋转: (-45°, -45°, 0°)`);
    }

    // ==================== 跟随逻辑 ====================
    
    /**
     * 更新跟随（完全模仿 Archero gameCamera.ts）
     * 
     * 核心算法：
     * 1. 使用 lerp 平滑插值目标位置
     * 2. 保持相机原始 Y 轴高度
     * 3. 只跟随目标的 XZ 平面位置
     */
    private updateFollow(): void {
        const targetWorldPos = this.followTarget.worldPosition;
        
        // 平滑插值目标位置
        this._targetPos = this._targetPos.lerp(targetWorldPos, this.lerpFactor);
        
        // 计算相机位置（保持原始 Y 高度）
        // 来自 Archero: _curCameraWorPos.set(_oriCameraWorPos.x + _targetCameraWorPos.x, _oriCameraWorPos.y, _oriCameraWorPos.z + _targetCameraWorPos.z)
        this._currentPos.set(
            this._originPos.x + this._targetPos.x,
            this._originPos.y,  // 保持原始高度
            this._originPos.z + this._targetPos.z
        );
        
        this.node.setWorldPosition(this._currentPos);
    }

    // ==================== 公共方法 ====================
    
    /**
     * 设置跟随目标
     */
    public setFollowTarget(target: Node): void {
        this.followTarget = target;
        
        // 立即移动到目标位置
        if (target) {
            this._targetPos = target.worldPosition.clone();
            this.updateFollow();
        }
    }
    
    /**
     * 重置相机到初始位置
     */
    public resetCamera(): void {
        this._targetPos.set(0, 0, 0);
        this.node.setWorldPosition(this._originPos);
    }
    
    /**
     * 获取初始位置
     */
    public getOriginPosition(): Vec3 {
        return this._originPos.clone();
    }
    
    /**
     * 设置初始位置（用于动态调整）
     */
    public setOriginPosition(pos: Vec3): void {
        this._originPos = pos.clone();
        this.node.setWorldPosition(pos);
    }
    
    /**
     * 计算并设置 Camera 初始位置
     * @param targetPos 目标位置（玩家位置）
     */
    public calculateAndSetPosition(targetPos: Vec3): void {
        // Camera 在目标的斜上方
        // 位置计算：根据旋转角度计算
        const rotY = -45 * Math.PI / 180;
        const distance = this.horizontalDistance;
        const height = this.heightOffset;
        
        // Camera 相对于目标的位置
        const offsetX = Math.sin(-rotY) * distance;
        const offsetZ = Math.cos(-rotY) * distance;
        
        this._originPos.set(
            targetPos.x + offsetX,
            targetPos.y + height,
            targetPos.z + offsetZ
        );
        
        this.node.setWorldPosition(this._originPos);
    }
}
