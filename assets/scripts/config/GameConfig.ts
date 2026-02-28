/**
 * 游戏配置 - Cocos Creator版本
 * 包含所有游戏常量和配置数据
 */

export class GameConfig {
    // 游戏基础配置
    static readonly GAME_NAME = '继续下一关';
    static readonly VERSION = '1.0.0';

    // 屏幕尺寸
    static readonly DESIGN_WIDTH = 720;
    static readonly DESIGN_HEIGHT = 1280;

    // 世界地图
    static readonly WORLD_WIDTH = 3000;
    static readonly WORLD_HEIGHT = 3000;

    // 时间系统
    static readonly DAY_DURATION = 600000; // 10分钟(毫秒)
    static readonly TOTAL_DAYS = 3;
    static readonly TIME_PHASES = {
        DAWN: { name: '黎明', start: 0, end: 0.1 },
        DAY: { name: '白天', start: 0.1, end: 0.7 },
        DUSK: { name: '黄昏', start: 0.7, end: 0.8 },
        NIGHT: { name: '夜晚', start: 0.8, end: 1.0 }
    };

    // 元素系统
    static readonly ELEMENTS = {
        WOOD: { id: 'wood', name: '木', color: '#00ff00' },
        WATER: { id: 'water', name: '水', color: '#00bfff' },
        FIRE: { id: 'fire', name: '火', color: '#ff4500' },
        EARTH: { id: 'earth', name: '土', color: '#8b4513' },
        THUNDER: { id: 'thunder', name: '雷', color: '#ffd700' },
        WIND: { id: 'wind', name: '风', color: '#87ceeb' },
        LIGHT: { id: 'light', name: '光', color: '#ffffff' },
        DARK: { id: 'dark', name: '暗', color: '#4b0082' }
    };

    // 武器类型
    static readonly WEAPON_TYPES = {
        SLASH: { id: 'slash', name: '斩击', color: '#ff6b6b' },
        BLUNT: { id: 'blunt', name: '打击', color: '#ffa500' },
        PIERCE: { id: 'pierce', name: '穿刺', color: '#4169e1' },
        MAGIC: { id: 'magic', name: '魔法', color: '#9370db' },
        RANGED: { id: 'ranged', name: '远程', color: '#32cd32' },
        EXPLOSION: { id: 'explosion', name: '爆炸', color: '#ff4500' }
    };

    // 稀有度
    static readonly RARITY = {
        COMMON: { id: 'common', name: '普通', color: '#ffffff', dropRate: 0.60 },
        UNCOMMON: { id: 'uncommon', name: '优秀', color: '#1eff00', dropRate: 0.25 },
        RARE: { id: 'rare', name: '稀有', color: '#0070dd', dropRate: 0.10 },
        EPIC: { id: 'epic', name: '史诗', color: '#a335ee', dropRate: 0.04 },
        LEGENDARY: { id: 'legendary', name: '传说', color: '#ff8000', dropRate: 0.009 },
        MYTHIC: { id: 'mythic', name: '神话', color: '#e6cc80', dropRate: 0.001 }
    };

    // 玩家基础属性
    static readonly PLAYER = {
        BASE_HP: 100,
        BASE_SPEED: 150,
        BASE_CRIT_RATE: 0.05,
        BASE_CRIT_DAMAGE: 1.5,
        INVENTORY_SIZE: 20
    };

    // 武器配置
    static readonly WEAPONS = {
        SWORD: {
            id: 'sword',
            name: '剑',
            type: 'slash',
            range: 80,
            attackSpeed: 1.5,
            baseDamage: 20,
            description: '近战武器,高伤害,范围小'
        },
        SPEAR: {
            id: 'spear',
            name: '枪',
            type: 'pierce',
            range: 300,
            attackSpeed: 2.0,
            baseDamage: 15,
            description: '远程武器,中等伤害,直线攻击'
        },
        SHIELD: {
            id: 'shield',
            name: '盾',
            type: 'blunt',
            range: 60,
            attackSpeed: 1.0,
            baseDamage: 10,
            description: '防御武器,低伤害,可格挡'
        },
        CANNON: {
            id: 'cannon',
            name: '炮',
            type: 'explosion',
            range: 250,
            attackSpeed: 0.8,
            baseDamage: 30,
            description: '远程武器,高伤害,范围攻击'
        },
        STAFF: {
            id: 'staff',
            name: '法杖',
            type: 'magic',
            range: 200,
            attackSpeed: 1.2,
            baseDamage: 18,
            description: '魔法武器,特殊效果'
        }
    };

