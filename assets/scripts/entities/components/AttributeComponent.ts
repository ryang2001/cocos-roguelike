/**
 * 属性组件 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. 管理实体的基础属性
 * 2. 支持属性修改器
 * 3. 属性变化事件
 */

import { _decorator, Component } from 'cc';
import { clientEvent, GameEvents } from '../../framework';

const { ccclass, property } = _decorator;

/**
 * 属性类型
 */
export enum AttributeType {
    HP = 'hp',
    MAX_HP = 'maxHp',
    ATTACK = 'attack',
    DEFENSE = 'defense',
    SPEED = 'speed',
    CRITICAL_RATE = 'criticalRate',
    CRITICAL_DAMAGE = 'criticalDamage',
    ATTACK_SPEED = 'attackSpeed',
    ATTACK_RANGE = 'attackRange',
}

/**
 * 属性修改器
 */
export interface AttributeModifier {
    id: string;
    type: AttributeType;
    value: number;
    isPercent: boolean;  // true = 百分比加成, false = 固定值加成
    duration: number;    // 持续时间（秒），-1 = 永久
    remainingTime: number;
}

/**
 * 属性组件
 */
@ccclass('AttributeComponent')
export class AttributeComponent extends Component {
    // ==================== 基础属性 ====================
    
    /** 血量 */
    private _hp: number = 100;
    /** 最大血量 */
    private _maxHp: number = 100;
    /** 攻击力 */
    private _attack: number = 10;
    /** 防御力 */
    private _defense: number = 5;
    /** 移动速度 */
    private _speed: number = 100;
    /** 暴击率 */
    private _criticalRate: number = 0.05;
    /** 暴击伤害倍率 */
    private _criticalDamage: number = 1.5;
    /** 攻击速度 */
    private _attackSpeed: number = 1.0;
    /** 攻击范围 */
    private _attackRange: number = 100;
    
    /** 属性修改器列表 */
    private _modifiers: Map<string, AttributeModifier> = new Map();
    
    /** 修改器ID计数器 */
    private _modifierIdCounter: number = 0;

    // ==================== 生命周期 ====================
    
    update(deltaTime: number) {
        this.updateModifiers(deltaTime);
    }

    // ==================== 属性获取（含修改器） ====================
    
    /**
     * 获取最终属性值（基础值 + 修改器）
     */
    public getAttribute(type: AttributeType): number {
        let baseValue = this.getBaseValue(type);
        let flatBonus = 0;
        let percentBonus = 0;
        
        // 计算修改器
        for (const modifier of this._modifiers.values()) {
            if (modifier.type === type) {
                if (modifier.isPercent) {
                    percentBonus += modifier.value;
                } else {
                    flatBonus += modifier.value;
                }
            }
        }
        
        // 最终值 = (基础值 + 固定加成) * (1 + 百分比加成)
        return (baseValue + flatBonus) * (1 + percentBonus);
    }
    
    /**
     * 获取基础属性值
     */
    private getBaseValue(type: AttributeType): number {
        switch (type) {
            case AttributeType.HP: return this._hp;
            case AttributeType.MAX_HP: return this._maxHp;
            case AttributeType.ATTACK: return this._attack;
            case AttributeType.DEFENSE: return this._defense;
            case AttributeType.SPEED: return this._speed;
            case AttributeType.CRITICAL_RATE: return this._criticalRate;
            case AttributeType.CRITICAL_DAMAGE: return this._criticalDamage;
            case AttributeType.ATTACK_SPEED: return this._attackSpeed;
            case AttributeType.ATTACK_RANGE: return this._attackRange;
            default: return 0;
        }
    }

    // ==================== 属性设置 ====================
    
    /**
     * 设置基础属性
     */
    public setBaseAttribute(type: AttributeType, value: number): void {
        switch (type) {
            case AttributeType.HP:
                this._hp = Math.max(0, Math.min(value, this._maxHp));
                break;
            case AttributeType.MAX_HP:
                this._maxHp = Math.max(1, value);
                this._hp = Math.min(this._hp, this._maxHp);
                break;
            case AttributeType.ATTACK:
                this._attack = Math.max(0, value);
                break;
            case AttributeType.DEFENSE:
                this._defense = Math.max(0, value);
                break;
            case AttributeType.SPEED:
                this._speed = Math.max(0, value);
                break;
            case AttributeType.CRITICAL_RATE:
                this._criticalRate = Math.max(0, Math.min(1, value));
                break;
            case AttributeType.CRITICAL_DAMAGE:
                this._criticalDamage = Math.max(1, value);
                break;
            case AttributeType.ATTACK_SPEED:
                this._attackSpeed = Math.max(0.1, value);
                break;
            case AttributeType.ATTACK_RANGE:
                this._attackRange = Math.max(0, value);
                break;
        }
    }
    
