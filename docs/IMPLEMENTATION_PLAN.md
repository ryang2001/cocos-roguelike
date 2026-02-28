# Cocos Roguelike 游戏项目完善方案

## 项目概述

**项目名称**: 继续下一关 - Roguelike塔防RPG
**引擎**: Cocos Creator 3.8.0
**目标平台**: 抖音小游戏
**游戏时长**: 30分钟一局（3天循环）

---

## 一、现有功能分析

### 1.1 已实现的系统（25个TS文件）

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| **核心** | GameManager.ts | ✅ | 游戏流程、存档管理 |
| **核心** | SceneAutoConfig.ts | ✅ | 场景自动配置 |
| **配置** | GameConfig.ts | ✅ | 游戏常量、怪物/Boss配置 |
| **类型** | Types.ts | ✅ | 接口、枚举、工具函数 |
| **实体** | Player.ts | ✅ | 移动、攻击、装备管理 |
| **实体** | Monster.ts | ✅ | AI状态机、Boss技能 |
| **实体** | Tower.ts | ⏳ | 炮台实体（基础框架） |
| **实体** | Castle.ts | ⏳ | 城堡实体（基础框架） |
| **实体** | Item.ts | ⏳ | 掉落物实体（基础框架） |
| **系统** | CombatSystem.ts | ✅ | 战斗实体管理、攻击流程 |
| **系统** | DamageSystem.ts | ✅ | 伤害计算、暴击、元素克制 |
| **系统** | MonsterManager.ts | ✅ | 怪物生成、对象池 |
| **系统** | WaveSystem.ts | ✅ | 波次管理、时间触发 |
| **系统** | TimeSystem.ts | ⏳ | 时间系统（待完善） |
| **系统** | TowerManager.ts | ⏳ | 炮台管理（基础框架） |
| **系统** | InventorySystem.ts | ✅ | 20格背包、装备槽位 |
| **系统** | LootSystem.ts | ⏳ | 掉落系统（基础框架） |
| **系统** | ShopSystem.ts | ⏳ | 商店系统（基础框架） |
| **系统** | SkillSystem.ts | ⏳ | 技能系统（基础框架） |
| **系统** | EffectSystem.ts | ⏳ | 特效系统（基础框架） |
| **系统** | ExperienceSystem.ts | ✅ | 升级、属性成长 |
| **系统** | CameraController.ts | ⏳ | 摄像机控制（基础框架） |
| **UI** | HUDController.ts | ✅ | HUD显示 |
| **UI** | MainMenuController.ts | ⏳ | 主菜单（基础框架） |
| **UI** | GameOverController.ts | ⏳ | 游戏结束（基础框架） |

### 1.2 设计文档与现有功能的差距分析

#### 🔴 高优先级 - 核心功能缺失

| 功能 | 设计文档要求 | 当前状态 | 差距说明 |
|------|-------------|----------|----------|
| **词条系统** | 完整的词条生成、镶嵌、计算 | ❌ 未实现 | 设计文档137-345行详细定义，代码中无实现 |
| **武器类型伤害** | 斩击/打击/戳击/魔法/射击/爆炸 | ⚠️ 部分 | Types.ts定义了枚举，DamageSystem未使用 |
| **物理抗性** | 斩击/打击/戳击抗性 | ⚠️ 部分 | 只有元素抗性，无物理攻击类型抗性 |
| **特殊地形** | 雪山/火山/沙漠/沼泽效果 | ❌ 未实现 | 配置中定义，无实际效果代码 |
| **地图生成** | 3000x3000大地图、事件分布 | ❌ 未实现 | 只有出生点配置 |
| **迷你地图** | 显示全局地图 | ❌ 未实现 | UI中无迷你地图 |

#### 🟡 中优先级 - 系统完善

| 功能 | 设计文档要求 | 当前状态 | 差距说明 |
|------|-------------|----------|----------|
| **炮台放置/收纳** | 可放置/收纳，自动攻击 | ⚠️ 框架 | Tower.ts和TowerManager.ts只有基础框架 |
| **城堡防守** | 怪物优先攻击城堡 | ⚠️ 框架 | Castle.ts只有基础框架 |
| **掉落系统** | 稀有度计算、装备生成 | ⚠️ 框架 | LootSystem.ts需要完善 |
| **技能系统** | 主动技能、Buff/Debuff | ⚠️ 框架 | SkillSystem.ts需要完善 |
| **商店系统** | 物品购买、出售 | ⚠️ 框架 | ShopSystem.ts需要完善 |
| **成就系统** | 成就接口已定义，无实现 | ⚠️ 部分 | Types.ts有定义，无实际系统 |

#### 🟢 低优先级 - 优化增强

