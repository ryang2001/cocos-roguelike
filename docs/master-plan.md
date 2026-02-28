# Cocos Roguelike 游戏项目 - 完整实施方案

> **项目名称**: 继续下一关 - Roguelike塔防RPG
> **引擎**: Cocos Creator 3.8.0
> **目标平台**: 抖音小游戏
> **文档版本**: 1.0
> **更新时间**: 2026-02-26

---

## 目录

1. [项目概述与分析](#一项目概述与分析)
2. [功能完善方案](#二功能完善方案)
3. [项目结构优化方案](#三项目结构优化方案)
4. [Cocos Creator MCP自动化方案](#四cocos-creator-mcp自动化方案)
5. [自动化测试方案](#五自动化测试方案)
6. [实施路线图](#六实施路线图)
7. [风险评估与应对](#七风险评估与应对)

---

## 一、项目概述与分析

### 1.1 项目现状

#### 已完成功能 (Phase 1-4)

| 模块 | 实现文件 | 状态 | 说明 |
|------|----------|------|------|
| 角色移动与控制 | `entities/Player.ts` | ✅ 完成 | 摇杆+触摸控制，虚拟摇杆跟随玩家 |
| 武器自动攻击 | `entities/Player.ts` + `systems/CombatSystem.ts` | ✅ 完成 | 多武器独立计时，自动锁定敌人 |
| 怪物AI | `entities/Monster.ts` | ✅ 完成 | IDLE/CHASE/ATTACK状态机，Boss技能系统 |
| 碰撞检测 | `systems/CombatSystem.ts` | ✅ 完成 | 范围检测，伤害事件派发 |
| 背包系统 | `systems/InventorySystem.ts` | ✅ 完成 | 20格背包，装备槽位 |
| 词条系统 | `systems/ModifierSystem.ts` | ✅ 完成 | 40+词条类型，Boss掉落，词条镶嵌UI |
| 物理抗性系统 | `types/Types.ts` + `systems/DamageSystem.ts` | ✅ 完成 | 6种武器类型抗性，8种元素抗性 |
| 伤害计算 | `systems/DamageSystem.ts` | ✅ 完成 | 元素克制+物理抗性综合计算 |
| 地形系统 | `world/TerrainSystem.ts` | ✅ 完成 | 6种特殊地形效果 |
| 地图生成 | `world/MapGenerator.ts` | ✅ 完成 | 3000x3000程序化地图 |
| 摄像机跟随 | `core/GameManager.ts` | ✅ 完成 | 平滑跟随玩家 |
| 波次系统 | `systems/WaveSystem.ts` | ✅ 完成 | 3天波次配置 |
| 时间系统 | `systems/TimeSystem.ts` | ✅ 完成 | 白天/黄昏/夜晚循环 |
| 城堡防守 | `entities/Castle.ts` | ✅ 完成 | 自动回血，怪物优先攻击 |
| 炮台系统 | `entities/Tower.ts` + `systems/TowerManager.ts` | ✅ 完成 | 放置/收纳/升级 |
| UI系统 | `ui/*.ts` | ✅ 完成 | HUD、属性面板、词条UI |

#### 待完善功能 (Phase 5)

| 功能 | 优先级 | 状态 | 说明 |
|------|--------|------|------|
| 音效系统 | 中 | ⏳ 待实现 | 战斗音效、背景音乐、UI音效 |
| 存档系统完善 | 中 | ⏳ 待实现 | 词条持久化、炮台布局保存 |
| 特效系统完善 | 低 | ⏳ 待实现 | 粒子效果预制体 |
| 成就系统 | 低 | ⏳ 待实现 | 成就条件判断、奖励发放 |
| 多人联机 | 低 | ⏳ 待实现 | 协作模式、排行榜 |

### 1.2 项目文件统计

```
代码文件: 34个 TypeScript文件
核心代码: ~10,000+ 行
场景文件: 4个 (BootScene, MainMenuScene, GameScene, GameOverScene)
预制体: 4个 (Player, Monster, Tower, Item)
文档: 12个 Markdown文件
```

### 1.3 技术架构

**设计模式**:
- 单例模式 (GameManager, ModifierSystem, CombatSystem等)
- 状态模式 (怪物AI: IDLE/CHASE/ATTACK)
- 组件模式 (Cocos Creator标准)
- 观察者模式 (事件派发)

**核心系统架构**:
```
GameManager (单例)
├── 游戏流程控制
├── 场景管理
├── 存档管理
└── 实体生命周期

ModifierSystem (单例)
├── 词条数据存储
├── 词条生成
├── 词条计算
└── Buff管理

CombatSystem (单例)
├── 战斗实体注册
├── 攻击流程
├── 伤害计算
└── 目标查找
```

---

## 二、功能完善方案

### 2.1 音效系统实现

#### 需求分析
根据ROGUELIKE_DESIGN.md，音效系统需要：
- 战斗音效 (攻击、受伤、死亡)
- 背景音乐 (白天/夜晚不同BGM)
- UI音效 (按钮点击、背包打开)
- 环境音效 (地形相关)

#### 实现方案

**文件**: `assets/scripts/infrastructure/audio/AudioSystem.ts`

```typescript
@ccclass('AudioSystem')
export class AudioSystem extends Component {
    // 单例
    private static _instance: AudioSystem | null = null;
    public static get instance(): AudioSystem | null {
        return this._instance;
    }

    // 音频分类
    private _bgmSource: AudioSource | null = null;
    private _sfxSources: AudioSource[] = [];
    private _uiSource: AudioSource | null = null;

    // 音频资源缓存
    private _audioCache: Map<string, AudioClip> = new Map();

    // 配置
    private _bgmVolume: number = 0.5;
    private _sfxVolume: number = 0.7;
    private _uiVolume: number = 0.8;

    // 初始化
    onLoad() {
        if (AudioSystem._instance === null) {
            AudioSystem._instance = this;
            director.addPersistRootNode(this.node);
            this.initAudioSources();
        } else {
            this.node.destroy();
        }
    }

    /**
     * 播放背景音乐
     */
    playBGM(clipName: string, fadeDuration: number = 1.0): void {
        const clip = this._audioCache.get(clipName);
        if (clip && this._bgmSource) {
            // 淡入淡出切换
            this.fadeBGM(fadeDuration, () => {
                this._bgmSource!.clip = clip;
                this._bgmSource!.play();
            });
        }
    }

    /**
     * 播放音效
     */
    playSFX(clipName: string, position?: Vec3): void {
        const clip = this._audioCache.get(clipName);
        if (!clip) return;

        // 使用对象池获取可用音源
        const source = this.getAvailableSFXSource();
        if (source) {
            source.clip = clip;
            // 3D音效：根据位置调整音量
            if (position) {
                const playerPos = GameManager.instance?.getPlayerNode()?.position;
                if (playerPos) {
                    const distance = Vec3.distance(position, playerPos);
                    const volume = Math.max(0, 1 - distance / 1000);
                    source.volume = volume * this._sfxVolume;
                }
            }
            source.play();
        }
    }

    /**
     * 播放UI音效
     */
    playUI(clipName: string): void {
        const clip = this._audioCache.get(clipName);
        if (clip && this._uiSource) {
            this._uiSource.clip = clip;
            this._uiSource.play();
        }
    }

    /**
     * 预加载音频资源
     */
    async preloadAudio(): Promise<void> {
        const audioPaths = [
            // BGM
            'audio/bgm/day_theme',
            'audio/bgm/night_theme',
            'audio/bgm/boss_theme',
            // SFX - 战斗
            'audio/sfx/attack_sword',
            'audio/sfx/attack_gun',
            'audio/sfx/hit_normal',
            'audio/sfx/hit_crit',
            'audio/sfx/monster_death',
            'audio/sfx/level_up',
            // SFX - 环境
            'audio/sfx/terrain_forest',
            'audio/sfx/terrain_volcano',
            // UI
            'audio/ui/button_click',
            'audio/ui/open_inventory',
            'audio/ui/equip_item',
        ];

        for (const path of audioPaths) {
            await this.loadAudioClip(path);
        }
    }
}
```

**音效触发点**:

| 事件 | 音效文件 | 触发位置 |
|------|----------|----------|
| 玩家攻击 | `sfx/attack_[weapon_type]` | Player.ts:attack() |
| 造成伤害 | `sfx/hit_[normal/crit]` | DamageSystem.ts:calculateDamage() |
| 怪物死亡 | `sfx/monster_death` | Monster.ts:die() |
| 升级 | `sfx/level_up` | ExperienceSystem.ts:levelUp() |
| 获得金币 | `sfx/coin_pickup` | LootSystem.ts:collectItem() |
| 打开背包 | `ui/open_inventory` | InventoryUI.ts:show() |
| 按钮点击 | `ui/button_click` | 所有按钮组件 |
| 切换时间 | `bgm/[day/night]_theme` | TimeSystem.ts:onPhaseChange() |

### 2.2 存档系统完善

#### 需求分析
当前存档系统只保存基础玩家数据，需要扩展：
- 词条数据持久化
- 炮台布局保存
- 地形状态保存
- 游戏进度精确保存

#### 实现方案

**文件**: `assets/scripts/infrastructure/save/SaveSystem.ts`

```typescript
interface ISaveData {
    version: string;
    timestamp: number;
    // 玩家数据
    player: {
        hp: number;
        maxHp: number;
        level: number;
        exp: number;
        gold: number;
        position: { x: number; y: number; z: number };
        weapons: IWeaponItem[];
        equipment: { [slot: string]: IEquipmentItem };
    };
    // 词条数据
    modifiers: {
        playerModifiers: IModifier[];
        equipmentModifiers: { [equipmentId: string]: IModifier[] };
    };
    // 背包数据
    inventory: {
        backpack: IItemStack[];
        gold: number;
    };
    // 游戏进度
    progress: {
        currentDay: number;
        gameTime: number;
        timePhase: TimePhase;
        killedMonsters: number;
        killedBosses: string[];
    };
    // 炮台布局
    towers: {
        placedTowers: Array<{
            id: string;
            type: TowerType;
            level: number;
            position: { x: number; y: number; z: number };
        }>;
    };
    // 世界状态
    world: {
        terrainSeed: number;
        exploredAreas: string[];
    };
    // 成就进度
    achievements: {
        unlocked: string[];
        progress: { [achievementId: string]: number };
    };
}

@ccclass('SaveSystem')
export class SaveSystem extends Component {
    private static _instance: SaveSystem | null = null;
    public static get instance(): SaveSystem | null {
        return this._instance;
    }

    private readonly SAVE_KEY = 'roguelike_save_v2';
    private readonly AUTO_SAVE_INTERVAL = 30000; // 30秒自动保存

    onLoad() {
        if (SaveSystem._instance === null) {
            SaveSystem._instance = this;
            this.startAutoSave();
        } else {
            this.node.destroy();
        }
    }

    /**
     * 完整保存游戏
     */
    saveGame(): boolean {
        const saveData = this.collectSaveData();
        const json = JSON.stringify(saveData);

        try {
            if (typeof tt !== 'undefined') {
                tt.setStorageSync(this.SAVE_KEY, json);
            } else {
                localStorage.setItem(this.SAVE_KEY, json);
            }
            console.log('[SaveSystem] 游戏已保存');
            return true;
        } catch (e) {
            console.error('[SaveSystem] 保存失败:', e);
            return false;
        }
    }

    /**
     * 加载游戏
     */
    loadGame(): ISaveData | null {
        let json: string | null = null;

        try {
            if (typeof tt !== 'undefined') {
                json = tt.getStorageSync(this.SAVE_KEY);
            } else {
                json = localStorage.getItem(this.SAVE_KEY);
            }

            if (json) {
                const data = JSON.parse(json) as ISaveData;
                // 版本迁移处理
                if (data.version !== GameConfig.VERSION) {
                    return this.migrateSaveData(data);
                }
                return data;
            }
        } catch (e) {
            console.error('[SaveSystem] 加载失败:', e);
        }

        return null;
    }

    /**
     * 收集保存数据
     */
    private collectSaveData(): ISaveData {
        const gameManager = GameManager.instance;
        const player = gameManager?.getPlayerNode()?.getComponent(Player);
        const modifierSystem = ModifierSystem.instance;
        const inventorySystem = InventorySystem.instance;

        return {
            version: GameConfig.VERSION,
            timestamp: Date.now(),
            player: {
                hp: player?.hp || 0,
                maxHp: player?.maxHp || 0,
                level: player?.level || 1,
                exp: player?.exp || 0,
                gold: player?.gold || 0,
                position: {
                    x: player?.node.position.x || 0,
                    y: player?.node.position.y || 0,
                    z: player?.node.position.z || 0
                },
                weapons: player?.weapons || [],
                equipment: player?.equipment || {}
            },
            modifiers: {
                playerModifiers: modifierSystem?.getAllModifiers('player') || [],
                equipmentModifiers: this.collectEquipmentModifiers()
            },
            inventory: {
                backpack: inventorySystem?.getAllItems() || [],
                gold: inventorySystem?.gold || 0
            },
            progress: {
                currentDay: gameManager?.currentDay || 1,
                gameTime: gameManager?.gameTime || 0,
                timePhase: TimeSystem.instance?.getCurrentPhase() || TimePhase.DAY,
                killedMonsters: CombatSystem.instance?.getKillCount() || 0,
                killedBosses: CombatSystem.instance?.getKilledBosses() || []
            },
            towers: {
                placedTowers: TowerManager.instance?.getSaveData() || []
            },
            world: {
                terrainSeed: MapGenerator.instance?.getSeed() || 0,
                exploredAreas: []
            },
            achievements: {
                unlocked: AchievementSystem.instance?.getUnlockedAchievements() || [],
                progress: AchievementSystem.instance?.getProgress() || {}
            }
        };
    }

    /**
     * 自动保存
     */
    private startAutoSave(): void {
        this.schedule(() => {
            if (!GameManager.instance?.isPaused) {
                this.saveGame();
            }
        }, this.AUTO_SAVE_INTERVAL / 1000);
    }
}
```

### 2.3 特效系统完善

#### 需求分析
- 攻击特效 (剑气、子弹、法术)
- 受击特效 (伤害数字、出血、闪光)
- 环境特效 (地形效果、天气)
- 升级/获得物品特效

#### 实现方案

**文件**: `assets/scripts/infrastructure/effect/EffectSystem.ts`

```typescript
interface IEffectConfig {
    id: string;
    prefabPath: string;
    duration: number;
    poolSize: number;
}

@ccclass('EffectSystem')
export class EffectSystem extends Component {
    private static _instance: EffectSystem | null = null;
    public static get instance(): EffectSystem | null {
        return this._instance;
    }

    // 特效对象池
    private _effectPools: Map<string, NodePool> = new Map();

    // 激活的特效
    private _activeEffects: Map<string, Node[]> = new Map();

    onLoad() {
        if (EffectSystem._instance === null) {
            EffectSystem._instance = this;
            this.initEffectPools();
        } else {
            this.node.destroy();
        }
    }

    /**
     * 播放攻击特效
     */
    playAttackEffect(
        weaponType: WeaponType,
        startPos: Vec3,
        endPos: Vec3,
        element?: ElementType
    ): void {
        const effectId = this.getAttackEffectId(weaponType, element);
        const effect = this.spawnEffect(effectId);

        if (effect) {
            effect.setPosition(startPos);

            // 计算方向
            const direction = new Vec3();
            Vec3.subtract(direction, endPos, startPos);
            direction.normalize();

            // 设置旋转
            const angle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);
            effect.setRotationFromEuler(0, 0, angle);

            // 移动动画
            const tweenDuration = Vec3.distance(startPos, endPos) / 500;
            tween(effect.position)
                .to(tweenDuration, endPos, { easing: 'linear' })
                .call(() => this.despawnEffect(effectId, effect))
                .start();
        }
    }

    /**
     * 播放受击特效
     */
    playHitEffect(
        position: Vec3,
        damage: number,
        isCrit: boolean,
        element?: ElementType
    ): void {
        // 伤害数字
        this.showDamageNumber(position, damage, isCrit);

        // 元素特效
        if (element && element !== ElementType.NONE) {
            const effectId = `hit_${ElementType[element].toLowerCase()}`;
            this.spawnOneShotEffect(effectId, position);
        }

        // 暴击特效
        if (isCrit) {
            this.spawnOneShotEffect('crit_flash', position);
        }
    }

    /**
     * 显示伤害数字
     */
    showDamageNumber(
        position: Vec3,
        damage: number,
        isCrit: boolean
    ): void {
        const numberNode = new Node('DamageNumber');
        numberNode.setPosition(position);

        const label = numberNode.addComponent(Label);
        label.string = Math.floor(damage).toString();
        label.fontSize = isCrit ? 48 : 32;
        label.color = isCrit ? Color.RED : Color.WHITE;

        // 添加描边
        label.enableOutline = true;
        label.outlineColor = Color.BLACK;
        label.outlineWidth = 2;

        this.node.addChild(numberNode);

        // 上浮动画
        tween(numberNode)
            .by(0.5, { position: new Vec3(0, 50, 0) })
            .parallel(
                tween().to(0.3, { scale: new Vec3(1.5, 1.5, 1) }),
                tween().to(0.5, { opacity: 0 })
            )
            .call(() => numberNode.destroy())
            .start();
    }

    /**
     * 播放地形特效
     */
    playTerrainEffect(terrainType: TerrainType, position: Vec3): void {
        const effectMap: { [key in TerrainType]?: string } = {
            [TerrainType.SNOW]: 'terrain_snow',
            [TerrainType.VOLCANO]: 'terrain_fire',
            [TerrainType.SWAMP]: 'terrain_poison',
            [TerrainType.FOREST]: 'terrain_leaves',
            [TerrainType.DESERT]: 'terrain_sand'
        };

        const effectId = effectMap[terrainType];
        if (effectId) {
            this.spawnLoopingEffect(effectId, position, 2.0);
        }
    }

    /**
     * 播放获得词条特效
     */
    playModifierGetEffect(modifier: IModifier, position: Vec3): void {
        const rarityColors = {
            [Rarity.COMMON]: Color.WHITE,
            [Rarity.GOOD]: Color.GREEN,
            [Rarity.RARE]: Color.BLUE,
            [Rarity.EPIC]: Color.MAGENTA,
            [Rarity.LEGENDARY]: new Color(255, 165, 0),
            [Rarity.MYTHICAL]: Color.RED
        };

        // 创建光柱特效
        const beamNode = new Node('ModifierBeam');
        beamNode.setPosition(position);

        const sprite = beamNode.addComponent(Sprite);
        sprite.color = rarityColors[modifier.rarity];

        this.node.addChild(beamNode);

        // 缩放动画
        tween(beamNode)
            .to(0.3, { scale: new Vec3(1.5, 1.5, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .delay(0.5)
            .to(0.5, { opacity: 0 })
            .call(() => beamNode.destroy())
            .start();
    }

    /**
     * 初始化特效池
     */
    private initEffectPools(): void {
        const configs: IEffectConfig[] = [
            { id: 'attack_slash', prefabPath: 'effects/attack_slash', duration: 0.3, poolSize: 10 },
            { id: 'attack_projectile', prefabPath: 'effects/attack_projectile', duration: 0.5, poolSize: 20 },
            { id: 'attack_magic', prefabPath: 'effects/attack_magic', duration: 0.4, poolSize: 15 },
            { id: 'hit_normal', prefabPath: 'effects/hit_normal', duration: 0.2, poolSize: 10 },
            { id: 'hit_fire', prefabPath: 'effects/hit_fire', duration: 0.5, poolSize: 10 },
            { id: 'hit_ice', prefabPath: 'effects/hit_ice', duration: 0.5, poolSize: 10 },
            { id: 'level_up', prefabPath: 'effects/level_up', duration: 2.0, poolSize: 1 },
        ];

        for (const config of configs) {
            const pool = new NodePool(config.id);
            this._effectPools.set(config.id, pool);
            this.preloadEffect(config);
        }
    }
}
```

### 2.4 成就系统实现

#### 需求分析
根据ROGUELIKE_DESIGN.md，成就系统需要：
- 永久解锁内容
- 单局进度追踪
- 多样化的成就条件

#### 实现方案

**文件**: `assets/scripts/gameplay/progression/AchievementSystem.ts`

```typescript
interface IAchievementDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (stats: IGameStats, data?: any) => boolean;
    reward: IAchievementReward;
    isHidden: boolean;
    category: 'combat' | 'exploration' | 'collection' | 'challenge';
}

@ccclass('AchievementSystem')
export class AchievementSystem extends Component {
    private static _instance: AchievementSystem | null = null;
    public static get instance(): AchievementSystem | null {
        return this._instance;
    }

    // 成就定义
    private _achievementDefs: Map<string, IAchievementDefinition> = new Map();

    // 已解锁成就
    private _unlockedAchievements: Set<string> = new Set();

    // 成就进度
    private _achievementProgress: Map<string, number> = new Map();

    // 游戏统计
    private _gameStats: IGameStats = {
        totalKills: 0,
        totalDamage: 0,
        totalGold: 0,
        totalPlayTime: 0,
        deaths: 0,
        bossesKilled: 0,
        itemsCollected: 0,
        itemsCrafted: 0
    };

    onLoad() {
        if (AchievementSystem._instance === null) {
            AchievementSystem._instance = this;
            this.initAchievements();
        } else {
            this.node.destroy();
        }
    }

    /**
     * 初始化成就定义
     */
    private initAchievements(): void {
        const achievements: IAchievementDefinition[] = [
            // 战斗类
            {
                id: 'first_blood',
                name: '第一滴血',
                description: '击杀第一个怪物',
                icon: 'achievements/first_blood',
                condition: (stats) => stats.totalKills >= 1,
                reward: { gold: 100 },
                isHidden: false,
                category: 'combat'
            },
            {
                id: 'monster_slayer',
                name: '怪物杀手',
                description: '累计击杀100个怪物',
                icon: 'achievements/monster_slayer',
                condition: (stats) => stats.totalKills >= 100,
                reward: { exp: 500, unlockItem: 'weapon_sword_rare' },
                isHidden: false,
                category: 'combat'
            },
            {
                id: 'boss_hunter',
                name: 'Boss猎人',
                description: '累计击杀10个Boss',
                icon: 'achievements/boss_hunter',
                condition: (stats) => stats.bossesKilled >= 10,
                reward: { gold: 5000, exp: 2000 },
                isHidden: false,
                category: 'combat'
            },
            {
                id: 'damage_dealer',
                name: '伤害输出者',
                description: '累计造成10000点伤害',
                icon: 'achievements/damage_dealer',
                condition: (stats) => stats.totalDamage >= 10000,
                reward: { exp: 1000 },
                isHidden: false,
                category: 'combat'
            },
            {
                id: 'untouchable',
                name: '毫发无伤',
                description: '在不受伤的情况下击败一个Boss',
                icon: 'achievements/untouchable',
                condition: (stats, data) => data?.noDamageBossKill === true,
                reward: { gold: 2000, exp: 1000 },
                isHidden: true,
                category: 'challenge'
            },

            // 探索类
            {
                id: 'survivor_day1',
                name: '第一天',
                description: '存活过第1天',
                icon: 'achievements/survivor',
                condition: (stats, data) => data?.survivedDays >= 1,
                reward: { gold: 200 },
                isHidden: false,
                category: 'exploration'
            },
            {
                id: 'survivor_day3',
                name: '幸存者',
                description: '存活过第3天',
                icon: 'achievements/survivor',
                condition: (stats, data) => data?.survivedDays >= 3,
                reward: { gold: 1000, exp: 500, unlockItem: 'character_paladin' },
                isHidden: false,
                category: 'exploration'
            },

            // 收集类
            {
                id: 'collector',
                name: '收藏家',
                description: '收集50个物品',
                icon: 'achievements/collector',
                condition: (stats) => stats.itemsCollected >= 50,
                reward: { gold: 300 },
                isHidden: false,
                category: 'collection'
            },
            {
                id: 'legendary_finder',
                name: '传说发现者',
                description: '获得一件传说品质装备',
                icon: 'achievements/legendary_finder',
                condition: (stats, data) => data?.foundLegendary === true,
                reward: { exp: 2000 },
                isHidden: false,
                category: 'collection'
            },

            // 挑战类
            {
                id: 'speed_runner',
                name: '速通者',
                description: '在20分钟内击败最终Boss',
                icon: 'achievements/speed_runner',
                condition: (stats, data) => data?.clearTime <= 1200000,
                reward: { gold: 5000, exp: 3000 },
                isHidden: false,
                category: 'challenge'
            }
        ];

        for (const achievement of achievements) {
            this._achievementDefs.set(achievement.id, achievement);
        }
    }

    /**
     * 检查成就
     */
    checkAchievements(eventData?: any): void {
        for (const [id, def] of this._achievementDefs) {
            if (this._unlockedAchievements.has(id)) continue;

            if (def.condition(this._gameStats, eventData)) {
                this.unlockAchievement(id);
            }
        }
    }

    /**
     * 解锁成就
     */
    private unlockAchievement(id: string): void {
        const def = this._achievementDefs.get(id);
        if (!def) return;

        this._unlockedAchievements.add(id);

        // 发放奖励
        this.grantReward(def.reward);

        // 显示解锁提示
        this.showUnlockNotification(def);

        console.log(`[AchievementSystem] 解锁成就: ${def.name}`);
    }

    /**
     * 更新统计
     */
    updateStats(key: keyof IGameStats, value: number): void {
        (this._gameStats[key] as number) += value;
        this.checkAchievements();
    }

    /**
     * 获取已解锁成就
     */
    getUnlockedAchievements(): string[] {
        return Array.from(this._unlockedAchievements);
    }

    /**
     * 获取进度
     */
    getProgress(): { [id: string]: number } {
        const progress: { [id: string]: number } = {};
        for (const [id, def] of this._achievementDefs) {
            // 计算进度百分比
            progress[id] = this.calculateProgress(def);
        }
        return progress;
    }
}
```

---

## 三、项目结构优化方案

### 3.1 当前结构问题

```
assets/scripts/
├── core/        # 2个文件
├── entities/    # 5个文件
├── systems/     # 15个文件 - 过于庞大
├── ui/          # 6个文件
├── config/      # 1个文件
├── types/       # 1个文件
└── world/       # 2个文件
```

**问题分析**:
1. `systems/` 目录包含15个文件，职责不清晰
2. 缺乏清晰的层次划分
3. 世界相关代码散落在各处
4. 缺少工具类目录
5. 特效、音频、存档等基础设施代码混杂

### 3.2 优化后的项目结构

```
assets/scripts/
├── core/                           # 核心层 - 游戏流程控制
│   ├── GameManager.ts              # 游戏主管理器
│   ├── SceneAutoConfig.ts          # 场景自动配置
│   ├── GameSceneInitializer.ts     # 游戏场景初始化
│   └── EventBus.ts                 # 全局事件总线 [新增]
│
├── gameplay/                       # 游戏玩法层 [重命名 systems/]
│   ├── entities/                   # 游戏实体
│   │   ├── Player.ts               # 玩家控制器
│   │   ├── Monster.ts              # 怪物AI
│   │   ├── Castle.ts               # 城堡实体
│   │   ├── Tower.ts                # 炮台实体
│   │   └── Item.ts                 # 掉落物品
│   │
│   ├── combat/                     # 战斗系统 [从 systems/ 拆分]
│   │   ├── CombatSystem.ts         # 战斗实体管理
│   │   ├── DamageSystem.ts         # 伤害计算
│   │   └── ModifierSystem.ts       # 词条系统
│   │
│   ├── progression/                # 进度系统 [从 systems/ 拆分]
│   │   ├── TimeSystem.ts           # 时间系统
│   │   ├── WaveSystem.ts           # 波次管理
│   │   ├── ExperienceSystem.ts     # 经验/升级
│   │   └── AchievementSystem.ts    # 成就系统 [新增]
│   │
│   ├── economy/                    # 经济系统 [从 systems/ 拆分]
│   │   ├── InventorySystem.ts      # 背包系统
│   │   ├── LootSystem.ts           # 掉落系统
│   │   ├── ShopSystem.ts           # 商店系统
│   │   └── CurrencySystem.ts       # 货币管理 [新增]
│   │
│   └── world/                      # 世界系统 [从 world/ 移动]
│       ├── TerrainSystem.ts        # 地形系统
│       ├── MapGenerator.ts         # 地图生成
│       └── EventSystem.ts          # 事件系统 [新增]
│
├── infrastructure/                 # 基础设施层 [新增目录]
│   ├── audio/                      # 音频系统 [新增]
│   │   ├── AudioSystem.ts          # 音频管理
│   │   ├── SoundEffect.ts          # 音效定义
│   │   └── BGMManager.ts           # 背景音乐管理
│   │
│   ├── effect/                     # 特效系统
│   │   ├── EffectSystem.ts         # 特效管理
│   │   ├── VisualEffect.ts         # 视觉特效定义
│   │   └── DamageNumbers.ts        # 伤害数字 [从 ui/ 移动]
│   │
│   ├── pool/                       # 对象池 [新增]
│   │   ├── ObjectPool.ts           # 通用对象池
│   │   ├── MonsterPool.ts          # 怪物对象池
│   │   └── EffectPool.ts           # 特效对象池
│   │
│   └── save/                       # 存档系统 [新增]
│       ├── SaveSystem.ts           # 存档管理
│       ├── SaveData.ts             # 存档数据结构
│       └── SaveMigrator.ts         # 存档版本迁移
│
├── ui/                             # UI层
│   ├── hud/                        # HUD组件 [新增目录]
│   │   ├── HUDController.ts        # HUD主控制器
│   │   ├── HealthBar.ts            # 血条组件
│   │   ├── Minimap.ts              # 迷你地图 [新增]
│   │   └── Joystick.ts             # 虚拟摇杆
│   │
│   ├── screens/                    # 全屏界面 [新增目录]
│   │   ├── MainMenuController.ts   # 主菜单
│   │   ├── GameOverController.ts   # 游戏结束
│   │   ├── PauseMenu.ts            # 暂停菜单 [新增]
│   │   ├── InventoryUI.ts          # 背包界面
│   │   ├── ShopUI.ts               # 商店界面
│   │   ├── ModifierUI.ts           # 词条镶嵌界面
│   │   └── PlayerStatsUI.ts        # 属性面板
│   │
│   └── components/                 # 可复用UI组件 [新增目录]
│       ├── Button.ts               # 自定义按钮
│       ├── ProgressBar.ts          # 进度条
│       ├── Tooltip.ts              # 提示框
│       ├── ItemSlot.ts             # 物品槽位
│       └── ModifierSlot.ts         # 词条槽位
│
├── data/                           # 数据层 [重命名 config/]
│   ├── config/
│   │   ├── GameConfig.ts           # 游戏常量
│   │   ├── MonsterConfig.ts        # 怪物配置 [拆分]
│   │   ├── WeaponConfig.ts         # 武器配置 [拆分]
│   │   ├── TerrainConfig.ts        # 地形配置 [拆分]
│   │   └── AudioConfig.ts          # 音频配置 [新增]
│   │
│   └── types/
│       ├── Types.ts                # 主要类型定义
│       ├── Interfaces.ts           # 接口定义 [拆分]
│       └── Enums.ts                # 枚举定义 [拆分]
│
└── utils/                          # 工具类 [新增目录]
    ├── MathUtils.ts                # 数学计算
    ├── RandomUtils.ts              # 随机数生成
    ├── VectorUtils.ts              # 向量操作
    └── ArrayUtils.ts               # 数组操作
```

### 3.3 重构实施步骤

#### Phase 1: 目录结构调整（低风险）

**步骤1**: 创建新目录结构
```bash
# 创建 gameplay 目录
mkdir -p assets/scripts/gameplay/{entities,combat,progression,economy,world}

# 创建 infrastructure 目录
mkdir -p assets/scripts/infrastructure/{audio,effect,pool,save}

# 创建 ui 子目录
mkdir -p assets/scripts/ui/{hud,screens,components}

# 创建 data 子目录
mkdir -p assets/scripts/data/{config,types}

# 创建 utils 目录
mkdir -p assets/scripts/utils
```

**步骤2**: 移动文件到新位置
| 原位置 | 新位置 |
|--------|--------|
| `systems/CombatSystem.ts` | `gameplay/combat/CombatSystem.ts` |
| `systems/DamageSystem.ts` | `gameplay/combat/DamageSystem.ts` |
| `systems/ModifierSystem.ts` | `gameplay/combat/ModifierSystem.ts` |
| `systems/TimeSystem.ts` | `gameplay/progression/TimeSystem.ts` |
| `systems/WaveSystem.ts` | `gameplay/progression/WaveSystem.ts` |
| `systems/ExperienceSystem.ts` | `gameplay/progression/ExperienceSystem.ts` |
| `systems/InventorySystem.ts` | `gameplay/economy/InventorySystem.ts` |
| `systems/LootSystem.ts` | `gameplay/economy/LootSystem.ts` |
| `systems/ShopSystem.ts` | `gameplay/economy/ShopSystem.ts` |
| `world/TerrainSystem.ts` | `gameplay/world/TerrainSystem.ts` |
| `world/MapGenerator.ts` | `gameplay/world/MapGenerator.ts` |
| `ui/HUDController.ts` | `ui/hud/HUDController.ts` |
| `ui/Joystick.ts` | `ui/hud/Joystick.ts` |
| `ui/MainMenuController.ts` | `ui/screens/MainMenuController.ts` |
| `config/GameConfig.ts` | `data/config/GameConfig.ts` |
| `types/Types.ts` | `data/types/Types.ts` |

**步骤3**: 更新所有导入路径
使用VSCode全局替换功能更新import路径：
```typescript
// 原导入
import { CombatSystem } from '../systems/CombatSystem';

// 新导入
import { CombatSystem } from '../gameplay/combat/CombatSystem';
```

**步骤4**: 验证编译无错误
```bash
# Cocos Creator 编译检查
npm run build
```

#### Phase 2: 代码抽取（中风险）

**步骤1**: 拆分 Types.ts
```typescript
// data/types/Enums.ts - 所有枚举定义
export enum ElementType { ... }
export enum WeaponType { ... }
export enum Rarity { ... }

// data/types/Interfaces.ts - 所有接口定义
export interface ICharacter { ... }
export interface IWeapon { ... }

// data/types/Types.ts - 类型别名和工具类型
export type ModifierValueType = 'flat' | 'percent';
```

**步骤2**: 拆分 GameConfig.ts
```typescript
// data/config/MonsterConfig.ts
export class MonsterConfig { ... }

// data/config/WeaponConfig.ts
export class WeaponConfig { ... }

// data/config/AudioConfig.ts [新增]
export class AudioConfig { ... }
```

#### Phase 3: 新增系统（高风险）

**步骤1**: 实现 EventBus
```typescript
// core/EventBus.ts
type EventCallback = (data?: any) => void;

export class EventBus {
    private static _instance: EventBus;
    private _listeners: Map<string, EventCallback[]> = new Map();

    static get instance(): EventBus {
        if (!this._instance) {
            this._instance = new EventBus();
        }
        return this._instance;
    }

    on(event: string, callback: EventCallback): void {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event)!.push(callback);
    }

    off(event: string, callback: EventCallback): void {
        const listeners = this._listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event: string, data?: any): void {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
}

// 事件名称常量
export const GameEvents = {
    PLAYER_DAMAGE_TAKEN: 'player:damage_taken',
    MONSTER_KILLED: 'monster:killed',
    BOSS_KILLED: 'boss:killed',
    LEVEL_UP: 'player:level_up',
    ITEM_COLLECTED: 'item:collected',
    MODIFIER_ACQUIRED: 'modifier:acquired',
    TIME_PHASE_CHANGED: 'time:phase_changed',
    GAME_OVER: 'game:over',
    GAME_WIN: 'game:win'
} as const;
```

---

## 四、Cocos Creator MCP自动化方案

### 4.1 MCP服务器概述

项目已安装 `extensions/cocos-mcp-server/`，可用于自动化操作Cocos Creator编辑器。

**MCP能力**:
- 场景操作 (创建/删除节点、保存场景)
- 组件操作 (添加/移除/获取组件)
- 资源操作 (导入资源、创建预制体)
- 脚本操作 (创建/更新脚本)

### 4.2 自动化任务清单

#### 任务1: 自动生成新系统代码

**脚本**: `mcp-tasks/generate-system.js`

```javascript
/**
 * 自动生成游戏系统代码
 * 用法: node generate-system.js --name=AudioSystem --category=infrastructure/audio
 */

const fs = require('fs');
const path = require('path');

function generateSystemCode(systemName, category) {
    const template = `/**
 * ${systemName} - 自动生成
 * 生成时间: ${new Date().toISOString()}
 */

import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('${systemName}')
export class ${systemName} extends Component {
    // 单例
    private static _instance: ${systemName} | null = null;
    public static get instance(): ${systemName} | null {
        return this._instance;
    }

    onLoad() {
        if (${systemName}._instance === null) {
            ${systemName}._instance = this;
            console.log('[${systemName}] 初始化完成');
        } else {
            this.node.destroy();
        }
    }

    onDestroy() {
        if (${systemName}._instance === this) {
            ${systemName}._instance = null;
        }
    }

    // TODO: 实现系统功能
}
`;

    const outputPath = path.join('assets/scripts', category, `${systemName}.ts`);

    // 确保目录存在
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // 写入文件
    fs.writeFileSync(outputPath, template, 'utf-8');

    console.log(\`✓ 已生成: \${outputPath}\`);
    return outputPath;
}

// 主执行
const args = process.argv.slice(2);
const nameArg = args.find(arg => arg.startsWith('--name='));
const categoryArg = args.find(arg => arg.startsWith('--category='));

if (nameArg && categoryArg) {
    const name = nameArg.split('=')[1];
    const category = categoryArg.split('=')[1];
    generateSystemCode(name, category);
} else {
    console.log('用法: node generate-system.js --name=SystemName --category=path/to/dir');
}
```

#### 任务2: 自动创建UI预制体

**脚本**: `mcp-tasks/create-ui-prefab.js`

```javascript
/**
 * 自动创建UI预制体
 * 用法: node create-ui-prefab.js --type=screen --name=SettingsMenu
 */

async function createScreenPrefab(name) {
    // 1. 创建根节点
    const root = await mcp.scene.createNode(name);

    // 2. 添加UI组件
    await mcp.component.addComponent(root, 'cc.UITransform');
    const widget = await mcp.component.addComponent(root, 'cc.Widget');

    // 设置Widget为全屏
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.isAlignTop = true;
    widget.isAlignBottom = true;

    // 3. 创建背景
    const bgNode = await mcp.scene.createNode('Background');
    bgNode.setParent(root);

    const bgTransform = await mcp.component.addComponent(bgNode, 'cc.UITransform');
    bgTransform.setContentSize(720, 1280);

    const bgSprite = await mcp.component.addComponent(bgNode, 'cc.Sprite');
    // 设置半透明黑色背景
    bgSprite.color = { r: 0, g: 0, b: 0, a: 200 };

    // 4. 创建标题
    const titleNode = await mcp.scene.createNode('Title');
    titleNode.setParent(root);

    const titleTransform = await mcp.component.addComponent(titleNode, 'cc.UITransform');
    titleTransform.setContentSize(400, 80);

    const titleLabel = await mcp.component.addComponent(titleNode, 'cc.Label');
    titleLabel.string = name;
    titleLabel.fontSize = 48;
    titleLabel.color = { r: 255, g: 255, b: 255, a: 255 };

    // 5. 创建关闭按钮
    const closeBtn = await mcp.scene.createNode('CloseButton');
    closeBtn.setParent(root);

    const btnTransform = await mcp.component.addComponent(closeBtn, 'cc.UITransform');
    btnTransform.setContentSize(120, 60);

    const btnSprite = await mcp.component.addComponent(closeBtn, 'cc.Sprite');
    const btnComponent = await mcp.component.addComponent(closeBtn, 'cc.Button');

    const btnLabel = await mcp.component.addComponent(closeBtn, 'cc.Label');
    btnLabel.string = '关闭';
    btnLabel.fontSize = 24;

    // 6. 保存为预制体
    await mcp.asset.createPrefab(root, \`assets/resources/prefabs/ui/\${name}.prefab\`);

    console.log(\`✓ UI预制体已创建: \${name}\`);
}

// 根据类型创建
const args = process.argv.slice(2);
const typeArg = args.find(arg => arg.startsWith('--type='));
const nameArg = args.find(arg => arg.startsWith('--name='));

if (typeArg && nameArg) {
    const type = typeArg.split('=')[1];
    const name = nameArg.split('=')[1];

    switch(type) {
        case 'screen':
            createScreenPrefab(name);
            break;
        case 'hud':
            createHUDPrefab(name);
            break;
        case 'component':
            createComponentPrefab(name);
            break;
        default:
            console.log('未知类型:', type);
    }
}
```

#### 任务3: 自动配置场景

**脚本**: `mcp-tasks/setup-scene.js`

```javascript
/**
 * 自动配置游戏场景
 * 确保所有必需的系统节点都存在
 */

async function setupGameScene() {
    // 1. 获取当前场景
    const scene = await mcp.scene.getCurrentScene();

    // 2. 确保Canvas存在
    let canvas = await mcp.scene.findNode('Canvas');
    if (!canvas) {
        canvas = await mcp.scene.createNode('Canvas');
        await mcp.component.addComponent(canvas, 'cc.Canvas');
        await mcp.component.addComponent(canvas, 'cc.UITransform');
        console.log('✓ 创建Canvas');
    }

    // 3. 确保摄像机存在
    let camera = await mcp.scene.findNode('MainCamera');
    if (!camera) {
        camera = await mcp.scene.createNode('MainCamera');
        const camComponent = await mcp.component.addComponent(camera, 'cc.Camera');
        camComponent.projection = 0; // ORTHO
        console.log('✓ 创建MainCamera');
    }

    // 4. 创建系统节点
    const systems = [
        { name: 'GameManager', script: 'GameManager', persist: true },
        { name: 'AudioSystem', script: 'AudioSystem', persist: true },
        { name: 'SaveSystem', script: 'SaveSystem', persist: true },
        { name: 'EventBus', script: 'EventBus', persist: true },
        { name: 'ModifierSystem', script: 'ModifierSystem' },
        { name: 'CombatSystem', script: 'CombatSystem' },
        { name: 'EffectSystem', script: 'EffectSystem' },
    ];

    for (const sys of systems) {
        let node = await mcp.scene.findNode(sys.name);
        if (!node) {
            node = await mcp.scene.createNode(sys.name);
            await mcp.component.addComponent(node, sys.script);

            if (sys.persist) {
                await mcp.scene.setPersistent(node, true);
            }

            console.log(\`✓ 创建系统: \${sys.name}\`);
        }
    }

    // 5. 保存场景
    await mcp.scene.saveScene();
    console.log('✓ 场景已保存');
}

setupGameScene().catch(console.error);
```

#### 任务4: 自动生成测试文件

**脚本**: `mcp-tasks/generate-test.js`

```javascript
/**
 * 自动生成测试文件
 * 用法: node generate-test.js --target=ModifierSystem
 */

function generateUnitTest(systemName) {
    return `/**
 * \${systemName} 单元测试
 * 自动生成于 \${new Date().toISOString()}
 */

import { \${systemName} } from '../../assets/scripts/gameplay/combat/\${systemName}';

describe('\${systemName}', () => {
    let system: \${systemName};

    beforeEach(() => {
        system = new \${systemName}();
    });

    afterEach(() => {
        system = null;
    });

    test('应该正确初始化', () => {
        expect(system).toBeDefined();
    });

    test('单例模式应该正常工作', () => {
        const instance1 = \${systemName}.instance;
        const instance2 = \${systemName}.instance;
        expect(instance1).toBe(instance2);
    });

    // TODO: 添加更多测试用例
});
`;
}

const args = process.argv.slice(2);
const targetArg = args.find(arg => arg.startsWith('--target='));

if (targetArg) {
    const target = targetArg.split('=')[1];
    const testCode = generateUnitTest(target);

    const fs = require('fs');
    const path = require('path');

    const outputPath = path.join('tests/unit', \`\${target}.test.ts\`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, testCode, 'utf-8');

    console.log(\`✓ 测试文件已生成: \${outputPath}\`);
}
```

### 4.3 MCP自动化执行计划

```yaml
# mcp-automation-plan.yml

phases:
  phase1_foundation:
    name: "基础系统自动化"
    tasks:
      - name: "创建音频系统"
        script: "generate-system.js"
        args: "--name=AudioSystem --category=infrastructure/audio"

      - name: "创建存档系统"
        script: "generate-system.js"
        args: "--name=SaveSystem --category=infrastructure/save"

      - name: "创建成就系统"
        script: "generate-system.js"
        args: "--name=AchievementSystem --category=gameplay/progression"

      - name: "创建事件总线"
        script: "generate-system.js"
        args: "--name=EventBus --category=core"

  phase2_ui:
    name: "UI自动化"
    tasks:
      - name: "创建暂停菜单"
        script: "create-ui-prefab.js"
        args: "--type=screen --name=PauseMenu"

      - name: "创建设置界面"
        script: "create-ui-prefab.js"
        args: "--type=screen --name=SettingsMenu"

      - name: "创建迷你地图"
        script: "create-ui-prefab.js"
        args: "--type=hud --name=Minimap"

  phase3_scene:
    name: "场景配置自动化"
    tasks:
      - name: "配置GameScene"
        script: "setup-scene.js"

      - name: "验证场景完整性"
        script: "validate-scene.js"

  phase4_tests:
    name: "测试自动化"
    tasks:
      - name: "生成单元测试模板"
        script: "generate-test.js"
        args: "--target=ModifierSystem"

      - name: "生成集成测试模板"
        script: "generate-test.js"
        args: "--target=CombatIntegration"
```

---

## 五、自动化测试方案

### 5.1 测试架构

```
tests/
├── unit/                          # 单元测试
│   ├── gameplay/
│   │   ├── entities/
│   │   │   ├── Player.test.ts
│   │   │   ├── Monster.test.ts
│   │   │   └── Castle.test.ts
│   │   ├── combat/
│   │   │   ├── DamageSystem.test.ts
│   │   │   ├── ModifierSystem.test.ts
│   │   │   └── CombatSystem.test.ts
│   │   ├── progression/
│   │   │   ├── TimeSystem.test.ts
│   │   │   ├── WaveSystem.test.ts
│   │   │   └── ExperienceSystem.test.ts
│   │   └── economy/
│   │       ├── InventorySystem.test.ts
│   │       └── LootSystem.test.ts
│   ├── infrastructure/
│   │   ├── audio/
│   │   │   └── AudioSystem.test.ts
│   │   ├── save/
│   │   │   └── SaveSystem.test.ts
│   │   └── effect/
│   │       └── EffectSystem.test.ts
│   └── utils/
│       ├── MathUtils.test.ts
│       └── RandomUtils.test.ts
│
├── integration/                   # 集成测试
│   ├── combat-flow.test.ts
│   ├── wave-spawn.test.ts
│   ├── save-load.test.ts
│   └── modifier-integration.test.ts
│
├── e2e/                          # 端到端测试
│   ├── full-gameplay.test.ts
│   └── ui-interaction.test.ts
│
└── performance/                   # 性能测试
    ├── monster-spawn-perf.test.ts
    ├── combat-perf.test.ts
    └── render-perf.test.ts
```

### 5.2 关键测试用例

#### 测试1: 伤害计算系统

```typescript
// tests/unit/gameplay/combat/DamageSystem.test.ts

import { DamageSystem } from '../../../assets/scripts/gameplay/combat/DamageSystem';
import { ElementType, WeaponAttackType, DEFAULT_RESISTANCES } from '../../../assets/scripts/data/types/Types';

describe('DamageSystem', () => {
    let damageSystem: DamageSystem;

    beforeEach(() => {
        damageSystem = new DamageSystem();
    });

    describe('基础伤害计算', () => {
        test('基础伤害无加成时应该返回基础值', () => {
            const attacker = createMockCharacter({ damage: 100 });
            const weapon = createMockWeapon({ damage: 50, element: ElementType.NONE });
            const defender = createMockCharacter({});

            const result = DamageSystem.calculateDamage({
                attacker,
                weapon,
                defender,
                resistances: DEFAULT_RESISTANCES
            });

            expect(result.damage).toBe(150);
        });

        test('暴击应该造成额外伤害', () => {
            const result = DamageSystem.calculateDamage({
                baseDamage: 100,
                isCrit: true,
                critDamage: 1.5,
                resistances: DEFAULT_RESISTANCES
            });

            expect(result.damage).toBe(150);
            expect(result.isCrit).toBe(true);
        });
    });

    describe('元素克制系统', () => {
        test('火元素攻击木属性目标应该造成2倍伤害', () => {
            const weapon = createMockWeapon({
                damage: 100,
                element: ElementType.FIRE
            });
            const resistances = { ...DEFAULT_RESISTANCES, wood: -1 };

            const result = DamageSystem.calculateDamage({
                weapon,
                resistances
            });

            expect(result.damage).toBe(200);
        });

        test('水元素攻击火属性目标应该造成2倍伤害', () => {
            const weapon = createMockWeapon({
                damage: 100,
                element: ElementType.WATER
            });
            const resistances = { ...DEFAULT_RESISTANCES, fire: -1 };

            const result = DamageSystem.calculateDamage({
                weapon,
                resistances
            });

            expect(result.damage).toBe(200);
        });

        test('火元素攻击水属性目标应该造成0.5倍伤害', () => {
            const weapon = createMockWeapon({
                damage: 100,
                element: ElementType.FIRE
            });
            const resistances = { ...DEFAULT_RESISTANCES, fire: 0.5 };

            const result = DamageSystem.calculateDamage({
                weapon,
                resistances
            });

            expect(result.damage).toBe(50);
        });
    });

    describe('物理抗性系统', () => {
        test('斩击攻击软甲目标(抗性-30%)应该造成130%伤害', () => {
            const weapon = createMockWeapon({
                damage: 100,
                attackType: WeaponAttackType.SLASH
            });
            const resistances = { ...DEFAULT_RESISTANCES, slash: -0.3 };

            const result = DamageSystem.calculateDamage({
                weapon,
                resistances
            });

            expect(result.damage).toBe(130);
        });

        test('打击攻击重甲目标(抗性+50%)应该造成50%伤害', () => {
            const weapon = createMockWeapon({
                damage: 100,
                attackType: WeaponAttackType.BLUNT
            });
            const resistances = { ...DEFAULT_RESISTANCES, blunt: 0.5 };

            const result = DamageSystem.calculateDamage({
                weapon,
                resistances
            });

            expect(result.damage).toBe(50);
        });
    });

    describe('综合伤害计算', () => {
        test('综合计算：基础100 + 斩击20% + 火元素30% + 暴击50%', () => {
            // 配置：史莱姆(斩击-30%, 火-50%抗性)
            const weapon = createMockWeapon({
                damage: 100,
                element: ElementType.FIRE,
                attackType: WeaponAttackType.SLASH
            });
            const resistances = {
                ...DEFAULT_RESISTANCES,
                slash: -0.3,
                fire: -0.5
            };

            const result = DamageSystem.calculateDamage({
                weapon,
                resistances,
                critRate: 1.0, // 100%暴击
                critDamage: 1.5
            });

            // 100 * (1 + 0.3) * (1 + 0.5) * 1.5 = 292.5
            expect(result.damage).toBeCloseTo(293, 0);
        });
    });
});

// Mock辅助函数
function createMockCharacter(data: any) {
    return {
        hp: 100,
        maxHp: 100,
        damage: data.damage || 10,
        defense: data.defense || 0,
        critRate: data.critRate || 0.05,
        critDamage: data.critDamage || 1.5,
        ...data
    };
}

function createMockWeapon(data: any) {
    return {
        damage: data.damage || 10,
        element: data.element || ElementType.NONE,
        attackType: data.attackType || WeaponAttackType.SLASH,
        ...data
    };
}
```

#### 测试2: 词条系统

```typescript
// tests/unit/gameplay/combat/ModifierSystem.test.ts

import { ModifierSystem } from '../../../assets/scripts/gameplay/combat/ModifierSystem';
import { ModifierType, Rarity, IModifier } from '../../../assets/scripts/data/types/Types';

describe('ModifierSystem', () => {
    let modifierSystem: ModifierSystem;

    beforeEach(() => {
        modifierSystem = new ModifierSystem();
    });

    describe('词条管理', () => {
        test('添加词条到实体', () => {
            const entityId = 'player_1';
            const modifier: IModifier = {
                id: 'mod_1',
                type: ModifierType.ATTACK_PERCENT,
                value: 0.2,
                valueType: 'percent',
                rarity: Rarity.RARE,
                source: 'equipment',
                name: '攻击力加成',
                description: '攻击力+20%'
            };

            modifierSystem.addModifier(entityId, modifier);

            const modifiers = modifierSystem.getAllModifiers(entityId);
            expect(modifiers).toHaveLength(1);
            expect(modifiers[0].value).toBe(0.2);
        });

        test('移除词条', () => {
            const entityId = 'player_1';
            const modifier: IModifier = {
                id: 'mod_1',
                type: ModifierType.ATTACK_PERCENT,
                value: 0.2,
                valueType: 'percent',
                rarity: Rarity.COMMON,
                source: 'equipment',
                name: '攻击力加成',
                description: '攻击力+20%'
            };

            modifierSystem.addModifier(entityId, modifier);
            const removed = modifierSystem.removeModifier(entityId, 'mod_1');

            expect(removed).toBe(true);
            expect(modifierSystem.getAllModifiers(entityId)).toHaveLength(0);
        });

        test('计算同类型词条叠加', () => {
            const entityId = 'player_1';

            modifierSystem.addModifier(entityId, {
                id: 'mod_1',
                type: ModifierType.ATTACK_PERCENT,
                value: 0.1,
                valueType: 'percent',
                rarity: Rarity.COMMON,
                source: 'equipment',
                name: '攻击力+10%',
                description: ''
            });

            modifierSystem.addModifier(entityId, {
                id: 'mod_2',
                type: ModifierType.ATTACK_PERCENT,
                value: 0.2,
                valueType: 'percent',
                rarity: Rarity.COMMON,
                source: 'equipment',
                name: '攻击力+20%',
                description: ''
            });

            const total = modifierSystem.calculateTotalModifier(
                entityId,
                ModifierType.ATTACK_PERCENT
            );

            expect(total).toBe(0.3); // 10% + 20% = 30%
        });
    });

    describe('词条生成', () => {
        test('生成随机词条应该有正确的稀有度', () => {
            const modifier = modifierSystem.generateRandomModifier(Rarity.EPIC);

            expect(modifier.rarity).toBe(Rarity.EPIC);
            expect(modifier.value).toBeGreaterThan(0);
            expect(modifier.id).toBeDefined();
        });

        test('Boss掉落词条数量应该在正确范围内', () => {
            const bossModifiers = modifierSystem.generateBossModifiers(Rarity.LEGENDARY);

            // 传说Boss掉落2-3个词条
            expect(bossModifiers.length).toBeGreaterThanOrEqual(2);
            expect(bossModifiers.length).toBeLessThanOrEqual(3);

            // 所有词条都是传说稀有度
            bossModifiers.forEach(mod => {
                expect(mod.rarity).toBe(Rarity.LEGENDARY);
            });
        });

        test('词条数值应该根据稀有度递增', () => {
            const commonMod = modifierSystem.generateRandomModifier(Rarity.COMMON);
            const rareMod = modifierSystem.generateRandomModifier(Rarity.RARE);
            const legendaryMod = modifierSystem.generateRandomModifier(Rarity.LEGENDARY);

            // 同类型词条，高稀有度数值应该更高
            if (commonMod.type === rareMod.type) {
                expect(rareMod.value).toBeGreaterThanOrEqual(commonMod.value);
            }
        });
    });

    describe('时限词条', () => {
        test('时限词条应该在时间到达后自动移除', () => {
            const entityId = 'player_1';
            const modifier: IModifier = {
                id: 'buff_1',
                type: ModifierType.ATTACK_PERCENT,
                value: 0.5,
                valueType: 'percent',
                rarity: Rarity.RARE,
                source: 'buff',
                name: '临时攻击加成',
                description: '攻击力+50%，持续5秒',
                duration: 5,
                remainingTime: 5
            };

            modifierSystem.addModifier(entityId, modifier);

            // 模拟5秒过去
            modifierSystem.update(5);

            // Buff应该被移除
            const modifiers = modifierSystem.getAllModifiers(entityId);
            expect(modifiers).toHaveLength(0);
        });
    });
});
```

#### 测试3: 波次系统

```typescript
// tests/integration/wave-spawn.test.ts

import { WaveSystem } from '../../assets/scripts/gameplay/progression/WaveSystem';
import { MonsterManager } from '../../assets/scripts/gameplay/entities/MonsterManager';
import { TimeSystem, TimePhase } from '../../assets/scripts/gameplay/progression/TimeSystem';

describe('波次生成集成测试', () => {
    let waveSystem: WaveSystem;
    let monsterManager: MonsterManager;
    let timeSystem: TimeSystem;

    beforeEach(() => {
        waveSystem = new WaveSystem();
        monsterManager = new MonsterManager();
        timeSystem = new TimeSystem();
    });

    test('第1天夜晚应该生成正确数量的怪物', async () => {
        // 设置第1天
        waveSystem.setDay(1);

        // 触发夜晚
        timeSystem.setPhase(TimePhase.NIGHT);
        waveSystem.onNightStart();

        // 等待生成完成
        await waitForSpawn();

        // 验证怪物数量
        // 第1天：20史莱姆 + 10哥布林 + 2精英 = 32只
        const activeMonsters = monsterManager.getActiveMonsterCount();
        expect(activeMonsters).toBe(32);
    });

    test('第3天应该生成最终Boss', async () => {
        waveSystem.setDay(3);
        timeSystem.setPhase(TimePhase.NIGHT);
        waveSystem.onNightStart();

        await waitForSpawn();

        const boss = monsterManager.findBoss();
        expect(boss).not.toBeNull();
        expect(boss?.name).toContain('龙');
    });

    test('清除所有怪物后波次应该完成', async () => {
        waveSystem.setDay(1);
        timeSystem.setPhase(TimePhase.NIGHT);
        waveSystem.onNightStart();

        await waitForSpawn();

        // 击杀所有怪物
        monsterManager.killAllMonsters();

        await wait(100);

        expect(waveSystem.getWaveState()).toBe(WaveState.COMPLETED);
        expect(timeSystem.getCurrentPhase()).toBe(TimePhase.DAY);
    });

    test('波次难度应该随天数递增', async () => {
        const day1Monsters = await getMonsterCountForDay(1);
        const day2Monsters = await getMonsterCountForDay(2);
        const day3Monsters = await getMonsterCountForDay(3);

        expect(day2Monsters).toBeGreaterThan(day1Monsters);
        expect(day3Monsters).toBeGreaterThan(day2Monsters);
    });
});
```

### 5.3 测试执行脚本

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:performance": "jest tests/performance",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/tests"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/assets/scripts/$1"
    },
    "collectCoverageFrom": [
      "assets/scripts/**/*.ts",
      "!assets/scripts/**/*.d.ts"
    ]
  }
}
```

### 5.4 测试验证清单

| 系统 | 测试类型 | 验证点 | 优先级 | 状态 |
|------|----------|--------|--------|------|
| 伤害计算 | 单元测试 | 元素克制、物理抗性、暴击计算 | P0 | ⏳ 待实现 |
| 词条系统 | 单元测试 | 词条叠加、Boss掉落生成 | P0 | ⏳ 待实现 |
| 战斗系统 | 集成测试 | 攻击流程、死亡处理 | P0 | ⏳ 待实现 |
| 波次系统 | 集成测试 | 怪物生成、Boss生成 | P0 | ⏳ 待实现 |
| 背包系统 | 单元测试 | 添加/移除/堆叠物品 | P1 | ⏳ 待实现 |
| 存档系统 | 集成测试 | 保存/加载完整性 | P1 | ⏳ 待实现 |
| 音频系统 | 单元测试 | 音量控制、3D音效 | P2 | ⏳ 待实现 |
| 成就系统 | 单元测试 | 条件判断、奖励发放 | P2 | ⏳ 待实现 |
| 性能测试 | 性能测试 | 100只怪物同时战斗 | P1 | ⏳ 待实现 |

---

## 六、实施路线图

### Phase 1: 基础系统完善（第1-2周）

```
Week 1:
├── Day 1-2: 实现音效系统 (AudioSystem)
│   ├── 创建 AudioSystem.ts
│   ├── 实现 BGM管理
│   ├── 实现 音效播放
│   └── 集成到战斗系统
├── Day 3-4: 完善存档系统 (SaveSystem)
│   ├── 创建 SaveSystem.ts
│   ├── 实现 完整数据结构
│   ├── 实现 自动保存
│   └── 实现 版本迁移
└── Day 5-7: 实现成就系统 (AchievementSystem)
    ├── 创建 AchievementSystem.ts
    ├── 定义成就条件
    ├── 实现 奖励发放
    └── 集成到游戏流程
```

### Phase 2: 项目结构优化（第3-4周）

```
Week 3:
├── Day 1-3: 目录结构调整
│   ├── 创建新目录结构
│   ├── 移动文件到新位置
│   └── 更新所有导入路径
├── Day 4-5: 代码抽取重构
│   ├── 拆分 Types.ts
│   ├── 拆分 GameConfig.ts
│   └── 抽取工具函数
└── Day 6-7: 新增基础设施
    ├── 实现 EventBus
    ├── 实现 ObjectPool
    └── 验证编译无错误

Week 4:
├── Day 1-3: 特效系统完善
│   ├── 完善 EffectSystem.ts
│   ├── 实现 伤害数字
│   ├── 实现 攻击特效
│   └── 实现 地形特效
├── Day 4-5: UI组件完善
│   ├── 创建 Minimap.ts
│   ├── 创建 PauseMenu.ts
│   └── 创建 可复用组件
└── Day 6-7: 测试与修复
```

### Phase 3: MCP自动化与测试（第5-6周）

```
Week 5:
├── Day 1-3: MCP自动化脚本
│   ├── 创建 generate-system.js
│   ├── 创建 create-ui-prefab.js
│   ├── 创建 setup-scene.js
│   └── 创建 generate-test.js
├── Day 4-5: 自动化场景配置
│   ├── 使用MCP配置GameScene
│   ├── 验证所有系统节点
│   └── 创建缺失的预制体
└── Day 6-7: 测试环境搭建
    ├── 配置 Jest
    ├── 创建 Mock数据
    └── 编写第一个测试

Week 6:
├── Day 1-3: 单元测试编写
│   ├── DamageSystem.test.ts
│   ├── ModifierSystem.test.ts
│   └── InventorySystem.test.ts
├── Day 4-5: 集成测试编写
│   ├── combat-flow.test.ts
│   ├── wave-spawn.test.ts
│   └── save-load.test.ts
└── Day 6-7: 性能测试与优化
    ├── 怪物生成性能测试
    ├── 战斗性能测试
    └── 内存泄漏检测
```

### Phase 4: 验证与发布准备（第7-8周）

```
Week 7:
├── Day 1-3: 完整功能测试
│   ├── 端到端游戏流程测试
│   ├── 所有UI界面测试
│   └── 存档/加载测试
├── Day 4-5: 抖音平台适配
│   ├── 构建测试
│   ├── 性能优化
│   └── 兼容性测试
└── Day 6-7: Bug修复

Week 8:
├── Day 1-3: 文档完善
│   ├── 更新API文档
│   ├── 编写用户手册
│   └── 编写测试报告
├── Day 4-5: 最终优化
│   ├── 代码清理
│   ├── 资源优化
│   └── 包体积优化
└── Day 6-7: 发布准备
    ├── 版本标记
    ├── 发布说明
    └── 部署检查清单
```

---

## 七、风险评估与应对

### 7.1 风险分析

| 风险 | 影响 | 可能性 | 应对措施 |
|------|------|--------|----------|
| 项目重构引入回归Bug | 高 | 中 | 1. 完善的自动化测试覆盖<br>2. 分阶段重构，每阶段验证<br>3. 保留原始备份 |
| MCP服务器不稳定 | 中 | 低 | 1. 准备手动执行方案<br>2. 脚本可独立运行<br>3. 文档化手动步骤 |
| 音效/特效资源缺失 | 中 | 高 | 1. 准备占位资源<br>2. 程序化生成替代方案<br>3. 资源清单追踪 |
| 性能问题(怪物过多) | 高 | 中 | 1. 对象池优化<br>2. LOD系统<br>3. 分帧加载<br>4. 性能测试监控 |
| 抖音平台兼容性 | 中 | 低 | 1. 定期构建测试<br>2. 真机测试<br>3. 使用抖音SDK适配 |
| 存档数据版本迁移复杂 | 中 | 中 | 1. 设计可扩展的存档结构<br>2. 编写迁移工具<br>3. 向后兼容测试 |
| 多系统耦合导致难以测试 | 中 | 高 | 1. 使用EventBus解耦<br>2. 依赖注入<br>3. Mock外部依赖 |

### 7.2 应急预案

**场景1: MCP无法使用**
```
1. 切换到手动执行模式
2. 使用 generate-system.js 独立脚本生成代码
3. 参考 SCENE_SETUP_GUIDE.md 手动配置场景
4. 使用 VSCode 代码片段辅助开发
```

**场景2: 重构后出现严重Bug**
```
1. 立即回滚到上一个稳定版本
2. 使用 git revert 撤销问题提交
3. 在分支中修复问题后重新合并
4. 增加该场景的测试用例
```

**场景3: 性能不达标**
```
1. 使用 Chrome DevTools 分析性能瓶颈
2. 实施对象池优化
3. 减少同时活跃的怪物数量
4. 降低特效质量设置
5. 使用 Cocos 性能分析工具
```

---

## 附录

### A. 项目文件完整清单

```
📁 assets/
├── 📁 scenes/
│   ├── BootScene.scene
│   ├── MainMenuScene.scene
│   ├── GameScene.scene
│   └── GameOverScene.scene
│
├── 📁 scripts/
│   ├── 📁 core/
│   ├── 📁 gameplay/
│   ├── 📁 infrastructure/
│   ├── 📁 ui/
│   ├── 📁 data/
│   └── 📁 utils/
│
├── 📁 resources/
│   ├── 📁 prefabs/
│   ├── 📁 textures/
│   ├── 📁 audio/ (待添加)
│   └── 📁 animations/ (待添加)
│
└── 📁 materials/

📁 docs/
├── master-plan.md (本文档)
├── ROGUELIKE_DESIGN.md
├── IMPLEMENTATION_PLAN.md
├── IMPLEMENTATION_PROGRESS.md
├── DEVELOPMENT_GUIDE.md
└── ...

📁 tests/
├── 📁 unit/
├── 📁 integration/
├── 📁 e2e/
└── 📁 performance/

📁 extensions/
└── 📁 cocos-mcp-server/
```

### B. 关键系统交互图

```
┌─────────────────────────────────────────────────────────────┐
│                        GameManager                           │
│                   (游戏流程控制器)                            │
└──────────────┬──────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│TimeSys │ │WaveSys │ │Combat  │ │SaveSys │ │AudioSys│
└───┬────┘ └────┬───┘ └────┬───┘ └────────┘ └────────┘
    │           │          │
    ▼           ▼          ▼
┌────────────────────────────────────────┐
│              游戏实体                   │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Player  │ │Monster │ │Tower   │     │
│  └───┬────┘ └────┬───┘ └────┬───┘     │
│      │           │          │          │
│      ▼           ▼          ▼          │
│  ┌─────────────────────────────────┐  │
│  │       ModifierSystem             │  │
│  │  (词条计算、属性加成)             │  │
│  └─────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### C. 参考资料

- [Cocos Creator 3.8 文档](https://docs.cocos.com/creator/3.8/manual/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [Jest 测试框架](https://jestjs.io/docs/getting-started)
- [抖音小游戏开发文档](https://developer.open-douyin.com/docs/)

---

**文档结束**

> 本方案文档由AI助手生成，涵盖了项目功能完善、结构优化、MCP自动化和测试方案的完整规划。
> 实施时请根据实际情况调整和细化。
