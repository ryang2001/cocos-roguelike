/**
 * 词条系统 - Cocos Creator版本
 * 负责管理所有游戏实体的词条(Modifiers)
 * 包括词条的添加、移除、计算和Boss掉落生成
 */

import { _decorator, Component } from 'cc';
import {
    ModifierType,
    IModifier,
    IModifierConfig,
    Rarity,
    ModifierValueType,
    ModifierSource,
    ElementType,
    WeaponAttackType
} from '../types/Types';

const { ccclass } = _decorator;

/**
 * 词条数值配置
 */
const MODIFIER_CONFIGS: IModifierConfig[] = [
    // 基础属性类
    { type: ModifierType.ATTACK_PERCENT, minValue: 0.05, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 10 },
    { type: ModifierType.DEFENSE_PERCENT, minValue: 0.05, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 10 },
    { type: ModifierType.HP_PERCENT, minValue: 0.05, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 10 },
    { type: ModifierType.MOVE_SPEED_PERCENT, minValue: 0.05, maxValue: 0.30, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 5 },

    // 战斗属性类
    { type: ModifierType.CRIT_RATE, minValue: 0.02, maxValue: 0.20, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 8 },
    { type: ModifierType.CRIT_DAMAGE, minValue: 0.10, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 6 },
    { type: ModifierType.ATTACK_SPEED, minValue: 0.05, maxValue: 0.30, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 7 },
    { type: ModifierType.LIFE_STEAL, minValue: 0.02, maxValue: 0.15, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 5 },
    { type: ModifierType.DAMAGE_REFLECT, minValue: 0.05, maxValue: 0.25, valueType: 'percent', availableRarities: [Rarity.EPIC, Rarity.LEGENDARY], weight: 4 },

    // 元素攻击力
    { type: ModifierType.ELEMENT_ATTACK_FIRE, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
    { type: ModifierType.ELEMENT_ATTACK_WATER, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
    { type: ModifierType.ELEMENT_ATTACK_THUNDER, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
    { type: ModifierType.ELEMENT_ATTACK_WIND, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 5 },
    { type: ModifierType.ELEMENT_ATTACK_LIGHT, minValue: 0.15, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 4 },
    { type: ModifierType.ELEMENT_ATTACK_DARK, minValue: 0.15, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 4 },

    // 元素抗性
    { type: ModifierType.ELEMENT_RESIST_FIRE, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 7 },
    { type: ModifierType.ELEMENT_RESIST_WATER, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 7 },
    { type: ModifierType.ELEMENT_RESIST_THUNDER, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 7 },
    { type: ModifierType.ALL_ELEMENT_RESIST, minValue: 0.05, maxValue: 0.25, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 5 },

    // 武器类型伤害
    { type: ModifierType.WEAPON_DAMAGE_SLASH, minValue: 0.10, maxValue: 0.35, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
    { type: ModifierType.WEAPON_DAMAGE_BLUNT, minValue: 0.10, maxValue: 0.35, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
    { type: ModifierType.WEAPON_DAMAGE_PIERCE, minValue: 0.10, maxValue: 0.35, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
    { type: ModifierType.WEAPON_DAMAGE_MAGIC, minValue: 0.10, maxValue: 0.40, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 5 },
    { type: ModifierType.ALL_WEAPON_DAMAGE, minValue: 0.05, maxValue: 0.25, valueType: 'percent', availableRarities: [Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL], weight: 4 },

    // 特殊效果
    { type: ModifierType.KNOCKBACK, minValue: 0.10, maxValue: 0.30, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 5 },
    { type: ModifierType.STUN_CHANCE, minValue: 0.02, maxValue: 0.10, valueType: 'percent', availableRarities: [Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 4 },
    { type: ModifierType.BLEED_DAMAGE, minValue: 5, maxValue: 25, valueType: 'flat', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 5 },
    { type: ModifierType.BURN_DAMAGE, minValue: 3, maxValue: 15, valueType: 'flat', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 5 },
    { type: ModifierType.POISON_DAMAGE, minValue: 3, maxValue: 15, valueType: 'flat', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 5 },

    // 资源类
    { type: ModifierType.GOLD_DROP, minValue: 0.10, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 8 },
    { type: ModifierType.EXP_GAIN, minValue: 0.10, maxValue: 0.50, valueType: 'percent', availableRarities: [Rarity.COMMON, Rarity.GOOD, Rarity.RARE, Rarity.EPIC], weight: 8 },
    { type: ModifierType.DROP_RATE, minValue: 0.05, maxValue: 0.25, valueType: 'percent', availableRarities: [Rarity.GOOD, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY], weight: 6 },
];

/**
 * 稀有度数值倍率
 */
const RARITY_MULTIPLIERS: { [key in Rarity]: number } = {
    [Rarity.COMMON]: 0.5,
    [Rarity.GOOD]: 0.75,
    [Rarity.RARE]: 1.0,
    [Rarity.EPIC]: 1.3,
    [Rarity.LEGENDARY]: 1.6,
    [Rarity.MYTHICAL]: 2.0
};

/**
 * 稀有度对应的词条数量
 */
const RARITY_MODIFIER_COUNT: { [key in Rarity]: { min: number; max: number } } = {
    [Rarity.COMMON]: { min: 1, max: 1 },
    [Rarity.GOOD]: { min: 1, max: 2 },
    [Rarity.RARE]: { min: 1, max: 2 },
    [Rarity.EPIC]: { min: 2, max: 3 },
    [Rarity.LEGENDARY]: { min: 2, max: 3 },
    [Rarity.MYTHICAL]: { min: 3, max: 4 }
};

@ccclass('ModifierSystem')
export class ModifierSystem extends Component {
    // 单例
    private static _instance: ModifierSystem | null = null;
    public static get instance(): ModifierSystem | null {
        return this._instance;
    }

    // 实体词条映射: entityId -> Map<modifierId, IModifier>
    private _entityModifiers: Map<string, Map<string, IModifier>> = new Map();

    // 词条配置缓存
    private _configCache: Map<ModifierType, IModifierConfig> = new Map();

    onLoad() {
        if (ModifierSystem._instance === null) {
            ModifierSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 初始化配置缓存
        this.initConfigCache();

        console.log('ModifierSystem: 词条系统初始化完成');
    }

    onDestroy() {
        if (ModifierSystem._instance === this) {
            ModifierSystem._instance = null;
        }
        this._entityModifiers.clear();
        this._configCache.clear();
    }

    update(deltaTime: number): void {
        // 更新所有有时限的词条
        this.updateTimedModifiers(deltaTime);
    }

    // ==================== 初始化 ====================

    private initConfigCache(): void {
        for (const config of MODIFIER_CONFIGS) {
            this._configCache.set(config.type, config);
        }
    }

    // ==================== 词条管理 ====================

    /**
     * 添加词条到实体
     */
    addModifier(entityId: string, modifier: IModifier): void {
        if (!this._entityModifiers.has(entityId)) {
            this._entityModifiers.set(entityId, new Map());
        }

        const entityMods = this._entityModifiers.get(entityId)!;
        entityMods.set(modifier.id, modifier);

        console.log(`[ModifierSystem] 实体 ${entityId} 获得词条: ${modifier.name} (+${modifier.value}${modifier.valueType === 'percent' ? '%' : ''})`);
    }

    /**
     * 移除词条
     */
    removeModifier(entityId: string, modifierId: string): boolean {
        const entityMods = this._entityModifiers.get(entityId);
        if (!entityMods) return false;

        const modifier = entityMods.get(modifierId);
        if (!modifier) return false;

        entityMods.delete(modifierId);
        console.log(`[ModifierSystem] 实体 ${entityId} 失去词条: ${modifier.name}`);
        return true;
    }

    /**
     * 移除某类型的所有词条
     */
    removeModifiersByType(entityId: string, type: ModifierType): number {
        const entityMods = this._entityModifiers.get(entityId);
        if (!entityMods) return 0;

        let count = 0;
        for (const [id, modifier] of entityMods) {
            if (modifier.type === type) {
                entityMods.delete(id);
                count++;
            }
        }

        return count;
    }

    /**
     * 清除实体的所有词条
     */
    clearModifiers(entityId: string): void {
        this._entityModifiers.delete(entityId);
    }

    /**
     * 获取实体的所有词条
     */
    getAllModifiers(entityId: string): IModifier[] {
        const entityMods = this._entityModifiers.get(entityId);
        if (!entityMods) return [];

        return Array.from(entityMods.values());
    }

    /**
     * 获取特定类型的词条
     */
    getModifiersByType(entityId: string, type: ModifierType): IModifier[] {
        const entityMods = this._entityModifiers.get(entityId);
        if (!entityMods) return [];

        return Array.from(entityMods.values()).filter(mod => mod.type === type);
    }

    // ==================== 词条计算 ====================

    /**
     * 计算某类型词条的总值
     * 同类型词条数值相加
     */
    calculateTotalModifier(entityId: string, type: ModifierType): number {
        const modifiers = this.getModifiersByType(entityId, type);
        if (modifiers.length === 0) return 0;

        return modifiers.reduce((sum, mod) => sum + mod.value, 0);
    }

    /**
     * 获取所有生效的词条类型及其总值
     */
    getAllActiveModifiers(entityId: string): Map<ModifierType, number> {
        const result = new Map<ModifierType, number>();
        const modifiers = this.getAllModifiers(entityId);

        for (const mod of modifiers) {
            const current = result.get(mod.type) || 0;
            result.set(mod.type, current + mod.value);
        }

        return result;
    }

    /**
     * 检查实体是否有特定词条
     */
    hasModifier(entityId: string, type: ModifierType): boolean {
        return this.getModifiersByType(entityId, type).length > 0;
    }

    // ==================== 词条生成 ====================

    /**
     * 生成随机词条
     */
    generateRandomModifier(rarity: Rarity, source: ModifierSource = 'equipment'): IModifier {
        // 根据稀有度筛选可用配置
        const availableConfigs = MODIFIER_CONFIGS.filter(
            config => config.availableRarities.includes(rarity)
        );

        if (availableConfigs.length === 0) {
            // 回退到普通配置的最低档
            return this.createFallbackModifier(rarity, source);
        }

        // 按权重随机选择配置
        const config = this.weightedRandom(availableConfigs);

        // 计算数值
        const multiplier = RARITY_MULTIPLIERS[rarity];
        const baseValue = config.minValue + Math.random() * (config.maxValue - config.minValue);
        const finalValue = config.valueType === 'percent'
            ? baseValue * multiplier
            : Math.floor(baseValue * multiplier);

        return this.createModifier(config.type, finalValue, config.valueType, rarity, source);
    }

    /**
     * 生成多个词条（用于Boss掉落）
     */
    generateBossModifiers(bossRarity: Rarity, source: ModifierSource = 'equipment'): IModifier[] {
        const countRange = RARITY_MODIFIER_COUNT[bossRarity];
        const count = Math.floor(Math.random() * (countRange.max - countRange.min + 1)) + countRange.min;

        const modifiers: IModifier[] = [];
        const usedTypes = new Set<ModifierType>();

        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let modifier: IModifier;

            // 尝试生成不重复的词条类型
            do {
                modifier = this.generateRandomModifier(bossRarity, source);
                attempts++;
            } while (usedTypes.has(modifier.type) && attempts < 10);

            usedTypes.add(modifier.type);
            modifiers.push(modifier);
        }

        return modifiers;
    }

    /**
     * 生成特定类型的词条
     */
    generateSpecificModifier(
        type: ModifierType,
        rarity: Rarity,
        source: ModifierSource = 'equipment'
    ): IModifier | null {
        const config = this._configCache.get(type);
        if (!config) return null;

        const multiplier = RARITY_MULTIPLIERS[rarity];
        const baseValue = config.minValue + Math.random() * (config.maxValue - config.minValue);
        const finalValue = config.valueType === 'percent'
            ? baseValue * multiplier
            : Math.floor(baseValue * multiplier);

        return this.createModifier(type, finalValue, config.valueType, rarity, source);
    }

    // ==================== 辅助方法 ====================

    private createModifier(
        type: ModifierType,
        value: number,
        valueType: ModifierValueType,
        rarity: Rarity,
        source: ModifierSource
    ): IModifier {
        const id = `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const name = this.getModifierName(type);
        const description = this.getModifierDescription(type, value, valueType);

        return {
            id,
            type,
            value,
            valueType,
            rarity,
            source,
            name,
            description
        };
    }

    private createFallbackModifier(rarity: Rarity, source: ModifierSource): IModifier {
        // 回退词条：攻击力+5%
        return this.createModifier(
            ModifierType.ATTACK_PERCENT,
            0.05 * RARITY_MULTIPLIERS[rarity],
            'percent',
            rarity,
            source
        );
    }

    private weightedRandom<T extends { weight: number }>(items: T[]): T {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item;
        }

        return items[items.length - 1];
    }

    private getModifierName(type: ModifierType): string {
        const names: { [key in ModifierType]: string } = {
            [ModifierType.ATTACK_PERCENT]: '攻击力加成',
            [ModifierType.DEFENSE_PERCENT]: '防御力加成',
            [ModifierType.HP_PERCENT]: '生命值加成',
            [ModifierType.MOVE_SPEED_PERCENT]: '移动速度加成',
            [ModifierType.CRIT_RATE]: '暴击率',
            [ModifierType.CRIT_DAMAGE]: '暴击伤害',
            [ModifierType.ATTACK_SPEED]: '攻击速度',
            [ModifierType.LIFE_STEAL]: '生命偷取',
            [ModifierType.DAMAGE_REFLECT]: '伤害反弹',
            [ModifierType.ELEMENT_ATTACK_WOOD]: '木属性攻击',
            [ModifierType.ELEMENT_ATTACK_WATER]: '水属性攻击',
            [ModifierType.ELEMENT_ATTACK_FIRE]: '火属性攻击',
            [ModifierType.ELEMENT_ATTACK_EARTH]: '土属性攻击',
            [ModifierType.ELEMENT_ATTACK_THUNDER]: '雷属性攻击',
            [ModifierType.ELEMENT_ATTACK_WIND]: '风属性攻击',
            [ModifierType.ELEMENT_ATTACK_LIGHT]: '光属性攻击',
            [ModifierType.ELEMENT_ATTACK_DARK]: '暗属性攻击',
            [ModifierType.ELEMENT_RESIST_WOOD]: '木属性抗性',
            [ModifierType.ELEMENT_RESIST_WATER]: '水属性抗性',
            [ModifierType.ELEMENT_RESIST_FIRE]: '火属性抗性',
            [ModifierType.ELEMENT_RESIST_EARTH]: '土属性抗性',
            [ModifierType.ELEMENT_RESIST_THUNDER]: '雷属性抗性',
            [ModifierType.ELEMENT_RESIST_WIND]: '风属性抗性',
            [ModifierType.ELEMENT_RESIST_LIGHT]: '光属性抗性',
            [ModifierType.ELEMENT_RESIST_DARK]: '暗属性抗性',
            [ModifierType.ALL_ELEMENT_ATTACK]: '全元素攻击',
            [ModifierType.ALL_ELEMENT_RESIST]: '全元素抗性',
            [ModifierType.WEAPON_DAMAGE_SLASH]: '斩击伤害',
            [ModifierType.WEAPON_DAMAGE_BLUNT]: '打击伤害',
            [ModifierType.WEAPON_DAMAGE_PIERCE]: '戳击伤害',
            [ModifierType.WEAPON_DAMAGE_MAGIC]: '魔法伤害',
            [ModifierType.WEAPON_DAMAGE_RANGED]: '射击伤害',
            [ModifierType.WEAPON_DAMAGE_EXPLOSION]: '爆炸伤害',
            [ModifierType.ALL_WEAPON_DAMAGE]: '全武器伤害',
            [ModifierType.ATTACK_RANGE]: '攻击范围',
            [ModifierType.KNOCKBACK]: '击退效果',
            [ModifierType.STUN_CHANCE]: '眩晕几率',
            [ModifierType.BLEED_DAMAGE]: '流血伤害',
            [ModifierType.BURN_DAMAGE]: '燃烧伤害',
            [ModifierType.POISON_DAMAGE]: '中毒伤害',
            [ModifierType.FREEZE_CHANCE]: '冰冻几率',
            [ModifierType.GOLD_DROP]: '金币掉落',
            [ModifierType.EXP_GAIN]: '经验获取',
            [ModifierType.DROP_RATE]: '掉落率',
            [ModifierType.BACKPACK_CAPACITY]: '背包容量'
        };

        return names[type] || '未知词条';
    }

    private getModifierDescription(type: ModifierType, value: number, valueType: ModifierValueType): string {
        const formattedValue = valueType === 'percent'
            ? `+${(value * 100).toFixed(1)}%`
            : `+${Math.floor(value)}`;

        const descriptions: { [key in ModifierType]?: string } = {
            [ModifierType.ATTACK_PERCENT]: `攻击力${formattedValue}`,
            [ModifierType.DEFENSE_PERCENT]: `防御力${formattedValue}`,
            [ModifierType.HP_PERCENT]: `生命值${formattedValue}`,
            [ModifierType.MOVE_SPEED_PERCENT]: `移动速度${formattedValue}`,
            [ModifierType.CRIT_RATE]: `暴击率${formattedValue}`,
            [ModifierType.CRIT_DAMAGE]: `暴击伤害${formattedValue}`,
            [ModifierType.ATTACK_SPEED]: `攻击速度${formattedValue}`,
            [ModifierType.LIFE_STEAL]: `生命偷取${formattedValue}`,
            [ModifierType.DAMAGE_REFLECT]: `伤害反弹${formattedValue}`,
            [ModifierType.GOLD_DROP]: `金币掉落${formattedValue}`,
            [ModifierType.EXP_GAIN]: `经验获取${formattedValue}`,
            [ModifierType.DROP_RATE]: `掉落率${formattedValue}`
        };

        return descriptions[type] || `${this.getModifierName(type)}${formattedValue}`;
    }

    private updateTimedModifiers(deltaTime: number): void {
        for (const [entityId, modifiers] of this._entityModifiers) {
            for (const [modifierId, modifier] of modifiers) {
                if (modifier.duration !== undefined && modifier.remainingTime !== undefined) {
                    modifier.remainingTime -= deltaTime;

                    if (modifier.remainingTime <= 0) {
                        modifiers.delete(modifierId);
                        console.log(`[ModifierSystem] 词条过期: ${modifier.name}`);
                    }
                }
            }
        }
    }

    // ==================== 批量操作 ====================

    /**
     * 应用词条到实体属性（创建带有时限的buff词条）
     */
    applyBuff(
        entityId: string,
        type: ModifierType,
        value: number,
        valueType: ModifierValueType,
        duration: number,
        source: ModifierSource = 'buff'
    ): IModifier {
        const modifier = this.createModifier(type, value, valueType, Rarity.COMMON, source);
        modifier.duration = duration;
        modifier.remainingTime = duration;

        this.addModifier(entityId, modifier);
        return modifier;
    }

    /**
     * 复制词条给另一个实体
     */
    copyModifiers(fromEntityId: string, toEntityId: string): void {
        const modifiers = this.getAllModifiers(fromEntityId);
        for (const mod of modifiers) {
            const newMod = { ...mod, id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
            this.addModifier(toEntityId, newMod);
        }
    }

    /**
     * 获取系统中所有实体的词条统计
     */
    getStatistics(): { entityCount: number; totalModifiers: number } {
        let totalModifiers = 0;
        for (const modifiers of this._entityModifiers.values()) {
            totalModifiers += modifiers.size;
        }

        return {
            entityCount: this._entityModifiers.size,
            totalModifiers
        };
    }
}