| 功能 | 设计文档要求 | 当前状态 | 差距说明 |
|------|-------------|----------|----------|
| **音效系统** | 战斗音效、背景音乐 | ❌ 未实现 | 无音频相关代码 |
| **特效系统** | 视觉特效、动画 | ⚠️ 框架 | EffectSystem.ts只有基础框架 |
| **摄像机控制** | 跟随、边界限制 | ⚠️ 框架 | CameraController.ts需要完善 |
| **多语言支持** | 本地化编辑器已安装 | ⏳ 预留 | extensions/localization-editor/ |

---

## 二、功能完善方案

### 2.1 词条系统实现方案

#### 核心设计
```typescript
// 新增文件: assets/scripts/systems/ModifierSystem.ts

// 词条类型枚举
enum ModifierType {
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

    // 元素属性类
    ELEMENT_ATTACK_PREFIX = 'element_attack_',
    ELEMENT_RESIST_PREFIX = 'element_resist_',

    // 武器类型类
    WEAPON_DAMAGE_PREFIX = 'weapon_damage_',

    // 特殊效果类
    KNOCKBACK = 'knockback',
    STUN_CHANCE = 'stun_chance',
    BLEED_DAMAGE = 'bleed_damage',
    BURN_DAMAGE = 'burn_damage',
    POISON_DAMAGE = 'poison_damage',

    // 资源类
    GOLD_DROP = 'gold_drop',
    EXP_GAIN = 'exp_gain',
    DROP_RATE = 'drop_rate'
}

// 词条数据接口
interface IModifier {
    id: string;
    type: ModifierType;
    value: number;        // 数值
    valueType: 'flat' | 'percent';  // 固定值或百分比
    rarity: Rarity;       // 词条稀有度
    source: 'equipment' | 'buff' | 'skill';  // 来源
}

// 实体词条管理
class ModifierManager {
    private _modifiers: Map<string, IModifier[]> = new Map();

    // 添加词条
    addModifier(entityId: string, modifier: IModifier): void;

    // 移除词条
    removeModifier(entityId: string, modifierId: string): void;

    // 计算总加成
    calculateTotalModifier(entityId: string, type: ModifierType): number;

    // 获取所有有效词条
    getAllModifiers(entityId: string): IModifier[];
}
```

#### 实现步骤

1. **Phase 1**: 基础词条系统
   - 创建 `ModifierSystem.ts`
   - 实现词条的添加/移除/查询
   - 与DamageSystem集成计算伤害加成

2. **Phase 2**: Boss掉落词条
   - 修改Monster.ts死亡掉落逻辑
   - 根据Boss稀有度生成1-3个词条
   - 词条数值根据稀有度浮动

3. **Phase 3**: 词条镶嵌
   - 扩展InventorySystem装备槽位
   - 实现词条镶嵌UI
   - 词条可叠加逻辑

### 2.2 武器类型与物理抗性系统

#### 修改 DamageSystem.ts

```typescript
// 在Types.ts中已有定义
enum WeaponAttackType {
    SLASH = 'slash',      // 斩击
    BLUNT = 'blunt',      // 打击
    PIERCE = 'pierce',    // 戳击
    MAGIC = 'magic',      // 魔法
    RANGED = 'ranged',    // 射击
    EXPLOSION = 'explosion'  // 爆炸
}

// 扩展IResistances接口
interface IResistances {
    // 元素抗性（已有）
    wood: number;
    water: number;
    fire: number;
    earth: number;
    thunder: number;
    wind: number;
    light: number;
    dark: number;

    // 物理攻击类型抗性（新增）
    slash: number;       // 斩击抗性
    blunt: number;       // 打击抗性
    pierce: number;      // 戳击抗性
    magic: number;       // 魔法抗性
    ranged: number;      // 射击抗性
    explosion: number;   // 爆炸抗性
}

// 修改伤害计算公式
static calculateDamage(
    attacker: ICharacter,
    weapon: IWeapon | null,
    defender: ICharacter,
    resistances: IResistances,
    critRate: number = 0.05,
    critDamage: number = 1.5
): IDamageResult {
    let baseDamage = weapon ? weapon.damage : 10;

    // 1. 武器类型伤害加成
    if (weapon && weapon.attackType) {
        const weaponTypeBonus = getWeaponTypeBonus(attacker, weapon.attackType);
        baseDamage *= (1 + weaponTypeBonus);
    }

    // 2. 元素伤害加成
    let elementMultiplier = 1.0;
    if (weapon && weapon.element) {
        const resistance = resistances[weapon.element];
        elementMultiplier = 1 - resistance;
    }

    // 3. 物理攻击类型抗性
    let physicalMultiplier = 1.0;
    if (weapon && weapon.attackType) {
        const physicalResistance = resistances[weapon.attackType] || 0;
        physicalMultiplier = 1 - physicalResistance;
    }

    // 4. 暴击
    const isCrit = Math.random() < critRate;
    if (isCrit) baseDamage *= critDamage;

    // 最终伤害 = 基础 × 武器类型加成 × 元素倍率 × 物理抗性倍率
    let finalDamage = Math.floor(baseDamage * elementMultiplier * physicalMultiplier);

    return { damage: finalDamage, isCrit, element: weapon?.element || null };
}
```

