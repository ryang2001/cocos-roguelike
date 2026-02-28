/**
 * 游戏类型定义
 * 包含所有游戏对象的接口和枚举类型
 */

import { Vec3 } from 'cc';

// ==================== 基础游戏对象接口 ====================

/**
 * 游戏对象基础接口
 */
export interface IGameObject {
    id: string;
    name: string;
}

/**
 * 角色接口
 */
export interface ICharacter extends IGameObject {
    hp: number;
    maxHp: number;
    speed: number;
    position: Vec3;
}

// ==================== 武器相关 ====================

/**
 * 元素类型枚举 (8种完整元素 - 数值枚举用于 Cocos Creator)
 */
export enum ElementType {
    NONE = 0,
    WOOD = 1,      // 木
    WATER = 2,     // 水
    FIRE = 3,      // 火
    EARTH = 4,     // 土
    THUNDER = 5,   // 雷
    WIND = 6,      // 风
    LIGHT = 7,     // 光
    DARK = 8       // 影
}

/**
 * 元素属性配置
 */
export interface IElement {
    id: string;
    name: string;
    color: string;
}

/**
 * 武器类型枚举 (数值枚举用于 Cocos Creator)
 */
export enum WeaponType {
    SWORD = 0,   // 近战高伤 - 斩击
    SPEAR = 1,   // 远程穿透 - 刺击
    CANNON = 2,  // AOE - 爆炸
    STAFF = 3,   // 法杖 - 魔法
    BOW = 4,     // 弓箭 - 射击
    DAGGER = 5   // 匕首 - 打击
}

/**
 * 稀有度枚举 (6种完整稀有度 - 数值枚举用于 Cocos Creator)
 */
export enum Rarity {
    COMMON = 0,      // 普通 - 50% 掉率 - 白色
    GOOD = 1,        // 优秀 - 30% 掉率 - 绿色
    RARE = 2,        // 稀有 - 15% 掉率 - 蓝色
    EPIC = 3,        // 史诗 - 4% 掉率 - 紫色
    LEGENDARY = 4,   // 传说 - 0.9% 掉率 - 橙色
    MYTHICAL = 5     // 神话 - 0.1% 掉率 - 红色
}

/**
 * 稀有度配置
 */
export interface IRarity {
    id: string;
    name: string;
    color: string;
    dropRate: number;
}

/**
 * 武器接口
 */
export interface IWeapon extends IGameObject {
    type: WeaponType;
    damage: number;
    attackSpeed: number;
    range: number;
    element?: ElementType;
    rarity: Rarity;
    level: number;
}

// ==================== 怪物相关 ====================

/**
 * 怪物类型枚举 (数值枚举，用于 Cocos Creator @property)
 */
export enum MonsterType {
    SLIME = 0,
    GOBLIN = 1,
    SKELETON = 2,
    WOLF = 3
}

/**
 * 怪物状态枚举 (数值枚举)
 */
export enum MonsterState {
    IDLE = 0,
    CHASE = 1,
    ATTACK = 2,
    DEAD = 3
}

/**
 * 怪物配置
 */
export interface IMonsterConfig {
    id: string;
    name: string;
    hp: number;
    damage: number;
    speed: number;
    exp: number;
    gold: number;
    resistances: IResistances;
}

/**
 * 怪物接口
 */
export interface IMonster extends ICharacter {
    monsterType: MonsterType;
    damage: number;
    exp: number;
    gold: number;
    resistances: IResistances;
    state: MonsterState;
    target: ICharacter | null;
}

// ==================== 元素抗性 ====================

/**
 * 物理攻击类型枚举
 */
export enum WeaponAttackType {
    SLASH = 'slash',      // 斩击
    BLUNT = 'blunt',      // 打击
    PIERCE = 'pierce',    // 戳击
    MAGIC = 'magic',      // 魔法
    RANGED = 'ranged',    // 射击
    EXPLOSION = 'explosion'  // 爆炸
}

/**
 * 元素抗性接口 (8种元素) + 物理抗性
 * 值范围: -1 到 1
 * -1 = 易伤 (受到200%伤害)
 * 0 = 无抗性
 * 1 = 免疫 (受到0%伤害)
 */
export interface IResistances {
    // 元素抗性
    wood: number;
    water: number;
    fire: number;
    earth: number;
    thunder: number;
    wind: number;
    light: number;
    dark: number;

