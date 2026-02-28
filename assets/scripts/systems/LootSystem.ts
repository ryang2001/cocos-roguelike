/**
 * 掉落系统 - Cocos Creator版本
 * 负责生成和管理怪物掉落物品
 */

import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { IItem, Rarity, ItemType, IEquipmentItem, IWeaponItem, WeaponType, ElementType } from '../types/Types';
import { Item } from '../entities/Item';

const { ccclass, property } = _decorator;

@ccclass('LootSystem')
export class LootSystem extends Component {
    // 单例
    private static _instance: LootSystem | null = null;
    public static get instance(): LootSystem | null {
        return this._instance;
    }

    // ==================== 编辑器属性 ====================

    @property({ type: Prefab, displayName: '物品预制体' })
    itemPrefab: Prefab | null = null;

    @property({ displayName: '掉落扩散范围' })
    dropSpreadRange: number = 50;

    // ==================== 私有属性 ====================

    // 掉落率配置
    private readonly _baseDropRate: number = 0.2; // 20% 基础掉落率

    // 稀有度权重 (数值越大，概率越高)
    private readonly _rarityWeights: { [key in Rarity]: number } = {
        [Rarity.COMMON]: 50,
        [Rarity.GOOD]: 30,
        [Rarity.RARE]: 15,
        [Rarity.EPIC]: 4,
        [Rarity.LEGENDARY]: 0.9,
        [Rarity.MYTHICAL]: 0.1
    };

    // ==================== 生命周期 ====================