#### 怪物抗性配置更新

```typescript
// Monster.ts 中更新配置
private getMonsterConfig(): IMonsterConfig {
    const configs: { [key in MonsterType]: IMonsterConfig } = {
        [MonsterType.SLIME]: {
            // ... 其他配置
            resistances: {
                // 元素抗性
                wood: 0, water: 0, fire: -0.5, earth: 0,
                thunder: 0, wind: 0, light: 0, dark: 0,
                // 物理抗性 - 史莱姆(软甲)
                slash: -0.3,   // 易受斩击
                blunt: 0.5,    // 抗打击
                pierce: 0,     // 正常
                magic: -0.3,   // 易受魔法
                ranged: 0,
                explosion: 0
            }
        },
        [MonsterType.SKELETON]: {
            // ... 骷髅(重甲)
            resistances: {
                slash: 0.4,    // 抗斩击
                blunt: -0.3,   // 易受打击
                pierce: 0.2,
                magic: 0,
                light: -0.5    // 神圣克制
            }
        }
        // ... 其他怪物
    };
}
```

### 2.3 特殊地形系统

#### 新增文件: assets/scripts/world/TerrainSystem.ts

```typescript
// 地形类型效果
interface ITerrainEffect {
    type: 'slow' | 'damage' | 'visibility' | 'poison';
    value: number;
    interval?: number;  // 持续伤害间隔
}

// 地形区域
interface ITerrainZone {
    type: TerrainType;
    bounds: Rect;       // 区域边界
    effect: ITerrainEffect;
}

class TerrainSystem extends Component {
    private _terrainZones: ITerrainZone[] = [];

    // 初始化地形
    initTerrain(worldWidth: number, worldHeight: number): void {
        // 根据设计文档生成6种地形
        // 1. 雪山 - 减速效果
        // 2. 火山 - 持续伤害
        // 3. 城堡 - 玩家基地
        // 4. 森林 - 隐蔽区域
        // 5. 沙漠 - 视野受限
        // 6. 沼泽 - 毒性区域
    }

    // 检查实体所在地形
    getTerrainAt(position: Vec3): ITerrainZone | null;

    // 应用地形效果
    applyTerrainEffect(entity: ICombatEntity, terrain: ITerrainZone): void;

    // 渲染地形视觉
    renderTerrainVisuals(): void;
}
```

#### 地形效果实现

| 地形 | 效果 | 实现方式 |
|------|------|----------|
| 雪山 | 移动速度-30% | Player.ts中检测地形，修改moveSpeed |
| 火山 | 每秒5点伤害 | TerrainSystem定时检测，调用takeDamage |
| 沼泽 | 每秒3点毒伤害 | 同上，添加中毒Buff |
| 沙漠 | 视野范围-50% | CameraController中修改缩放 |
| 森林 | 怪物仇恨范围-50% | Monster.ts中修改detectRange |

### 2.4 炮台系统完善

#### 修改 Tower.ts

```typescript
@ccclass('Tower')
export class Tower extends Component implements ICombatEntity {
    @property({ displayName: '炮台类型' })
    towerType: TowerType = TowerType.BASIC;

    @property({ displayName: '攻击范围' })
    attackRange: number = 200;

    @property({ displayName: '攻击速度' })
    attackSpeed: number = 1.0;

    @property({ displayName: '伤害' })
    damage: number = 15;

    // 炮台状态
    private _isPlaced: boolean = false;
    private _owner: ICombatEntity | null = null;
    private _attackTimer: number = 0;

    // 放置炮台
    place(position: Vec3, owner: ICombatEntity): void {
        this.node.setPosition(position);
        this._isPlaced = true;
        this._owner = owner;
        this.registerToCombatSystem();
    }

    // 收纳炮台
    store(): void {
        this._isPlaced = false;
        this.node.active = false;
        this.unregisterFromCombatSystem();
    }

    // 自动攻击逻辑
    update(deltaTime: number): void {
        if (!this._isPlaced) return;

        this._attackTimer += deltaTime;
        if (this._attackTimer >= 1.0 / this.attackSpeed) {
            this.performAutoAttack();
            this._attackTimer = 0;
        }
    }

    // 升级炮台
    upgrade(): boolean {
        // 消耗资源升级属性
        this.damage *= 1.5;
        this.attackSpeed *= 1.2;
        this.attackRange *= 1.1;
        return true;
    }
}
```

