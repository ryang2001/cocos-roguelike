/**
 * 物品组件 - Cocos Creator版本
 * 附着在场景中的掉落物品节点上
 * @version 1.0.1
 */

import { _decorator, Component, Node, Sprite, Vec3, Collider2D, UITransform, Color, Label } from 'cc';
import { IItem, Rarity } from '../types/Types';

const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component {
    // ==================== 编辑器属性 ====================

    @property({ displayName: '物品ID' })
    itemId: string = '';

    @property({ displayName: '物品名称' })
    itemName: string = '';

    @property({ displayName: '物品稀有度' })
    itemRarity: Rarity = Rarity.COMMON;

    @property({ displayName: '拾取范围' })
    pickupRange: number = 80;

    @property({ displayName: '自动拾取' })
    autoPickup: boolean = false;

    // ==================== 私有属性 ====================

    private _itemData: IItem | null = null;
    private _stackCount: number = 1;
    private _player: Node | null = null;
    private _isBeingPickedUp: boolean = false;

    // 稀有度颜色
    private static readonly RARITY_COLORS: { [key in Rarity]: Color } = {
        [Rarity.COMMON]: new Color().fromHEX('#FFFFFF'),
        [Rarity.GOOD]: new Color().fromHEX('#00FF00'),
        [Rarity.RARE]: new Color().fromHEX('#0070DD'),
        [Rarity.EPIC]: new Color().fromHEX('#A335EE'),
        [Rarity.LEGENDARY]: new Color().fromHEX('#FF8000'),
        [Rarity.MYTHICAL]: new Color().fromHEX('#FF0000')
    };

    // ==================== 生命周期 ====================

    onLoad() {
        // 初始化碰撞检测
        this.setupCollider();

        // 如果没有设置物品数据，使用编辑器属性创建默认数据
        if (!this._itemData) {
            this.createDefaultItemData();
        }

        // 更新视觉显示
        this.updateVisuals();
    }

    start() {
        // 查找玩家引用
        this.findPlayer();

        // 启动物品
        this.spawnAnimation();
    }

    update(deltaTime: number): void {
        if (!this._player || this._isBeingPickedUp) return;

        // 检查拾取范围
        const distance = Vec3.distance(this.node.position, this._player.position);

        if (distance <= this.pickupRange) {
            if (this.autoPickup) {
                this.pickup();
            } else {
                // 显示拾取提示
                this.showPickupPrompt(true);
            }
        } else {
            this.showPickupPrompt(false);
        }
    }

    // ==================== 初始化 ====================

    /**
     * 设置物品数据
     */
    setItemData(item: IItem, count: number = 1): void {
        this._itemData = item;
        this._stackCount = count;
        this.itemId = item.id;
        this.itemName = item.name;
        this.itemRarity = item.rarity;
        this.updateVisuals();
    }

    /**
     * 创建默认物品数据 (从编辑器属性)
     */
    private createDefaultItemData(): void {
        this._itemData = {
            id: this.itemId,
            name: this.itemName,
            description: '',
            itemType: 0 as any, // 需要根据实际类型设置
            rarity: this.itemRarity,
            level: 1,
            icon: '',
            stackable: true,
            maxStack: 99,
            sellPrice: 10,
            buyPrice: 20
        };
    }

    /**
     * 设置碰撞检测
     */
    private setupCollider(): void {
        let collider = this.node.getComponent(Collider2D);
        if (!collider) {
            collider = this.node.addComponent(Collider2D) as Collider2D;
        }

        // 设置碰撞体为圆形
        (collider as any).shape = {
            type: 'circle',
            radius: 30
        };
    }

    /**
     * 查找玩家引用
     */
    private findPlayer(): void {
        const playerNode = this.node.scene.getChildByPath('WorldContainer/Player');
        if (playerNode) {
            this._player = playerNode;
        }
    }

    // ==================== 视觉效果 ====================

    /**
     * 更新视觉效果
     */
    private updateVisuals(): void {
        // 设置稀有度边框颜色
        const sprite = this.node.getComponent(Sprite);
        if (sprite && this._itemData) {
            sprite.color = Item.RARITY_COLORS[this._itemData.rarity];
        }

        // 如果有数量标签，更新显示
        let countLabel = this.node.getChildByName('CountLabel');
        if (this._stackCount > 1) {
            if (!countLabel) {
                countLabel = new Node('CountLabel');
                const transform = countLabel.addComponent(UITransform);
                transform.setContentSize(40, 20);
                countLabel.setPosition(15, -15, 0);

                const label = countLabel.addComponent(Label);
                label.fontSize = 14;
                label.lineHeight = 20;

                this.node.addChild(countLabel);
            }

            const label = countLabel.getComponent(Label);
            if (label) {
                label.string = this._stackCount.toString();
            }
        } else if (countLabel) {
            countLabel.destroy();
        }
    }

    /**
     * 生成动画 (掉落效果)
     */
    private spawnAnimation(): void {
        // 向上弹出后落地
        const startY = this.node.position.y;
        const jumpHeight = 30;

        this.schedule((dt: number) => {
            const progress = Math.sin(dt * Math.PI);
            this.node.setPosition(this.node.position.x, startY + jumpHeight * progress, 0);

            if (progress <= 0) {
                this.node.setPosition(this.node.position.x, startY, 0);
                return false;
            }
            return true;
        }, 0.3);
    }

    /**
     * 显示/隐藏拾取提示
     */
    private showPickupPrompt(show: boolean): void {
        let prompt = this.node.getChildByName('PickupPrompt');
        if (show) {
            if (!prompt) {
                prompt = new Node('PickupPrompt');
                const transform = prompt.addComponent(UITransform);
                transform.setContentSize(60, 20);
                prompt.setPosition(0, 40, 0);

                const label = prompt.addComponent(Label);
                label.string = '按E拾取';
                label.fontSize = 12;
                label.lineHeight = 16;
                label.color = new Color().fromHEX('#FFFF00');

                this.node.addChild(prompt);
            }
        } else if (prompt) {
            prompt.destroy();
        }
    }

    /**
     * 拾取动画
     */
    private pickupAnimation(playerNode: Node): void {
        this._isBeingPickedUp = true;

        // 飞向玩家
        this.schedule((dt: number) => {
            const direction = new Vec3();
            Vec3.subtract(direction, playerNode.position, this.node.position);
            direction.normalize();

            const speed = 400;
            const moveDist = speed * dt;

            if (Vec3.distance(this.node.position, playerNode.position) <= moveDist) {
                this.node.setPosition(playerNode.position);
                return false;
            }

            Vec3.scaleAndAdd(this.node.position, this.node.position, direction, moveDist);
            return true;
        }, 0.5);
    }

    // ==================== 拾取逻辑 ====================

    /**
     * 拾取物品
     */
    pickup(): boolean {
        if (!this._itemData || !this._player) return false;

        // 尝试添加到玩家背包 (动态获取InventorySystem)
        const inventoryNode = this.node.scene.getChildByName('InventorySystem');
        if (!inventoryNode) {
            console.warn('Item: 未找到InventorySystem节点');
            return false;
        }
        const inventory = inventoryNode.getComponent('InventorySystem') as any;
        if (!inventory) {
            console.warn('Item: 未找到InventorySystem组件');
            return false;
        }

        const success = inventory.addItem(this._itemData, this._stackCount);

        if (success) {
            console.log(`拾取物品: ${this._itemData.name} x${this._stackCount}`);

            // 播放拾取动画后销毁
            this.pickupAnimation(this._player);
            this.scheduleOnce(() => {
                this.node.destroy();
            }, 0.5);

            return true;
        } else {
            console.log('背包已满');
            // 可以显示提示
            this.showInventoryFullPrompt();
            return false;
        }
    }

    /**
     * 显示背包满提示
     */
    private showInventoryFullPrompt(): void {
        console.log('背包已满!');
        // 可以创建浮动文字提示
    }

    // ==================== 公共方法 ====================

    /**
     * 获取物品数据
     */
    getItemData(): IItem | null {
        return this._itemData;
    }

    /**
     * 获取堆栈数量
     */
    getStackCount(): number {
        return this._stackCount;
    }

    /**
     * 是否正在被拾取
     */
    isBeingPickedUp(): boolean {
        return this._isBeingPickedUp;
    }
}

// Ensure class registration - Updated 2025-02-24 12:30
console.log('[Item] Class loaded and registered');
