/**
 * 实体基类 - 基于 Archero 设计模式
 * 
 * 所有游戏实体（玩家、怪物、塔、子弹等）的基类
 * 采用组件化设计，将功能拆分为可复用的组件
 */

import { _decorator, Component, Node, Vec3, UITransform, Sprite, Color } from 'cc';
import { clientEvent, GameEvents } from '../../framework';

const { ccclass, property } = _decorator;

/**
 * 实体状态
 */
export enum EntityState {
    IDLE = 'idle',
    MOVING = 'moving',
    ATTACKING = 'attacking',
    DEAD = 'dead',
    STUNNED = 'stunned',
}

/**
 * 实体阵营
 */
export enum EntityFaction {
    PLAYER = 'player',
    ENEMY = 'enemy',
    NEUTRAL = 'neutral',
}

/**
 * 实体基类
 */
@ccclass('EntityBase')
export class EntityBase extends Component {
    // ==================== 基础属性 ====================
    
    /** 实体ID */
    public entityId: number = 0;
    
    /** 实体类型 */
    public entityType: string = '';
    
    /** 阵营 */
    public faction: EntityFaction = EntityFaction.NEUTRAL;
    
    /** 当前状态 */
    protected _state: EntityState = EntityState.IDLE;
    
    /** 是否激活 */
    protected _active: boolean = true;
    
    /** 移动速度 */
    public moveSpeed: number = 100;
    
    /** 面朝方向 */
    protected _facing: Vec3 = new Vec3(0, -1, 0);

    // ==================== 组件引用 ====================
    
    protected _transform: UITransform | null = null;
    protected _sprite: Sprite | null = null;

    // ==================== 生命周期 ====================
    
    onLoad() {
        this._transform = this.node.getComponent(UITransform);
        if (!this._transform) {
            this._transform = this.node.addComponent(UITransform);
        }
        
        this._sprite = this.node.getComponent(Sprite);
    }
    
    start() {
        this.onInit();
    }
    
    update(deltaTime: number) {
        if (!this._active) return;
        
        this.onUpdate(deltaTime);
    }
    
    lateUpdate(deltaTime: number) {
        if (!this._active) return;
        
        this.onLateUpdate(deltaTime);
    }

    // ==================== 子类重写方法 ====================
    
    /**
     * 初始化（子类重写）
     */
    protected onInit(): void {}
    
    /**
     * 更新（子类重写）
     */
    protected onUpdate(deltaTime: number): void {}
    
    /**
     * 延迟更新（子类重写）
     */
    protected onLateUpdate(deltaTime: number): void {}
    
    /**
     * 死亡处理（子类重写）
     */
    protected onDeath(): void {}

    // ==================== 状态管理 ====================
    
    /**
     * 获取当前状态
     */
    public get state(): EntityState {
        return this._state;
    }
    
    /**
     * 设置状态
     */
    public setState(state: EntityState): void {
        if (this._state === state) return;
        
        const oldState = this._state;
        this._state = state;
        
        this.onStateChanged(oldState, state);
    }
    
    /**
     * 状态变化处理
     */
    protected onStateChanged(oldState: EntityState, newState: EntityState): void {
        // 子类重写
    }

    // ==================== 移动相关 ====================
    
    /**
     * 移动到目标位置
     */
    public moveTo(targetPos: Vec3, deltaTime: number): void {
        const currentPos = this.node.position;
        const direction = new Vec3();
        Vec3.subtract(direction, targetPos, currentPos);
        
        const distance = direction.length();
        if (distance < 1) return;
        
        // 归一化方向
        direction.normalize();
        this._facing.set(direction);
        
        // 计算移动距离
        const moveDistance = this.moveSpeed * deltaTime;
        if (moveDistance >= distance) {
            this.node.setPosition(targetPos);
        } else {
            const newPos = new Vec3();
            Vec3.scaleAndAdd(newPos, currentPos, direction, moveDistance);
            this.node.setPosition(newPos);
        }
        
        this.setState(EntityState.MOVING);
    }
    
    /**
     * 获取面朝方向
     */
    public get facing(): Vec3 {
        return this._facing;
    }
    
    /**
     * 设置面朝方向
     */
    public setFacing(direction: Vec3): void {
        this._facing.set(direction);
        this._facing.normalize();
    }

    // ==================== 激活/停用 ====================
    
    /**
     * 激活实体
     */
    public activate(): void {
        this._active = true;
        this.node.active = true;
        this.onActivate();
    }
    
    /**
     * 停用实体
     */
    public deactivate(): void {
        this._active = false;
        this.onDeactivate();
    }
    
    /**
     * 激活时调用
     */
    protected onActivate(): void {}
    
    /**
     * 停用时调用
     */
    protected onDeactivate(): void {}

    // ==================== 死亡处理 ====================
    
    /**
     * 死亡
     */
    public die(): void {
        if (this._state === EntityState.DEAD) return;
        
        this.setState(EntityState.DEAD);
        this._active = false;
        
        this.onDeath();
        
        // 发送死亡事件
        clientEvent.emit(GameEvents.MONSTER_DIED, { entity: this });
    }

    // ==================== 工具方法 ====================
    
    /**
     * 获取位置
     */
    public getPosition(): Vec3 {
        return this.node.position.clone();
    }
    
    /**
     * 设置位置
     */
    public setPosition(x: number, y: number, z: number = 0): void {
        this.node.setPosition(x, y, z);
    }
    
    /**
     * 获取到目标的距离
     */
    public getDistanceTo(target: Node | Vec3): number {
        const pos = this.node.position;
        const targetPos = target instanceof Node ? target.position : target;
        return Vec3.distance(pos, targetPos);
    }
    
    /**
     * 获取到目标的方向
     */
    public getDirectionTo(target: Node | Vec3): Vec3 {
        const pos = this.node.position;
        const targetPos = target instanceof Node ? target.position : target;
        const direction = new Vec3();
        Vec3.subtract(direction, targetPos, pos);
        direction.normalize();
        return direction;
    }
    
    /**
     * 是否在范围内
     */
    public isInRange(target: Node | Vec3, range: number): boolean {
        return this.getDistanceTo(target) <= range;
    }
}