#### 修改 TowerManager.ts

```typescript
class TowerManager extends Component {
    private _placedTowers: Map<string, Tower> = new Map();
    private _storedTowers: Tower[] = [];

    // 从背包放置炮台
    placeTowerFromInventory(
        towerItem: ITowerItem,
        position: Vec3,
        owner: ICombatEntity
    ): boolean;

    // 收纳炮台到背包
    storeTower(towerId: string): boolean;

    // 获取所有已放置炮台
    getPlacedTowers(): Tower[];

    // 炮台数量限制检查
    canPlaceMoreTowers(): boolean;
}
```

### 2.5 城堡防守系统完善

#### 修改 Castle.ts

```typescript
@ccclass('Castle')
export class Castle extends Component implements ICombatEntity {
    @property({ displayName: '城堡血量' })
    maxHp: number = 5000;

    @property({ displayName: '自动回血速度' })
    regenRate: number = 5;  // 每秒回血

    private _currentHp: number;
    private _isDestroyed: boolean = false;

    // 城堡作为优先攻击目标
    getAttackPriority(): number {
        return 100;  // 最高优先级
    }

    // 受到伤害
    takeDamage(damage: number): void {
        this._currentHp -= damage;

        // 通知所有怪物攻击城堡
        this.notifyMonstersToAttack();

        if (this._currentHp <= 0) {
            this._isDestroyed = true;
            GameManager.instance.gameOver(false);
        }
    }

    // 更新回血
    update(deltaTime: number): void {
        if (this._isDestroyed) return;

        // 白天回血，夜晚不回血
        const timeSystem = TimeSystem.instance;
        if (timeSystem && timeSystem.getCurrentPhase() !== TimePhase.NIGHT) {
            this._currentHp = Math.min(
                this._currentHp + this.regenRate * deltaTime,
                this.maxHp
            );
        }
    }
}
```

#### 修改 Monster.ts AI

```typescript
// 在Monster.ts中修改目标选择
private findTarget(): void {
    const combatSystem = CombatSystem.instance;
    if (!combatSystem) return;

    // 优先查找城堡
    const castle = this.findCastleInRange();
    if (castle) {
        this._target = castle;
        this.changeState(MonsterState.CHASE);
        return;
    }

    // 其次查找玩家
    const player = combatSystem.findNearestEnemy(
        this.node.position,
        this._detectRange,
        (entity) => CombatSystem.isEnemy(this, entity)
    );

    if (player) {
        this._target = player;
        this.changeState(MonsterState.CHASE);
    }
}
```

---

## 三、项目结构优化方案

### 3.1 当前结构问题

```
assets/scripts/
├── core/        # 核心管理器
├── entities/    # 游戏实体
├── systems/     # 游戏系统
├── ui/          # UI控制器
├── config/      # 配置数据
├── types/       # 类型定义
```

**存在的问题**:
1. systems/ 目录过于庞大（15个文件）
2. 缺乏清晰的层次划分
3. 世界相关代码散落在各处
4. 缺少工具类目录

### 3.2 优化后的项目结构