    // 怪物配置
    static readonly MONSTERS = {
        SLIME: {
            id: 'slime',
            name: '史莱姆',
            hp: 50,
            damage: 5,
            speed: 80,
            exp: 10,
            gold: 5
        },
        GOBLIN: {
            id: 'goblin',
            name: '哥布林',
            hp: 80,
            damage: 10,
            speed: 100,
            exp: 20,
            gold: 10
        },
        SKELETON: {
            id: 'skeleton',
            name: '骷髅',
            hp: 60,
            damage: 15,
            speed: 120,
            exp: 15,
            gold: 8
        },
        WOLF: {
            id: 'wolf',
            name: '狼',
            hp: 70,
            damage: 12,
            speed: 150,
            exp: 18,
            gold: 12
        }
    };

    // Boss配置
    static readonly BOSSES = {
        GOBLIN_KING: {
            id: 'goblin_king',
            name: '哥布林王',
            hp: 1000,
            damage: 30,
            speed: 80,
            exp: 500,
            gold: 200,
            skills: ['summon', 'throw_bomb']
        },
        SKELETON_KING: {
            id: 'skeleton_king',
            name: '骷髅王',
            hp: 1200,
            damage: 35,
            speed: 70,
            exp: 600,
            gold: 250,
            skills: ['summon', 'bone_shield']
        },
        WOLF_KING: {
            id: 'wolf_king',
            name: '狼王',
            hp: 800,
            damage: 40,
            speed: 100,
            exp: 550,
            gold: 220,
            skills: ['summon', 'howl']
        },
        DEMON_KING: {
            id: 'demon_king',
            name: '魔王',
            hp: 3000,
            damage: 50,
            speed: 60,
            exp: 2000,
            gold: 1000,
            skills: ['summon', 'aoe_attack', 'full_screen_skill', 'berserk']
        },
        DRAGON_BOSS: {
            id: 'dragon_boss',
            name: '龙',
            hp: 5000,
            damage: 80,
            speed: 100,
            exp: 5000,
            gold: 2000,
            skills: ['summon', 'aoe_attack', 'breath_attack', 'fly_attack'],
            prefabUuid: '49099856-8dec-4bdc-b4ae-2f77d5dcffcd@e979f',
            scale: 0.5
        }
    };

    // 地形类型
    static readonly TERRAIN = {
        PLAIN: { id: 'plain', name: '平原', color: '#90ee90' },
        FOREST: { id: 'forest', name: '森林', color: '#228b22' },
        MOUNTAIN: { id: 'mountain', name: '雪山', color: '#ffffff' },
        VOLCANO: { id: 'volcano', name: '火山', color: '#ff4500' },
        DESERT: { id: 'desert', name: '沙漠', color: '#f4a460' },
        SWAMP: { id: 'swamp', name: '沼泽', color: '#556b2f' },
        CASTLE: { id: 'castle', name: '城堡', color: '#808080' },
        WATER: { id: 'water', name: '水域', color: '#4169e1' }
    };

    // 波次配置
    static readonly WAVES = {
        DAY_1: {
            monsters: { slime: 20, goblin: 10 },
            elites: 2,
            boss: null
        },
        DAY_2: {
            monsters: { slime: 30, goblin: 20, skeleton: 10 },
            elites: 5,
            boss: 'goblin_king'
        },
        DAY_3: {
            monsters: { slime: 40, goblin: 30, skeleton: 20, wolf: 10 },
            elites: 8,
            boss: 'dragon_boss'
        }
    };

