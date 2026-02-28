/**
 * 词条镶嵌UI系统 - Cocos Creator版本
 * 负责显示和管理词条镶嵌界面
 */

import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Color } from 'cc';
import { ModifierSystem } from '../systems/ModifierSystem';
import { IModifier, ModifierType, Rarity, ModifierSource } from '../types/Types';

const { ccclass, property } = _decorator;

/**
 * 词条槽位类型
 */
enum ModifierSlotType {
    WEAPON = 'weapon',
    ARMOR = 'armor',
    ACCESSORY = 'accessory',
    SKILL = 'skill'
}

/**
 * 词条槽位数据
 */
interface IModifierSlot {
    type: ModifierSlotType;
    index: number;
    modifier: IModifier | null;
    node: Node | null;
}

@ccclass('ModifierUI')
export class ModifierUI extends Component {
    // ==================== 编辑器属性 ====================

    @property({ type: Node, displayName: '词条列表面板' })
    modifierListPanel: Node | null = null;

    @property({ type: ScrollView, displayName: '词条列表滚动视图' })
    modifierListScrollView: ScrollView | null = null;

    @property({ type: Node, displayName: '装备槽位面板' })
    equipmentSlotPanel: Node | null = null;

    @property({ type: Prefab, displayName: '词条项预制体' })
    modifierItemPrefab: Prefab | null = null;

    @property({ type: Prefab, displayName: '槽位预制体' })
    slotPrefab: Prefab | null = null;

    @property({ type: Node, displayName: '详情面板' })
    detailPanel: Node | null = null;

    @property({ type: Label, displayName: '详情名称' })
    detailNameLabel: Label | null = null;

    @property({ type: Label, displayName: '详情描述' })
    detailDescLabel: Label | null = null;

    // ==================== 私有属性 ====================

    // 当前选中的词条
    private _selectedModifier: IModifier | null = null;

    // 当前选中的槽位
    private _selectedSlot: IModifierSlot | null = null;

    // 装备槽位列表
    private _equipmentSlots: Map<string, IModifierSlot> = new Map();

    // 玩家ID (用于获取词条)
    private _playerId: string = 'player';

    // 词条系统引用
    private _modifierSystem: ModifierSystem | null = null;

    // 是否显示中
    private _isVisible: boolean = false;

    // ==================== 生命周期 ====================

    onLoad() {
        this._modifierSystem = ModifierSystem.instance;
        this.initEquipmentSlots();
        this.hide();
    }

    onDestroy() {
        this._equipmentSlots.clear();
    }

    // ==================== 初始化 ====================

    /**
     * 初始化装备槽位
     */
    private initEquipmentSlots(): void {
        // 武器槽位 x3
        for (let i = 0; i < 3; i++) {
            this.createSlot(ModifierSlotType.WEAPON, i);
        }

        // 防具槽位 x2
        for (let i = 0; i < 2; i++) {
            this.createSlot(ModifierSlotType.ARMOR, i);
        }

        // 饰品槽位 x2
        for (let i = 0; i < 2; i++) {
            this.createSlot(ModifierSlotType.ACCESSORY, i);
        }

        // 技能槽位 x4
        for (let i = 0; i < 4; i++) {
            this.createSlot(ModifierSlotType.SKILL, i);
        }
    }

    /**
     * 创建槽位
     */
    private createSlot(type: ModifierSlotType, index: number): void {
        const slotKey = `${type}_${index}`;

        const slot: IModifierSlot = {
            type,
            index,
            modifier: null,
            node: null
        };

        // 如果有预制体，创建槽位节点
        if (this.slotPrefab && this.equipmentSlotPanel) {
            const slotNode = instantiate(this.slotPrefab);
            this.equipmentSlotPanel.addChild(slotNode);

            // 设置槽位信息
            const label = slotNode.getComponentInChildren(Label);
            if (label) {
                const typeNames: { [key in ModifierSlotType]: string } = {
                    [ModifierSlotType.WEAPON]: '武器',
                    [ModifierSlotType.ARMOR]: '防具',
                    [ModifierSlotType.ACCESSORY]: '饰品',
                    [ModifierSlotType.SKILL]: '技能'
                };
                label.string = `${typeNames[type]} ${index + 1}`;
            }

            // 添加点击事件
            const button = slotNode.getComponent(Button);
            if (button) {
                button.node.on('click', () => this.onSlotClick(slot), this);
            }

            slot.node = slotNode;
        }

        this._equipmentSlots.set(slotKey, slot);
    }