```
assets/scripts/
├── core/                    # 核心层
│   ├── GameManager.ts       # 游戏主管理器
│   ├── SceneAutoConfig.ts   # 场景自动配置
│   └── EventBus.ts          # 全局事件总线 [新增]
│
├── gameplay/                # 游戏玩法层 [新增目录]
│   ├── entities/            # 游戏实体
│   │   ├── Player.ts
│   │   ├── Monster.ts
│   │   ├── Castle.ts
│   │   ├── Tower.ts
│   │   └── Item.ts
│   │
│   ├── combat/              # 战斗系统 [新增目录]
│   │   ├── CombatSystem.ts
│   │   ├── DamageSystem.ts
│   │   ├── DamageCalculator.ts    # [新增] 伤害计算抽取
│   │   └── ModifierSystem.ts      # [新增] 词条系统
│   │
│   ├── world/               # 世界系统 [新增目录]
│   │   ├── TerrainSystem.ts       # [新增]
│   │   ├── MapGenerator.ts        # [新增]
│   │   ├── EventSystem.ts         # [新增]
│   │   └── CameraController.ts
│   │
│   ├── progression/         # 进度系统 [新增目录]
│   │   ├── TimeSystem.ts
│   │   ├── WaveSystem.ts
│   │   ├── ExperienceSystem.ts
│   │   └── AchievementSystem.ts   # [新增]
│   │
│   └── economy/             # 经济系统 [新增目录]
│       ├── InventorySystem.ts
│       ├── LootSystem.ts
│       ├── ShopSystem.ts
│       └── CurrencySystem.ts      # [新增] 货币管理
│
├── infrastructure/          # 基础设施层 [新增目录]
│   ├── pool/                # 对象池
│   │   ├── ObjectPool.ts
│   │   ├── MonsterPool.ts
│   │   └── EffectPool.ts
│   │
│   ├── effect/              # 特效
│   │   ├── EffectSystem.ts
│   │   ├── VisualEffect.ts
│   │   └── SoundEffect.ts
│   │
│   └── save/                # 存档
│       ├── SaveSystem.ts    # [新增]
│       └── SaveData.ts      # [新增]
│
├── ui/                      # UI层
│   ├── hud/                 # HUD组件 [新增目录]
│   │   ├── HUDController.ts
│   │   ├── HealthBar.ts     # [新增]
│   │   ├── Minimap.ts       # [新增]
│   │   └── DamageNumbers.ts # [新增]
│   │
│   ├── screens/             # 界面 [新增目录]
│   │   ├── MainMenuController.ts
│   │   ├── GameOverController.ts
│   │   ├── InventoryUI.ts   # [新增]
│   │   ├── ShopUI.ts        # [新增]
│   │   └── PauseMenu.ts     # [新增]
│   │
│   └── components/          # UI组件 [新增目录]
│       ├── Button.ts
│       ├── ProgressBar.ts
│       └── Tooltip.ts       # [新增]
│
├── data/                    # 数据层 [重命名 config/]
│   ├── config/
│   │   ├── GameConfig.ts
│   │   ├── MonsterConfig.ts      # [拆分]
│   │   ├── WeaponConfig.ts       # [拆分]
│   │   └── TerrainConfig.ts      # [新增]
│   │
│   └── types/
│       ├── Types.ts
│       ├── Interfaces.ts         # [拆分]
│       └── Enums.ts              # [拆分]
│
└── utils/                   # 工具类 [新增目录]
    ├── MathUtils.ts
    ├── RandomUtils.ts
    ├── VectorUtils.ts
    └── ArrayUtils.ts
```

### 3.3 重构步骤

#### Phase 1: 目录结构调整（低风险）

1. 创建新目录结构
2. 移动文件到新位置
3. 更新所有导入路径
4. 验证编译无错误

#### Phase 2: 代码抽取（中风险）

1. 从 DamageSystem 抽取 DamageCalculator
2. 拆分 Types.ts 为 Interfaces.ts 和 Enums.ts
3. 拆分 GameConfig.ts 为多个配置文件

#### Phase 3: 新增系统（高风险）

1. 实现 EventBus 解耦系统间通信
2. 实现 SaveSystem 统一存档管理
3. 实现 ModifierSystem 词条系统

---

## 四、Cocos Creator MCP自动化方案

### 4.1 MCP服务器配置

项目已安装 `extensions/cocos-mcp-server/`，可用于自动化操作。

#### 可用MCP功能

```typescript
// MCP服务器提供的API
interface CocosMCP {
    // 场景操作
    scene: {
        createNode(name: string): Node;
        deleteNode(node: Node): void;
        findNode(path: string): Node | null;
        saveScene(): void;
    };

    // 组件操作
    component: {
        addComponent(node: Node, type: string): Component;
        removeComponent(node: Node, component: Component): void;
        getComponent(node: Node, type: string): Component | null;
    };

    // 资源操作
    asset: {
        importAsset(path: string): Promise<Asset>;
        createPrefab(node: Node, path: string): void;
        loadAsset(uuid: string): Promise<Asset>;
    };

    // 脚本操作
    script: {
        createScript(name: string, template: string): void;
        updateScript(name: string, content: string): void;
    };
}
```

### 4.2 自动化任务清单

#### 任务1: 自动生成词条系统代码

```javascript
// mcp-tasks/generate-modifier-system.js

const modifierSystemCode = `
/**
 * 词条系统 - 自动生成
 * 生成时间: ${new Date().toISOString()}
 */

import { _decorator, Component } from 'cc';
import {
    ModifierType,
    IModifier,
    Rarity,
    ElementType,
    WeaponAttackType
} from '../data/types/Enums';

const { ccclass } = _decorator;

@ccclass('ModifierSystem')
export class ModifierSystem extends Component {
    // 单例
    private static _instance: ModifierSystem | null = null;
    public static get instance(): ModifierSystem | null {
        return this._instance;
    }

    // 词条数据存储
    private _modifiers: Map<string, Map<string, IModifier>> = new Map();

