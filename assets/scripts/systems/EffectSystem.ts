/**
 * 效果系统 - Cocos Creator版本
 * 管理Buff/Debuff状态效果
 */

import { _decorator, Component, Node, ParticleSystem2D, Color, Vec3 } from 'cc';
import { IBuff, BuffType, ElementType, IModifier, Rarity } from '../types/Types';

const { ccclass } = _decorator;

/**
 * 效果系统单例
 */
@ccclass('EffectSystem')
export class EffectSystem extends Component {
    // 单例
    private static _instance: EffectSystem | null = null;
    public static get instance(): EffectSystem | null {
        return this._instance;
    }

    // ==================== 私有属性 ====================

    // 当前激活的Buff列表
    private _activeBuffs: IBuff[] = [];

    // 事件回调
    private _onBuffAdd: ((buff: IBuff) => void) | null = null;
    private _onBuffRemove: ((buff: IBuff) => void) | null = null;
    private _onBuffUpdate: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad() {
        if (EffectSystem._instance === null) {
            EffectSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        console.log('EffectSystem: 效果系统初始化完成');
    }

    onDestroy() {
        if (EffectSystem._instance === this) {
            EffectSystem._instance = null;
        }
    }

    update(deltaTime: number): void {
        if (this._activeBuffs.length === 0) return;

        // 更新所有Buff持续时间
        this.updateBuffs(deltaTime);
    }

    // ==================== 主要接口 ====================

    /**
     * 添加Buff
     * @param buff 要添加的Buff
     */
    addBuff(buff: IBuff): void {
        // 检查是否已有相同类型的Buff
        const existingBuff = this._activeBuffs.find(b => b.id === buff.id);

        if (existingBuff) {
            // 刷新持续时间 (不超过原持续时间)
            existingBuff.remainingTime = Math.min(
                existingBuff.remainingTime + buff.duration * 0.5,
                existingBuff.duration
            );

            // 尝试叠加层数
            if (existingBuff.stackCount < existingBuff.maxStack) {
                existingBuff.stackCount = Math.min(
                    existingBuff.stackCount + buff.stackCount,
                    existingBuff.maxStack
                );
                existingBuff.value = Math.floor(existingBuff.value * (1 + 0.2 * existingBuff.stackCount));
            }

            console.log(`刷新Buff: ${buff.name} (层数: ${existingBuff.stackCount})`);
        } else {
            // 添加新Buff
            buff.remainingTime = buff.duration;
            this._activeBuffs.push(buff);
            console.log(`添加Buff: ${buff.name}`);
            this.notifyBuffAdd(buff);
        }

        this.notifyBuffUpdate();
    }

    /**
     * 移除Buff
     * @param buffId Buff ID
     */
    removeBuff(buffId: string): boolean {
        const index = this._activeBuffs.findIndex(b => b.id === buffId);
        if (index === -1) return false;

        const buff = this._activeBuffs[index];
        this._activeBuffs.splice(index, 1);

        console.log(`移除Buff: ${buff.name}`);
        this.notifyBuffRemove(buff);
        this.notifyBuffUpdate();
        return true;
    }

    /**
     * 移除指定类型的所有Buff
     */
    removeBuffsByType(type: BuffType): void {
        const toRemove = this._activeBuffs.filter(b => b.type === type);

        for (const buff of toRemove) {
            this.removeBuff(buff.id);
        }
    }

    /**
     * 清除所有Buff
     */
    clearAllBuffs(): void {
        for (const buff of this._activeBuffs) {
            this.notifyBuffRemove(buff);
        }

        this._activeBuffs = [];
        this.notifyBuffUpdate();
        console.log('清除所有Buff');
    }

    /**
     * 更新Buff持续时间
     */
    private updateBuffs(deltaTime: number): void {
        let hasChange = false;

        for (let i = this._activeBuffs.length - 1; i >= 0; i--) {
            const buff = this._activeBuffs[i];
            buff.remainingTime -= deltaTime;

            if (buff.remainingTime <= 0) {
                // 移除过期Buff
                this._activeBuffs.splice(i, 1);
                this.notifyBuffRemove(buff);
                hasChange = true;
                console.log(`Buff过期: ${buff.name}`);
            }
        }

        if (hasChange) {
            this.notifyBuffUpdate();
        }
    }

    // ==================== 属性计算 ====================

    /**
     * 计算修正后的伤害
     * @param baseDamage 基础伤害
     * @param element 元素类型
     * @returns 修正后的伤害
     */
    calculateModifiedDamage(baseDamage: number, element?: ElementType): number {
        let modifiedDamage = baseDamage;
        let hasModifier = false;

        for (const buff of this._activeBuffs) {
            switch (buff.type) {
                case BuffType.STRENGTH:
                    // 力量提升: 增加伤害
                    modifiedDamage = Math.floor(modifiedDamage * (1 + buff.value * buff.stackCount));
                    hasModifier = true;
                    break;

                case BuffType.WEAKNESS:
                    // 虚弱: 减少伤害
                    modifiedDamage = Math.floor(modifiedDamage * (1 - buff.value * buff.stackCount));
                    hasModifier = true;
                    break;

                case BuffType.BURN:
                    // 燃烧: 额外火焰伤害
                    if (element === ElementType.FIRE) {
                        modifiedDamage += Math.floor(buff.value * buff.stackCount);
                        hasModifier = true;
                    }
                    break;
            }
        }

        return hasModifier ? Math.max(1, modifiedDamage) : baseDamage;
    }

    /**
     * 计算修正后的防御力
     * @param baseDefense 基础防御
     * @returns 修正后的防御
     */
    calculateModifiedDefense(baseDefense: number): number {
        let modifiedDefense = baseDefense;

        for (const buff of this._activeBuffs) {
            if (buff.type === BuffType.SHIELD) {
                // 护盾: 增加防御
                modifiedDefense += Math.floor(buff.value * buff.stackCount);
            }
        }

        return modifiedDefense;
    }

    /**
     * 计算修正后的移动速度
     * @param baseSpeed 基础速度
     * @returns 修正后的速度
     */
    calculateModifiedSpeed(baseSpeed: number): number {
        let modifiedSpeed = baseSpeed;

        for (const buff of this._activeBuffs) {
            if (buff.type === BuffType.SLOW) {
                // 减速: 降低速度
                modifiedSpeed = Math.floor(modifiedSpeed * (1 - buff.value * buff.stackCount));
            }
        }

        return Math.max(10, modifiedSpeed); // 最低保留10%速度
    }

    /**
     * 计算伤害加成 (每帧调用，用于DoT效果)
     * @returns 伤害值
     */
    calculateDoTDamage(): number {
        let totalDamage = 0;

        for (const buff of this._activeBuffs) {
            if (buff.type === BuffType.POISON) {
                // 中毒: 持续伤害
                totalDamage += buff.value * buff.stackCount;
            } else if (buff.type === BuffType.BURN) {
                // 燃烧: 持续伤害
                totalDamage += buff.value * buff.stackCount;
            }
        }

        return totalDamage;
    }

    /**
     * 计算治疗量 (每帧调用，用于再生效果)
     * @returns 治疗量
     */
    calculateRegeneration(): number {
        for (const buff of this._activeBuffs) {
            if (buff.type === BuffType.REGENERATION) {
                return buff.value * buff.stackCount;
            }
        }
        return 0;
    }

    /**
     * 检查是否被眩晕
     */
    isStunned(): boolean {
        return this._activeBuffs.some(b => b.type === BuffType.STUN);
    }

    /**
     * 检查是否有护盾
     */
    hasShield(): boolean {
        return this._activeBuffs.some(b => b.type === BuffType.SHIELD);
    }

    /**
     * 获取护盾值
     */
    getShieldValue(): number {
        for (const buff of this._activeBuffs) {
            if (buff.type === BuffType.SHIELD) {
                return buff.value * buff.stackCount;
            }
        }
        return 0;
    }

    /**
     * 消耗护盾 (受到伤害时调用)
     * @param damage 伤害值
     * @return 实际承受的伤害 (消耗护盾后剩余)
     */
    consumeShield(damage: number): number {
        let remainingDamage = damage;

        for (let i = this._activeBuffs.length - 1; i >= 0; i--) {
            const buff = this._activeBuffs[i];
            if (buff.type === BuffType.SHIELD) {
                const shieldValue = buff.value * buff.stackCount;

                if (shieldValue >= remainingDamage) {
                    // 护盾完全抵挡
                    buff.value = Math.floor(shieldValue - remainingDamage);
                    return 0;
                } else {
                    // 护盾被破
                    remainingDamage -= shieldValue;
                    this._activeBuffs.splice(i, 1);
                    this.notifyBuffRemove(buff);
                }
            }
        }

        this.notifyBuffUpdate();
        return remainingDamage;
    }

    // ==================== 获取数据 ====================

    /**
     * 获取所有激活的Buff
     */
    getActiveBuffs(): ReadonlyArray<IBuff> {
        return this._activeBuffs;
    }

    /**
     * 获取指定类型的Buff
     */
    getBuffsByType(type: BuffType): IBuff[] {
        return this._activeBuffs.filter(b => b.type === type);
    }

    /**
     * 获取Buff数量
     */
    getBuffCount(): number {
        return this._activeBuffs.length;
    }

    /**
     * 检查是否有指定Buff
     */
    hasBuff(buffId: string): boolean {
        return this._activeBuffs.some(b => b.id === buffId);
    }

    // ==================== 事件回调 ====================

    onBuffAdd(callback: (buff: IBuff) => void): void {
        this._onBuffAdd = callback;
    }

    onBuffRemove(callback: (buff: IBuff) => void): void {
        this._onBuffRemove = callback;
    }

    onBuffUpdate(callback: () => void): void {
        this._onBuffUpdate = callback;
    }

    private notifyBuffAdd(buff: IBuff): void {
        if (this._onBuffAdd) {
            this._onBuffAdd(buff);
        }
    }

    private notifyBuffRemove(buff: IBuff): void {
        if (this._onBuffRemove) {
            this._onBuffRemove(buff);
        }
    }

    private notifyBuffUpdate(): void {
        if (this._onBuffUpdate) {
            this._onBuffUpdate();
        }
    }

    // ==================== 保存/加载 ====================

    /**
     * 保存数据
     */
    saveData(): any {
        return {
            activeBuffs: this._activeBuffs
        };
    }

    /**
     * 加载数据
     */
    loadData(data: any): void {
        if (!data || !data.activeBuffs) return;

        this._activeBuffs = data.activeBuffs;
        this.notifyBuffUpdate();
    }

    // ==================== 视觉特效 [新增] ====================

    /**
     * 播放地形视觉效果
     * @param terrainType 地形类型
     * @param position 位置
     */
    playTerrainEffect(terrainType: TerrainType, position: Vec3): void {
        switch (terrainType) {
            case TerrainType.SNOW_MOUNTAIN:
                this.playSnowEffect(position);
                break;
            case TerrainType.VOLCANO:
                this.playFireEffect(position);
                break;
            case TerrainType.SWAMP:
                this.playPoisonEffect(position);
                break;
            case TerrainType.FOREST:
                this.playLeafEffect(position);
                break;
            case TerrainType.DESERT:
                this.playSandEffect(position);
                break;
            case TerrainType.CASTLE:
                this.playSafeZoneEffect(position);
                break;
        }
    }

    /**
     * 播放雪地效果
     */
    private playSnowEffect(position: Vec3): void {
        // 创建雪花粒子效果
        console.log(`EffectSystem: 播放雪地效果 at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        // TODO: 实例化雪花粒子预制体
    }

    /**
     * 播放火焰效果
     */
    private playFireEffect(position: Vec3): void {
        // 创建火焰粒子效果
        console.log(`EffectSystem: 播放火焰效果 at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        // TODO: 实例化火焰粒子预制体
    }

    /**
     * 播放毒气效果
     */
    private playPoisonEffect(position: Vec3): void {
        // 创建毒气粒子效果
        console.log(`EffectSystem: 播放毒气效果 at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        // TODO: 实例化毒气粒子预制体
    }

    /**
     * 播放落叶效果
     */
    private playLeafEffect(position: Vec3): void {
        // 创建落叶粒子效果
        console.log(`EffectSystem: 播放落叶效果 at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        // TODO: 实例化落叶粒子预制体
    }

    /**
     * 播放沙尘效果
     */
    private playSandEffect(position: Vec3): void {
        // 创建沙尘粒子效果
        console.log(`EffectSystem: 播放沙尘效果 at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        // TODO: 实例化沙尘粒子预制体
    }

    /**
     * 播放安全区效果
     */
    private playSafeZoneEffect(position: Vec3): void {
        // 创建安全区光环效果
        console.log(`EffectSystem: 播放安全区效果 at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        // TODO: 实例化光环粒子预制体
    }

    /**
     * 播放词条获得效果
     * @param modifier 词条
     * @param position 位置
     */
    playModifierAcquireEffect(modifier: IModifier, position: Vec3): void {
        const color = this.getRarityColor(modifier.rarity);
        console.log(`EffectSystem: 播放词条获得效果 - ${modifier.name} (${Rarity[modifier.rarity]})`);
        // TODO: 实例化对应稀有度的粒子效果
    }

    /**
     * 播放词条镶嵌效果
     * @param modifier 词条
     * @param position 位置
     */
    playModifierEquipEffect(modifier: IModifier, position: Vec3): void {
        console.log(`EffectSystem: 播放词条镶嵌效果 - ${modifier.name}`);
        // TODO: 实例化镶嵌特效
    }

    /**
     * 播放伤害数字效果
     * @param damage 伤害值
     * @param position 位置
     * @param isCrit 是否暴击
     * @param element 元素类型
     */
    playDamageNumber(damage: number, position: Vec3, isCrit: boolean = false, element?: ElementType): void {
        let color = Color.WHITE;
        if (isCrit) {
            color = Color.RED;
        } else if (element) {
            color = this.getElementColor(element);
        }
        console.log(`EffectSystem: 显示伤害数字 ${damage} (暴击:${isCrit})`);
        // TODO: 实例化伤害数字预制体
    }

    /**
     * 播放攻击特效
     * @param attackType 攻击类型
     * @param position 位置
     */
    playAttackEffect(attackType: string, position: Vec3): void {
        console.log(`EffectSystem: 播放攻击特效 - ${attackType}`);
        // TODO: 根据攻击类型播放不同特效
    }

    /**
     * 获取稀有度颜色
     */
    private getRarityColor(rarity: Rarity): Color {
        const colors: { [key in Rarity]: Color } = {
            [Rarity.COMMON]: new Color().fromHEX('#9E9E9E'),
            [Rarity.UNCOMMON]: new Color().fromHEX('#4CAF50'),
            [Rarity.RARE]: new Color().fromHEX('#2196F3'),
            [Rarity.EPIC]: new Color().fromHEX('#9C27B0'),
            [Rarity.LEGENDARY]: new Color().fromHEX('#FF9800'),
            [Rarity.MYTHICAL]: new Color().fromHEX('#F44336')
        };
        return colors[rarity] || Color.WHITE;
    }

    /**
     * 获取元素颜色
     */
    private getElementColor(element: ElementType): Color {
        const colors: { [key in ElementType]: Color } = {
            [ElementType.NONE]: new Color().fromHEX('#CCCCCC'),
            [ElementType.FIRE]: new Color().fromHEX('#FF4500'),
            [ElementType.WATER]: new Color().fromHEX('#00BFFF'),
            [ElementType.EARTH]: new Color().fromHEX('#8B4513'),
            [ElementType.THUNDER]: new Color().fromHEX('#FFD700'),
            [ElementType.WOOD]: new Color().fromHEX('#228B22'),
            [ElementType.WIND]: new Color().fromHEX('#87CEEB'),
            [ElementType.LIGHT]: new Color().fromHEX('#FFFFE0'),
            [ElementType.DARK]: new Color().fromHEX('#4B0082')
        };
        return colors[element] || Color.WHITE;
    }
}

// ==================== Buff工厂函数 ====================

/**
 * 创建Buff
 */
export function createBuff(
    id: string,
    name: string,
    type: BuffType,
    value: number,
    duration: number,
    stackCount: number = 1,
    maxStack: number = 1
): IBuff {
    return {
        id,
        name,
        type,
        value,
        duration,
        remainingTime: duration,
        stackCount,
        maxStack,
        icon: `buffs/${type}.png`
    };
}

/**
 * 预定义Buff配置
 */
export const BuffPresets = {
    // 中毒
    POISON_WEAK: (duration: number = 5) => createBuff(
        'poison_weak',
        '中毒',
        BuffType.POISON,
        5, // 每秒5点伤害
        duration
    ),

    POISON_STRONG: (duration: number = 8) => createBuff(
        'poison_strong',
        '剧毒',
        BuffType.POISON,
        15,
        duration,
        1,
        3
    ),

    // 燃烧
    BURN_WEAK: (duration: number = 3) => createBuff(
        'burn_weak',
        '燃烧',
        BuffType.BURN,
        8,
        duration
    ),

    BURN_STRONG: (duration: number = 6) => createBuff(
        'burn_strong',
        '烈焰',
        BuffType.BURN,
        20,
        duration,
        1,
        2
    ),

    // 减速
    SLOW_WEAK: (duration: number = 4) => createBuff(
        'slow_weak',
        '减速',
        BuffType.SLOW,
        0.3, // 降低30%速度
        duration
    ),

    SLOW_STRONG: (duration: number = 6) => createBuff(
        'slow_strong',
        '极缓',
        BuffType.SLOW,
        0.5, // 降低50%速度
        duration
    ),

    // 眩晕
    STUN: (duration: number = 2) => createBuff(
        'stun',
        '眩晕',
        BuffType.STUN,
        0,
        duration
    ),

    // 护盾
    SHIELD_WEAK: (duration: number = 10) => createBuff(
        'shield_weak',
        '护盾',
        BuffType.SHIELD,
        50, // 吸收50点伤害
        duration
    ),

    SHIELD_STRONG: (duration: number = 15) => createBuff(
        'shield_strong',
        '强力护盾',
        BuffType.SHIELD,
        150,
        duration
    ),

    // 力量提升
    STRENGTH: (duration: number = 10) => createBuff(
        'strength',
        '力量',
        BuffType.STRENGTH,
        0.3, // 增加30%伤害
        duration,
        1,
        3
    ),

    // 虚弱
    WEAKNESS: (duration: number = 8) => createBuff(
        'weakness',
        '虚弱',
        BuffType.WEAKNESS,
        0.25, // 降低25%伤害
        duration
    ),

    // 再生
    REGENERATION: (duration: number = 10) => createBuff(
        'regeneration',
        '再生',
        BuffType.REGENERATION,
        5, // 每秒恢复5点生命
        duration
    )
};
