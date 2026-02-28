/**
 * 怪物控制器 - Cocos Creator版本
 * 负责怪物的 AI、移动、攻击和掉落
 */

import { _decorator, Component, Node, Vec3, Sprite, Color, resources, SpriteFrame } from 'cc';
import { GameConfig } from '../config/GameConfig';
import {
    IMonster,
    IMonsterConfig,
    MonsterType,
    MonsterState,
    ICharacter,
    IResistances,
    DEFAULT_RESISTANCES,
    IBossSkill,
    BossSkillType,
    Rarity,
    IModifier,
    ICombatEntity
} from '../types/Types';

const { ccclass, property } = _decorator;

/**
 * 怪物类
 * 实现 ICombatEntity 接口以参与战斗系统
 */
@ccclass('Monster')
export class Monster extends Component implements ICombatEntity {
    // 显式声明 node 属性以满足接口
    declare readonly node: Node;

    // ==================== 编辑器属性 ====================

    @property({ displayName: '怪物类型' })
    monsterType: MonsterType = MonsterType.SLIME;

    @property({ displayName: '是否为精英怪' })
    isElite: boolean = false;

    // ==================== 私有属性 ====================

    // 怪物数据
    private _monsterData: IMonster;

    // 状态机
    private _state: MonsterState = MonsterState.IDLE;

    // 目标引用 (通常是玩家)
    private _target: ICombatEntity | null = null;

    // 攻击计时器
    private _attackTimer: number = 0;
    private _attackCooldown: number = 1.0;

    // 检测范围
    private readonly _detectRange: number = 300;
    private readonly _attackRange: number = 50;

    // 死亡标记 (防止重复触发)
    private _isDead: boolean = false;

    // ==================== Boss技能相关属性 ====================

    // 是否为Boss
    private _isBoss: boolean = false;

    // Boss技能列表
    private _bossSkills: IBossSkill[] = [];

    // 当前正在释放的技能
    private _currentSkill: IBossSkill | null = null;

    // 技能冷却计时器
    private _skillCooldownTimer: number = 0;

    // 技能预警计时器
    private _skillWarningTimer: number = 0;

    // 是否正在释放技能
    private _isCastingSkill: boolean = false;

    // ==================== 系统获取辅助方法 ====================

    private _getCombatSystem(): any {
        return (this.node.scene.getComponent('CombatSystem') as any)?.instance;
    }

    private _getLootSystem(): any {
        return (this.node.scene.getComponent('LootSystem') as any)?.instance;
    }

    private _getModifierSystem(): any {
        return (this.node.scene.getComponent('ModifierSystem') as any)?.instance;
    }

    private _getCastle(): any {
        const castleNode = this.node.scene.getChildByName('Castle');
        return castleNode?.getComponent('Castle');
    }

    // ==================== 生命周期 ====================

    onLoad() {
        // 初始化怪物数据
        this._monsterData = this.createMonsterData();

        // 加载AI生成的精灵图
        this.loadMonsterSprite();

        // 初始化Boss技能
        this.initBossSkills();
    }

    /**
     * 加载AI生成的怪物精灵图
     */
    private loadMonsterSprite(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) {
            console.warn(`Monster: 节点上没有Sprite组件，无法加载精灵图`);
            return;
        }

        // 根据怪物类型和是否为精英获取对应的路径
        let texturePath: string | null = null;

        if (this.isElite) {
            // 精英怪使用精英贴图
            texturePath = GameConfig.ELITE_TEXTURE_MAP[this.monsterType] || null;
        } else {
            // 普通怪使用普通贴图
            texturePath = GameConfig.MONSTER_TEXTURE_MAP[this.monsterType] || null;
        }

        if (!texturePath) {
            console.warn(`Monster: 未找到怪物类型 ${this.monsterType} 的贴图路径`);
            // 使用默认颜色作为后备
            this.updateMonsterColor();
            return;
        }

        // 动态加载精灵图
        resources.load(texturePath, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn(`Monster: 加载精灵图失败 ${texturePath}`, err.message);
                // 加载失败时使用默认颜色
                this.updateMonsterColor();
                return;
            }

