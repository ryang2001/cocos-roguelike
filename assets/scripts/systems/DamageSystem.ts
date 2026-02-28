/**
 * 伤害计算系统
 * 负责计算所有伤害相关的逻辑
 */

import { ICharacter, IWeapon, IResistances, ElementType, IDamageResult, WeaponAttackType, WeaponType, getElementAdvantage, getWeaponAttackType } from '../types/Types';

export class DamageSystem {
    /**
     * 计算伤害 (完整版，支持物理抗性)
     * @param attacker 攻击者
     * @param weapon 武器 (null 表示无武器攻击)
     * @param defender 防御者
     * @param resistances 防御者的抗性
     * @param critRate 暴击率 (0-1)
     * @param critDamage 暴击伤害倍率
     * @param attackType 攻击类型 (可选，用于物理抗性计算)
     * @returns 伤害结果
     */
    static calculateDamage(
        attacker: ICharacter,
        weapon: IWeapon | null,
        defender: ICharacter,
        resistances: IResistances,
        critRate: number = 0.05,
        critDamage: number = 1.5,
        attackType?: WeaponAttackType
    ): IDamageResult {
        // 基础伤害
        let baseDamage = weapon ? weapon.damage : 10;

        // 暴击判定
        const isCrit = Math.random() < critRate;
        if (isCrit) {
            baseDamage *= critDamage;
        }

        // 元素克制计算
        let elementMultiplier = 1.0;
        let element: ElementType | null = null;

        if (weapon && weapon.element) {
            element = weapon.element;
            const elementResistance = resistances[weapon.element] || 0;

            // 抗性影响: -1 (易伤200%) 到 1 (免疫)
            elementMultiplier = 1 - elementResistance;
            elementMultiplier = Math.max(0, Math.min(2.5, elementMultiplier));
        }

        // 物理攻击类型抗性计算
        let physicalMultiplier = 1.0;
        let actualAttackType = attackType;

        // 如果没有指定攻击类型，从武器类型推断
        if (!actualAttackType && weapon) {
            actualAttackType = getWeaponAttackType(weapon.type);
        }

        if (actualAttackType) {
            const physicalResistance = resistances[actualAttackType] || 0;
            // 物理抗性计算: -1 (易伤200%) 到 1 (免疫)
            physicalMultiplier = 1 - physicalResistance;
            physicalMultiplier = Math.max(0, Math.min(2.5, physicalMultiplier));
        }

        // 计算最终伤害 = 基础 × 元素倍率 × 物理倍率
        let finalDamage = Math.floor(baseDamage * elementMultiplier * physicalMultiplier);

        // 确保至少造成1点伤害
        finalDamage = Math.max(1, finalDamage);

        // 计算目标剩余血量
        const targetHp = Math.max(0, defender.hp - finalDamage);
        const isLethal = targetHp <= 0;

        return {
            damage: finalDamage,
            isCrit,
            element,
            targetHp,
            isLethal
        };
    }

    /**
     * 计算完整伤害（带词条加成）
     * 用于玩家攻击，包含所有加成计算
     */
    static calculateDamageAdvanced(
        attacker: ICharacter,
        weapon: IWeapon | null,
        defender: ICharacter,
        resistances: IResistances,
        options: {
            critRate?: number;
            critDamage?: number;
            attackType?: WeaponAttackType;
            elementBonus?: number;        // 元素伤害加成 (0-1)
            weaponTypeBonus?: number;     // 武器类型伤害加成 (0-1)
            defense?: number;             // 防御力
        } = {}
    ): IDamageResult {
        const {
            critRate = 0.05,
            critDamage = 1.5,
            attackType,
            elementBonus = 0,
            weaponTypeBonus = 0,
            defense = 0
        } = options;

        // 基础伤害
        let baseDamage = weapon ? weapon.damage : 10;

        // 武器类型伤害加成
        if (weaponTypeBonus > 0) {
            baseDamage *= (1 + weaponTypeBonus);
        }

        // 元素伤害加成
        if (elementBonus > 0 && weapon?.element) {
            baseDamage *= (1 + elementBonus);
        }

        // 暴击判定
        const isCrit = Math.random() < critRate;
        if (isCrit) {
            baseDamage *= critDamage;
        }

        // 元素抗性计算
        let elementMultiplier = 1.0;
        let element: ElementType | null = null;

        if (weapon && weapon.element) {
            element = weapon.element;
            const elementResistance = resistances[weapon.element] || 0;
            elementMultiplier = 1 - elementResistance;
            elementMultiplier = Math.max(0, Math.min(2.5, elementMultiplier));
        }

        // 物理抗性计算
        let physicalMultiplier = 1.0;
        let actualAttackType = attackType;

        if (!actualAttackType && weapon) {
            actualAttackType = getWeaponAttackType(weapon.type);
        }

        if (actualAttackType) {
            const physicalResistance = resistances[actualAttackType] || 0;
            physicalMultiplier = 1 - physicalResistance;
            physicalMultiplier = Math.max(0, Math.min(2.5, physicalMultiplier));
        }

        // 计算伤害
        let finalDamage = Math.floor(baseDamage * elementMultiplier * physicalMultiplier);

        // 应用防御减伤
        if (defense > 0) {
            finalDamage = this.applyDefense(finalDamage, defense);
        }

        // 确保至少造成1点伤害
        finalDamage = Math.max(1, finalDamage);

        // 计算目标剩余血量
        const targetHp = Math.max(0, defender.hp - finalDamage);
        const isLethal = targetHp <= 0;

        return {
            damage: finalDamage,
            isCrit,
            element,
            targetHp,
            isLethal
        };
    }

