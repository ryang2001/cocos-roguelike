/**
 * 摄像机控制器 - Cocos Creator版本
 * 参考Archero实现,负责摄像机跟随玩家移动，并与地图边界联动
 */

import { _decorator, Component, Node, Camera, Vec3, view, screen } from 'cc';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

/**
 * 摄像机模式
 */
enum CameraMode {
    FOLLOW = 'follow',    // 跟随模式
    FREE = 'free',        // 自由模式
    FIXED = 'fixed'       // 固定模式
}

@ccclass('CameraController')
export class CameraController extends Component {
    // ==================== 编辑器属性 ====================

    @property({ type: Node, displayName: '跟随目标' })
    target: Node | null = null;

    @property({ displayName: '平滑速度' })
    smoothSpeed: number = 5;

    @property({ displayName: '偏移量 (Z轴为相机高度)' })
    offset: Vec3 = new Vec3(0, 0, 1000);

    @property({ displayName: '边界限制' })
    enableBounds: boolean = true;

    @property({ displayName: '最小位置' })
    minPosition: Vec3 = new Vec3(0, 0, 0);

    @property({ displayName: '最大位置' })
    maxPosition: Vec3 = new Vec3(
        GameConfig.WORLD_WIDTH,
        GameConfig.WORLD_HEIGHT,
        1000
    );

    @property({ displayName: '缩放系数' })
    zoomFactor: number = 1.0;

    @property({ displayName: '自动适配地图边界' })
    autoFitMapBounds: boolean = true;

    // ==================== 私有属性 ====================

    // 单例
    private static _instance: CameraController | null = null;
    public static get instance(): CameraController | null {
        return this._instance;
    }

    // 摄像机模式
    private _cameraMode: CameraMode = CameraMode.FOLLOW;

    // 当前速度 (用于平滑移动)
    private _currentVelocity: Vec3 = new Vec3();

    // 目标位置 (用于自由模式)
    private _freeTargetPosition: Vec3 = new Vec3();

    // 相机组件引用
    private _camera: Camera | null = null;

    // 地图尺寸（用于动态边界计算）
    private _mapWidth: number = GameConfig.WORLD_WIDTH;
    private _mapHeight: number = GameConfig.WORLD_HEIGHT;

    // 视口尺寸（用于边界计算）
    private _viewportWidth: number = 0;
    private _viewportHeight: number = 0;

    // 初始相机世界坐标 (参考Archero)
    private _oriCameraWorPos: Vec3 = new Vec3();
    // 目标相机世界坐标 (参考Archero)
    private _targetCameraWorPos: Vec3 = new Vec3();
    // 当前相机世界坐标 (参考Archero)
    private _curCameraWorPos: Vec3 = new Vec3();

    // ==================== 生命周期 ====================