    onLoad() {
        if (ModifierSystem._instance === null) {
            ModifierSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }
    }

    // [后续代码由AI生成...]
}
`;

// 使用MCP创建脚本
await mcp.script.createScript('ModifierSystem', modifierSystemCode);
```

#### 任务2: 自动创建UI预制体

```javascript
// mcp-tasks/create-ui-prefabs.js

// 创建词条面板预制体
async function createModifierPanel() {
    // 1. 创建根节点
    const root = await mcp.scene.createNode('ModifierPanel');

    // 2. 添加UI组件
    await mcp.component.addComponent(root, 'cc.UITransform');
    await mcp.component.addComponent(root, 'cc.Widget');

    // 3. 创建词条列表容器
    const listNode = await mcp.scene.createNode('ModifierList');
    listNode.setParent(root);

    // 4. 创建词条模板
    const itemTemplate = await mcp.scene.createNode('ModifierItem');
    itemTemplate.setParent(listNode);

    // 5. 添加Label组件
    const label = await mcp.component.addComponent(itemTemplate, 'cc.Label');
    label.fontSize = 24;

    // 6. 保存为预制体
    await mcp.asset.createPrefab(root, 'assets/resources/prefabs/ui/ModifierPanel.prefab');
}

await createModifierPanel();
```

#### 任务3: 自动配置场景

```javascript
// mcp-tasks/setup-game-scene.js

async function setupGameScene() {
    // 1. 查找或创建GameScene
    const scene = await mcp.scene.findNode('GameScene');

    // 2. 确保所有系统节点存在
    const systems = [
        { name: 'ModifierSystem', component: 'ModifierSystem' },
        { name: 'TerrainSystem', component: 'TerrainSystem' },
        { name: 'AchievementSystem', component: 'AchievementSystem' }
    ];

    for (const sys of systems) {
        let node = await mcp.scene.findNode(sys.name);
        if (!node) {
            node = await mcp.scene.createNode(sys.name);
            await mcp.component.addComponent(node, sys.component);
            console.log(`创建系统节点: ${sys.name}`);
        }
    }

    // 3. 保存场景
    await mcp.scene.saveScene();
}

await setupGameScene();
```

### 4.3 MCP自动化执行计划

```yaml
# mcp-automation-plan.yml

phases:
  phase1_foundation:
    name: "基础系统自动化"
    tasks:
      - name: "创建词条系统"
        script: "generate-modifier-system.js"
        dependencies: []

      - name: "创建地形系统"
        script: "generate-terrain-system.js"
        dependencies: []

      - name: "创建成就系统"
        script: "generate-achievement-system.js"
        dependencies: []

  phase2_ui:
    name: "UI自动化"
    tasks:
      - name: "创建词条面板"
        script: "create-modifier-panel.js"
        dependencies: ["phase1_foundation"]

      - name: "创建迷你地图"
        script: "create-minimap.js"
        dependencies: []

      - name: "创建商店UI"
        script: "create-shop-ui.js"
        dependencies: []

  phase3_integration:
    name: "集成自动化"
    tasks:
      - name: "配置游戏场景"
        script: "setup-game-scene.js"
        dependencies: ["phase1_foundation", "phase2_ui"]

      - name: "配置地形区域"
        script: "setup-terrain-zones.js"
        dependencies: ["phase1_foundation"]

      - name: "生成测试数据"
        script: "generate-test-data.js"
        dependencies: ["phase1_foundation"]

  phase4_validation:
    name: "验证自动化"
    tasks:
      - name: "编译检查"
        script: "validate-compilation.js"
        dependencies: ["phase3_integration"]

      - name: "场景完整性检查"
        script: "validate-scene.js"
        dependencies: ["phase3_integration"]
```

---

## 五、自动化测试方案

### 5.1 测试架构

```
tests/
├── unit/                    # 单元测试
│   ├── combat/
│   │   ├── DamageCalculator.test.ts
│   │   ├── ModifierSystem.test.ts
│   │   └── CombatSystem.test.ts
│   ├── economy/
│   │   ├── InventorySystem.test.ts
│   │   └── LootSystem.test.ts
│   └── utils/
│       └── MathUtils.test.ts
│
├── integration/             # 集成测试
│   ├── combat-integration.test.ts
│   ├── wave-integration.test.ts
│   └── save-load-integration.test.ts
│
├── e2e/                     # 端到端测试
│   ├── gameplay-flow.test.ts
│   └── ui-interaction.test.ts
│
└── performance/             # 性能测试
    ├── monster-spawn-performance.test.ts
    └── combat-performance.test.ts
```

### 5.2 关键测试用例

#### 测试1: 伤害计算系统

