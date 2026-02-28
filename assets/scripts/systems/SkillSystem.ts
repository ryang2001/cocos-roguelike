/**
 * 技能系统 - Cocos Creator版本
 * 管理玩家技能释放、冷却和学习
 */

import { _decorator, Component, Node, Vec3 } from 'cc';
import { ISkill, SkillType, ElementType, ICombatEntity } from '../types/Types';
import { CombatSystem } from './CombatSystem';

const { ccclass } = _decorator;

/**
 * 技能释放结果
 */
export enum SkillResult {
    SUCCESS = 'success',
    COOLDOWN = 'cooldown',
    NO_MANA = 'no_mana',
    OUT_OF_RANGE = 'out_of_range',
    INVALID_TARGET = 'invalid_target',
    NOT_LEARNED = 'not_learned'
}

/**
 * 技能系统单例
 */
@ccclass('SkillSystem')
export class SkillSystem extends Component {
    // 单例
    private static _instance: SkillSystem | null = null;
    public static get instance(): SkillSystem | null {
        return this._instance;
    }

    // ==================== 私有属性 ====================

    // 已学习的技能
    private _learnedSkills: Map<string, ISkill> = new Map();

    // 技能冷却时间 (技能ID -> 剩余冷却时间)
    private _cooldowns: Map<string, number> = new Map();

    // 当前法力值
    private _currentMana: number = 100;

    // 最大法力值
    private _maxMana: number = 100;

    // 法力回复速度 (每秒)
    private _manaRegen: number = 5;

    // 事件回调
    private _onSkillCast: ((skillId: string, result: SkillResult) => void) | null = null;
    private _onManaChange: (() => void) | null = null;
    private _onCooldownUpdate: (() => void) | null = null;

    // ==================== 初始技能配置 ====================

    private readonly _availableSkills: ISkill[] = [
        {
            id: 'fireball',
            name: '火球术',
            description: '发射一枚火球，对范围内的敌人造成火焰伤害',
            icon: 'skills/fireball.png',
            cooldown: 3,
            damage: 50,
            range: 200,
            manaCost: 20,
            skillType: SkillType.FIREBALL,
            element: ElementType.FIRE,
            level: 1,
            maxLevel: 5
        },
        {
            id: 'heal',
            name: '治疗术',
            description: '恢复自身生命值',
            icon: 'skills/heal.png',
            cooldown: 8,
            damage: 0,
            range: 0,
            manaCost: 30,
            skillType: SkillType.HEAL,
            element: undefined,
            level: 1,
            maxLevel: 5
        },
        {
            id: 'shield',
            name: '护盾术',
            description: '获得一个吸收伤害的护盾',
            icon: 'skills/shield.png',
            cooldown: 15,
            damage: 0,
            range: 0,
            manaCost: 25,
            skillType: SkillType.SHIELD,
            element: undefined,
            level: 1,
            maxLevel: 3
        },
        {
            id: 'whirlwind',
            name: '旋风斩',
            description: '对周围所有敌人造成伤害',
            icon: 'skills/whirlwind.png',
            cooldown: 6,
            damage: 40,
            range: 100,
            manaCost: 15,
            skillType: SkillType.WHIRLWIND,
            element: undefined,
            level: 1,
            maxLevel: 5
        },
        {
            id: 'lightning',
            name: '闪电链',
            description: '释放闪电，在多个敌人之间跳跃',
            icon: 'skills/lightning.png',
            cooldown: 5,
            damage: 35,
            range: 250,
            manaCost: 25,
            skillType: SkillType.LIGHTNING,
            element: ElementType.THUNDER,
            level: 1,
            maxLevel: 5
        },
        {
            id: 'teleport',
            name: '闪现',
            description: '瞬间移动到目标位置',
            icon: 'skills/teleport.png',
            cooldown: 10,
            damage: 0,
            range: 150,
            manaCost: 20,
            skillType: SkillType.TELEPORT,
            element: undefined,
            level: 1,
            maxLevel: 3
        }
    ];

    // ==================== 生命周期 ====================