    onLoad() {
        if (CameraController._instance === null) {
            CameraController._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 获取相机组件
        this._camera = this.node.getComponent(Camera);
        if (!this._camera) {
            this._camera = this.node.addComponent(Camera);
        }

        // 设置正交投影 (2D 游戏必需)
        if (this._camera) {
            // 设置为正交投影
            // 注意：直接使用数值避免编辑器预览时 Camera.Projection 未定义的问题
            // 0 = ORTHO (正交), 1 = PERSPECTIVE (透视)
            try {
                (this._camera as any).projection = 0;
            } catch (e) {
                console.warn('设置相机投影失败:', e);
            }

            // 根据设计分辨率调整视口大小
            const designSize = view.getDesignResolutionSize();
            this._camera.orthoHeight = designSize.height / 2;

            // 设置远裁剪面以覆盖整个世界
            this._camera.far = 2000;

            console.log(`摄像机配置: 正交投影, orthoHeight=${this._camera.orthoHeight}`);
        }

        // 计算视口尺寸
        this.updateViewportSize();

        // 如果启用自动适配，根据地图尺寸调整边界
        if (this.autoFitMapBounds) {
            this.fitBoundsToMap(this._mapWidth, this._mapHeight);
        }
    }

    start() {
        // 保存初始相机世界坐标 (参考Archero)
        this._oriCameraWorPos = this.node.worldPosition.clone();

        // 设置初始位置到世界中心
        const centerX = GameConfig.WORLD_WIDTH / 2;
        const centerY = GameConfig.WORLD_HEIGHT / 2;

        this.node.setPosition(
            centerX + this.offset.x,
            centerY + this.offset.y,
            this.offset.z
        );

        // 如果有预设目标，使用目标位置
        if (this.target) {
            const targetPos = this.target.position;
            this.node.setPosition(
                targetPos.x + this.offset.x,
                targetPos.y + this.offset.y,
                this.offset.z
            );
        }

        // 更新初始位置
        this._oriCameraWorPos = this.node.worldPosition.clone();
    }

    /**
     * 重置相机 (参考Archero)
     */
    public resetCamera(): void {
        this._targetCameraWorPos.set(this._oriCameraWorPos);
    }

    lateUpdate(deltaTime: number): void {
        switch (this._cameraMode) {
            case CameraMode.FOLLOW:
                this.updateFollow(deltaTime);
                break;
            case CameraMode.FREE:
                this.updateFree(deltaTime);
                break;
            case CameraMode.FIXED:
                // 固定模式不需要更新
                break;
        }
    }

    // ==================== 跟随模式 ====================

    /**
     * 更新跟随模式 (参考Archero的GameCamera实现)
     */
    private updateFollow(deltaTime: number): void {
        if (!this.target || !this.target.worldPosition || !this.target.active) {
            return;
        }

        // 使用lerp平滑插值 (参考Archero)
        this._targetCameraWorPos = this._targetCameraWorPos.lerp(this.target.worldPosition, 0.5);

        // 只跟随XZ平面,Y轴保持固定高度 (参考Archero)
        this._curCameraWorPos.set(
            this._oriCameraWorPos.x + this._targetCameraWorPos.x,
            this._oriCameraWorPos.y,
            this._oriCameraWorPos.z + this._targetCameraWorPos.z
        );

        // 应用边界限制
        if (this.enableBounds) {
            this._curCameraWorPos.x = Math.max(this.minPosition.x, Math.min(this.maxPosition.x, this._curCameraWorPos.x));
            this._curCameraWorPos.z = Math.max(this.minPosition.z, Math.min(this.maxPosition.z, this._curCameraWorPos.z));
        }

        this.node.setWorldPosition(this._curCameraWorPos);
    }

    /**
     * 平滑移动到目标位置
     */
    private smoothMoveTo(targetPosition: Vec3, deltaTime: number): void {
        const currentPos = this.node.position;
        const smoothedPosition = new Vec3();

        // 使用 Lerp 进行平滑移动
        const t = Math.min(1, this.smoothSpeed * deltaTime);
        Vec3.lerp(smoothedPosition, currentPos, targetPosition, t);

        // 应用边界限制
        if (this.enableBounds) {
            smoothedPosition.x = Math.max(this.minPosition.x, Math.min(this.maxPosition.x, smoothedPosition.x));
            smoothedPosition.y = Math.max(this.minPosition.y, Math.min(this.maxPosition.y, smoothedPosition.y));
            smoothedPosition.z = this.offset.z;
        }

        this.node.setPosition(smoothedPosition);
    }

    // ==================== 自由模式 ====================

    /**
     * 更新自由模式
     */
    private updateFree(deltaTime: number): void {
        this.smoothMoveTo(this._freeTargetPosition, deltaTime);
    }

    // ==================== 公共方法 ====================

    /**
     * 设置跟随目标
     */
    public setTarget(target: Node | null): void {
        this.target = target;

        if (target && this._cameraMode === CameraMode.FREE) {
            this._cameraMode = CameraMode.FOLLOW;
        }
    }

    /**
     * 设置摄像机模式
     */
    public setCameraMode(mode: CameraMode): void {
        this._cameraMode = mode;

        if (mode === CameraMode.FREE) {
            // 记录当前位置作为自由模式的目标
            this._freeTargetPosition = this.node.position.clone();
        }
    }

    /**
     * 移动到指定位置 (自由模式)
     */
    public moveTo(position: Vec3, immediate: boolean = false): void {
        if (this._cameraMode !== CameraMode.FREE) {
            this._cameraMode = CameraMode.FREE;
        }

        if (immediate) {
            this.node.setPosition(position.x, position.y, this.offset.z);
        }

        this._freeTargetPosition = new Vec3(position.x, position.y, this.offset.z);
    }

    /**
     * 移动相对位置
     */
    public moveBy(delta: Vec3): void {
        const currentPos = this.node.position;
        const newPos = new Vec3();
        Vec3.add(newPos, currentPos, delta);
        this.moveTo(newPos);
    }

    /**
     * 平滑移动到目标 (自由模式)
     */
    public smoothMoveToTarget(targetPosition: Vec3): void {
        if (this._cameraMode !== CameraMode.FREE) {
            this._cameraMode = CameraMode.FREE;
        }

        this._freeTargetPosition = new Vec3(targetPosition.x, targetPosition.y, this.offset.z);
    }

    /**
     * 设置缩放 (通过调整相机高度)
     */
    public setZoom(zoom: number): void {
        this.zoomFactor = Math.max(0.5, Math.min(2.0, zoom));

        if (this._camera) {
            const designSize = view.getDesignResolutionSize();
            this._camera.orthoHeight = (designSize.height / 2) / this.zoomFactor;
        }
    }

    /**
     * 获取缩放
     */
    public getZoom(): number {
        return this.zoomFactor;
    }

    /**
     * 屏幕坐标转世界坐标
     */
    public screenToWorld(screenPos: Vec3): Vec3 {
        if (!this._camera) return screenPos.clone();

        const worldPos = new Vec3();
        this._camera.screenToWorld(screenPos, worldPos);
        return worldPos;
    }

    /**
     * 世界坐标转屏幕坐标
     */
    public worldToScreen(worldPos: Vec3): Vec3 {
        if (!this._camera) return worldPos.clone();

        const screenPos = new Vec3();
        this._camera.worldToScreen(worldPos, screenPos);
        return screenPos;
    }

    /**
     * 抖动效果 (用于受击、爆炸等)
     */
    public shake(intensity: number, duration: number): void {
        this.scheduleOnce(() => {
            // 简单实现: 随机偏移后恢复
            const originalPos = this.node.position.clone();
            const randomOffset = new Vec3(
                (Math.random() - 0.5) * intensity,
                (Math.random() - 0.5) * intensity,
                0
            );

            this.node.setPosition(
                originalPos.x + randomOffset.x,
                originalPos.y + randomOffset.y,
                originalPos.z
            );

            // 恢复原位置
            this.scheduleOnce(() => {
                this.node.setPosition(originalPos);
            }, 0.05);
        }, 0);
    }

    /**
     * 设置边界
     */
    public setBounds(minPos: Vec3, maxPos: Vec3): void {
        this.minPosition = minPos;
        this.maxPosition = maxPos;
    }

    /**
     * 启用/禁用边界限制
     */
    public setEnableBounds(enable: boolean): void {
        this.enableBounds = enable;
    }

    /**
     * 获取当前摄像机模式
     */
    public getCameraMode(): CameraMode {
        return this._cameraMode;
    }

    /**
     * 是否正在跟随
     */
    public isFollowing(): boolean {
        return this._cameraMode === CameraMode.FOLLOW && this.target !== null;
    }

    // ==================== Getter 方法 ====================

    public get camera(): Camera | null {
        return this._camera;
    }

    // ==================== 地图联动方法 ====================

    /**
     * 更新视口尺寸
     */
    private updateViewportSize(): void {
        if (this._camera) {
            const designSize = view.getDesignResolutionSize();
            this._viewportWidth = designSize.width;
            this._viewportHeight = designSize.height;

            console.log(`视口尺寸: ${this._viewportWidth} x ${this._viewportHeight}`);
        }
    }

    /**
     * 根据地图尺寸自动适配边界
     * 确保摄像机不会移出地图范围
     */
    public fitBoundsToMap(mapWidth: number, mapHeight: number): void {
        this._mapWidth = mapWidth;
        this._mapHeight = mapHeight;

        // 计算摄像机可以移动的范围
        // 摄像机中心点不能超出地图边界减去半个视口
        const halfViewportWidth = this._viewportWidth / 2;
        const halfViewportHeight = this._viewportHeight / 2;

        // 计算最小和最大位置
        const minX = halfViewportWidth;
        const maxX = mapWidth - halfViewportWidth;
        const minY = halfViewportHeight;
        const maxY = mapHeight - halfViewportHeight;

        // 如果地图比视口小，则限制在世界中心
        if (maxX < minX) {
            const centerX = mapWidth / 2;
            this.minPosition.x = centerX;
            this.maxPosition.x = centerX;
        } else {
            this.minPosition.x = minX;
            this.maxPosition.x = maxX;
        }

        if (maxY < minY) {
            const centerY = mapHeight / 2;
            this.minPosition.y = centerY;
            this.maxPosition.y = centerY;
        } else {
            this.minPosition.y = minY;
            this.maxPosition.y = maxY;
        }

        this.minPosition.z = 0;
        this.maxPosition.z = 1000;

        console.log(`摄像机边界已适配地图: 地图(${mapWidth}x${mapHeight}), 边界X[${this.minPosition.x.toFixed(0)}, ${this.maxPosition.x.toFixed(0)}], Y[${this.minPosition.y.toFixed(0)}, ${this.maxPosition.y.toFixed(0)}]`);
    }

    /**
     * 设置地图尺寸并更新边界
     */
    public setMapSize(width: number, height: number): void {
        this.fitBoundsToMap(width, height);
    }

    /**
     * 获取当前地图尺寸
     */
    public getMapSize(): { width: number; height: number } {
        return {
            width: this._mapWidth,
            height: this._mapHeight
        };
    }

    /**
     * 获取当前视口尺寸
     */
    public getViewportSize(): { width: number; height: number } {
        return {
            width: this._viewportWidth,
            height: this._viewportHeight
        };
    }

    /**
     * 检查世界坐标是否在摄像机视口内
     */
    public isWorldPositionInView(worldPos: Vec3): boolean {
        const cameraPos = this.node.position;
        const halfWidth = this._viewportWidth / 2;
        const halfHeight = this._viewportHeight / 2;

        return (
            worldPos.x >= cameraPos.x - halfWidth &&
            worldPos.x <= cameraPos.x + halfWidth &&
            worldPos.y >= cameraPos.y - halfHeight &&
            worldPos.y <= cameraPos.y + halfHeight
        );
    }

    /**
     * 获取摄像机视口在世界坐标中的边界
     */
    public getViewBounds(): { min: Vec3; max: Vec3 } {
        const cameraPos = this.node.position;
        const halfWidth = this._viewportWidth / 2;
        const halfHeight = this._viewportHeight / 2;

        return {
            min: new Vec3(cameraPos.x - halfWidth, cameraPos.y - halfHeight, 0),
            max: new Vec3(cameraPos.x + halfWidth, cameraPos.y + halfHeight, 0)
        };
    }
}