    /**
     * 批量设置属性
     */
    public setAttributes(attrs: Partial<Record<AttributeType, number>>): void {
        for (const [type, value] of Object.entries(attrs)) {
            this.setBaseAttribute(type as AttributeType, value as number);
        }
    }

    // ==================== 修改器管理 ====================
    
    /**
     * 添加属性修改器
     * @param type 属性类型
     * @param value 修改值
     * @param isPercent 是否百分比
     * @param duration 持续时间（-1 = 永久）
     * @returns 修改器ID
     */
    public addModifier(
        type: AttributeType,
        value: number,
        isPercent: boolean = false,
        duration: number = -1
    ): string {
        const id = `modifier_${this._modifierIdCounter++}`;
        
        const modifier: AttributeModifier = {
            id,
            type,
            value,
            isPercent,
            duration,
            remainingTime: duration,
        };
        
        this._modifiers.set(id, modifier);
        
        return id;
    }
    
    /**
     * 移除属性修改器
     */
    public removeModifier(id: string): boolean {
        return this._modifiers.delete(id);
    }
    
    /**
     * 清除所有修改器
     */
    public clearModifiers(): void {
        this._modifiers.clear();
    }
    
    /**
     * 更新修改器（处理过期）
     */
    private updateModifiers(deltaTime: number): void {
        const expiredIds: string[] = [];
        
        for (const [id, modifier] of this._modifiers) {
            if (modifier.duration > 0) {
                modifier.remainingTime -= deltaTime;
                if (modifier.remainingTime <= 0) {
                    expiredIds.push(id);
                }
            }
        }
        
        // 移除过期的修改器
        for (const id of expiredIds) {
            this._modifiers.delete(id);
        }
    }

    // ==================== 战斗相关 ====================
    
    /**
     * 受到伤害
     * @param damage 原始伤害
     * @returns 实际伤害
     */
    public takeDamage(damage: number): number {
        // 伤害公式：damage * (1 - defense / (defense + 400))
        const defense = this.getAttribute(AttributeType.DEFENSE);
        const actualDamage = Math.floor(damage * (1 - defense / (defense + 400)));
        
        this._hp = Math.max(0, this._hp - actualDamage);
        
        // 发送血量变化事件
        clientEvent.emit(GameEvents.PLAYER_HP_CHANGED, {
            current: this._hp,
            max: this._maxHp,
            damage: actualDamage,
        });
        
        return actualDamage;
    }
    
    /**
     * 治疗
     */
    public heal(amount: number): number {
        const oldHp = this._hp;
        this._hp = Math.min(this._maxHp, this._hp + amount);
        const actualHeal = this._hp - oldHp;
        
        clientEvent.emit(GameEvents.PLAYER_HP_CHANGED, {
            current: this._hp,
            max: this._maxHp,
            heal: actualHeal,
        });
        
        return actualHeal;
    }
    
    /**
     * 是否死亡
     */
    public isDead(): boolean {
        return this._hp <= 0;
    }
    
    /**
     * 计算攻击伤害（含暴击）
     */
    public calculateDamage(): { damage: number; isCritical: boolean } {
        const attack = this.getAttribute(AttributeType.ATTACK);
        const criticalRate = this.getAttribute(AttributeType.CRITICAL_RATE);
        const criticalDamage = this.getAttribute(AttributeType.CRITICAL_DAMAGE);
        
        const isCritical = Math.random() < criticalRate;
        const damage = isCritical ? Math.floor(attack * criticalDamage) : attack;
        
        return { damage, isCritical };
    }

    // ==================== Getter/Setter ====================
    
    public get hp(): number { return this._hp; }
    public set hp(value: number) { this.setBaseAttribute(AttributeType.HP, value); }
    
    public get maxHp(): number { return this._maxHp; }
    public set maxHp(value: number) { this.setBaseAttribute(AttributeType.MAX_HP, value); }
    
    public get attack(): number { return this.getAttribute(AttributeType.ATTACK); }
    public set attack(value: number) { this.setBaseAttribute(AttributeType.ATTACK, value); }
    
    public get defense(): number { return this.getAttribute(AttributeType.DEFENSE); }
    public set defense(value: number) { this.setBaseAttribute(AttributeType.DEFENSE, value); }
    
    public get speed(): number { return this.getAttribute(AttributeType.SPEED); }
    public set speed(value: number) { this.setBaseAttribute(AttributeType.SPEED, value); }
}
