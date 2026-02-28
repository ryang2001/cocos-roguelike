/**
 * GameConfig Test Suite
 * 测试游戏配置常量
 */

import { GameConfig } from '../../assets/scripts/config/GameConfig';

describe('GameConfig - 游戏配置测试', () => {
    describe('基础配置', () => {
        test('游戏名称正确', () => {
            expect(GameConfig.GAME_NAME).toBe('继续下一关');
        });

        test('版本号正确', () => {
            expect(GameConfig.VERSION).toBe('1.0.0');
        });

        test('屏幕尺寸配置正确', () => {
            expect(GameConfig.DESIGN_WIDTH).toBe(720);
            expect(GameConfig.DESIGN_HEIGHT).toBe(1280);
        });

        test('世界地图尺寸配置正确', () => {
            expect(GameConfig.WORLD_WIDTH).toBe(3000);
            expect(GameConfig.WORLD_HEIGHT).toBe(3000);
        });
    });

    describe('时间系统配置', () => {
        test('一天时长为10分钟', () => {
            expect(GameConfig.DAY_DURATION).toBe(600000); // 10分钟(毫秒)
        });

        test('总天数为3天', () => {
            expect(GameConfig.TOTAL_DAYS).toBe(3);
        });

        test('时间阶段配置正确', () => {
            expect(GameConfig.TIME_PHASES.DAWN.name).toBe('黎明');
            expect(GameConfig.TIME_PHASES.DAY.name).toBe('白天');
            expect(GameConfig.TIME_PHASES.DUSK.name).toBe('黄昏');
            expect(GameConfig.TIME_PHASES.NIGHT.name).toBe('夜晚');
        });

        test('时间阶段范围配置正确', () => {
            expect(GameConfig.TIME_PHASES.DAWN.start).toBe(0);
            expect(GameConfig.TIME_PHASES.DAWN.end).toBe(0.1);
            expect(GameConfig.TIME_PHASES.DAY.start).toBe(0.1);
            expect(GameConfig.TIME_PHASES.DAY.end).toBe(0.7);
            expect(GameConfig.TIME_PHASES.DUSK.start).toBe(0.7);
            expect(GameConfig.TIME_PHASES.DUSK.end).toBe(0.8);
            expect(GameConfig.TIME_PHASES.NIGHT.start).toBe(0.8);
            expect(GameConfig.TIME_PHASES.NIGHT.end).toBe(1.0);
        });
    });

    describe('元素系统配置', () => {
        test('所有8种元素都有配置', () => {
            expect(GameConfig.ELEMENTS.WOOD).toBeDefined();
            expect(GameConfig.ELEMENTS.WATER).toBeDefined();
            expect(GameConfig.ELEMENTS.FIRE).toBeDefined();
            expect(GameConfig.ELEMENTS.EARTH).toBeDefined();
            expect(GameConfig.ELEMENTS.THUNDER).toBeDefined();
            expect(GameConfig.ELEMENTS.WIND).toBeDefined();
            expect(GameConfig.ELEMENTS.LIGHT).toBeDefined();
            expect(GameConfig.ELEMENTS.DARK).toBeDefined();
        });

        test('元素配置包含名称和颜色', () => {
            expect(GameConfig.ELEMENTS.FIRE.name).toBe('火');
            expect(GameConfig.ELEMENTS.FIRE.color).toBe('#ff4500');

            expect(GameConfig.ELEMENTS.WATER.name).toBe('水');
            expect(GameConfig.ELEMENTS.WATER.color).toBe('#00bfff');
        });
    });

    describe('武器类型配置', () => {
        test('所有6种武器类型都有配置', () => {
            expect(GameConfig.WEAPON_TYPES.SLASH).toBeDefined();
            expect(GameConfig.WEAPON_TYPES.BLUNT).toBeDefined();
            expect(GameConfig.WEAPON_TYPES.PIERCE).toBeDefined();
            expect(GameConfig.WEAPON_TYPES.MAGIC).toBeDefined();
            expect(GameConfig.WEAPON_TYPES.RANGED).toBeDefined();
            expect(GameConfig.WEAPON_TYPES.EXPLOSION).toBeDefined();
        });
    });

    describe('稀有度配置', () => {
        test('所有6种稀有度都有配置', () => {
            expect(GameConfig.RARITY.COMMON).toBeDefined();
            expect(GameConfig.RARITY.UNCOMMON).toBeDefined();
            expect(GameConfig.RARITY.RARE).toBeDefined();
            expect(GameConfig.RARITY.EPIC).toBeDefined();
            expect(GameConfig.RARITY.LEGENDARY).toBeDefined();
            expect(GameConfig.RARITY.MYTHIC).toBeDefined();
        });

        test('稀有度掉率总和接近1.0', () => {
            const totalDropRate =
                GameConfig.RARITY.COMMON.dropRate +
                GameConfig.RARITY.UNCOMMON.dropRate +
                GameConfig.RARITY.RARE.dropRate +
                GameConfig.RARITY.EPIC.dropRate +
                GameConfig.RARITY.LEGENDARY.dropRate +
                GameConfig.RARITY.MYTHIC.dropRate;

            expect(totalDropRate).toBeCloseTo(1.0, 2);
        });

        test('稀有度掉率递减', () => {
            expect(GameConfig.RARITY.COMMON.dropRate).toBeGreaterThan(
                GameConfig.RARITY.UNCOMMON.dropRate
            );
            expect(GameConfig.RARITY.UNCOMMON.dropRate).toBeGreaterThan(
                GameConfig.RARITY.RARE.dropRate
            );
            expect(GameConfig.RARITY.RARE.dropRate).toBeGreaterThan(
                GameConfig.RARITY.EPIC.dropRate
            );
            expect(GameConfig.RARITY.EPIC.dropRate).toBeGreaterThan(
                GameConfig.RARITY.LEGENDARY.dropRate
            );
            expect(GameConfig.RARITY.LEGENDARY.dropRate).toBeGreaterThan(
                GameConfig.RARITY.MYTHIC.dropRate
            );
        });
    });

    describe('玩家基础属性', () => {
        test('基础生命值配置正确', () => {
            expect(GameConfig.PLAYER.BASE_HP).toBe(100);
        });

        test('基础移动速度配置正确', () => {
            expect(GameConfig.PLAYER.BASE_SPEED).toBe(150);
        });

        test('基础暴击率配置正确', () => {
            expect(GameConfig.PLAYER.BASE_CRIT_RATE).toBe(0.05);
        });

        test('基础暴击伤害配置正确', () => {
            expect(GameConfig.PLAYER.BASE_CRIT_DAMAGE).toBe(1.5);
        });

        test('背包容量配置正确', () => {
            expect(GameConfig.PLAYER.INVENTORY_SIZE).toBe(20);
        });
    });

    describe('武器配置', () => {
        test('剑配置正确', () => {
            const sword = GameConfig.WEAPONS.SWORD;
            expect(sword.name).toBe('剑');
            expect(sword.type).toBe('slash');
            expect(sword.range).toBe(80);
            expect(sword.attackSpeed).toBe(1.5);
            expect(sword.baseDamage).toBe(20);
        });

        test('枪配置正确', () => {
            const spear = GameConfig.WEAPONS.SPEAR;
            expect(spear.name).toBe('枪');
            expect(spear.type).toBe('pierce');
            expect(spear.range).toBe(300);
            expect(spear.attackSpeed).toBe(2.0);
            expect(spear.baseDamage).toBe(15);
        });

        test('炮配置正确', () => {
            const cannon = GameConfig.WEAPONS.CANNON;
            expect(cannon.name).toBe('炮');
            expect(cannon.type).toBe('explosion');
            expect(cannon.range).toBe(250);
            expect(cannon.attackSpeed).toBe(0.8);
            expect(cannon.baseDamage).toBe(30);
        });

        test('法杖配置正确', () => {
            const staff = GameConfig.WEAPONS.STAFF;
            expect(staff.name).toBe('法杖');
            expect(staff.type).toBe('magic');
            expect(staff.range).toBe(200);
            expect(staff.attackSpeed).toBe(1.2);
            expect(staff.baseDamage).toBe(18);
        });
    });

    describe('怪物配置', () => {
        test('史莱姆配置正确', () => {
            const slime = GameConfig.MONSTERS.SLIME;
            expect(slime.name).toBe('史莱姆');
            expect(slime.hp).toBe(50);
            expect(slime.damage).toBe(5);
            expect(slime.speed).toBe(80);
            expect(slime.exp).toBe(10);
            expect(slime.gold).toBe(5);
        });

        test('哥布林配置正确', () => {
            const goblin = GameConfig.MONSTERS.GOBLIN;
            expect(goblin.name).toBe('哥布林');
            expect(goblin.hp).toBe(80);
            expect(goblin.damage).toBe(10);
            expect(goblin.speed).toBe(100);
            expect(goblin.exp).toBe(20);
            expect(goblin.gold).toBe(10);
        });

        test('骷髅配置正确', () => {
            const skeleton = GameConfig.MONSTERS.SKELETON;
            expect(skeleton.name).toBe('骷髅');
            expect(skeleton.hp).toBe(60);
            expect(skeleton.damage).toBe(15);
            expect(skeleton.speed).toBe(120);
            expect(skeleton.exp).toBe(15);
            expect(skeleton.gold).toBe(8);
        });

        test('狼配置正确', () => {
            const wolf = GameConfig.MONSTERS.WOLF;
            expect(wolf.name).toBe('狼');
            expect(wolf.hp).toBe(70);
            expect(wolf.damage).toBe(12);
            expect(wolf.speed).toBe(150);
            expect(wolf.exp).toBe(18);
            expect(wolf.gold).toBe(12);
        });
    });

    describe('Boss配置', () => {
        test('哥布林王配置正确', () => {
            const boss = GameConfig.BOSSES.GOBLIN_KING;
            expect(boss.name).toBe('哥布林王');
            expect(boss.hp).toBe(1000);
            expect(boss.damage).toBe(30);
            expect(boss.skills).toContain('summon');
            expect(boss.skills).toContain('throw_bomb');
        });

        test('魔王配置正确', () => {
            const boss = GameConfig.BOSSES.DEMON_KING;
            expect(boss.name).toBe('魔王');
            expect(boss.hp).toBe(3000);
            expect(boss.damage).toBe(50);
            expect(boss.skills).toContain('berserk');
        });

        test('龙Boss配置正确', () => {
            const boss = GameConfig.BOSSES.DRAGON_BOSS;
            expect(boss.name).toBe('龙');
            expect(boss.hp).toBe(5000);
            expect(boss.damage).toBe(80);
            expect(boss.skills).toContain('breath_attack');
            expect(boss.skills).toContain('fly_attack');
        });
    });

    describe('地形配置', () => {
        test('所有8种地形都有配置', () => {
            expect(GameConfig.TERRAIN.PLAIN).toBeDefined();
            expect(GameConfig.TERRAIN.FOREST).toBeDefined();
            expect(GameConfig.TERRAIN.MOUNTAIN).toBeDefined();
            expect(GameConfig.TERRAIN.VOLCANO).toBeDefined();
            expect(GameConfig.TERRAIN.DESERT).toBeDefined();
            expect(GameConfig.TERRAIN.SWAMP).toBeDefined();
            expect(GameConfig.TERRAIN.CASTLE).toBeDefined();
            expect(GameConfig.TERRAIN.WATER).toBeDefined();
        });

        test('每种地形都有名称和颜色', () => {
            Object.values(GameConfig.TERRAIN).forEach((terrain: any) => {
                expect(terrain.name).toBeDefined();
                expect(terrain.color).toBeDefined();
            });
        });
    });

    describe('波次配置', () => {
        test('第1天波次配置正确', () => {
            const wave = GameConfig.WAVES.DAY_1;
            expect(wave.monsters.slime).toBe(20);
            expect(wave.monsters.goblin).toBe(10);
            expect(wave.elites).toBe(2);
            expect(wave.boss).toBeNull();
        });

        test('第2天波次配置正确', () => {
            const wave = GameConfig.WAVES.DAY_2;
            expect(wave.monsters.slime).toBe(30);
            expect(wave.monsters.goblin).toBe(20);
            expect(wave.monsters.skeleton).toBe(10);
            expect(wave.elites).toBe(5);
            expect(wave.boss).toBe('goblin_king');
        });

        test('第3天波次配置正确', () => {
            const wave = GameConfig.WAVES.DAY_3;
            expect(wave.monsters.slime).toBe(40);
            expect(wave.monsters.goblin).toBe(30);
            expect(wave.monsters.skeleton).toBe(20);
            expect(wave.monsters.wolf).toBe(10);
            expect(wave.elites).toBe(8);
            expect(wave.boss).toBe('dragon_boss');
        });

        test('波次难度随天数递增', () => {
            const day1Total = Object.values(GameConfig.WAVES.DAY_1.monsters)
                .reduce((sum: number, count: number) => sum + count, 0);
            const day2Total = Object.values(GameConfig.WAVES.DAY_2.monsters)
                .reduce((sum: number, count: number) => sum + count, 0);
            const day3Total = Object.values(GameConfig.WAVES.DAY_3.monsters)
                .reduce((sum: number, count: number) => sum + count, 0);

            expect(day2Total).toBeGreaterThan(day1Total);
            expect(day3Total).toBeGreaterThan(day2Total);
        });
    });

    describe('纹理路径配置', () => {
        test('角色纹理路径配置正确', () => {
            expect(GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_KNIGHT).toBe(
                'textures/characters/player/player_knight'
            );
        });

        test('怪物纹理路径配置正确', () => {
            expect(GameConfig.TEXTURE_PATHS.MONSTERS.SLIME).toBe(
                'textures/monsters/normal/monster_slime'
            );
        });

        test('武器纹理路径配置正确', () => {
            expect(GameConfig.TEXTURE_PATHS.WEAPONS.SWORD_DROP).toBe(
                'textures/weapons/drops/weapon_sword'
            );
        });

        test('炮台纹理路径配置正确', () => {
            expect(GameConfig.TEXTURE_PATHS.TOWERS.BASIC).toBe('textures/towers/tower_basic');
        });
    });

    describe('怪物纹理映射', () => {
        test('普通怪物纹理映射包含所有怪物', () => {
            expect(GameConfig.MONSTER_TEXTURE_MAP['slime']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['goblin']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['skeleton']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['wolf']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['spider']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['bat']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['ghost']).toBeDefined();
            expect(GameConfig.MONSTER_TEXTURE_MAP['golem']).toBeDefined();
        });

        test('精英怪物纹理映射正确', () => {
            expect(GameConfig.ELITE_TEXTURE_MAP['goblin']).toBeDefined();
            expect(GameConfig.ELITE_TEXTURE_MAP['skeleton']).toBeDefined();
            expect(GameConfig.ELITE_TEXTURE_MAP['wolf']).toBeDefined();
            expect(GameConfig.ELITE_TEXTURE_MAP['demon']).toBeDefined();
        });
    });
});