    // 物理攻击类型抗性
    slash: number;       // 斩击抗性
    blunt: number;       // 打击抗性
    pierce: number;      // 戳击抗性
    magic: number;       // 魔法抗性
    ranged: number;      // 射击抗性
    explosion: number;   // 爆炸抗性
}

/**
 * 默认抗性 (无抗性)
 */
export const DEFAULT_RESISTANCES: IResistances = {
    // 元素抗性
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0,
    thunder: 0,
    wind: 0,
    light: 0,
    dark: 0,
    // 物理抗性
    slash: 0,
    blunt: 0,
    pierce: 0,
    magic: 0,
    ranged: 0,
    explosion: 0
};

// ==================== 玩家相关 ====================

/**
 * 装备接口 (兼容旧代码)
 */
export interface IEquipment extends IGameObject {
    type: EquipmentType;
    rarity: Rarity;
    level: number;
    stats: IEquipmentStats;
}

/**
 * 装备类型 (兼容旧代码)
 */
export enum EquipmentType {
    HEAD = 0,      // 头盔
    BODY = 1,      // 胸甲
    LEGS = 2,      // 护腿
    RING = 3,      // 戒指
    NECKLACE = 4   // 项链
}

/**
 * 装备属性
 */
export interface IEquipmentStats {
    hp?: number;
    damage?: number;
    defense?: number;
    critRate?: number;
    critDamage?: number;
    moveSpeed?: number;
}

/**
 * 玩家接口
 */
export interface IPlayer extends ICharacter {
    level: number;
    exp: number;
    gold: number;
    weapons: IWeapon[];
    equipment: IEquipment[];
    critRate: number;
    critDamage: number;
    defense: number;
}

// ==================== 时间系统 ====================

/**
 * 时间阶段枚举
 */
export enum TimePhase {
    DAWN = 'dawn',     // 黎明 (0-10%)
    DAY = 'day',       // 白天 (10-70%)
    DUSK = 'dusk',     // 黄昏 (70-80%)
    NIGHT = 'night'    // 夜晚 (80-100%)
}

/**
 * 时间阶段配置
 */
export interface ITimePhase {
    name: string;
    start: number;  // 0-1 之间的值
    end: number;    // 0-1 之间的值
}

// ==================== 波次系统 ====================

/**
 * 波次配置接口
 */
export interface IWaveConfig {
    monsters: { [key: string]: number };  // 怪物类型和数量
    elites: number;                       // 精英怪数量
    boss: string | null;                  // Boss 类型
}

/**
 * 游戏状态接口
 */
export interface IGameState {
    isPaused: boolean;
    gameTime: number;    // 毫秒
    currentDay: number;
    timePhase: TimePhase;
    playerData: IPlayer;
}

// ==================== 伤害计算相关 ====================

/**
 * 伤害结果接口
 */
export interface IDamageResult {
    damage: number;
    isCrit: boolean;
    element: ElementType | null;
    targetHp: number;
    isLethal: boolean;
}

/**
 * 攻击事件接口
 */
export interface IAttackEvent {
    attacker: ICharacter;
    target: ICharacter;
    weapon: IWeapon | null;
    damageResult: IDamageResult;
}

// ==================== 掉落系统 ====================

/**
 * 掉落物品接口
 */
export interface IDropItem {
    itemType: DropItemType;
    rarity: Rarity;
    amount: number;
}

/**
 * 掉落类型
 */
export enum DropItemType {
    GOLD = 'gold',
    EXP = 'exp',
    WEAPON = 'weapon',
    EQUIPMENT = 'equipment',
    ITEM = 'item'
}

/**
 * 掉落配置
 */
export interface IDropConfig {
    gold: { min: number; max: number };
    exp: { min: number; max: number };
    items: IDropItem[];
}

// ==================== 物品系统 ====================

/**
 * 物品类型枚举
 */
export enum ItemType {
    CONSUMABLE = 0,    // 消耗品
    WEAPON = 1,        // 武器
    EQUIPMENT = 2,     // 装备
    MATERIAL = 3,      // 材料
    QUEST = 4,         // 任务物品
    SPECIAL = 5        // 特殊物品
}

/**
 * 装备槽位枚举
 */
export enum EquipmentSlot {
    MAINHAND = 'mainhand',  // 主手
    OFFHAND = 'offhand',    // 副手
    HELMET = 'helmet',      // 头盔
    CHEST = 'chest',        // 胸甲
    GLOVES = 'gloves',      // 手套
    BOOTS = 'boots'         // 鞋子
}