    /**
     * 计算防御减少的伤害
     * @param damage 原始伤害
     * @param defense 防御力
     * @returns 减少后的伤害
     */
    static applyDefense(damage: number, defense: number): number {
        // 简单的防御公式: 伤害 = 原始伤害 / (1 + 防御/100)
        const defenseMultiplier = 1 / (1 + defense / 100);
        return Math.max(1, Math.floor(damage * defenseMultiplier));
    }

    /**
     * 计算元素伤害加成
     * @param baseDamage 基础伤害
     * @param elementBonusPercent 元素伤害加成百分比 (0-1)
     * @returns 加成后的伤害
     */
    static applyElementBonus(baseDamage: number, elementBonusPercent: number): number {
        return Math.floor(baseDamage * (1 + elementBonusPercent));
    }

    /**
     * 计算持续伤害 (燃烧、中毒等)
     * @param baseDamage 基础伤害
     * @param duration 持续时间 (秒)
     * @param interval 伤害间隔 (秒)
     * @returns 每次造成的伤害
     */
    static calculateDoTDamage(baseDamage: number, duration: number, interval: number): number {
        const totalTicks = Math.floor(duration / interval);
        if (totalTicks <= 0) return 0;
        return Math.floor(baseDamage / totalTicks);
    }

    /**
     * 计算AOE伤害衰减
     * 距离越远，伤害越低
     * @param baseDamage 基础伤害
     * @param distance 距离中心的距离
     * @param maxRange 最大范围
     * @param falloffStart 衰减开始距离
     * @returns 衰减后的伤害
     */
    static calculateAOEDamage(
        baseDamage: number,
        distance: number,
        maxRange: number,
        falloffStart: number = 0
    ): number {
        if (distance <= falloffStart) {
            return baseDamage;
        }

        const falloffRange = maxRange - falloffStart;
        const falloffRatio = (distance - falloffStart) / falloffRange;

        // 线性衰减: 最远距离造成50%伤害
        const damageMultiplier = 1 - (falloffRatio * 0.5);

        return Math.max(1, Math.floor(baseDamage * damageMultiplier));
    }

    /**
     * 计算反弹伤害
     * @param incomingDamage 受到的伤害
     * @param reflectPercent 反弹百分比 (0-1)
     * @returns 反弹伤害
     */
    static calculateReflectDamage(incomingDamage: number, reflectPercent: number): number {
        return Math.floor(incomingDamage * reflectPercent);
    }

    /**
     * 计算生命偷取
     * @param damageDealt 造成的伤害
     * @param lifestealPercent 生命偷取百分比 (0-1)
     * @returns 恢复的生命值
     */
    static calculateLifesteal(damageDealt: number, lifestealPercent: number): number {
        return Math.floor(damageDealt * lifestealPercent);
    }

    /**
     * 创建伤害数字显示文本
     * @param result 伤害结果
     * @returns 格式化的伤害文本
     */
    static formatDamageText(result: IDamageResult): string {
        let text = result.damage.toString();

        if (result.isCrit) {
            text = `暴击! ${text}`;
        }

        if (result.element) {
            const elementNames: { [key in ElementType]: string } = {
                [ElementType.NONE]: '无',
                [ElementType.FIRE]: '火',
                [ElementType.WATER]: '水',
                [ElementType.EARTH]: '土',
                [ElementType.THUNDER]: '雷',
                [ElementType.WOOD]: '木',
                [ElementType.WIND]: '风',
                [ElementType.LIGHT]: '光',
                [ElementType.DARK]: '暗'
            };
            text += ` [${elementNames[result.element]}]`;
        }

        return text;
    }

    /**
     * 获取伤害颜色 (用于UI显示)
     * @param result 伤害结果
     * @returns 颜色值
     */
    static getDamageColor(result: IDamageResult): string {
        if (result.isCrit) {
            return '#ff0000'; // 红色 - 暴击
        }

        if (result.element) {
            const elementColors: { [key in ElementType]: string } = {
                [ElementType.NONE]: '#cccccc',
                [ElementType.FIRE]: '#ff4500',
                [ElementType.WATER]: '#00bfff',
                [ElementType.EARTH]: '#8b4513',
                [ElementType.THUNDER]: '#ffd700',
                [ElementType.WOOD]: '#228b22',
                [ElementType.WIND]: '#87ceeb',
                [ElementType.LIGHT]: '#ffffe0',
                [ElementType.DARK]: '#4b0082'
            };
            return elementColors[result.element];
        }

        return '#ffffff'; // 白色 - 普通伤害
    }
}
