/**
 * Types Test Suite
 * 测试游戏类型定义和工具函数
 */

import {
    ElementType,
    WeaponType,
    Rarity,
    WeaponAttackType,
    ModifierType,
    getElementAdvantage,
    getRarityConfig,
    getElementConfig,
    getWeaponAttackType,
    DEFAULT_RESISTANCES,
} from '../../assets/scripts/types/Types';
import { Vec3 } from '../mocks/cocos-mock';

describe('Types - 基础类型测试', () => {
    describe('ElementType 元素类型', () => {
        test('应该包含所有8种元素', () => {
            expect(ElementType.NONE).toBe(0);
            expect(ElementType.WOOD).toBe(1);
            expect(ElementType.WATER).toBe(2);
            expect(ElementType.FIRE).toBe(3);
            expect(ElementType.EARTH).toBe(4);
            expect(ElementType.THUNDER).toBe(5);
            expect(ElementType.WIND).toBe(6);
            expect(ElementType.LIGHT).toBe(7);
            expect(ElementType.DARK).toBe(8);
        });
    });

    describe('WeaponType 武器类型', () => {
        test('应该包含所有6种武器类型', () => {
            expect(WeaponType.SWORD).toBe(0);
            expect(WeaponType.SPEAR).toBe(1);
            expect(WeaponType.CANNON).toBe(2);
            expect(WeaponType.STAFF).toBe(3);
            expect(WeaponType.BOW).toBe(4);
            expect(WeaponType.DAGGER).toBe(5);
        });
    });

    describe('Rarity 稀有度', () => {
        test('应该包含所有6种稀有度', () => {
            expect(Rarity.COMMON).toBe(0);
            expect(Rarity.GOOD).toBe(1);
            expect(Rarity.RARE).toBe(2);
            expect(Rarity.EPIC).toBe(3);
            expect(Rarity.LEGENDARY).toBe(4);
            expect(Rarity.MYTHICAL).toBe(5);
        });
    });

    describe('WeaponAttackType 攻击类型', () => {
        test('应该包含所有6种攻击类型', () => {
            expect(WeaponAttackType.SLASH).toBe('slash');
            expect(WeaponAttackType.BLUNT).toBe('blunt');
            expect(WeaponAttackType.PIERCE).toBe('pierce');
            expect(WeaponAttackType.MAGIC).toBe('magic');
            expect(WeaponAttackType.RANGED).toBe('ranged');
            expect(WeaponAttackType.EXPLOSION).toBe('explosion');
        });
    });

    describe('ModifierType 词条类型', () => {
        test('应该包含基础属性类词条', () => {
            expect(ModifierType.ATTACK_PERCENT).toBe('attack_percent');
            expect(ModifierType.DEFENSE_PERCENT).toBe('defense_percent');
            expect(ModifierType.HP_PERCENT).toBe('hp_percent');
            expect(ModifierType.MOVE_SPEED_PERCENT).toBe('move_speed_percent');
        });

        test('应该包含战斗属性类词条', () => {
            expect(ModifierType.CRIT_RATE).toBe('crit_rate');
            expect(ModifierType.CRIT_DAMAGE).toBe('crit_damage');
            expect(ModifierType.ATTACK_SPEED).toBe('attack_speed');
            expect(ModifierType.LIFE_STEAL).toBe('life_steal');
        });

        test('应该包含元素攻击类词条', () => {
            expect(ModifierType.ELEMENT_ATTACK_FIRE).toBe('element_attack_fire');
            expect(ModifierType.ELEMENT_ATTACK_WATER).toBe('element_attack_water');
            expect(ModifierType.ELEMENT_ATTACK_THUNDER).toBe('element_attack_thunder');
        });

        test('应该包含武器类型伤害词条', () => {
            expect(ModifierType.WEAPON_DAMAGE_SLASH).toBe('weapon_damage_slash');
            expect(ModifierType.WEAPON_DAMAGE_BLUNT).toBe('weapon_damage_blunt');
            expect(ModifierType.WEAPON_DAMAGE_PIERCE).toBe('weapon_damage_pierce');
        });
    });
});