/**
 * 物品接口 (基础)
 */
export interface IItem {
    id: string;
    name: string;
    description: string;
    itemType: ItemType;
    rarity: Rarity;
    level: number;
    icon: string;
    stackable: boolean;
    maxStack: number;
    sellPrice: number;
    buyPrice: number;
}

/**
 * 装备接口 (扩展IItem)
 */
export interface IEquipmentItem extends IItem {
    itemType: ItemType.EQUIPMENT;
    equipmentSlot: EquipmentSlot;
    stats: IEquipmentStats;
    setBonus?: string;  // 套装奖励ID (可选)
}

/**
 * 武器接口 (扩展IItem)
 */
export interface IWeaponItem extends IItem {
    itemType: ItemType.WEAPON;
    weaponType: WeaponType;
    damage: number;
    attackSpeed: number;
    range: number;
    element?: ElementType;
}

/**
 * 消耗品接口
 */
export interface IConsumableItem extends IItem {
    itemType: ItemType.CONSUMABLE;
    effect: ConsumableEffect;
    cooldown: number;
    duration: number;
}

/**
 * 消耗品效果类型
 */
export enum ConsumableEffect {
    HEAL = 'heal',           // 治疗
    MANA = 'mana',           // 恢复法力
    BUFF = 'buff',           // 增益
    TELEPORT = 'teleport',   // 传送
    RESURRECT = 'resurrect'  // 复活
}

/**
 * 物品堆栈数据
 */
export interface IItemStack {
    item: IItem;
    count: number;
}

/**
 * 背包数据
 */
export interface IInventoryData {
    backpack: (IItemStack | null)[];  // 20格背包
    equipment: { [slot in EquipmentSlot]: IEquipmentItem | null };
    gold: number;
}

// ==================== 技能系统 ====================

/**
 * 技能类型枚举
 */
export enum SkillType {
    FIREBALL = 'fireball',
    HEAL = 'heal',
    SHIELD = 'shield',
    WHIRLWIND = 'whirlwind',
    TELEPORT = 'teleport',
    LIGHTNING = 'lightning'
}

/**
 * 技能接口
 */
export interface ISkill {
    id: string;
    name: string;
    description: string;
    icon: string;
    cooldown: number;
    damage: number;
    range: number;
    manaCost: number;
    skillType: SkillType;
    element?: ElementType;
    level: number;
    maxLevel: number;
}

// ==================== Buff/Debuff系统 ====================

/**
 * Buff类型枚举
 */
export enum BuffType {
    POISON = 'poison',      // 中毒
    BURN = 'burn',          // 燃烧
    SLOW = 'slow',          // 减速
    STUN = 'stun',          // 眩晕
    SHIELD = 'shield',      // 护盾
    STRENGTH = 'strength',  // 力量提升
    REGENERATION = 'regeneration',  // 再生
    WEAKNESS = 'weakness'   // 虚弱
}

/**
 * Buff接口
 */
export interface IBuff {
    id: string;
    name: string;
    type: BuffType;
    value: number;
    duration: number;
    remainingTime: number;
    stackCount: number;
    maxStack: number;
    icon: string;
}

// ==================== Boss技能 ====================

/**
 * Boss技能类型枚举
 */
export enum BossSkillType {
    AOE = 'aoe',              // 范围攻击
    PROJECTILE = 'projectile',// 投射物
    SUMMON = 'summon',        // 召唤
    CHARGE = 'charge',        // 冲锋
    TELEPORT = 'teleport'     // 传送
}

/**
 * Boss技能接口
 */
export interface IBossSkill {
    id: string;
    name: string;
    skillType: BossSkillType;
    cooldown: number;
    damage: number;
    range: number;
    warningTime: number;
    element?: ElementType;
}

// ==================== 成就系统 ====================

/**
 * 成就接口
 */
export interface IAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (stats: IGameStats) => boolean;
    reward: IAchievementReward;
    isHidden: boolean;
}

/**
 * 成就奖励接口
 */
export interface IAchievementReward {
    gold?: number;
    exp?: number;
    items?: IItem[];
    unlockItem?: string;  // 解锁物品ID
}

/**
 * 游戏统计接口 (用于成就条件)
 */