```typescript
// tests/unit/combat/DamageCalculator.test.ts

describe('DamageCalculator', () => {
    // 基础伤害计算
    test('基础伤害无加成', () => {
        const attacker = createMockCharacter({ damage: 100 });
        const defender = createMockCharacter({});
        const weapon = createMockWeapon({ damage: 50 });

        const result = DamageCalculator.calculate({
            attacker, defender, weapon,
            resistances: DEFAULT_RESISTANCES
        });

        expect(result.damage).toBe(150);
    });

    // 元素克制
    test('火元素攻击木属性目标造成2倍伤害', () => {
        const weapon = createMockWeapon({
            damage: 100,
            element: ElementType.FIRE
        });
        const resistances = { ...DEFAULT_RESISTANCES, wood: -1 };

        const result = DamageCalculator.calculate({
            weapon, resistances
        });

        expect(result.damage).toBe(200);  // 100 * 2
    });

    // 物理抗性
    test('斩击攻击软甲目标造成额外伤害', () => {
        const weapon = createMockWeapon({
            damage: 100,
            attackType: WeaponAttackType.SLASH
        });
        const resistances = { ...DEFAULT_RESISTANCES, slash: -0.3 };

        const result = DamageCalculator.calculate({
            weapon, resistances
        });

        expect(result.damage).toBe(130);  // 100 * 1.3
    });

    // 暴击计算
    test('暴击造成1.5倍伤害', () => {
        const result = DamageCalculator.calculate({
            baseDamage: 100,
            isCrit: true,
            critDamage: 1.5
        });

        expect(result.damage).toBe(150);
    });

    // 综合计算
    test('综合伤害计算', () => {
        // 基础100，武器类型加成20%，元素加成30%，暴击150%
        // 怪物斩击抗性-30%，火抗性-50%
        const result = DamageCalculator.calculate({
            baseDamage: 100,
            weaponTypeBonus: 0.2,
            elementBonus: 0.3,
            isCrit: true,
            critDamage: 1.5,
            slashResistance: -0.3,
            fireResistance: -0.5
        });

        // 100 * 1.2 * 1.3 * 1.5 * 1.5 = 456.3
        expect(result.damage).toBeCloseTo(456, 0);
    });
});
```

#### 测试2: 词条系统

```typescript
// tests/unit/combat/ModifierSystem.test.ts

describe('ModifierSystem', () => {
    let modifierSystem: ModifierSystem;

    beforeEach(() => {
        modifierSystem = new ModifierSystem();
    });

    test('添加词条到实体', () => {
        const entityId = 'player_1';
        const modifier: IModifier = {
            id: 'mod_1',
            type: ModifierType.ATTACK_PERCENT,
            value: 0.2,
            valueType: 'percent',
            rarity: Rarity.RARE,
            source: 'equipment'
        };

        modifierSystem.addModifier(entityId, modifier);

        const modifiers = modifierSystem.getAllModifiers(entityId);
        expect(modifiers).toHaveLength(1);
        expect(modifiers[0].value).toBe(0.2);
    });

    test('计算同类型词条叠加', () => {
        const entityId = 'player_1';

        modifierSystem.addModifier(entityId, {
            type: ModifierType.ATTACK_PERCENT,
            value: 0.1
        });

        modifierSystem.addModifier(entityId, {
            type: ModifierType.ATTACK_PERCENT,
            value: 0.2
        });

        const total = modifierSystem.calculateTotalModifier(
            entityId,
            ModifierType.ATTACK_PERCENT
        );

        expect(total).toBe(0.3);  // 10% + 20% = 30%
    });

    test('Boss掉落词条生成', () => {
        const bossRarity = Rarity.LEGENDARY;
        const modifiers = modifierSystem.generateBossModifiers(bossRarity);

        // 传说Boss应该掉落1-3个词条
        expect(modifiers.length).toBeGreaterThanOrEqual(1);
        expect(modifiers.length).toBeLessThanOrEqual(3);

        // 所有词条应该是传说稀有度
        modifiers.forEach(mod => {
            expect(mod.rarity).toBe(Rarity.LEGENDARY);
        });
    });
});
```

#### 测试3: 波次系统

