/**
 * 子弹组件 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. 子弹飞行
 * 2. 碰撞检测
 * 3. 伤害计算
 * 4. 对象池支持
 */

import { _decorator, Component, Node, Vec3, UITransform, Sprite, Color } from 'cc';
import { poolManager, clientEvent, GameEvents } from '../../framework';

const { ccclass, property } = _decorator;

/**
 * 子弹类型
 */
export enum BulletType {
    PLAYER = 'player',      // 玩家子弹
    ENEMY = 'enemy',        // 敌人子弹
    TOWER = 'tower',        // 塔防子弹
}

/**
 * 子弹配置
 */
export interface BulletConfig {
    type: BulletType;
    damage: number;
    speed: number;
    range: number;
    pierce: number;         // 穿透数量
    homing: boolean;        // 是否追踪
    color?: Color;
    size?: number;
}

/**
 * 子弹组件
 */
@ccclass('Bullet')
export class Bullet extends Component {
    // ==================== 编辑器属性 ====================
    
    @property({ displayName: '子弹速度' })
    defaultSpeed: number = 500;
    
    @property({ displayName: '子弹大小' })
    defaultSize: number = 8;

    // ==================== 私有属性 ====================
    
    private _config: BulletConfig | null = null;
    private _direction: Vec3 = new Vec3(0, 1, 0);
    private _startPos: Vec3 = new Vec3();
    private _traveledDistance: number = 0;
    private _active: boolean = false;
    private _hitCount: number = 0;
    private _owner: Node | null = null;
    private _target: Node | null = null;
    
    private _transform: UITransform | null = null;
    private _sprite: Sprite | null = null;

    // ==================== 生命周期 ====================
    
    onLoad() {
        this._transform = this.node.getComponent(UITransform);
        if (!this._transform) {
            this._transform = this.node.addComponent(UITransform);
        }
        
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            this._sprite = this.node.addComponent(Sprite);
            this._sprite.color = Color.WHITE;
        }
    }
    
    update(deltaTime: number) {
        if (!this._active) return;
        
        this.updateMovement(deltaTime);
        this.checkRange();
    }

    // ==================== 初始化 ====================
    
    /**
     * 初始化子弹
     * @param config 子弹配置
     * @param startPos 起始位置
     * @param direction 飞行方向
     * @param owner 发射者
     */
    public init(
        config: BulletConfig,
        startPos: Vec3,
        direction: Vec3,
        owner: Node
    ): void {
        this._config = config;
        this._owner = owner;
        this._direction = direction.clone();
        this._direction.normalize();
        this._startPos = startPos.clone();
        this._traveledDistance = 0;
        this._hitCount = 0;
        this._active = true;
        
        // 设置位置
        this.node.setPosition(startPos);
        
        // 设置外观
        this.setupAppearance();
    }
    
    /**
     * 设置追踪目标
     */
    public setTarget(target: Node): void {
        this._target = target;
    }
    
    /**
     * 设置外观
     */
    private setupAppearance(): void {
        if (!this._config) return;
        
        const size = this._config.size || this.defaultSize;
        if (this._transform) {
            this._transform.setContentSize(size, size);
        }
        
        if (this._sprite && this._config.color) {
            this._sprite.color = this._config.color;
        }
    }

    // ==================== 移动更新 ====================
    
    /**
     * 更新移动
     */
    private updateMovement(deltaTime: number): void {
        if (!this._config) return;
        
        // 追踪目标
        if (this._config.homing && this._target && this._target.isValid) {
            const targetDir = new Vec3();
            Vec3.subtract(targetDir, this._target.position, this.node.position);
            targetDir.normalize();
            
            // 平滑转向
            this._direction.lerp(targetDir, 0.1);
            this._direction.normalize();
        }
        
        // 计算移动
        const speed = this._config.speed || this.defaultSpeed;
        const moveDistance = speed * deltaTime;
        
        const newPos = new Vec3();
        Vec3.scaleAndAdd(newPos, this.node.position, this._direction, moveDistance);
        this.node.setPosition(newPos);
        
        this._traveledDistance += moveDistance;
    }
    
    /**
     * 检查是否超出范围
     */
    private checkRange(): void {
        if (!this._config) return;
        
        if (this._traveledDistance >= this._config.range) {
            this.recycle();
        }
    }

    // ==================== 碰撞处理 ====================
    
    /**
     * 命中目标
     */
    public onHit(target: Node): void {
        if (!this._config || !this._active) return;
        
        // 发送伤害事件
        clientEvent.emit('bullet:hit', {
            bullet: this,
            target,
            damage: this._config.damage,
            owner: this._owner,
        });
        
        this._hitCount++;
        
        // 检查穿透
        if (this._hitCount >= this._config.pierce) {
            this.recycle();
        }
    }
    
    /**
     * 检测碰撞（简单圆形检测）
     */
    public checkCollision(targets: Node[], radius: number): Node | null {
        for (const target of targets) {
            if (!target.isValid) continue;
            
            const distance = Vec3.distance(this.node.position, target.position);
            if (distance <= radius) {
                return target;
            }
        }
        
        return null;
    }

    // ==================== 回收 ====================
    
    /**
     * 回收子弹
     */
    public recycle(): void {
        this._active = false;
        this._config = null;
        this._owner = null;
        this._target = null;
        
        // 使用对象池回收
        poolManager.putNode(this.node);
    }

    // ==================== Getter ====================
    
    public get isActive(): boolean {
        return this._active;
    }
    
    public get config(): BulletConfig | null {
        return this._config;
    }
    
    public get direction(): Vec3 {
        return this._direction;
    }
    
    public get owner(): Node | null {
        return this._owner;
    }
}