export interface IGameStats {
    totalKills: number;
    totalDamage: number;
    totalGold: number;
    totalPlayTime: number;
    deaths: number;
    bossesKilled: number;
    itemsCollected: number;
    itemsCrafted: number;
}

// ==================== 炮台相关 ====================

/**
 * 炮台数据接口
 */
export interface ITowerData {
    type: TowerType;
    level: number;
    damage: number;
    attackSpeed: number;
    range: number;
    element?: ElementType;
}

/**
 * 炮台类型 (数值枚举，用于 Cocos Creator @property)
 */
export enum TowerType {
    BASIC = 0,      // 基础炮台
    FIRE = 1,       // 火焰炮台
    ICE = 2,        // 冰霜炮台
    THUNDER = 3     // 雷电炮台
}

// ==================== 城堡相关 ====================

/**
 * 城堡状态接口
 */
export interface ICastleState {
    hp: number;
    maxHp: number;
    isDestroyed: boolean;
}

// ==================== 辅助函数 ====================

/**
 * 创建默认角色
 */
export function createDefaultCharacter(id: string, name: string): ICharacter {
    return {
        id,
        name,
        hp: 100,
        maxHp: 100,
        speed: 150,
        position: new Vec3(0, 0, 0)
    };
}

/**
 * 创建默认玩家
 */
export function createDefaultPlayer(): IPlayer {
    const base = createDefaultCharacter('player', 'Player');
    return {
        ...base,
        level: 1,
        exp: 0,
        gold: 0,
        weapons: [],
        equipment: [],
        critRate: 0.05,
        critDamage: 1.5,
        defense: 0
    };
}

/**
 * 获取稀有度配置
 */
export function getRarityConfig(rarity: Rarity): IRarity {
    const configs: { [key: number]: IRarity } = {
        [Rarity.COMMON]: { id: 'common', name: '普通', color: '#ffffff', dropRate: 0.50 },
        [Rarity.GOOD]: { id: 'good', name: '优秀', color: '#00ff00', dropRate: 0.30 },
        [Rarity.RARE]: { id: 'rare', name: '稀有', color: '#0070dd', dropRate: 0.15 },
        [Rarity.EPIC]: { id: 'epic', name: '史诗', color: '#a335ee', dropRate: 0.04 },
        [Rarity.LEGENDARY]: { id: 'legendary', name: '传说', color: '#ff8000', dropRate: 0.009 },
        [Rarity.MYTHICAL]: { id: 'mythical', name: '神话', color: '#ff0000', dropRate: 0.001 }
    };
    return configs[rarity] || configs[Rarity.COMMON];
}

/**
 * 获取元素配置
 */
export function getElementConfig(element: ElementType): IElement {
    const configs: { [key: number]: IElement } = {
        [ElementType.NONE]: { id: 'none', name: '无', color: '#cccccc' },
        [ElementType.WOOD]: { id: 'wood', name: '木', color: '#228b22' },
        [ElementType.WATER]: { id: 'water', name: '水', color: '#00bfff' },
        [ElementType.FIRE]: { id: 'fire', name: '火', color: '#ff4500' },
        [ElementType.EARTH]: { id: 'earth', name: '土', color: '#8b4513' },
        [ElementType.THUNDER]: { id: 'thunder', name: '雷', color: '#ffd700' },
        [ElementType.WIND]: { id: 'wind', name: '风', color: '#87ceeb' },
        [ElementType.LIGHT]: { id: 'light', name: '光', color: '#ffffe0' },
        [ElementType.DARK]: { id: 'dark', name: '影', color: '#4b0082' }
    };
    return configs[element] || configs[ElementType.NONE];
}

/**
 * 元素克制表 (8元素完整版)
 * 返回克制倍率 (0.5 = 被克制, 1.0 = 正常, 2.0 = 克制)
 *
 * 克制关系:
 * 木克土, 土克水, 水克火, 火克金(雷), 雷克木
 * 风克制火, 火克制风
 * 光克制影, 影克制光
 */
