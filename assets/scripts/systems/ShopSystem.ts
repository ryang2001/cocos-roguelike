/**
 * 商店系统 - Cocos Creator版本
 * 管理游戏中的商店功能
 */

import { _decorator, Component } from 'cc';
import { IItem, Rarity, ItemType, IEquipmentItem, IWeaponItem, WeaponType, ElementType, IModifier } from '../types/Types';
import { InventorySystem } from './InventorySystem';
import { ModifierSystem } from './ModifierSystem';

const { ccclass } = _decorator;

/**
 * 商店类型
 */
export enum ShopType {
    DAILY = 'daily',           // 每日商店
    MYSTERY = 'mystery',       // 神秘商人
    EQUIPMENT = 'equipment',   // 装备商店
    CONSUMABLE = 'consumable', // 消耗品商店
    MODIFIER = 'modifier'      // 词条商店 [新增]
}

/**
 * 商店物品数据
 */
export interface IShopItem {
    item: IItem;
    stock: number;             // 库存数量 (-1表示无限)
    originalPrice: number;     // 原价
    discount: number;          // 折扣 (0-1)
    isSoldOut: boolean;        // 是否已售罄
}

/**
 * 词条商店物品数据 [新增]
 */
export interface IModifierShopItem {
    modifier: IModifier;
    stock: number;
    originalPrice: number;
    discount: number;
    isSoldOut: boolean;
}

/**
 * 商店系统单例
 */
@ccclass('ShopSystem')
export class ShopSystem extends Component {
    // 单例
    private static _instance: ShopSystem | null = null;
    public static get instance(): ShopSystem | null {
        return this._instance;
    }

    // ==================== 私有属性 ====================

    // 当前商店物品
    private _shopItems: IShopItem[] = [];

    // 词条商店物品 [新增]
    private _modifierShopItems: IModifierShopItem[] = [];

    // 词条系统引用 [新增]
    private _modifierSystem: ModifierSystem | null = null;

    // 商店类型
    private _currentShopType: ShopType = ShopType.DAILY;

    // 刷新次数
    private _refreshCount: number = 0;

