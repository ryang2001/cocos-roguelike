/**
 * 炮台管理器 - Cocos Creator版本
 * 负责炮台的放置、管理和回收
 */

import { _decorator, Component, Node, Prefab, instantiate, Vec3, input, Input, EventTouch, Camera, UITransform, view } from 'cc';
import { TowerType, Rarity, ITowerData } from '../types/Types';
import { Tower } from '../entities/Tower';
import { Player } from '../entities/Player';

const { ccclass, property } = _decorator;

/**
 * 炮台放置状态
 */
enum PlacementState {
    IDLE = 'idle',           // 空闲
    PLACING = 'placing',     // 放置中
    ROTATING = 'rotating'    // 旋转中 (某些炮台)
}

/**
 * 炮台配置
 */
interface ITowerConfig {
    type: TowerType;
    name: string;
    cost: number;
    damage: number;
    attackSpeed: number;
    range: number;
    description: string;
}

@ccclass('TowerManager')
export class TowerManager extends Component {
    // ==================== 编辑器属性 ====================

    @property({ type: Prefab, displayName: '炮台预制体' })
    towerPrefab: Prefab | null = null;

    @property({ displayName: '最大炮台数量' })
    maxTowers: number = 10;

    // ==================== 私有属性 ====================

    // 单例
    private static _instance: TowerManager | null = null;
    public static get instance(): TowerManager | null {
        return this._instance;
    }

    // 活跃炮台列表
    private readonly _activeTowers: Map<string, Tower> = new Map();

    // 放置状态
    private _placementState: PlacementState = PlacementState.IDLE;

    // 当前正在放置的炮台
    private _placingTower: Node | null = null;

    // 当前放置的炮台类型
    private _currentTowerType: TowerType = TowerType.BASIC;

    // 炮台配置
    private readonly _towerConfigs: { [key in TowerType]: ITowerConfig } = {
        [TowerType.BASIC]: {
            type: TowerType.BASIC,
            name: '基础炮台',
            cost: 100,
            damage: 10,
            attackSpeed: 1.0,
            range: 200,
            description: '基础炮台，性价比高'
        },
        [TowerType.FIRE]: {
            type: TowerType.FIRE,
            name: '火焰炮台',
            cost: 200,
            damage: 15,
            attackSpeed: 0.8,
            range: 180,
            description: '持续火焰伤害'
        },
        [TowerType.ICE]: {
            type: TowerType.ICE,
            name: '冰霜炮台',
            cost: 200,
            damage: 8,
            attackSpeed: 1.5,
            range: 200,
            description: '减速敌人'
        },
        [TowerType.THUNDER]: {
            type: TowerType.THUNDER,
            name: '雷电炮台',
            cost: 300,
            damage: 25,
            attackSpeed: 0.6,
            range: 250,
            description: '连锁闪电伤害'
        }
    };

    // 玩家引用
    private _player: Player | null = null;

    // ==================== 生命周期 ====================