    // ==================== UI控制 ====================

    /**
     * 显示UI
     */
    public show(): void {
        this._isVisible = true;
        this.node.active = true;
        this.refreshModifierList();
        this.refreshEquipmentSlots();
        console.log('词条镶嵌UI已打开');
    }

    /**
     * 隐藏UI
     */
    public hide(): void {
        this._isVisible = false;
        this.node.active = false;
        this._selectedModifier = null;
        this._selectedSlot = null;
        this.hideDetailPanel();
    }

    /**
     * 切换显示/隐藏
     */
    public toggle(): void {
        if (this._isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 是否显示中
     */
    public isShowing(): boolean {
        return this._isVisible;
    }

    // ==================== 刷新显示 ====================

    /**
     * 刷新词条列表
     */
    public refreshModifierList(): void {
        if (!this._modifierSystem) return;

        // 清空列表
        if (this.modifierListScrollView) {
            const content = this.modifierListScrollView.content;
            if (content) {
                content.removeAllChildren();
            }
        }

        // 获取玩家所有词条
        const modifiers = this._modifierSystem.getAllActiveModifiers(this._playerId);

        // 创建词条项
        for (const modifier of modifiers) {
            this.createModifierItem(modifier);
        }

        console.log(`刷新词条列表: ${modifiers.length} 个词条`);
    }

    /**
     * 创建词条项
     */
    private createModifierItem(modifier: IModifier): void {
        if (!this.modifierItemPrefab || !this.modifierListScrollView) return;

        const content = this.modifierListScrollView.content;
        if (!content) return;

        const itemNode = instantiate(this.modifierItemPrefab);
        content.addChild(itemNode);

        // 设置词条名称
        const nameLabel = itemNode.getChildByName('Name')?.getComponent(Label);
        if (nameLabel) {
            nameLabel.string = modifier.name;
            nameLabel.color = this.getRarityColor(modifier.rarity);
        }

        // 设置词条描述
        const descLabel = itemNode.getChildByName('Description')?.getComponent(Label);
        if (descLabel) {
            descLabel.string = modifier.description;
        }

        // 添加点击事件
        const button = itemNode.getComponent(Button);
        if (button) {
            button.node.on('click', () => this.onModifierClick(modifier), this);
        }
    }

    /**
     * 刷新装备槽位
     */
    public refreshEquipmentSlots(): void {
        for (const slot of this._equipmentSlots.values()) {
            this.updateSlotDisplay(slot);
        }
    }

    /**
     * 更新槽位显示
     */
    private updateSlotDisplay(slot: IModifierSlot): void {
        if (!slot.node) return;

        const iconNode = slot.node.getChildByName('Icon');
        const nameLabel = slot.node.getChildByName('ModifierName')?.getComponent(Label);

        if (slot.modifier) {
            // 有词条
            if (nameLabel) {
                nameLabel.string = slot.modifier.name;
                nameLabel.color = this.getRarityColor(slot.modifier.rarity);
            }
            if (iconNode) {
                iconNode.active = true;
            }
        } else {
            // 无词条
            if (nameLabel) {
                nameLabel.string = '空';
                nameLabel.color = Color.GRAY;
            }
            if (iconNode) {
                iconNode.active = false;
            }
        }
    }

    // ==================== 事件处理 ====================

    /**
     * 词条点击
     */
    private onModifierClick(modifier: IModifier): void {
        this._selectedModifier = modifier;
        this.showDetailPanel(modifier);
        console.log(`选中词条: ${modifier.name}`);
    }

    /**
     * 槽位点击
     */
    private onSlotClick(slot: IModifierSlot): void {
        this._selectedSlot = slot;

        if (this._selectedModifier) {
            // 如果已有选中的词条，尝试镶嵌
            this.equipModifier(this._selectedModifier, slot);
        } else if (slot.modifier) {
            // 如果槽位有词条，显示详情
            this.showDetailPanel(slot.modifier);
        }
    }

    /**
     * 镶嵌词条
     */
    public equipModifier(modifier: IModifier, slot: IModifierSlot): boolean {
        // 检查槽位类型是否匹配
        if (!this.isModifierCompatible(modifier, slot)) {
            console.log('词条类型与槽位不匹配');
            return false;
        }

        // 如果槽位已有词条，先卸下
        if (slot.modifier) {
            this.unequipModifier(slot);
        }

        // 镶嵌词条
        slot.modifier = modifier;
        this.updateSlotDisplay(slot);

        console.log(`镶嵌词条: ${modifier.name} -> ${slot.type}_${slot.index}`);

        // 刷新显示
        this.refreshModifierList();
        this.hideDetailPanel();

        return true;
    }

    /**
     * 卸下词条
     */
    public unequipModifier(slot: IModifierSlot): boolean {
        if (!slot.modifier) return false;

        const modifier = slot.modifier;
        slot.modifier = null;
        this.updateSlotDisplay(slot);

        console.log(`卸下词条: ${modifier.name}`);

        // 刷新显示
        this.refreshModifierList();

        return true;
    }

    /**
     * 检查词条是否与槽位兼容
     */
    private isModifierCompatible(modifier: IModifier, slot: IModifierSlot): boolean {
        // 根据词条类型判断兼容性
        switch (slot.type) {
            case ModifierSlotType.WEAPON:
                // 武器槽位接受攻击类词条
                return modifier.type.includes('attack') ||
                       modifier.type.includes('crit') ||
                       modifier.type.includes('damage');

            case ModifierSlotType.ARMOR:
                // 防具槽位接受防御类词条
                return modifier.type.includes('defense') ||
                       modifier.type.includes('hp') ||
                       modifier.type.includes('resist');

            case ModifierSlotType.ACCESSORY:
                // 饰品槽位接受通用词条
                return modifier.type.includes('speed') ||
                       modifier.type.includes('drop') ||
                       modifier.type.includes('gold') ||
                       modifier.type.includes('exp');

            case ModifierSlotType.SKILL:
                // 技能槽位接受特殊效果词条
                return modifier.type.includes('element') ||
                       modifier.type.includes('lifesteal') ||
                       modifier.type.includes('knockback');

            default:
                return false;
        }
    }

    // ==================== 详情面板 ====================

    /**
     * 显示详情面板
     */
    private showDetailPanel(modifier: IModifier): void {
        if (!this.detailPanel) return;

        this.detailPanel.active = true;

        if (this.detailNameLabel) {
            this.detailNameLabel.string = modifier.name;
            this.detailNameLabel.color = this.getRarityColor(modifier.rarity);
        }

        if (this.detailDescLabel) {
            this.detailDescLabel.string = `${modifier.description}\n\n类型: ${modifier.type}\n稀有度: ${Rarity[modifier.rarity]}\n来源: ${modifier.source}`;
        }
    }

    /**
     * 隐藏详情面板
     */
    private hideDetailPanel(): void {
        if (this.detailPanel) {
            this.detailPanel.active = false;
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 获取稀有度颜色
     */
    private getRarityColor(rarity: Rarity): Color {
        const colors: { [key in Rarity]: Color } = {
            [Rarity.COMMON]: new Color().fromHEX('#9E9E9E'),    // 灰色
            [Rarity.UNCOMMON]: new Color().fromHEX('#4CAF50'),  // 绿色
            [Rarity.RARE]: new Color().fromHEX('#2196F3'),      // 蓝色
            [Rarity.EPIC]: new Color().fromHEX('#9C27B0'),      // 紫色
            [Rarity.LEGENDARY]: new Color().fromHEX('#FF9800'), // 橙色
            [Rarity.MYTHICAL]: new Color().fromHEX('#F44336')   // 红色
        };
        return colors[rarity] || Color.WHITE;
    }

    /**
     * 设置玩家ID
     */
    public setPlayerId(playerId: string): void {
        this._playerId = playerId;
    }

    /**
     * 获取已镶嵌的词条
     */
    public getEquippedModifiers(): IModifier[] {
        const modifiers: IModifier[] = [];
        for (const slot of this._equipmentSlots.values()) {
            if (slot.modifier) {
                modifiers.push(slot.modifier);
            }
        }
        return modifiers;
    }
}