```typescript
// tests/integration/wave-integration.test.ts

describe('WaveSystem Integration', () => {
    test('第1天波次生成正确数量的怪物', async () => {
        const waveSystem = new WaveSystem();
        const monsterManager = new MonsterManager();

        // 模拟第1天夜晚开始
        waveSystem.onNightStart();

        // 等待波次生成
        await wait(100);

        // 第1天应该有20史莱姆 + 10哥布林 + 2精英 = 32只
        expect(monsterManager.getActiveMonsterCount()).toBe(32);
    });

    test('第3天Boss正确生成', async () => {
        const waveSystem = new WaveSystem();

        // 模拟第3天
        waveSystem.setDay(3);
        waveSystem.onNightStart();

        await wait(100);

        // 检查是否生成了龙王
        const boss = monsterManager.findBoss();
        expect(boss).not.toBeNull();
        expect(boss.name).toContain('龙');
    });

    test('波次完成后进入白天', async () => {
        const waveSystem = new WaveSystem();
        const timeSystem = new TimeSystem();

        waveSystem.onNightStart();

        // 击杀所有怪物
        monsterManager.killAllMonsters();

        await wait(100);

        // 波次应该完成
        expect(waveSystem.getWaveState()).toBe(WaveState.COMPLETED);
    });
});
```

### 5.3 自动化测试执行流程

```bash
# 测试执行脚本

# 1. 单元测试
npm run test:unit

# 2. 集成测试
npm run test:integration

# 3. 性能测试
npm run test:performance

# 4. 生成覆盖率报告
npm run test:coverage

# 5. 完整测试套件
npm run test:all
```

### 5.4 测试验证清单

| 系统 | 测试类型 | 验证点 | 优先级 |
|------|----------|--------|--------|
| 伤害计算 | 单元测试 | 元素克制、物理抗性、暴击 | P0 |
| 词条系统 | 单元测试 | 词条叠加、Boss掉落 | P0 |
| 战斗系统 | 集成测试 | 攻击流程、死亡处理 | P0 |
| 波次系统 | 集成测试 | 怪物生成、Boss生成 | P0 |
| 背包系统 | 单元测试 | 添加/移除/堆叠 | P1 |
| 存档系统 | 集成测试 | 保存/加载 | P1 |
| 地形系统 | 单元测试 | 效果应用 | P2 |
| 成就系统 | 单元测试 | 条件判断、奖励发放 | P2 |
| 性能测试 | 性能测试 | 100只怪物同时战斗 | P1 |

---

## 六、实施路线图

### Phase 1: 核心系统（第1-2周）

```
Week 1:
├── Day 1-2: 实现词条系统 ModifierSystem
├── Day 3-4: 完善伤害计算（物理抗性）
├── Day 5-7: 集成词条系统到DamageSystem

Week 2:
├── Day 1-2: Boss掉落词条实现
├── Day 3-4: 词条镶嵌功能
└── Day 5-7: 测试与优化
```

### Phase 2: 世界系统（第3-4周）

```
Week 3:
├── Day 1-3: 地形系统 TerrainSystem
├── Day 4-5: 地图生成 MapGenerator
└── Day 6-7: 事件系统 EventSystem

Week 4:
├── Day 1-3: 迷你地图实现
├── Day 4-5: 地形视觉效果
└── Day 6-7: 测试与优化
```

### Phase 3: 玩法完善（第5-6周）

```
Week 5:
├── Day 1-3: 炮台系统完善
├── Day 4-5: 城堡防守系统
└── Day 6-7: 商店系统完善

Week 6:
├── Day 1-3: 掉落系统完善
├── Day 4-5: 技能系统完善
└── Day 6-7: 测试与优化
```

### Phase 4: 优化与测试（第7-8周）

```
Week 7:
├── Day 1-3: 项目结构重构
├── Day 4-5: 性能优化
└── Day 6-7: MCP自动化脚本

Week 8:
├── Day 1-4: 自动化测试编写
└── Day 5-7: 集成测试与修复
```

---

## 七、风险评估与应对

| 风险 | 影响 | 可能性 | 应对措施 |
|------|------|--------|----------|
| 词条系统复杂度超预期 | 高 | 中 | 分阶段实现，先基础后高级 |
| 性能问题（怪物过多） | 高 | 中 | 对象池优化、LOD系统 |
| MCP服务器不稳定 | 中 | 低 | 准备手动执行方案 |
| 重构引入回归bug | 高 | 中 | 完善的自动化测试覆盖 |
| 抖音平台兼容性 | 中 | 低 | 定期构建测试 |

---

## 八、总结

本方案涵盖了：

1. **功能完善**: 词条系统、武器类型抗性、特殊地形、炮台/城堡系统
2. **结构优化**: 清晰的4层架构（核心/玩法/基础设施/UI）
3. **MCP自动化**: 代码生成、UI创建、场景配置
4. **自动化测试**: 单元测试、集成测试、性能测试

**关键成功因素**:
- 分阶段实施，优先核心系统
- 完善的测试覆盖
- MCP自动化减少重复工作
- 持续的性能监控

**交付物**:
- 完整的功能代码
- 优化后的项目结构
- MCP自动化脚本集
- 自动化测试套件