export function getElementAdvantage(attacker: ElementType, defender: ElementType): number {
    // 数值映射表
    const advantages: { [key: number]: { [key: number]: number } } = {
        [ElementType.WOOD]: {
            [ElementType.EARTH]: 2.0,   // 木克土
            [ElementType.THUNDER]: 0.5, // 木被雷克
            [ElementType.WATER]: 0.5    // 木被水克(吸水)
        },
        [ElementType.WATER]: {
            [ElementType.FIRE]: 2.0,    // 水克火
            [ElementType.EARTH]: 0.5,   // 水被土克
            [ElementType.WOOD]: 2.0     // 水滋养木
        },
        [ElementType.FIRE]: {
            [ElementType.WOOD]: 2.0,    // 火克木
            [ElementType.WATER]: 0.5,   // 火被水克
            [ElementType.WIND]: 1.5,    // 火被风助燃
            [ElementType.THUNDER]: 0.5  // 火被雷克
        },
        [ElementType.EARTH]: {
            [ElementType.WATER]: 2.0,   // 土克水
            [ElementType.WOOD]: 0.5,    // 土被木克
            [ElementType.THUNDER]: 2.0  // 土吸收雷
        },
        [ElementType.THUNDER]: {
            [ElementType.WOOD]: 2.0,    // 雷克木
            [ElementType.EARTH]: 0.5,   // 雷被土吸收
            [ElementType.WATER]: 1.5,   // 雷导电水
            [ElementType.FIRE]: 2.0     // 雷克火
        },
        [ElementType.WIND]: {
            [ElementType.FIRE]: 1.5,    // 风助火势
            [ElementType.EARTH]: 0.5,   // 风被土阻挡
            [ElementType.THUNDER]: 0.5  // 风被雷克制
        },
        [ElementType.LIGHT]: {
            [ElementType.DARK]: 2.0,    // 光克影
            [ElementType.FIRE]: 1.2     // 光与火相近
        },
        [ElementType.DARK]: {
            [ElementType.LIGHT]: 2.0,   // 影克光
            [ElementType.WOOD]: 1.2     // 影与木相近
        }
    };

    if (attacker === ElementType.NONE || defender === ElementType.NONE) {
        return 1.0;
    }

    if (advantages[attacker] && advantages[attacker][defender] !== undefined) {
        return advantages[attacker][defender];
    }
    return 1.0; // 无克制关系
}

// ==================== 词条系统 ====================

/**
 * 词条类型枚举
 */
export enum ModifierType {
    // 基础属性类
    ATTACK_PERCENT = 'attack_percent',
    DEFENSE_PERCENT = 'defense_percent',
    HP_PERCENT = 'hp_percent',
    MOVE_SPEED_PERCENT = 'move_speed_percent',

    // 战斗属性类
    CRIT_RATE = 'crit_rate',
    CRIT_DAMAGE = 'crit_damage',
    ATTACK_SPEED = 'attack_speed',
    LIFE_STEAL = 'life_steal',
    DAMAGE_REFLECT = 'damage_reflect',

    // 元素属性类
    ELEMENT_ATTACK_WOOD = 'element_attack_wood',
    ELEMENT_ATTACK_WATER = 'element_attack_water',
    ELEMENT_ATTACK_FIRE = 'element_attack_fire',
    ELEMENT_ATTACK_EARTH = 'element_attack_earth',
    ELEMENT_ATTACK_THUNDER = 'element_attack_thunder',
    ELEMENT_ATTACK_WIND = 'element_attack_wind',
    ELEMENT_ATTACK_LIGHT = 'element_attack_light',
    ELEMENT_ATTACK_DARK = 'element_attack_dark',

    ELEMENT_RESIST_WOOD = 'element_resist_wood',
    ELEMENT_RESIST_WATER = 'element_resist_water',
    ELEMENT_RESIST_FIRE = 'element_resist_fire',
    ELEMENT_RESIST_EARTH = 'element_resist_earth',
    ELEMENT_RESIST_THUNDER = 'element_resist_thunder',
    ELEMENT_RESIST_WIND = 'element_resist_wind',
    ELEMENT_RESIST_LIGHT = 'element_resist_light',
    ELEMENT_RESIST_DARK = 'element_resist_dark',

    ALL_ELEMENT_ATTACK = 'all_element_attack',
    ALL_ELEMENT_RESIST = 'all_element_resist',

    // 武器类型类
    WEAPON_DAMAGE_SLASH = 'weapon_damage_slash',
    WEAPON_DAMAGE_BLUNT = 'weapon_damage_blunt',
    WEAPON_DAMAGE_PIERCE = 'weapon_damage_pierce',
    WEAPON_DAMAGE_MAGIC = 'weapon_damage_magic',
    WEAPON_DAMAGE_RANGED = 'weapon_damage_ranged',
    WEAPON_DAMAGE_EXPLOSION = 'weapon_damage_explosion',