    onLoad() {
        if (LootSystem._instance === null) {
            LootSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        console.log('LootSystem: 掉落系统初始化完成');
    }

    onDestroy() {
        if (LootSystem._instance === this) {
            LootSystem._instance = null;
        }
    }

    // ==================== 主要接口 ====================

    /**
     * 生成掉落物
     * @param position 掉落位置
     * @param sourceLevel 来源等级
     * @param rarityBonus 稀有度加成 (-5到+5)
     * @param isElite 是否是精英怪
     */
    spawnLoot(position: Vec3, sourceLevel: number, rarityBonus: number = 0, isElite: boolean = false): void {
        // 计算掉落率
        const dropRate = this._baseDropRate * (isElite ? 2.5 : 1);

        if (Math.random() > dropRate) {
            return; // 没有掉落
        }

        // 生成物品
        const item = this.generateRandomItem(sourceLevel, rarityBonus);

        // 创建掉落物节点
        this.createDropNode(position, item);
    }

    /**
     * 生成多个掉落物 (用于Boss死亡)
     */
    spawnMultipleLoot(position: Vec3, sourceLevel: number, count: number, isBoss: boolean = false): void {
        const rarityBonus = isBoss ? 3 : 0;

        for (let i = 0; i < count; i++) {
            // 计算扩散位置
            const offset = new Vec3(
                (Math.random() - 0.5) * this.dropSpreadRange * 2,
                (Math.random() - 0.5) * this.dropSpreadRange * 2,
                0
            );
            const dropPos = new Vec3();
            Vec3.add(dropPos, position, offset);

            this.scheduleOnce(() => {
                this.spawnLoot(dropPos, sourceLevel, rarityBonus, isBoss);
            }, i * 0.1); // 间隔0.1秒掉落
        }
    }

    /**
     * 生成指定物品
     */
    spawnSpecificItem(position: Vec3, item: IItem): void {
        this.createDropNode(position, item);
    }

    // ==================== 物品生成 ====================

    /**
     * 随机生成物品
     */
    generateRandomItem(level: number, rarityBonus: number): IItem {
        // 计算稀有度
        const rarity = this.calculateDropRarity(level, rarityBonus);

        // 随机选择物品类型
        const itemType = this.randomItemType();

        // 根据类型生成物品
        switch (itemType) {
            case ItemType.WEAPON:
                return this.generateWeapon(level, rarity);
            case ItemType.EQUIPMENT:
                return this.generateEquipment(level, rarity);
            case ItemType.CONSUMABLE:
                return this.generateConsumable(level, rarity);
            default:
                return this.generateMaterial(level, rarity);
        }
    }

    /**
     * 生成武器
     */
    private generateWeapon(level: number, rarity: Rarity): IWeaponItem {
        const weaponTypes = [
            WeaponType.SWORD,
            WeaponType.SPEAR,
            WeaponType.CANNON,
            WeaponType.STAFF,
            WeaponType.BOW,
            WeaponType.DAGGER
        ];
        const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

        const elements = [
            ElementType.NONE,
            ElementType.FIRE,
            ElementType.WATER,
            ElementType.THUNDER,
            ElementType.WOOD,
            ElementType.WIND,
            ElementType.LIGHT,
            ElementType.DARK
        ];
        const element = (Math.random() < 0.3) ? // 30%概率有元素属性
            elements[Math.floor(Math.random() * elements.length)] :
            ElementType.NONE;

        const baseDamage = 10 + level * 5;
        const rarityMultiplier = this.getRarityMultiplier(rarity);

        return {
            id: `weapon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.generateWeaponName(weaponType, element, rarity),
            description: this.generateWeaponDescription(weaponType, element),
            itemType: ItemType.WEAPON,
            rarity: rarity,
            level: level,
            icon: `weapons/${weaponType}_${rarity}.png`,
            stackable: false,
            maxStack: 1,
            sellPrice: Math.floor(10 * rarityMultiplier * level),
            buyPrice: Math.floor(25 * rarityMultiplier * level),
            weaponType: weaponType,
            damage: Math.floor(baseDamage * rarityMultiplier),
            attackSpeed: 1.0 + (rarity * 0.1),
            range: weaponType === WeaponType.BOW ? 300 : 80,
            element: element !== ElementType.NONE ? element : undefined
        };
    }

    /**
     * 生成装备
     */
    private generateEquipment(level: number, rarity: Rarity): IEquipmentItem {
        const equipmentSlots = [
            'mainhand' as const,
            'offhand' as const,
            'helmet' as const,
            'chest' as const,
            'gloves' as const,
            'boots' as const
        ];
        const slot = equipmentSlots[Math.floor(Math.random() * equipmentSlots.length)];

        const rarityMultiplier = this.getRarityMultiplier(rarity);
        const baseStat = 5 + level * 3;

        return {
            id: `equip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.generateEquipmentName(slot, rarity),
            description: this.generateEquipmentDescription(slot, rarity),
            itemType: ItemType.EQUIPMENT,
            rarity: rarity,
            level: level,
            icon: `equipment/${slot}_${rarity}.png`,
            stackable: false,
            maxStack: 1,
            sellPrice: Math.floor(8 * rarityMultiplier * level),
            buyPrice: Math.floor(20 * rarityMultiplier * level),
            equipmentSlot: slot,
            stats: this.generateEquipmentStats(slot, baseStat, rarity)
        };
    }

    /**
     * 生成消耗品
     */
    private generateConsumable(level: number, rarity: Rarity): IItem {
        const consumableTypes = ['生命药水', '法力药水', '速度卷轴', '力量卷轴'];
        const type = consumableTypes[Math.floor(Math.random() * consumableTypes.length)];

        const rarityMultiplier = this.getRarityMultiplier(rarity);

        return {
            id: `consumable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${type} (+${Math.floor(level * 10 * rarityMultiplier)})`,
            description: `恢复${Math.floor(level * 10 * rarityMultiplier)}点${type.includes('生命') ? '生命' : type.includes('法力') ? '法力' : '属性'}`,
            itemType: ItemType.CONSUMABLE,
            rarity: rarity,
            level: level,
            icon: `consumables/${type}.png`,
            stackable: true,
            maxStack: 99,
            sellPrice: Math.floor(2 * rarityMultiplier),
            buyPrice: Math.floor(5 * rarityMultiplier)
        } as any;
    }

    /**
     * 生成材料
     */
    private generateMaterial(level: number, rarity: Rarity): IItem {
        const materials = ['铁矿石', '魔法水晶', '龙鳞', '符文石', '精金矿'];
        const material = materials[Math.floor(Math.random() * materials.length)];

        const rarityMultiplier = this.getRarityMultiplier(rarity);

        return {
            id: `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${material} (Lv.${level})`,
            description: '用于制作装备和物品',
            itemType: ItemType.MATERIAL,
            rarity: rarity,
            level: level,
            icon: `materials/${material}.png`,
            stackable: true,
            maxStack: 999,
            sellPrice: Math.floor(1 * rarityMultiplier * level),
            buyPrice: Math.floor(3 * rarityMultiplier * level)
        };
    }

    /**
     * 生成装备属性
     */
    private generateEquipmentStats(slot: string, baseValue: number, rarity: Rarity): any {
        const multiplier = this.getRarityMultiplier(rarity);
        const stats: any = {};

        switch (slot) {
            case 'helmet':
                stats.hp = Math.floor(baseValue * multiplier * 2);
                stats.defense = Math.floor(baseValue * multiplier * 0.5);
                break;
            case 'chest':
                stats.hp = Math.floor(baseValue * multiplier * 3);
                stats.defense = Math.floor(baseValue * multiplier);
                break;
            case 'gloves':
                stats.damage = Math.floor(baseValue * multiplier * 0.3);
                stats.critRate = 0.02 * multiplier;
                break;
            case 'boots':
                stats.moveSpeed = Math.floor(baseValue * multiplier * 0.5);
                stats.defense = Math.floor(baseValue * multiplier * 0.3);
                break;
            case 'mainhand':
                stats.damage = Math.floor(baseValue * multiplier);
                break;
            case 'offhand':
                stats.defense = Math.floor(baseValue * multiplier * 0.8);
                stats.critDamage = 0.1 * multiplier;
                break;
        }

        return stats;
    }

    // ==================== 计算方法 ====================

    /**
     * 计算掉落稀有度
     */
    calculateDropRarity(level: number, bonus: number): Rarity {
        // 计算加权稀有度
        const adjustedWeights: { [key in Rarity]: number } = {
            [Rarity.COMMON]: this._rarityWeights[Rarity.COMMON],
            [Rarity.GOOD]: this._rarityWeights[Rarity.GOOD],
            [Rarity.RARE]: this._rarityWeights[Rarity.RARE],
            [Rarity.EPIC]: this._rarityWeights[Rarity.EPIC],
            [Rarity.LEGENDARY]: this._rarityWeights[Rarity.LEGENDARY] * (1 + bonus * 0.2),
            [Rarity.MYTHICAL]: this._rarityWeights[Rarity.MYTHICAL] * (1 + bonus * 0.1)
        };

        // 计算总权重
        let totalWeight = 0;
        for (const weight of Object.values(adjustedWeights)) {
            totalWeight += weight;
        }

        // 随机选择
        let random = Math.random() * totalWeight;
        for (const [rarity, weight] of Object.entries(adjustedWeights)) {
            random -= weight;
            if (random <= 0) {
                return parseInt(rarity) as Rarity;
            }
        }

        return Rarity.COMMON;
    }

    /**
     * 获取稀有度乘数
     */
    private getRarityMultiplier(rarity: Rarity): number {
        const multipliers: { [key in Rarity]: number } = {
            [Rarity.COMMON]: 1.0,
            [Rarity.GOOD]: 1.3,
            [Rarity.RARE]: 1.6,
            [Rarity.EPIC]: 2.0,
            [Rarity.LEGENDARY]: 2.5,
            [Rarity.MYTHICAL]: 3.0
        };
        return multipliers[rarity];
    }

    /**
     * 随机物品类型
     */
    private randomItemType(): ItemType {
        const types = [
            ItemType.WEAPON,
            ItemType.EQUIPMENT,
            ItemType.CONSUMABLE,
            ItemType.MATERIAL
        ];
        const weights = [25, 25, 30, 20]; // 权重

        let total = 0;
        for (const w of weights) total += w;

        let random = Math.random() * total;
        for (let i = 0; i < types.length; i++) {
            random -= weights[i];
            if (random <= 0) return types[i];
        }

        return ItemType.MATERIAL;
    }

    // ==================== 名称生成 ====================

    /**
     * 生成武器名称
     */
    private generateWeaponName(type: WeaponType, element: ElementType, rarity: Rarity): string {
        const typeNames: { [key in WeaponType]: string } = {
            [WeaponType.SWORD]: '剑',
            [WeaponType.SPEAR]: '矛',
            [WeaponType.CANNON]: '炮',
            [WeaponType.STAFF]: '法杖',
            [WeaponType.BOW]: '弓',
            [WeaponType.DAGGER]: '匕首'
        };

        const rarityPrefixes: { [key in Rarity]: string } = {
            [Rarity.COMMON]: '普通',
            [Rarity.GOOD]: '精良',
            [Rarity.RARE]: '稀有',
            [Rarity.EPIC]: '史诗',
            [Rarity.LEGENDARY]: '传说',
            [Rarity.MYTHICAL]: '神话'
        };

        const elementSuffixes: { [key in ElementType]: string } = {
            [ElementType.NONE]: '',
            [ElementType.FIRE]: '火焰',
            [ElementType.WATER]: '冰霜',
            [ElementType.THUNDER]: '雷霆',
            [ElementType.WOOD]: '自然',
            [ElementType.WIND]: '风暴',
            [ElementType.LIGHT]: '圣光',
            [ElementType.DARK]: '暗影',
            [ElementType.EARTH]: '大地'
        };

        let name = rarityPrefixes[rarity];
        if (element !== ElementType.NONE) {
            name += elementSuffixes[element];
        }
        name += typeNames[type];

        return name;
    }

    /**
     * 生成武器描述
     */
    private generateWeaponDescription(type: WeaponType, element: ElementType): string {
        let desc = `一把${type === WeaponType.SWORD ? '锋利' : type === WeaponType.STAFF ? '神秘' : '强大'}的武器`;
        if (element !== ElementType.NONE) {
            desc += `，附带有${element === ElementType.FIRE ? '火焰' : element === ElementType.WATER ? '冰霜' : element === ElementType.THUNDER ? '雷霆' : '元素'}之力`;
        }
        return desc;
    }

    /**
     * 生成装备名称
     */
    private generateEquipmentName(slot: string, rarity: Rarity): string {
        const slotNames: { [key: string]: string } = {
            mainhand: '武器',
            offhand: '护盾',
            helmet: '头盔',
            chest: '胸甲',
            gloves: '手套',
            boots: '战靴'
        };

        const rarityPrefixes: { [key in Rarity]: string } = {
            [Rarity.COMMON]: '粗布',
            [Rarity.GOOD]: '精制',
            [Rarity.RARE]: '精良',
            [Rarity.EPIC]: '光辉',
            [Rarity.LEGENDARY]: '传说',
            [Rarity.MYTHICAL]: '不朽'
        };

        return rarityPrefixes[rarity] + slotNames[slot];
    }

    /**
     * 生成装备描述
     */
    private generateEquipmentDescription(slot: string, rarity: Rarity): string {
        const slotNames: { [key: string]: string } = {
            mainhand: '武器',
            offhand: '护盾',
            helmet: '头盔',
            chest: '胸甲',
            gloves: '手套',
            boots: '战靴'
        };
        return `一件${rarity >= Rarity.EPIC ? '极其' : ''}强力的${slotNames[slot]}`;
    }

    // ==================== 节点创建 ====================

    /**
     * 创建掉落物节点
     */
    private createDropNode(position: Vec3, item: IItem): void {
        // 如果没有预制体，直接创建节点
        let dropNode: Node;
        if (this.itemPrefab) {
            dropNode = instantiate(this.itemPrefab);
        } else {
            dropNode = new Node('DropItem');
        }

        dropNode.setPosition(position);

        // 添加Item组件
        const itemComponent = dropNode.getComponent(Item);
        if (!itemComponent) {
            dropNode.addComponent(Item);
        }

        // 设置物品数据
        const itemComp = dropNode.getComponent(Item);
        if (itemComp) {
            itemComp.setItemData(item, 1);
        }

        // 添加到场景
        this.node.scene.getChildByName('WorldContainer')?.addChild(dropNode);

        console.log(`掉落物品: ${item.name} (${Rarity[item.rarity]}) 在 (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
    }
}