    // 事件回调
    private _onShopChange: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad() {
        if (ShopSystem._instance === null) {
            ShopSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 获取词条系统引用
        this._modifierSystem = ModifierSystem.instance;

        console.log('ShopSystem: 商店系统初始化完成');
    }

    onDestroy() {
        if (ShopSystem._instance === this) {
            ShopSystem._instance = null;
        }
    }

    // ==================== 主要接口 ====================

    /**
     * 刷新每日商店
     * @param day 当前天数
     */
    refreshDailyShop(day: number): void {
        this._currentShopType = ShopType.DAILY;
        this._refreshCount++;
        this._shopItems = this.generateShopItems(day, ShopType.DAILY);

        console.log(`ShopSystem: 第${day}天商店已刷新`);
        this.notifyShopChange();
    }

    /**
     * 刷新神秘商人商店
     * @param day 当前天数
     */
    refreshMysteryShop(day: number): void {
        this._currentShopType = ShopType.MYSTERY;
        this._shopItems = this.generateShopItems(day, ShopType.MYSTERY);

        console.log(`ShopSystem: 神秘商人已出现`);
        this.notifyShopChange();
    }

    /**
     * 手动刷新商店 (花费金币)
     * @param cost 刷新花费
     */
    manualRefresh(cost: number): boolean {
        const inventory = InventorySystem.instance;
        if (!inventory) return false;

        if (inventory.spendGold(cost)) {
            // 重新生成当前类型商店
            const day = this.getCurrentDay();
            this._shopItems = this.generateShopItems(day, this._currentShopType);
            this._refreshCount++;

            console.log(`ShopSystem: 商店已手动刷新 (花费${cost}金币)`);
            this.notifyShopChange();
            return true;
        }

        return false;
    }

    /**
     * 购买物品
     * @param index 商店物品索引
     * @returns 是否购买成功
     */
    buyItem(index: number): boolean {
        if (index < 0 || index >= this._shopItems.length) return false;

        const shopItem = this._shopItems[index];
        if (shopItem.isSoldOut) {
            console.log('该物品已售罄');
            return false;
        }

        const inventory = InventorySystem.instance;
        if (!inventory) return false;

        // 计算实际价格
        const price = this.calculatePrice(shopItem, false);

        // 检查金币
        if (inventory.getGold() < price) {
            console.log('金币不足');
            return false;
        }

        // 扣除金币
        if (!inventory.spendGold(price)) return false;

        // 添加物品到背包
        if (inventory.addItem(shopItem.item, 1)) {
            // 减少库存
            if (shopItem.stock > 0) {
                shopItem.stock--;
                if (shopItem.stock <= 0) {
                    shopItem.isSoldOut = true;
                }
            }

            console.log(`购买成功: ${shopItem.item.name} (花费${price}金币)`);
            this.notifyShopChange();
            return true;
        } else {
            // 背包已满，退还金币
            inventory.addGold(price);
            console.log('背包已满，购买失败');
            return false;
        }
    }

    /**
     * 出售物品
     * @param item 要出售的物品
     * @returns 出售价格
     */
    sellItem(item: IItem): number {
        const inventory = InventorySystem.instance;
        if (!inventory) return 0;

        // 计算出售价格 (基础价格的40%)
        const sellPrice = Math.floor(item.sellPrice * 0.4);

        // 添加金币
        inventory.addGold(sellPrice);

        console.log(`出售物品: ${item.name} (获得${sellPrice}金币)`);
        return sellPrice;
    }

    // ==================== 词条商店功能 [新增] ====================

    /**
     * 刷新词条商店
     * @param day 当前天数
     */
    refreshModifierShop(day: number): void {
        this._currentShopType = ShopType.MODIFIER;
        this._refreshCount++;
        this._modifierShopItems = this.generateModifierShopItems(day);

        console.log(`ShopSystem: 词条商店已刷新`);
        this.notifyShopChange();
    }

    /**
     * 生成词条商店物品
     */
    private generateModifierShopItems(day: number): IModifierShopItem[] {
        const items: IModifierShopItem[] = [];
        const modifierCount = 6; // 词条商店出售6个词条

        if (!this._modifierSystem) {
            console.warn('ShopSystem: ModifierSystem未找到');
            return items;
        }

        for (let i = 0; i < modifierCount; i++) {
            // 根据天数确定稀有度
            const rarity = this.calculateModifierRarity(day);

            // 生成词条
            const modifier = this._modifierSystem.generateRandomModifier(rarity);

            if (modifier) {
                const price = this.calculateModifierPrice(modifier);

                items.push({
                    modifier: modifier,
                    stock: 1, // 每个词条只有1个
                    originalPrice: price,
                    discount: Math.random() < 0.2 ? Math.floor(Math.random() * 20) : 0, // 20%概率有折扣
                    isSoldOut: false
                });
            }
        }

        return items;
    }

    /**
     * 计算词条稀有度
     */
    private calculateModifierRarity(day: number): Rarity {
        const roll = Math.random() * 100;

        // 根据天数提高稀有度
        const dayBonus = (day - 1) * 5; // 每天+5%稀有概率

        if (roll < 1 + dayBonus) return Rarity.MYTHICAL;
        if (roll < 5 + dayBonus) return Rarity.LEGENDARY;
        if (roll < 15 + dayBonus) return Rarity.EPIC;
        if (roll < 35 + dayBonus) return Rarity.RARE;
        if (roll < 65 + dayBonus) return Rarity.UNCOMMON;
        return Rarity.COMMON;
    }

    /**
     * 计算词条价格
     */
    private calculateModifierPrice(modifier: IModifier): number {
        const basePrice = 100;
        const rarityMultipliers: { [key in Rarity]: number } = {
            [Rarity.COMMON]: 1.0,
            [Rarity.UNCOMMON]: 1.5,
            [Rarity.RARE]: 2.5,
            [Rarity.EPIC]: 5.0,
            [Rarity.LEGENDARY]: 10.0,
            [Rarity.MYTHICAL]: 25.0
        };

        return Math.floor(basePrice * rarityMultipliers[modifier.rarity] * (1 + Math.abs(modifier.value) * 10));
    }

    /**
     * 购买词条
     * @param index 词条索引
     * @param playerId 玩家ID
     * @returns 是否购买成功
     */
    buyModifier(index: number, playerId: string = 'player'): boolean {
        if (index < 0 || index >= this._modifierShopItems.length) return false;

        const shopItem = this._modifierShopItems[index];
        if (shopItem.isSoldOut || shopItem.stock <= 0) {
            console.log('该词条已售罄');
            return false;
        }

        const inventory = InventorySystem.instance;
        if (!inventory) return false;

        // 计算实际价格
        const price = Math.floor(shopItem.originalPrice * (1 - shopItem.discount / 100));

        // 检查金币
        if (inventory.getGold() < price) {
            console.log('金币不足');
            return false;
        }

        // 扣除金币
        if (!inventory.spendGold(price)) return false;

        // 添加词条到玩家
        if (this._modifierSystem) {
            this._modifierSystem.addModifier(playerId, shopItem.modifier);

            // 减少库存
            shopItem.stock--;
            if (shopItem.stock <= 0) {
                shopItem.isSoldOut = true;
            }

            console.log(`购买词条成功: ${shopItem.modifier.name} (花费${price}金币)`);
            this.notifyShopChange();
            return true;
        }

        // 词条系统未找到，退还金币
        inventory.addGold(price);
        return false;
    }

    /**
     * 出售词条
     * @param modifier 要出售的词条
     * @returns 出售价格
     */
    sellModifier(modifier: IModifier): number {
        const inventory = InventorySystem.instance;
        if (!inventory) return 0;

        // 计算出售价格 (基础价格的30%)
        const basePrice = this.calculateModifierPrice(modifier);
        const sellPrice = Math.floor(basePrice * 0.3);

        // 添加金币
        inventory.addGold(sellPrice);

        console.log(`出售词条: ${modifier.name} (获得${sellPrice}金币)`);
        return sellPrice;
    }

    /**
     * 获取词条商店物品列表
     */
    getModifierShopItems(): ReadonlyArray<IModifierShopItem> {
        return this._modifierShopItems;
    }

    // ==================== 物品生成 ====================

    /**
     * 生成商店物品
     */
    private generateShopItems(day: number, shopType: ShopType): IShopItem[] {
        const items: IShopItem[] = [];
        const itemCount = this.getShopItemCount(shopType);

        for (let i = 0; i < itemCount; i++) {
            const item = this.generateShopItem(day, shopType);
            const originalPrice = item.buyPrice;

            // 计算库存和折扣
            let stock = -1; // 默认无限
            let discount = 0;

            if (shopType === ShopType.MYSTERY) {
                // 神秘商人: 有限库存，随机折扣
                stock = Math.floor(Math.random() * 3) + 1;
                discount = Math.random() < 0.3 ? Math.floor(Math.random() * 30) : 0; // 30%概率有折扣
            } else if (shopType === ShopType.DAILY) {
                // 每日商店: 部分物品有限库存
                stock = Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 1 : -1;
            }

            items.push({
                item: item,
                stock: stock,
                originalPrice: originalPrice,
                discount: discount,
                isSoldOut: false
            });
        }

        return items;
    }

    /**
     * 生成单个商店物品
     */
    private generateShopItem(day: number, shopType: ShopType): IItem {
        // 根据商店类型选择物品类型
        let itemTypes: ItemType[] = [];

        switch (shopType) {
            case ShopType.DAILY:
                itemTypes = [ItemType.WEAPON, ItemType.EQUIPMENT, ItemType.CONSUMABLE];
                break;
            case ShopType.MYSTERY:
                itemTypes = [ItemType.WEAPON, ItemType.EQUIPMENT];
                break;
            case ShopType.EQUIPMENT:
                itemTypes = [ItemType.EQUIPMENT];
                break;
            case ShopType.CONSUMABLE:
                itemTypes = [ItemType.CONSUMABLE];
                break;
        }

        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        // 计算稀有度 (神秘商人稀有度更高)
        const rarity = this.calculateShopRarity(shopType);

        switch (itemType) {
            case ItemType.WEAPON:
                return this.generateWeapon(day, rarity);
            case ItemType.EQUIPMENT:
                return this.generateEquipment(day, rarity);
            case ItemType.CONSUMABLE:
                return this.generateConsumable(day, rarity);
            default:
                return this.generateConsumable(day, rarity);
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
        const element = Math.random() < 0.4 ?
            elements[Math.floor(Math.random() * elements.length)] :
            ElementType.NONE;

        const baseDamage = 10 + level * 5;
        const rarityMultiplier = this.getRarityMultiplier(rarity);

        return {
            id: `shop_weapon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.generateWeaponName(weaponType, element, rarity),
            description: '商店出售的武器',
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
            id: `shop_equip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: this.generateEquipmentName(slot, rarity),
            description: '商店出售的装备',
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
        const consumableTypes = [
            { name: '小型生命药水', value: 50, cost: 10 },
            { name: '中型生命药水', value: 100, cost: 25 },
            { name: '大型生命药水', value: 200, cost: 50 },
            { name: '小型法力药水', value: 30, cost: 15 },
            { name: '中型法力药水', value: 60, cost: 35 },
            { name: '大型法力药水', value: 120, cost: 70 },
            { name: '速度卷轴', value: 0, cost: 40 },
            { name: '力量卷轴', value: 0, cost: 40 }
        ];

        // 根据稀有度选择更好的药水
        let availableTypes = consumableTypes;
        if (rarity >= Rarity.RARE) {
            availableTypes = consumableTypes.filter(c => c.value >= 60);
        }
        if (rarity >= Rarity.EPIC) {
            availableTypes = consumableTypes.filter(c => c.value >= 100);
        }

        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        return {
            id: `shop_consumable_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: type.name,
            description: `恢复${type.value > 0 ? type.value : '临时属性'}点`,
            itemType: ItemType.CONSUMABLE,
            rarity: Rarity.COMMON, // 消耗品通常都是普通稀有度
            level: 1,
            icon: `consumables/${type.name}.png`,
            stackable: true,
            maxStack: 99,
            sellPrice: Math.floor(type.cost * 0.4),
            buyPrice: type.cost
        };
    }

    // ==================== 计算方法 ====================

    /**
     * 计算商店稀有度
     */
    private calculateShopRarity(shopType: ShopType): Rarity {
        const roll = Math.random() * 100;

        if (shopType === ShopType.MYSTERY) {
            // 神秘商人: 更高稀有度
            if (roll < 1) return Rarity.MYTHICAL;
            if (roll < 5) return Rarity.LEGENDARY;
            if (roll < 20) return Rarity.EPIC;
            if (roll < 50) return Rarity.RARE;
            return Rarity.GOOD;
        } else {
            // 普通商店
            if (roll < 0.1) return Rarity.MYTHICAL;
            if (roll < 1) return Rarity.LEGENDARY;
            if (roll < 5) return Rarity.EPIC;
            if (roll < 20) return Rarity.RARE;
            if (roll < 50) return Rarity.GOOD;
            return Rarity.COMMON;
        }
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
     * 计算购买/出售价格
     */
    calculatePrice(shopItem: IShopItem, isSelling: boolean): number {
        if (isSelling) {
            return Math.floor(shopItem.item.sellPrice * 0.4);
        } else {
            return Math.floor(shopItem.originalPrice * (1 - shopItem.discount / 100));
        }
    }

    /**
     * 获取商店物品数量
     */
    private getShopItemCount(shopType: ShopType): number {
        switch (shopType) {
            case ShopType.DAILY:
                return 8;
            case ShopType.MYSTERY:
                return 5;
            case ShopType.EQUIPMENT:
                return 6;
            case ShopType.CONSUMABLE:
                return 10;
            default:
                return 8;
        }
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

    /**
     * 获取当前天数
     */
    private getCurrentDay(): number {
        const timeSystem = (this.node.scene.getComponent('TimeSystem') as any)?.instance;
        return timeSystem?.getCurrentDay() || 1;
    }

    // ==================== 名称生成 ====================

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

    // ==================== 获取数据 ====================

    /**
     * 获取商店物品列表
     */
    getShopItems(): ReadonlyArray<IShopItem> {
        return this._shopItems;
    }

    /**
     * 获取当前商店类型
     */
    getShopType(): ShopType {
        return this._currentShopType;
    }

    /**
     * 获取刷新次数
     */
    getRefreshCount(): number {
        return this._refreshCount;
    }

    /**
     * 获取刷新花费
     */
    getRefreshCost(): number {
        return 50 + this._refreshCount * 10; // 基础50金币，每次刷新+10金币
    }

    // ==================== 事件回调 ====================

    onShopChange(callback: () => void): void {
        this._onShopChange = callback;
    }

    private notifyShopChange(): void {
        if (this._onShopChange) {
            this._onShopChange();
        }
    }
}