describe('Types - 工具函数测试', () => {
    describe('getElementAdvantage 元素克制', () => {
        test('无元素应该返回1.0', () => {
            expect(getElementAdvantage(ElementType.NONE, ElementType.FIRE)).toBe(1.0);
            expect(getElementAdvantage(ElementType.FIRE, ElementType.NONE)).toBe(1.0);
        });

        test('木克土应该返回2.0', () => {
            expect(getElementAdvantage(ElementType.WOOD, ElementType.EARTH)).toBe(2.0);
        });

        test('土克水应该返回2.0', () => {
            expect(getElementAdvantage(ElementType.EARTH, ElementType.WATER)).toBe(2.0);
        });

        test('水克火应该返回2.0', () => {
            expect(getElementAdvantage(ElementType.WATER, ElementType.FIRE)).toBe(2.0);
        });

        test('火被水克应该返回0.5', () => {
            expect(getElementAdvantage(ElementType.FIRE, ElementType.WATER)).toBe(0.5);
        });

        test('光克暗应该返回2.0', () => {
            expect(getElementAdvantage(ElementType.LIGHT, ElementType.DARK)).toBe(2.0);
        });

        test('暗克光应该返回2.0', () => {
            expect(getElementAdvantage(ElementType.DARK, ElementType.LIGHT)).toBe(2.0);
        });
    });

    describe('getRarityConfig 稀有度配置', () => {
        test('普通稀有度配置正确', () => {
            const config = getRarityConfig(Rarity.COMMON);
            expect(config.name).toBe('普通');
            expect(config.color).toBe('#ffffff');
            expect(config.dropRate).toBe(0.50);
        });

        test('传说稀有度配置正确', () => {
            const config = getRarityConfig(Rarity.LEGENDARY);
            expect(config.name).toBe('传说');
            expect(config.color).toBe('#ff8000');
            expect(config.dropRate).toBe(0.009);
        });

        test('神话稀有度配置正确', () => {
            const config = getRarityConfig(Rarity.MYTHICAL);
            expect(config.name).toBe('神话');
            expect(config.color).toBe('#ff0000');
            expect(config.dropRate).toBe(0.001);
        });

        test('无效稀有度返回默认值', () => {
            const config = getRarityConfig(999 as Rarity);
            expect(config.name).toBe('普通');
        });
    });

    describe('getElementConfig 元素配置', () => {
        test('火元素配置正确', () => {
            const config = getElementConfig(ElementType.FIRE);
            expect(config.name).toBe('火');
            expect(config.color).toBe('#ff4500');
        });

        test('水元素配置正确', () => {
            const config = getElementConfig(ElementType.WATER);
            expect(config.name).toBe('水');
            expect(config.color).toBe('#00bfff');
        });

        test('无效元素返回默认配置', () => {
            const config = getElementConfig(999 as ElementType);
            expect(config.name).toBe('无');
        });
    });

    describe('getWeaponAttackType 武器攻击类型映射', () => {
        test('剑对应斩击', () => {
            expect(getWeaponAttackType(WeaponType.SWORD)).toBe(WeaponAttackType.SLASH);
        });

        test('枪对应戳击', () => {
            expect(getWeaponAttackType(WeaponType.SPEAR)).toBe(WeaponAttackType.PIERCE);
        });

        test('炮对应爆炸', () => {
            expect(getWeaponAttackType(WeaponType.CANNON)).toBe(WeaponAttackType.EXPLOSION);
        });

        test('法杖对应魔法', () => {
            expect(getWeaponAttackType(WeaponType.STAFF)).toBe(WeaponAttackType.MAGIC);
        });

        test('弓对应射击', () => {
            expect(getWeaponAttackType(WeaponType.BOW)).toBe(WeaponAttackType.RANGED);
        });

        test('匕首对应打击', () => {
            expect(getWeaponAttackType(WeaponType.DAGGER)).toBe(WeaponAttackType.BLUNT);
        });
    });

    describe('DEFAULT_RESISTANCES 默认抗性', () => {
        test('所有元素抗性默认为0', () => {
            expect(DEFAULT_RESISTANCES.wood).toBe(0);
            expect(DEFAULT_RESISTANCES.water).toBe(0);
            expect(DEFAULT_RESISTANCES.fire).toBe(0);
            expect(DEFAULT_RESISTANCES.earth).toBe(0);
            expect(DEFAULT_RESISTANCES.thunder).toBe(0);
            expect(DEFAULT_RESISTANCES.wind).toBe(0);
            expect(DEFAULT_RESISTANCES.light).toBe(0);
            expect(DEFAULT_RESISTANCES.dark).toBe(0);
        });

        test('所有物理抗性默认为0', () => {
            expect(DEFAULT_RESISTANCES.slash).toBe(0);
            expect(DEFAULT_RESISTANCES.blunt).toBe(0);
            expect(DEFAULT_RESISTANCES.pierce).toBe(0);
            expect(DEFAULT_RESISTANCES.magic).toBe(0);
            expect(DEFAULT_RESISTANCES.ranged).toBe(0);
            expect(DEFAULT_RESISTANCES.explosion).toBe(0);
        });
    });
});