    onLoad() {
        if (SkillSystem._instance === null) {
            SkillSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 默认学习第一个技能
        this.learnSkill(this._availableSkills[0]);

        console.log('SkillSystem: 技能系统初始化完成');
    }

    onDestroy() {
        if (SkillSystem._instance === this) {
            SkillSystem._instance = null;
        }
    }

    update(deltaTime: number): void {
        // 更新冷却时间
        this.updateCooldowns(deltaTime);

        // 法力回复
        if (this._currentMana < this._maxMana) {
            this._currentMana = Math.min(this._maxMana, this._currentMana + this._manaRegen * deltaTime);
            this.notifyManaChange();
        }
    }

    // ==================== 主要接口 ====================

    /**
     * 释放技能
     * @param skillId 技能ID
     * @param targetPos 目标位置
     * @returns 释放结果
     */
    castSkill(skillId: string, targetPos?: Vec3): SkillResult {
        const skill = this._learnedSkills.get(skillId);
        if (!skill) {
            return SkillResult.NOT_LEARNED;
        }

        // 检查冷却
        const remainingCooldown = this._cooldowns.get(skillId) || 0;
        if (remainingCooldown > 0) {
            return SkillResult.COOLDOWN;
        }

        // 检查法力
        if (this._currentMana < skill.manaCost) {
            return SkillResult.NO_MANA;
        }

        // 执行技能效果
        const success = this.executeSkill(skill, targetPos);

        if (success) {
            // 消耗法力
            this._currentMana -= skill.manaCost;
            this.notifyManaChange();

            // 设置冷却
            this._cooldowns.set(skillId, skill.cooldown);

            console.log(`释放技能: ${skill.name}`);
            this.notifySkillCast(skillId, SkillResult.SUCCESS);
            return SkillResult.SUCCESS;
        }

        return SkillResult.INVALID_TARGET;
    }

    /**
     * 学习技能
     */
    learnSkill(skill: ISkill): boolean {
        if (this._learnedSkills.has(skill.id)) {
            console.log(`技能 ${skill.name} 已学习`);
            return false;
        }

        this._learnedSkills.set(skill.id, skill);
        console.log(`学习技能: ${skill.name}`);
        return true;
    }

    /**
     * 升级技能
     */
    upgradeSkill(skillId: string): boolean {
        const skill = this._learnedSkills.get(skillId);
        if (!skill) return false;

        if (skill.level >= skill.maxLevel) {
            console.log(`技能 ${skill.name} 已达到最大等级`);
            return false;
        }

        skill.level++;
        skill.damage = Math.floor(skill.damage * 1.2); // 每级提升20%伤害
        skill.manaCost = Math.floor(skill.manaCost * 1.1); // 每级提升10%法力消耗

        console.log(`升级技能: ${skill.name} -> Lv.${skill.level}`);
        return true;
    }

    /**
     * 执行技能效果
     */
    private executeSkill(skill: ISkill, targetPos?: Vec3): boolean {
        const playerNode = this.node.scene.getChildByPath('WorldContainer/Player');
        if (!playerNode) return false;

        const caster = playerNode.getComponent('Player') as any;

        switch (skill.skillType) {
            case SkillType.FIREBALL:
                return this.castFireball(skill, caster, targetPos);

            case SkillType.HEAL:
                return this.castHeal(skill, caster);

            case SkillType.SHIELD:
                return this.castShield(skill, caster);

            case SkillType.WHIRLWIND:
                return this.castWhirlwind(skill, caster);

            case SkillType.LIGHTNING:
                return this.castLightning(skill, caster, targetPos);

            case SkillType.TELEPORT:
                return this.castTeleport(skill, caster, targetPos);

            default:
                console.warn(`未知技能类型: ${skill.skillType}`);
                return false;
        }
    }

    // ==================== 技能实现 ====================

    /**
     * 火球术
     */
    private castFireball(skill: ISkill, caster: any, targetPos?: Vec3): boolean {
        if (!targetPos) return false;

        // 查找目标位置附近的敌人
        const combatSystem = CombatSystem.instance;
        if (!combatSystem) return false;

        const target = combatSystem.findNearestEnemy(targetPos, skill.range);
        if (!target) return false;

        // 造成伤害
        combatSystem.performAttack(
            { node: caster.node, getCharacterData: () => caster.getCharacterData() } as ICombatEntity,
            null, // 无武器
            target,
            { fire: 0, water: 0, earth: 0, thunder: 0, wood: 0, wind: 0, light: 0, dark: 0 },
            0,
            skill.damage / 50 // 伤害倍数
        );

        return true;
    }

    /**
     * 治疗术
     */
    private castHeal(skill: ISkill, caster: any): boolean {
        const healAmount = skill.damage * 2; // 治疗量为技能配置的damage * 2

        if (caster.heal) {
            caster.heal(healAmount);
            console.log(`治疗: +${healAmount} HP`);
            return true;
        }

        return false;
    }

    /**
     * 护盾术
     */
    private castShield(skill: ISkill, caster: any): boolean {
        const shieldAmount = skill.damage * 3;

        // TODO: 实现护盾效果系统
        console.log(`获得护盾: ${shieldAmount}`);
        return true;
    }

    /**
     * 旋风斩
     */
    private castWhirlwind(skill: ISkill, caster: any): boolean {
        const combatSystem = CombatSystem.instance;
        if (!combatSystem) return false;

        // 获取周围所有敌人
        const allEnemies = combatSystem.getAllCombatEntities().filter(entity =>
            CombatSystem.isEnemy(
                { node: caster.node, getCharacterData: () => caster.getCharacterData() } as ICombatEntity,
                entity
            )
        );

        const casterPos = caster.node.position;
        let hitCount = 0;

        for (const enemy of allEnemies) {
            const distance = Vec3.distance(casterPos, enemy.node.position);
            if (distance <= skill.range) {
                combatSystem.performAttack(
                    { node: caster.node, getCharacterData: () => caster.getCharacterData() } as ICombatEntity,
                    null,
                    enemy,
                    { fire: 0, water: 0, earth: 0, thunder: 0, wood: 0, wind: 0, light: 0, dark: 0 },
                    0,
                    skill.damage / 50
                );
                hitCount++;
            }
        }

        console.log(`旋风斩命中 ${hitCount} 个敌人`);
        return hitCount > 0;
    }

    /**
     * 闪电链
     */
    private castLightning(skill: ISkill, caster: any, targetPos?: Vec3): boolean {
        if (!targetPos) return false;

        const combatSystem = CombatSystem.instance;
        if (!combatSystem) return false;

        // 查找第一个目标
        let target = combatSystem.findNearestEnemy(targetPos, skill.range);
        let chainCount = 0;
        const maxChains = 3;

        while (target && chainCount < maxChains) {
            combatSystem.performAttack(
                { node: caster.node, getCharacterData: () => caster.getCharacterData() } as ICombatEntity,
                null,
                target,
                { fire: 0, water: 0, earth: 0, thunder: 0, wood: 0, wind: 0, light: 0, dark: 0 },
                0,
                skill.damage / 50
            );

            chainCount++;

            // 寻找下一个目标 (距离当前目标80以内)
            const currentTargetPos = target.node.position;
            const nextTarget = combatSystem.findNearestEnemy(currentTargetPos, 80, (entity) => entity !== target);

            if (nextTarget === target) break; // 没有新目标了
            target = nextTarget;
        }

        console.log(`闪电链跳跃 ${chainCount} 次`);
        return chainCount > 0;
    }

    /**
     * 闪现
     */
    private castTeleport(skill: ISkill, caster: any, targetPos?: Vec3): boolean {
        if (!targetPos) return false;

        const currentPos = caster.node.position.clone();
        const direction = new Vec3();
        Vec3.subtract(direction, targetPos, currentPos);

        const distance = direction.length();
        if (distance > skill.range) {
            direction.normalize();
            Vec3.multiplyScalar(direction, direction, skill.range);
            Vec3.add(targetPos, currentPos, direction);
        }

        caster.node.setPosition(targetPos);
        console.log(`闪现到 (${targetPos.x.toFixed(0)}, ${targetPos.y.toFixed(0)})`);
        return true;
    }

    // ==================== 冷却管理 ====================

    /**
     * 更新冷却时间
     */
    private updateCooldowns(deltaTime: number): void {
        let hasChange = false;

        for (const [skillId, remaining] of this._cooldowns.entries()) {
            if (remaining > 0) {
                const newRemaining = Math.max(0, remaining - deltaTime);
                this._cooldowns.set(skillId, newRemaining);

                if (newRemaining === 0) {
                    hasChange = true;
                    console.log(`技能 ${skillId} 冷却完毕`);
                }
            }
        }

        if (hasChange) {
            this.notifyCooldownUpdate();
        }
    }

    /**
     * 获取技能剩余冷却时间
     */
    getCooldown(skillId: string): number {
        return this._cooldowns.get(skillId) || 0;
    }

    /**
     * 获取技能冷却百分比 (0-1)
     */
    getCooldownPercent(skillId: string): number {
        const skill = this._learnedSkills.get(skillId);
        if (!skill) return 0;

        const remaining = this.getCooldown(skillId);
        return remaining / skill.cooldown;
    }

    /**
     * 检查技能是否可用
     */
    canCastSkill(skillId: string): boolean {
        const skill = this._learnedSkills.get(skillId);
        if (!skill) return false;

        return this.getCooldown(skillId) <= 0 && this._currentMana >= skill.manaCost;
    }

    // ==================== 法力管理 ====================

    /**
     * 添加法力值
     */
    addMana(amount: number): void {
        this._currentMana = Math.min(this._maxMana, this._currentMana + amount);
        this.notifyManaChange();
    }

    /**
     * 消耗法力值
     */
    consumeMana(amount: number): boolean {
        if (this._currentMana < amount) return false;

        this._currentMana -= amount;
        this.notifyManaChange();
        return true;
    }

    /**
     * 增加最大法力值
     */
    addMaxMana(amount: number): void {
        this._maxMana += amount;
        this._currentMana = Math.min(this._currentMana + amount, this._maxMana);
        this.notifyManaChange();
    }

    // ==================== 获取数据 ====================

    /**
     * 获取所有已学习技能
     */
    getLearnedSkills(): ReadonlyArray<ISkill> {
        return Array.from(this._learnedSkills.values());
    }

    /**
     * 获取技能
     */
    getSkill(skillId: string): ISkill | undefined {
        return this._learnedSkills.get(skillId);
    }

    /**
     * 获取所有可用技能 (包括未学习的)
     */
    getAvailableSkills(): ReadonlyArray<ISkill> {
        return this._availableSkills;
    }

    /**
     * 获取当前法力值
     */
    getCurrentMana(): number {
        return this._currentMana;
    }

    /**
     * 获取最大法力值
     */
    getMaxMana(): number {
        return this._maxMana;
    }

    /**
     * 获取法力百分比 (0-1)
     */
    getManaPercent(): number {
        return this._currentMana / this._maxMana;
    }

    // ==================== 事件回调 ====================

    onSkillCast(callback: (skillId: string, result: SkillResult) => void): void {
        this._onSkillCast = callback;
    }

    onManaChange(callback: () => void): void {
        this._onManaChange = callback;
    }

    onCooldownUpdate(callback: () => void): void {
        this._onCooldownUpdate = callback;
    }

    private notifySkillCast(skillId: string, result: SkillResult): void {
        if (this._onSkillCast) {
            this._onSkillCast(skillId, result);
        }
    }

    private notifyManaChange(): void {
        if (this._onManaChange) {
            this._onManaChange();
        }
    }

    private notifyCooldownUpdate(): void {
        if (this._onCooldownUpdate) {
            this._onCooldownUpdate();
        }
    }

    // ==================== 保存/加载 ====================

    /**
     * 保存数据
     */
    saveData(): any {
        return {
            learnedSkills: Array.from(this._learnedSkills.entries()),
            maxMana: this._maxMana
        };
    }

    /**
     * 加载数据
     */
    loadData(data: any): void {
        if (!data) return;

        if (data.learnedSkills) {
            this._learnedSkills = new Map(data.learnedSkills);
        }

        if (data.maxMana) {
            this._maxMana = data.maxMana;
            this._currentMana = this._maxMana;
        }
    }
}