    ALL_WEAPON_DAMAGE = 'all_weapon_damage',
    ATTACK_RANGE = 'attack_range',

    // 特殊效果类
    KNOCKBACK = 'knockback',
    STUN_CHANCE = 'stun_chance',
    BLEED_DAMAGE = 'bleed_damage',
    BURN_DAMAGE = 'burn_damage',
    POISON_DAMAGE = 'poison_damage',
    FREEZE_CHANCE = 'freeze_chance',

    // 资源类
    GOLD_DROP = 'gold_drop',
    EXP_GAIN = 'exp_gain',
    DROP_RATE = 'drop_rate',
    BACKPACK_CAPACITY = 'backpack_capacity'
}

/**
 * 词条数值类型
 */
export type ModifierValueType = 'flat' | 'percent';

/**
 * 词条来源
 */
export type ModifierSource = 'equipment' | 'buff' | 'skill' | 'terrain' | 'achievement';

/**
 * 词条数据接口
 */
export interface IModifier {
    id: string;
    type: ModifierType;
    value: number;
    valueType: ModifierValueType;
    rarity: Rarity;
    source: ModifierSource;
    name: string;
    description: string;
    duration?: number;      // 持续时间(秒)，undefined表示永久
    remainingTime?: number; // 剩余时间
}

/**
 * 词条配置
 */
export interface IModifierConfig {
    type: ModifierType;
    minValue: number;
    maxValue: number;
    valueType: ModifierValueType;
    availableRarities: Rarity[];
    weight: number;  // 生成权重
}

/**
 * 词条生成器配置
 */
export interface IModifierGeneratorConfig {
    baseModifiers: IModifierConfig[];
    rarityMultipliers: { [key in Rarity]: number };
}

/**
 * 武器攻击类型映射
 */
export function getWeaponAttackType(weaponType: WeaponType): WeaponAttackType {
    const mapping: { [key in WeaponType]: WeaponAttackType } = {
        [WeaponType.SWORD]: WeaponAttackType.SLASH,
        [WeaponType.SPEAR]: WeaponAttackType.PIERCE,
        [WeaponType.CANNON]: WeaponAttackType.EXPLOSION,
        [WeaponType.STAFF]: WeaponAttackType.MAGIC,
        [WeaponType.BOW]: WeaponAttackType.RANGED,
        [WeaponType.DAGGER]: WeaponAttackType.BLUNT
    };
    return mapping[weaponType];
}

/**
 * 获取元素对应的词条类型
 */
export function getElementAttackModifierType(element: ElementType): ModifierType | null {
    const mapping: { [key in ElementType]: ModifierType | null } = {
        [ElementType.NONE]: null,
        [ElementType.WOOD]: ModifierType.ELEMENT_ATTACK_WOOD,
        [ElementType.WATER]: ModifierType.ELEMENT_ATTACK_WATER,
        [ElementType.FIRE]: ModifierType.ELEMENT_ATTACK_FIRE,
        [ElementType.EARTH]: ModifierType.ELEMENT_ATTACK_EARTH,
        [ElementType.THUNDER]: ModifierType.ELEMENT_ATTACK_THUNDER,
        [ElementType.WIND]: ModifierType.ELEMENT_ATTACK_WIND,
        [ElementType.LIGHT]: ModifierType.ELEMENT_ATTACK_LIGHT,
        [ElementType.DARK]: ModifierType.ELEMENT_ATTACK_DARK
    };
    return mapping[element];
}

/**
 * 获取武器攻击类型对应的词条类型
 */
export function getWeaponDamageModifierType(attackType: WeaponAttackType): ModifierType {
    const mapping: { [key in WeaponAttackType]: ModifierType } = {
        [WeaponAttackType.SLASH]: ModifierType.WEAPON_DAMAGE_SLASH,
        [WeaponAttackType.BLUNT]: ModifierType.WEAPON_DAMAGE_BLUNT,
        [WeaponAttackType.PIERCE]: ModifierType.WEAPON_DAMAGE_PIERCE,
        [WeaponAttackType.MAGIC]: ModifierType.WEAPON_DAMAGE_MAGIC,
        [WeaponAttackType.RANGED]: ModifierType.WEAPON_DAMAGE_RANGED,
        [WeaponAttackType.EXPLOSION]: ModifierType.WEAPON_DAMAGE_EXPLOSION
    };
    return mapping[attackType];
}