    onLoad() {
        if (TowerManager._instance === null) {
            TowerManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 查找玩家引用
        this.scheduleOnce(() => {
            const playerNode = this.node.scene?.getChildByPath('WorldContainer/Player');
            if (playerNode) {
                this._player = playerNode.getComponent(Player);
            }
        }, 0.1);

        // 注册输入事件 (用于炮台放置)
        this.registerInputEvents();
    }

    /**
     * 注册输入事件
     */
    private registerInputEvents(): void {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /**
     * 触摸开始 - 尝试放置炮台
     */
    private onTouchStart(event: EventTouch): void {
        // 如果正在放置中，点击确认放置
        if (this._placementState === PlacementState.PLACING) {
            this.confirmPlacement();
            return;
        }
    }

    /**
     * 触摸移动 - 更新放置位置
     */
    private onTouchMove(event: EventTouch): void {
        if (this._placementState === PlacementState.PLACING && this._placingTower) {
            const touchPos = event.getUILocation();
            const worldPos = this.screenToWorld(touchPos);
            this._placingTower.setPosition(worldPos);
        }
    }

    /**
     * 触摸结束 - 取消放置
     */
    private onTouchEnd(event: EventTouch): void {
        // 可以在这里添加取消确认逻辑
    }

    /**
     * 屏幕坐标转世界坐标
     */
    private screenToWorld(screenPos: Vec3): Vec3 {
        // 获取摄像机
        const camera = this.node.scene?.getComponentInChildren(Camera);
        if (!camera) return new Vec3(0, 0, 0);

        // 获取 UITransform
        const canvas = this.node.scene?.getChildByName('Canvas');
        if (!canvas) return new Vec3(0, 0, 0);

        const uiTransform = canvas.getComponent(UITransform);
        if (!uiTransform) return new Vec3(0, 0, 0);

        // 转换坐标
        const worldPos = new Vec3();
        uiTransform.convertToUIARSpace(screenPos.x, screenPos.y, worldPos);

        // 调整Y轴 (Cocos Creator 中Y轴方向可能需要调整)
        const designSize = view.getDesignResolutionSize();
        worldPos.x = worldPos.x - designSize.width / 2;
        worldPos.y = worldPos.y - designSize.height / 2;

        // 考虑摄像机位置
        const cameraPos = camera.node.position;
        worldPos.x += cameraPos.x;
        worldPos.y += cameraPos.y;

        return worldPos;
    }

    onDestroy() {
        if (TowerManager._instance === this) {
            TowerManager._instance = null;
        }

        // 移除输入事件
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        // 取消放置
        this.cancelPlacement();
    }

    update(deltaTime: number): void {
        // 处理放置中的炮台跟随鼠标
        if (this._placementState === PlacementState.PLACING && this._placingTower) {
            this.updatePlacingTower();
        }
    }

    // ==================== 炮台配置 ====================

    /**
     * 获取炮台配置
     */
    public getTowerConfig(type: TowerType): ITowerConfig {
        return this._towerConfigs[type];
    }

    /**
     * 获取所有炮台配置
     */
    public getAllTowerConfigs(): ITowerConfig[] {
        return Object.values(this._towerConfigs);
    }

    /**
     * 检查玩家是否有足够金币
     */
    public canAffordTower(type: TowerType): boolean {
        if (!this._player) return false;

        const config = this.getTowerConfig(type);
        return this._player.gold >= config.cost;
    }

    // ==================== 炮台放置 ====================

    /**
     * 开始放置炮台
     */
    public startPlacement(type: TowerType): boolean {
        if (!this.canAffordTower(type)) {
            console.log('金币不足!');
            return false;
        }

        if (this._activeTowers.size >= this.maxTowers) {
            console.log('已达到最大炮台数量!');
            return false;
        }

        // 创建预览炮台
        this._placingTower = this.createTower(type);
        if (!this._placingTower) return false;

        const tower = this._placingTower.getComponent(Tower);
        if (tower) {
            tower.deactivate(); // 暂时不激活
        }

        this._placementState = PlacementState.PLACING;
        this._currentTowerType = type;

        console.log(`开始放置: ${this._towerConfigs[type].name}`);
        return true;
    }

    /**
     * 确认放置
     */
    public confirmPlacement(): boolean {
        if (this._placementState !== PlacementState.PLACING || !this._placingTower) {
            return false;
        }

        const config = this.getTowerConfig(this._currentTowerType);

        // 扣除金币
        if (this._player) {
            if (this._player.gold >= config.cost) {
                this._player.gold -= config.cost;
                console.log(`花费${config.cost}金币，剩余${this._player.gold}金币`);
            } else {
                console.log('金币不足!');
                return false;
            }
        }

        // 激活炮台
        const tower = this._placingTower.getComponent(Tower);
        if (tower) {
            tower.activate();
        }

        // 添加到活跃列表
        if (tower) {
            this._activeTowers.set(this._placingTower.uuid, tower);
        }

        // 重置状态
        this._placingTower = null;
        this._placementState = PlacementState.IDLE;

        console.log('炮台放置成功!');
        return true;
    }

    /**
     * 取消放置
     */
    public cancelPlacement(): void {
        if (this._placingTower) {
            this._placingTower.destroy();
            this._placingTower = null;
        }

        this._placementState = PlacementState.IDLE;
    }

    /**
     * 创建炮台节点
     */
    private createTower(type: TowerType): Node | null {
        if (this.towerPrefab) {
            const node = instantiate(this.towerPrefab);
            this.node.addChild(node);

            const tower = node.getComponent(Tower);
            if (tower) {
                tower.setTowerType(type);
            }

            return node;
        }

        // 如果没有预制体，创建基础节点
        const node = new Node('Tower');
        node.addComponent(Tower);
        this.node.addChild(node);

        const tower = node.getComponent(Tower);
        if (tower) {
            tower.setTowerType(type);
        }

        return node;
    }

    /**
     * 更新放置中的炮台位置
     */
    private updatePlacingTower(): void {
        // 位置在 onTouchMove 中处理
        // 这个方法可以保留用于其他更新逻辑
    }

    // ==================== 炮台管理 ====================

    /**
     * 移除炮台
     */
    public removeTower(tower: Tower): void {
        const uuid = tower.node.uuid;

        if (this._activeTowers.has(uuid)) {
            // 返还金币
            const refundCost = tower.getRefundCost();
            if (this._player) {
                this._player.gold += refundCost;
                console.log(`回收炮台，返还${refundCost}金币，当前金币: ${this._player.gold}`);
            }

            this._activeTowers.delete(uuid);
            tower.node.destroy();
        }
    }

    /**
     * 收纳炮台 - 将炮台收回背包并返回炮台数据
     * @param tower 要收纳的炮台
     * @returns 收纳成功返回炮台数据，失败返回null
     */
    public storeTower(tower: Tower): any | null {
        const uuid = tower.node.uuid;

        if (!this._activeTowers.has(uuid)) {
            console.log('炮台不在活跃列表中，无法收纳');
            return null;
        }

        // 获取炮台数据
        const towerData = tower.getTowerData();

        // 从活跃列表移除
        this._activeTowers.delete(uuid);

        // 返还部分金币(收纳只返还50%)
        const refundCost = Math.floor(tower.getRefundCost() * 0.5);
        if (this._player) {
            this._player.gold += refundCost;
            console.log(`收纳炮台，返还${refundCost}金币(50%)，当前金币: ${this._player.gold}`);
        }

        // 销毁节点
        tower.node.destroy();

        console.log(`炮台已收纳: ${TowerType[towerData.type]} Lv.${towerData.level}`);

        return towerData;
    }

    /**
     * 收纳指定位置的炮台
     * @param position 位置
     * @param radius 搜索半径
     * @returns 收纳成功返回炮台数据，失败返回null
     */
    public storeTowerAt(position: Vec3, radius: number = 50): any | null {
        const tower = this.getTowerAt(position, radius);
        if (tower) {
            return this.storeTower(tower);
        }
        console.log('该位置没有炮台');
        return null;
    }

    /**
     * 升级炮台
     */
    public upgradeTower(tower: Tower): boolean {
        const cost = tower.getUpgradeCost();

        if (this._player && this._player.gold >= cost) {
            // 扣除金币
            this._player.gold -= cost;
            console.log(`升级炮台花费${cost}金币，剩余${this._player.gold}金币`);

            tower.upgrade();
            return true;
        }

        console.log('金币不足，无法升级!');
        return false;
    }

    /**
     * 获取指定位置的炮台
     */
    public getTowerAt(position: Vec3, radius: number = 50): Tower | null {
        for (const tower of this._activeTowers.values()) {
            const distance = Vec3.distance(tower.node.position, position);
            if (distance <= radius) {
                return tower;
            }
        }
        return null;
    }

    /**
     * 获取所有炮台
     */
    public getAllTowers(): Tower[] {
        return Array.from(this._activeTowers.values());
    }

    /**
     * 获取炮台数量
     */
    public getTowerCount(): number {
        return this._activeTowers.size;
    }

    /**
     * 清除所有炮台
     */
    public clearAllTowers(): void {
        for (const tower of this._activeTowers.values()) {
            tower.node.destroy();
        }
        this._activeTowers.clear();
    }

    // ==================== 状态查询 ====================

    /**
     * 是否正在放置
     */
    public isPlacing(): boolean {
        return this._placementState === PlacementState.PLACING;
    }

    /**
     * 获取当前放置状态
     */
    public getPlacementState(): PlacementState {
        return this._placementState;
    }

    /**
     * 获取当前正在放置的炮台类型
     */
    public getCurrentTowerType(): TowerType {
        return this._currentTowerType;
    }
}
