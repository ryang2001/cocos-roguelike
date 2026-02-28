/**
 * 背包系统 - Cocos Creator版本
 * 管理玩家背包和装备槽
 */

import { _decorator, Component } from 'cc';
import { IItem, IItemStack, IEquipmentItem, EquipmentSlot, Rarity, ItemType } from '../types/Types';

const { ccclass } = _decorator;

/**
 * 背包系统单例
 */
@ccclass('InventorySystem')
export class InventorySystem extends Component {
    // 单例
    private static _instance: InventorySystem | null = null;
    public static get instance(): InventorySystem | null {
        return this._instance;
    }

    // ==================== 私有属性 ====================

    // 背包 (20格)
    private readonly _backpackSize: number = 20;
    private _backpack: (IItemStack | null)[];

    // 装备槽 (6个)
    private _equipmentSlots: { [slot in EquipmentSlot]: IEquipmentItem | null };

    // 金币
    private _gold: number = 0;

    // 事件回调
    private _onInventoryChange: (() => void) | null = null;
    private _onEquipmentChange: (() => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad() {
        if (InventorySystem._instance === null) {
            InventorySystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 初始化背包
        this._backpack = new Array(this._backpackSize).fill(null);

        // 初始化装备槽
        this._equipmentSlots = {
            mainhand: null,
            offhand: null,
            helmet: null,
            chest: null,
            gloves: null,
            boots: null
        };

        console.log('InventorySystem: 背包系统初始化完成');
    }

    onDestroy() {
        if (InventorySystem._instance === this) {
            InventorySystem._instance = null;
        }
    }

    // ==================== 背包操作 ====================

    /**
     * 添加物品到背包
     * @param item 物品数据
     * @param count 数量
     * @returns 是否成功添加
     */
    addItem(item: IItem, count: number = 1): boolean {
        if (!item) return false;

        // 如果物品可堆叠，先尝试堆叠到现有物品
        if (item.stackable) {
            const stacked = this.tryStackItem(item, count);
            if (stacked > 0) {
                count -= stacked;
                if (count <= 0) {
                    this.notifyInventoryChange();
                    return true;
                }
            }
        }

        // 寻找空格子存放剩余物品
        return this.addItemToEmptySlot(item, count);
    }

    /**
     * 尝试堆叠物品
     * @returns 成功堆叠的数量
     */
    private tryStackItem(item: IItem, count: number): number {
        let remaining = count;

        for (let i = 0; i < this._backpackSize; i++) {
            const slot = this._backpack[i];
            if (slot && slot.item.id === item.id) {
                const canAdd = Math.min(remaining, item.maxStack - slot.count);
                slot.count += canAdd;
                remaining -= canAdd;

                if (remaining <= 0) {
                    return count;
                }
            }
        }

        return count - remaining;
    }

    /**
     * 添加物品到空格子
     */
    private addItemToEmptySlot(item: IItem, count: number): boolean {
        // 计算需要的格子数
        const stacksNeeded = Math.ceil(count / item.maxStack);

        // 查找足够的空格子
        const emptySlots: number[] = [];
        for (let i = 0; i < this._backpackSize; i++) {
            if (!this._backpack[i]) {
                emptySlots.push(i);
                if (emptySlots.length >= stacksNeeded) {
                    break;
                }
            }
        }

        if (emptySlots.length < stacksNeeded) {
            return false; // 空间不足
        }

        // 分配物品到空格子
        let remaining = count;
        for (const slotIndex of emptySlots) {
            const stackSize = Math.min(remaining, item.maxStack);
            this._backpack[slotIndex] = {
                item: item,
                count: stackSize
            };
            remaining -= stackSize;

            if (remaining <= 0) break;
        }

        this.notifyInventoryChange();
        return true;
    }

    /**
     * 移除物品
     * @param itemId 物品ID
     * @param count 数量
     * @returns 是否成功移除
     */
    removeItem(itemId: string, count: number = 1): boolean {
        let remaining = count;

        // 从后向前移除 (避免跳过格子)
        for (let i = this._backpackSize - 1; i >= 0 && remaining > 0; i--) {
            const slot = this._backpack[i];
            if (slot && slot.item.id === itemId) {
                const toRemove = Math.min(remaining, slot.count);
                slot.count -= toRemove;
                remaining -= toRemove;

                // 如果格子空了，清空
                if (slot.count <= 0) {
                    this._backpack[i] = null;
                }
            }
        }

        const success = remaining <= 0;
        if (success) {
            this.notifyInventoryChange();
        }

        return success;
    }

    /**
     * 获取物品数量
     */
    getItemCount(itemId: string): number {
        let count = 0;
        for (const slot of this._backpack) {
            if (slot && slot.item.id === itemId) {
                count += slot.count;
            }
        }
        return count;
    }

    /**
     * 移动物品 (拖拽操作)
     * @param fromIndex 源格子索引
     * @param toIndex 目标格子索引
     */
    moveItem(fromIndex: number, toIndex: number): boolean {
        if (fromIndex < 0 || fromIndex >= this._backpackSize ||
            toIndex < 0 || toIndex >= this._backpackSize) {
            return false;
        }

        if (fromIndex === toIndex) return true;

        const fromSlot = this._backpack[fromIndex];
        const toSlot = this._backpack[toIndex];

        // 交换
        this._backpack[toIndex] = fromSlot;
        this._backpack[fromIndex] = toSlot;

        // 如果目标位置有相同物品且可堆叠，进行堆叠
        if (toSlot && fromSlot && toSlot.item.id === fromSlot.item.id && toSlot.item.stackable) {
            const canStack = Math.min(fromSlot.count, toSlot.item.maxStack - toSlot.count);
            toSlot.count += canStack;
            fromSlot.count -= canStack;

            if (fromSlot.count <= 0) {
                this._backpack[fromIndex] = null;
            }
        }

        this.notifyInventoryChange();
        return true;
    }

    /**
     * 使用物品
     * @param index 格子索引
     */
    useItem(index: number): boolean {
        if (index < 0 || index >= this._backpackSize) return false;

        const slot = this._backpack[index];
        if (!slot) return false;

        const item = slot.item;

        // 消耗品: 直接使用并减少数量
        if (item.itemType === ItemType.CONSUMABLE) {
            this.applyConsumableEffect(item);
            slot.count--;

            if (slot.count <= 0) {
                this._backpack[index] = null;
            }

            this.notifyInventoryChange();
            return true;
        }

        // 装备: 尝试装备
        if (item.itemType === ItemType.EQUIPMENT) {
            return this.equipItem(index);
        }

        return false;
    }

    /**
     * 应用消耗品效果
     */
    private applyConsumableEffect(item: IItem): void {
        // 这里需要与Player组件交互
        console.log(`使用物品: ${item.name}`);
        // TODO: 实现具体的消耗品效果
    }

    // ==================== 装备操作 ====================

    /**
     * 装备物品
     * @param inventoryIndex 背包格子索引
     */
    equipItem(inventoryIndex: number): boolean {
        if (inventoryIndex < 0 || inventoryIndex >= this._backpackSize) return false;

        const slot = this._backpack[inventoryIndex];
        if (!slot || slot.item.itemType !== ItemType.EQUIPMENT) return false;

        const equipment = slot.item as IEquipmentItem;
        const equipSlot = equipment.equipmentSlot;

        // 检查等级要求
        if (equipment.level > this.getPlayerLevel()) {
            console.log('等级不足，无法装备');
            return false;
        }

        // 获取当前装备的物品
        const currentEquipped = this._equipmentSlots[equipSlot];

        // 装备新物品
        this._equipmentSlots[equipSlot] = equipment;

        // 将旧装备放回背包
        if (currentEquipped) {
            this._backpack[inventoryIndex] = {
                item: currentEquipped,
                count: 1
            };
        } else {
            this._backpack[inventoryIndex] = null;
        }

        this.notifyEquipmentChange();
        console.log(`装备: ${equipment.name} 到 ${equipSlot}`);

        return true;
    }

    /**
     * 卸下装备
     * @param slot 装备槽
     */
    unequipItem(slot: EquipmentSlot): boolean {
        const equipment = this._equipmentSlots[slot];
        if (!equipment) return false;

        // 尝试添加到背包
        if (this.addItem(equipment, 1)) {
            this._equipmentSlots[slot] = null;
            this.notifyEquipmentChange();
            console.log(`卸下装备: ${equipment.name}`);
            return true;
        }

        console.log('背包已满，无法卸下装备');
        return false;
    }

    /**
     * 获取装备总属性加成
     */
    getTotalEquipmentStats(): { [key: string]: number } {
        const stats: { [key: string]: number } = {
            hp: 0,
            damage: 0,
            defense: 0,
            critRate: 0,
            critDamage: 0,
            moveSpeed: 0
        };

        for (const slot of Object.values(this._equipmentSlots)) {
            if (!slot) continue;

            for (const [stat, value] of Object.entries(slot.stats)) {
                if (stats[stat] !== undefined) {
                    stats[stat] += value || 0;
                }
            }
        }

        return stats;
    }

    // ==================== 金币操作 ====================

    /**
     * 添加金币
     */
    addGold(amount: number): void {
        this._gold += amount;
        console.log(`获得金币: ${amount}, 当前金币: ${this._gold}`);
        this.notifyInventoryChange();
    }

    /**
     * 扣除金币
     */
    spendGold(amount: number): boolean {
        if (this._gold < amount) return false;

        this._gold -= amount;
        console.log(`花费金币: ${amount}, 剩余金币: ${this._gold}`);
        this.notifyInventoryChange();
        return true;
    }

    /**
     * 获取金币数量
     */
    getGold(): number {
        return this._gold;
    }

    // ==================== 获取数据 ====================

    /**
     * 获取背包数据
     */
    getBackpack(): ReadonlyArray<IItemStack | null> {
        return this._backpack;
    }

    /**
     * 获取背包容量
     */
    getBackpackSize(): number {
        return this._backpackSize;
    }

    /**
     * 获取装备数据
     */
    getEquipment(): Readonly<{ [slot in EquipmentSlot]: IEquipmentItem | null }> {
        return this._equipmentSlots;
    }

    /**
     * 获取玩家等级 (从Player组件获取)
     */
    private getPlayerLevel(): number {
        // TODO: 从Player组件获取等级
        return 1;
    }

    // ==================== 排序功能 ====================

    /**
     * 排序背包 (按类型和稀有度)
     */
    sortBackpack(): void {
        // 提取所有非空物品
        const items: IItemStack[] = [];
        for (const slot of this._backpack) {
            if (slot) items.push(slot);
        }

        // 排序: 类型 > 稀有度 > 名称
        items.sort((a, b) => {
            if (a.item.itemType !== b.item.itemType) {
                return a.item.itemType - b.item.itemType;
            }
            if (a.item.rarity !== b.item.rarity) {
                return b.item.rarity - a.item.rarity; // 高稀有度在前
            }
            return a.item.name.localeCompare(b.item.name);
        });

        // 清空背包
        this._backpack.fill(null);

        // 重新填充
        let index = 0;
        for (const item of items) {
            this._backpack[index++] = item;
        }

        this.notifyInventoryChange();
        console.log('背包已排序');
    }

    // ==================== 事件回调 ====================

    /**
     * 设置背包变化回调
     */
    onInventoryChange(callback: () => void): void {
        this._onInventoryChange = callback;
    }

    /**
     * 设置装备变化回调
     */
    onEquipmentChange(callback: () => void): void {
        this._onEquipmentChange = callback;
    }

    /**
     * 通知背包变化
     */
    private notifyInventoryChange(): void {
        if (this._onInventoryChange) {
            this._onInventoryChange();
        }
    }

    /**
     * 通知装备变化
     */
    private notifyEquipmentChange(): void {
        if (this._onEquipmentChange) {
            this._onEquipmentChange();
        }
    }

    // ==================== 保存/加载 ====================

    /**
     * 保存数据 (用于存档系统)
     */
    saveData(): any {
        return {
            backpack: this._backpack,
            equipment: this._equipmentSlots,
            gold: this._gold
        };
    }

    /**
     * 加载数据 (用于存档系统)
     */
    loadData(data: any): void {
        if (!data) return;

        this._backpack = data.backpack || new Array(this._backpackSize).fill(null);
        this._equipmentSlots = data.equipment || this._equipmentSlots;
        this._gold = data.gold || 0;

        this.notifyInventoryChange();
        this.notifyEquipmentChange();
    }

    /**
     * 清空背包 (用于新游戏)
     */
    clear(): void {
        this._backpack.fill(null);
        this._equipmentSlots = {
            mainhand: null,
            offhand: null,
            helmet: null,
            chest: null,
            gloves: null,
            boots: null
        };
        this._gold = 0;

        this.notifyInventoryChange();
        this.notifyEquipmentChange();
    }
}