            if (spriteFrame) {
                sprite.spriteFrame = spriteFrame;
                console.log(`Monster: 成功加载精灵图 ${texturePath}`);

                // 精英怪添加发光效果（通过调整颜色）
                if (this.isElite) {
                    sprite.color = new Color(255, 255, 255, 255);
                }
            }
        });
    }

    start() {
        // 注册到战斗系统
        this.registerToCombatSystem();

        // 初始状态为空闲
        this.changeState(MonsterState.IDLE);
    }

    update(deltaTime: number) {
        if (this._isDead) return;

        switch (this._state) {
            case MonsterState.IDLE:
                this.updateIdle(deltaTime);
                break;
            case MonsterState.CHASE:
                this.updateChase(deltaTime);
                break;
            case MonsterState.ATTACK:
                this.updateAttack(deltaTime);
                break;
        }

        // Boss技能AI更新
        if (this._isBoss) {
            this.updateBossAI(deltaTime);
        }
    }

    onDestroy() {
        // 从战斗系统注销
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.unregisterCombatEntity(this);
        }
    }

    // ==================== ICombatEntity 接口实现 ====================

    /**
     * 获取角色数据
     */
    getCharacterData(): ICharacter {
        return {
            id: this._monsterData.id,
            name: this._monsterData.name,
            hp: this._monsterData.hp,
            maxHp: this._monsterData.maxHp,
            speed: this._monsterData.speed,
            position: this.node.position
        };
    }

    /**
     * 受到伤害
     */
    takeDamage(damage: number): void {
        if (this._isDead) return;

        this._monsterData.hp -= damage;

        console.log(`${this._monsterData.name}受到${damage}点伤害,剩余生命: ${this._monsterData.hp}/${this._monsterData.maxHp}`);

        if (this._monsterData.hp <= 0) {
            this._monsterData.hp = 0;
            this.die();
        } else {
            // 受到伤害后，如果处于空闲状态，则进入追击状态
            if (this._state === MonsterState.IDLE) {
                this.findTarget();
            }
        }
    }

    /**
     * 治疗 (怪物通常不会治疗，但保留接口)
     */
    heal(amount: number): void {
        if (this._isDead) return;

        this._monsterData.hp = Math.min(this._monsterData.hp + amount, this._monsterData.maxHp);
    }

    /**
     * 死亡处理
     */
    onDeath(): void {
        // 已由 die() 方法处理
    }

    // ==================== 怪物数据创建 ====================

    /**
     * 创建怪物数据
     */
    private createMonsterData(): IMonster {
        const config = this.getMonsterConfig();
        const eliteMultiplier = this.isElite ? 2.0 : 1.0;

        return {
            id: this.node.uuid,
            name: this.isElite ? `精英${config.name}` : config.name,
            hp: config.hp * eliteMultiplier,
            maxHp: config.hp * eliteMultiplier,
            speed: config.speed,
            position: this.node.position,
            monsterType: this.monsterType,
            damage: config.damage * eliteMultiplier,
            exp: config.exp * eliteMultiplier,
            gold: config.gold * eliteMultiplier,
            resistances: config.resistances,
            state: MonsterState.IDLE,
            target: null
        };
    }

    /**
     * 获取怪物配置
     */
    private getMonsterConfig(): IMonsterConfig {
        const configs: { [key in MonsterType]: IMonsterConfig } = {
            [MonsterType.SLIME]: {
                id: 'slime',
                name: '史莱姆',
                hp: GameConfig.MONSTERS.SLIME.hp,
                damage: GameConfig.MONSTERS.SLIME.damage,
                speed: GameConfig.MONSTERS.SLIME.speed,
                exp: GameConfig.MONSTERS.SLIME.exp,
                gold: GameConfig.MONSTERS.SLIME.gold,
                resistances: {
                    // 元素抗性 - 史莱姆(软甲，易受斩击，抗打击)
                    wood: 0,
                    water: 0.2,
                    fire: -0.5,   // 易燃，易受火伤
                    earth: 0,
                    thunder: 0,
                    wind: 0,
                    light: 0,
                    dark: 0.1,
                    // 物理抗性
                    slash: -0.3,   // 软甲易受斩击
                    blunt: 0.5,    // 抗打击
                    pierce: 0,
                    magic: -0.3,   // 易受魔法
                    ranged: 0,
                    explosion: -0.2
                }
            },
            [MonsterType.GOBLIN]: {
                id: 'goblin',
                name: '哥布林',
                hp: GameConfig.MONSTERS.GOBLIN.hp,
                damage: GameConfig.MONSTERS.GOBLIN.damage,
                speed: GameConfig.MONSTERS.GOBLIN.speed,
                exp: GameConfig.MONSTERS.GOBLIN.exp,
                gold: GameConfig.MONSTERS.GOBLIN.gold,
                resistances: {
                    // 元素抗性
                    wood: 0.1,
                    water: 0,
                    fire: 0,
                    earth: 0.2,
                    thunder: -0.2,
                    wind: 0,
                    light: -0.1,
                    dark: 0.1,
                    // 物理抗性
                    slash: 0,
                    blunt: 0,
                    pierce: 0.2,
                    magic: -0.2,
                    ranged: 0.1,
                    explosion: 0
                }
            },
            [MonsterType.SKELETON]: {
                id: 'skeleton',
                name: '骷髅',
                hp: GameConfig.MONSTERS.SKELETON.hp,
                damage: GameConfig.MONSTERS.SKELETON.damage,
                speed: GameConfig.MONSTERS.SKELETON.speed,
                exp: GameConfig.MONSTERS.SKELETON.exp,
                gold: GameConfig.MONSTERS.SKELETON.gold,
                resistances: {
                    // 元素抗性
                    wood: 0,
                    water: 0,
                    fire: 0.2,
                    earth: 0.3,   // 土系抗性
                    thunder: 0,
                    wind: 0,
                    light: -0.5,  // 圣光克制
                    dark: 0.3,    // 暗系抗性
                    // 物理抗性 - 骷髅(骨甲，抗斩击，易受打击)
                    slash: 0.4,   // 骨甲抗斩击
                    blunt: -0.3,  // 易受打击
                    pierce: 0.2,  // 抗戳击
                    magic: 0.1,
                    ranged: 0,
                    explosion: 0
                }
            },
            [MonsterType.WOLF]: {
                id: 'wolf',
                name: '狼',
                hp: GameConfig.MONSTERS.WOLF.hp,
                damage: GameConfig.MONSTERS.WOLF.damage,
                speed: GameConfig.MONSTERS.WOLF.speed,
                exp: GameConfig.MONSTERS.WOLF.exp,
                gold: GameConfig.MONSTERS.WOLF.gold,
                resistances: {
                    // 元素抗性
                    wood: 0.1,
                    water: 0.1,
                    fire: 0,
                    earth: 0,
                    thunder: -0.3, // 怕雷
                    wind: 0.2,
                    light: 0,
                    dark: 0.2,
                    // 物理抗性 - 狼(皮甲，平衡)
                    slash: 0.1,
                    blunt: 0,
                    pierce: -0.2,  // 易被穿透
                    magic: -0.1,
                    ranged: 0,
                    explosion: -0.2
                }
            }
        };

        return configs[this.monsterType];
    }

    // ==================== 状态机 ====================

    /**
     * 改变状态
     */
    private changeState(newState: MonsterState): void {
        if (this._state === newState) return;

        console.log(`${this._monsterData.name}状态: ${this._state} -> ${newState}`);
        this._state = newState;
        this._monsterData.state = newState;

        // 状态退出处理
        this.onStateExit(newState);
    }

    /**
     * 状态退出处理
     */
    private onStateExit(oldState: MonsterState): void {
        switch (oldState) {
            case MonsterState.ATTACK:
                this._target = null;
                break;
        }
    }

    // ==================== IDLE 状态 ====================

    /**
     * 更新空闲状态
     */
    private updateIdle(deltaTime: number): void {
        // 检测范围内是否有玩家
        this.findTarget();
    }

    /**
     * 查找目标 - 优先攻击城堡
     */
    private findTarget(): void {
        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        // 优先查找城堡
        const castle = this._getCastle();
        if (castle && !castle.isDestroyed()) {
            const castlePos = castle.node.position;
            const distanceToCastle = Vec3.distance(this.node.position, castlePos);

            // 如果城堡在检测范围内，优先攻击城堡
            if (distanceToCastle <= this._detectRange * 1.5) {
                // 获取城堡作为战斗实体
                const allEntities = combatSystem.getAllCombatEntities();
                for (const entity of allEntities) {
                    if (entity.node === castle.node) {
                        this._target = entity;
                        this.changeState(MonsterState.CHASE);
                        console.log(`${this._monsterData.name} 发现城堡，优先攻击!`);
                        return;
                    }
                }
            }
        }

        // 如果没有找到城堡或城堡太远，查找最近的敌人(玩家)
        const target = combatSystem.findNearestEnemy(
            this.node.position,
            this._detectRange,
            (entity: ICombatEntity) => combatSystem.isEnemy(this, entity)
        );

        if (target) {
            this._target = target;
            this.changeState(MonsterState.CHASE);
        }
    }

    // ==================== CHASE 状态 ====================

    /**
     * 更新追击状态
     */
    private updateChase(deltaTime: number): void {
        if (!this._target) {
            this.changeState(MonsterState.IDLE);
            return;
        }

        const targetPos = this._target.node.position;
        const currentPos = this.node.position;
        const distance = Vec3.distance(currentPos, targetPos);

        // 检查目标是否仍在范围内
        if (distance > this._detectRange * 1.5) {
            this._target = null;
            this.changeState(MonsterState.IDLE);
            return;
        }

        // 检查是否进入攻击范围
        if (distance <= this._attackRange) {
            this.changeState(MonsterState.ATTACK);
            return;
        }

        // 移动向目标
        this.moveTowards(targetPos, deltaTime);
    }

    /**
     * 向目标移动
     */
    private moveTowards(targetPos: Vec3, deltaTime: number): void {
        const direction = new Vec3();
        Vec3.subtract(direction, targetPos, this.node.position);
        direction.normalize();

        const moveDistance = this._monsterData.speed * deltaTime;
        const newPos = new Vec3();
        Vec3.scaleAndAdd(newPos, this.node.position, direction, moveDistance);

        this.node.setPosition(newPos);
        this._monsterData.position = newPos;
    }

    // ==================== ATTACK 状态 ====================

    /**
     * 更新攻击状态
     */
    private updateAttack(deltaTime: number): void {
        if (!this._target) {
            this.changeState(MonsterState.IDLE);
            return;
        }

        const targetPos = this._target.node.position;
        const distance = Vec3.distance(this.node.position, targetPos);

        // 如果目标离开攻击范围，追击
        if (distance > this._attackRange * 1.2) {
            this.changeState(MonsterState.CHASE);
            return;
        }

        // 更新攻击计时器
        this._attackTimer += deltaTime;

        if (this._attackTimer >= this._attackCooldown) {
            this.performAttack();
            this._attackTimer = 0;
        }
    }

    /**
     * 执行攻击
     */
    private performAttack(): void {
        if (!this._target) return;

        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        // 怪物攻击使用简单伤害计算，无武器
        combatSystem.performAttack(
            this,
            null, // 怪物无武器
            this._target,
            DEFAULT_RESISTANCES, // 玩家抗性由玩家自己处理
            0, // 无暴击
            1
        );

        console.log(`${this._monsterData.name}攻击目标,造成${this._monsterData.damage}点伤害`);
    }

    // ==================== 死亡处理 ====================

    /**
     * 死亡
     */
    private die(): void {
        if (this._isDead) return;
        this._isDead = true;

        console.log(`${this._monsterData.name}死亡`);

        // 给予玩家经验和金币
        this.giveRewards();

        // 生成物品掉落
        this.spawnLoot();

        // 从战斗系统移除
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.unregisterCombatEntity(this);
        }

        // 延迟销毁节点 (等待特效等)
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 0.5);
    }

    /**
     * 给予奖励
     */
    private giveRewards(): void {
        // 查找玩家
        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        const allEntities = combatSystem.getAllCombatEntities();
        for (const entity of allEntities) {
            const data = entity.getCharacterData();
            if ('level' in data && 'exp' in data) {
                // 这是一个玩家
                const playerNode = entity.node;
                if (playerNode && playerNode.getComponent('Player')) {
                    const player = playerNode.getComponent('Player') as any;
                    player.addExp(this._monsterData.exp);
                    player.addGold(this._monsterData.gold);
                    console.log(`获得${this._monsterData.exp}经验和${this._monsterData.gold}金币`);
                }
                break;
            }
        }
    }

    /**
     * 生成物品掉落
     */
    private spawnLoot(): void {
        const lootSystem = this._getLootSystem();
        if (!lootSystem) {
            console.warn('Monster: LootSystem未找到，无法生成掉落');
            return;
        }

        // 计算掉落稀有度加成
        // 精英怪+1稀有度加成，第2天+0.5，第3天+1
        const timeSystem = (this.node.scene.getComponent('TimeSystem') as any)?.instance;
        const currentDay = timeSystem?.getCurrentDay() || 1;
        const rarityBonus = (this.isElite ? 1 : 0) + (currentDay - 1) * 0.5;

        // 精英怪和Boss有更高掉落率
        lootSystem.spawnLoot(
            this.node.position,
            currentDay,
            rarityBonus,
            this.isElite
        );

        // Boss死亡时生成词条
        if (this._isBoss || this.monsterType === MonsterType.SKELETON) {
            this.spawnBossModifiers();
        }
    }

    /**
     * 生成Boss掉落词条
     * Boss死亡时掉落可镶嵌的词条
     */
    private spawnBossModifiers(): void {
        const modifierSystem = this._getModifierSystem();
        if (!modifierSystem) {
            console.warn('Monster: ModifierSystem未找到，无法生成词条');
            return;
        }

        // 根据怪物类型和是否精英确定稀有度
        let bossRarity: Rarity;
        if (this.isElite) {
            // 精英Boss: 50%史诗, 40%传说, 10%神话
            const rand = Math.random();
            if (rand < 0.1) bossRarity = Rarity.MYTHICAL;
            else if (rand < 0.5) bossRarity = Rarity.LEGENDARY;
            else bossRarity = Rarity.EPIC;
        } else {
            // 普通Boss: 60%稀有, 30%史诗, 10%传说
            const rand = Math.random();
            if (rand < 0.1) bossRarity = Rarity.LEGENDARY;
            else if (rand < 0.4) bossRarity = Rarity.EPIC;
            else bossRarity = Rarity.RARE;
        }

        // 生成词条
        const modifiers = modifierSystem.generateBossModifiers(bossRarity);

        // 查找玩家并添加词条
        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        const allEntities = combatSystem.getAllCombatEntities();
        for (const entity of allEntities) {
            const data = entity.getCharacterData();
            if ('level' in data && 'exp' in data) {
                // 这是一个玩家
                const playerNode = entity.node;
                if (playerNode) {
                    const player = playerNode.getComponent('Player') as any;
                    if (player && player.addModifiers) {
                        // 添加所有生成的词条给玩家
                        for (const modifier of modifiers) {
                            player.addModifiers([modifier]);
                            console.log(`[Boss掉落] 玩家获得词条: ${modifier.name} (${Rarity[modifier.rarity]}) - ${modifier.description}`);
                        }
                    }
                }
                break;
            }
        }

        console.log(`${this._monsterData.name} 掉落了 ${modifiers.length} 个${Rarity[bossRarity]}词条!`);
    }

    // ==================== Boss技能AI ====================

    /**
     * 初始化Boss技能
     */
    private initBossSkills(): void {
        // 检查是否为Boss (精英怪有概率成为小Boss)
        this._isBoss = this.isElite && Math.random() < 0.3; // 30%精英怪成为小Boss

        if (!this._isBoss) return;

        // 生成Boss技能配置
        this._bossSkills = this.generateBossSkills();

        console.log(`${this._monsterData.name} 是Boss，拥有 ${this._bossSkills.length} 个技能`);
    }

    /**
     * 生成Boss技能配置
     */
    private generateBossSkills(): IBossSkill[] {
        const skills: IBossSkill[] = [];

        // 根据怪物类型生成不同技能
        switch (this.monsterType) {
            case MonsterType.SKELETON:
                skills.push({
                    id: 'skeleton_summon',
                    name: '召唤骷髅',
                    skillType: BossSkillType.SUMMON,
                    cooldown: 15,
                    damage: 0,
                    range: 150,
                    warningTime: 2,
                    element: undefined
                });
                break;

            case MonsterType.WOLF:
                skills.push({
                    id: 'wolf_charge',
                    name: '冲锋',
                    skillType: BossSkillType.CHARGE,
                    cooldown: 8,
                    damage: 30,
                    range: 200,
                    warningTime: 1,
                    element: undefined
                });
                break;

            default:
                // 通用AOE技能
                skills.push({
                    id: 'aoe_attack',
                    name: '范围攻击',
                    skillType: BossSkillType.AOE,
                    cooldown: 10,
                    damage: 25,
                    range: 100,
                    warningTime: 1.5,
                    element: undefined
                });
                break;
        }

        return skills;
    }

    /**
     * 更新Boss技能AI
     */
    private updateBossAI(deltaTime: number): void {
        if (!this._isBoss || this._isCastingSkill) return;

        // 更新技能冷却
        if (this._skillCooldownTimer > 0) {
            this._skillCooldownTimer -= deltaTime;
        }

        // 更新预警计时器
        if (this._skillWarningTimer > 0) {
            this._skillWarningTimer -= deltaTime;

            if (this._skillWarningTimer <= 0) {
                // 预警结束，释放技能
                this.executeBossSkill();
            }
            return;
        }

        // 检查是否可以释放技能
        if (this._skillCooldownTimer <= 0 && this._currentSkill) {
            // 开始技能预警
            this._skillWarningTimer = this._currentSkill.warningTime;
            this.showSkillWarning(this._currentSkill);
        } else if (!this._currentSkill && this._bossSkills.length > 0) {
            // 选择新技能
            this.selectNextSkill();
        }
    }

    /**
     * 选择下一个技能
     */
    private selectNextSkill(): void {
        if (this._bossSkills.length === 0) return;

        // 随机选择一个技能
        const randomIndex = Math.floor(Math.random() * this._bossSkills.length);
        this._currentSkill = this._bossSkills[randomIndex];

        console.log(`${this._monsterData.name} 选择技能: ${this._currentSkill.name}`);
    }

    /**
     * 显示技能预警
     */
    private showSkillWarning(skill: IBossSkill): void {
        console.log(`${this._monsterData.name} 正在蓄力 ${skill.name}!`);

        // 可以在这里添加视觉预警效果
        // 例如: 怪物变色、显示范围圈等
    }

    /**
     * 执行Boss技能
     */
    private executeBossSkill(): void {
        if (!this._currentSkill) return;

        this._isCastingSkill = true;

        console.log(`${this._monsterData.name} 释放技能: ${this._currentSkill.name}`);

        const combatSystem = this._getCombatSystem();
        if (!combatSystem) {
            this._isCastingSkill = false;
            return;
        }

        // 根据技能类型执行不同逻辑
        switch (this._currentSkill.skillType) {
            case BossSkillType.AOE:
                this.executeAOESkill();
                break;

            case BossSkillType.CHARGE:
                this.executeChargeSkill();
                break;

            case BossSkillType.SUMMON:
                this.executeSummonSkill();
                break;

            case BossSkillType.PROJECTILE:
                this.executeProjectileSkill();
                break;

            default:
                console.warn(`未知Boss技能类型: ${this._currentSkill.skillType}`);
                break;
        }

        // 技能释放完成
        this._isCastingSkill = false;
        this._skillCooldownTimer = this._currentSkill.cooldown;
        this._currentSkill = null;
    }

    /**
     * 执行AOE技能
     */
    private executeAOESkill(): void {
        if (!this._currentSkill) return;

        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        // 获取范围内的所有敌人
        const allEntities = combatSystem.getAllCombatEntities();
        const caster = this as unknown as ICombatEntity;

        for (const entity of allEntities) {
            if (combatSystem.isEnemy(caster, entity)) {
                const distance = Vec3.distance(this.node.position, entity.node.position);

                if (distance <= this._currentSkill.range) {
                    // 造成伤害
                    combatSystem.performAttack(
                        caster,
                        null,
                        entity,
                        DEFAULT_RESISTANCES,
                        0,
                        this._currentSkill.damage / 50
                    );
                }
            }
        }

        console.log(`${this._monsterData.name} 的AOE攻击命中!`);
    }

    /**
     * 执行冲锋技能
     */
    private executeChargeSkill(): void {
        if (!this._currentSkill || !this._target) return;

        const direction = new Vec3();
        Vec3.subtract(direction, this._target.node.position, this.node.position);
        direction.normalize();

        // 瞬间移动一段距离
        const chargeDistance = this._currentSkill.range;
        const newPos = new Vec3();
        Vec3.scaleAndAdd(newPos, this.node.position, direction, chargeDistance);

        this.node.setPosition(newPos);

        // 对冲锋路径上的敌人造成伤害
        console.log(`${this._monsterData.name} 冲锋!`);
    }

    /**
     * 执行召唤技能
     */
    private executeSummonSkill(): void {
        // TODO: 实现召唤小怪逻辑
        console.log(`${this._monsterData.name} 召唤援军!`);

        // 这里应该创建新的怪物节点
        // 可以通过 MonsterManager 来实现
    }

    /**
     * 执行投射物技能
     */
    private executeProjectileSkill(): void {
        if (!this._target) return;

        // TODO: 实现投射物逻辑
        console.log(`${this._monsterData.name} 发射投射物!`);

        // 这里应该创建一个投射物节点
        // 投射物飞行到目标位置后造成伤害
    }

    // ==================== 视觉效果 ====================

    /**
     * 更新怪物颜色
     */
    private updateMonsterColor(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        const colors: { [key in MonsterType]: Color } = {
            [MonsterType.SLIME]: new Color().fromHEX('#4CAF50'),     // 绿色
            [MonsterType.GOBLIN]: new Color().fromHEX('#8BC34A'),    // 浅绿
            [MonsterType.SKELETON]: new Color().fromHEX('#E0E0E0'),  // 灰白
            [MonsterType.WOLF]: new Color().fromHEX('#795548')       // 棕色
        };

        if (this.isElite) {
            // 精英怪使用金色
            sprite.color = new Color().fromHEX('#FFD700');
        } else {
            sprite.color = colors[this.monsterType];
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 设置怪物类型 (动态创建时使用)
     */
    public setMonsterType(type: MonsterType): void {
        this.monsterType = type;
        this._monsterData = this.createMonsterData();
        this.updateMonsterColor();
    }

    /**
     * 设置为精英怪
     */
    public setElite(elite: boolean): void {
        this.isElite = elite;
        this._monsterData = this.createMonsterData();
        this.updateMonsterColor();
    }

    /**
     * 获取怪物数据
     */
    public getMonsterData(): IMonster {
        return this._monsterData;
    }

    /**
     * 获取抗性
     */
    public getResistances(): IResistances {
        return this._monsterData.resistances;
    }
}

// Ensure class registration - Updated 2025-02-25 10:00
console.log('[Monster] Class loaded and registered');