    // ==================== AI生成资源路径配置 ====================
    static readonly TEXTURE_PATHS = {
        // 角色
        CHARACTERS: {
            PLAYER_KNIGHT: 'textures/characters/player/player_knight',
            PLAYER_MAGE: 'textures/characters/player/player_mage',
            PLAYER_PALADIN: 'textures/characters/player/player_paladin',
            PLAYER_RANGER: 'textures/characters/player/player_ranger',
            PLAYER_ROGUE: 'textures/characters/player/player_rogue',
        },

        // 怪物
        MONSTERS: {
            // 普通怪
            SLIME: 'textures/monsters/normal/monster_slime',
            GOBLIN: 'textures/monsters/normal/monster_goblin',
            SKELETON: 'textures/monsters/normal/monster_skeleton',
            WOLF: 'textures/monsters/normal/monster_wolf',
            SPIDER: 'textures/monsters/normal/monster_spider',
            BAT: 'textures/monsters/normal/monster_bat',
            GHOST: 'textures/monsters/normal/monster_ghost',
            GOLEM: 'textures/monsters/normal/monster_golem',
            // 精英怪
            ELITE_GOBLIN: 'textures/monsters/elite/monster_elite_goblin',
            ELITE_SKELETON: 'textures/monsters/elite/monster_elite_skeleton',
            ELITE_WOLF: 'textures/monsters/elite/monster_elite_wolf',
            ELITE_DEMON: 'textures/monsters/elite/monster_elite_demon',
            // Boss
            DRAGON_IDLE: 'textures/monsters/bosses/dragon_idle',
            DRAGON_ATTACK: 'textures/monsters/bosses/dragon_attack',
            DRAGON_HURT: 'textures/monsters/bosses/dragon_hurt',
            DRAGON_FLY: 'textures/monsters/bosses/dragon_fly',
        },

        // 武器
        WEAPONS: {
            // 掉落
            SWORD_DROP: 'textures/weapons/drops/weapon_sword',
            SPEAR_DROP: 'textures/weapons/drops/weapon_spear',
            SHIELD_DROP: 'textures/weapons/drops/weapon_shield',
            CANNON_DROP: 'textures/weapons/drops/weapon_cannon',
            STAFF_DROP: 'textures/weapons/drops/weapon_staff',
            // 图标
            SWORD_COMMON: 'textures/weapons/icons/icon_sword_common',
            SWORD_RARE: 'textures/weapons/icons/icon_sword_rare',
            SWORD_LEGENDARY: 'textures/weapons/icons/icon_sword_legendary',
            SWORD_MYTHICAL: 'textures/weapons/icons/icon_sword_mythical',
        },

        // 炮台
        TOWERS: {
            BASIC: 'textures/towers/tower_basic',
            ARROW: 'textures/towers/tower_arrow',
            CANNON: 'textures/towers/tower_cannon',
            MAGIC: 'textures/towers/tower_magic',
            ICE: 'textures/towers/tower_ice',
            FIRE: 'textures/towers/tower_fire',
            POISON: 'textures/towers/tower_poison',
            LIGHTNING: 'textures/towers/tower_lightning',
        },

        // 地形
        TERRAIN: {
            GRASS_01: 'textures/terrain/tiles/tile_grass_01',
            DIRT_01: 'textures/terrain/tiles/tile_dirt_01',
            STONE_01: 'textures/terrain/tiles/tile_stone_01',
        },

        // UI
        UI: {
            PANEL_BG: 'textures/ui/panels/ui_panel_bg',
            BUTTON_NORMAL: 'textures/ui/buttons/ui_button_normal',
            FRAME_COMMON: 'textures/ui/frames/ui_frame_common',
            FRAME_RARE: 'textures/ui/frames/ui_frame_rare',
            FRAME_LEGENDARY: 'textures/ui/frames/ui_frame_legendary',
            ICON_HP: 'textures/ui/icons/icon_hp',
            ICON_MP: 'textures/ui/icons/icon_mp',
            ICON_GOLD: 'textures/ui/icons/icon_gold',
            ELEMENT_FIRE: 'textures/ui/icons/elements/element_fire',
        },

        // 特效
        EFFECTS: {
            LIGHTNING: 'textures/effects/effect_lightning',
            FIRE_BREATH: 'textures/effects/effect_fire_breath',
        },
    };

    // 怪物类型到精灵图路径的映射
    static readonly MONSTER_TEXTURE_MAP: { [key: string]: string } = {
        'slime': 'textures/monsters/normal/monster_slime',
        'goblin': 'textures/monsters/normal/monster_goblin',
        'skeleton': 'textures/monsters/normal/monster_skeleton',
        'wolf': 'textures/monsters/normal/monster_wolf',
        'spider': 'textures/monsters/normal/monster_spider',
        'bat': 'textures/monsters/normal/monster_bat',
        'ghost': 'textures/monsters/normal/monster_ghost',
        'golem': 'textures/monsters/normal/monster_golem',
    };

    // 精英怪精灵图路径映射
    static readonly ELITE_TEXTURE_MAP: { [key: string]: string } = {
        'goblin': 'textures/monsters/elite/monster_elite_goblin',
        'skeleton': 'textures/monsters/elite/monster_elite_skeleton',
        'wolf': 'textures/monsters/elite/monster_elite_wolf',
        'demon': 'textures/monsters/elite/monster_elite_demon',
    };
}
