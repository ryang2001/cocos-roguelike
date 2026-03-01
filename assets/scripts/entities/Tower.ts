/**
 * 炮台 - Cocos Creator版本
 * 可放置的防御建筑，自动攻击范围内的敌人
 */

import { _decorator, Component, Node, Vec3, Sprite, UITransform, Color, resources, SpriteFrame, ImageAsset, Texture2D } from 'cc';
import { ElementType, TowerType, IWeapon, Rarity, ICombatEntity, ICharacter, DEFAULT_RESISTANCES } from '../types/Types';
import { GameConfig } from '../config/GameConfig';
import { ENTITY_SIZE_CONFIG, calculateEntityDepth } from '../config/EntitySizeConfig';

const { ccclass, property } = _decorator;

@ccclass('Tower')
export class Tower extends Component implements ICombatEntity {
    // 显式声明 node 属性以满足接口
    declare readonly node: Node;

    // ==================== 编辑器属性 ====================

    @property({ displayName: '炮台类型' })
    towerType: TowerType = TowerType.BASIC;

    @property({ displayName: '攻击范围' })
    range: number = 200;

    @property({ displayName: '伤害' })
    damage: number = 10;

    @property({ displayName: '攻击速度' })
    attackSpeed: number = 1.0;

    @property({ type: Sprite, displayName: '炮塔Sprite' })
    turretSprite: Sprite | null = null;

    @property({ displayName: '旋转速度' })
    rotationSpeed: number = 180;

    // ==================== 私有属性 ====================

    // 攻击计时器
    private _attackTimer: number = 0;

    // 当前目标
    private _target: ICombatEntity | null = null;

    // 炮台数据
    private _towerData: any = null;

    // 是否已激活
    private _isActive: boolean = false;

    // 炮台等级
    private _level: number = 1;

    // ==================== 系统获取辅助方法 ====================

    private _getCombatSystem(): any {
        return (this.node.scene.getComponent('CombatSystem') as any)?.instance;
    }

    private _getTowerManager(): any {
        return (this.node.scene.getComponent('TowerManager') as any)?.instance;
    }

    // ==================== 生命周期 ====================

    onLoad() {
        // 确保节点有UITransform组件（UI渲染必需）
        let uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            uiTransform = this.node.addComponent(UITransform);
            // 使用配置的炮台尺寸
            uiTransform.setContentSize(ENTITY_SIZE_CONFIG.TOWER.WIDTH, ENTITY_SIZE_CONFIG.TOWER.HEIGHT);
            uiTransform.anchorPoint.set(0.5, ENTITY_SIZE_CONFIG.TOWER.ANCHOR_Y);
            console.log('[Tower] 添加UITransform组件');
        }

        this.initTowerData();
        this.updateTowerColor();
        this.loadTowerSprite();
    }

    /**
     * 加载炮台精灵图
     */
    private loadTowerSprite(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) {
            console.warn('Tower: 节点上没有Sprite组件');
            return;
        }

        // 尝试加载炮台贴图
        const texturePath = GameConfig.TEXTURE_PATHS.TOWERS.BASIC;
        const spriteFramePath = `${texturePath}/spriteFrame`;

        resources.load(spriteFramePath, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame) {
                console.warn(`Tower: 加载精灵图失败 ${spriteFramePath}，使用默认图形`);
                this.createDefaultTowerSprite(sprite);
                return;
            }
            sprite.spriteFrame = spriteFrame;
            sprite.sizeMode = Sprite.SizeMode.RAW;
            console.log(`Tower: 成功加载精灵图 ${spriteFramePath}`);
        });
    }

    /**
     * 创建默认炮台图形（当纹理加载失败时使用）
     */
    private createDefaultTowerSprite(sprite: Sprite): void {
        try {
            const canvas = document.createElement('canvas');
            const size = 64;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                sprite.color = new Color(128, 128, 128, 255);
                return;
            }

            // 清空画布
            ctx.clearRect(0, 0, size, size);

            // 根据炮台类型选择颜色
            const colors: { [key in TowerType]: string } = {
                [TowerType.BASIC]: '#808080',  // 灰色
                [TowerType.FIRE]: '#ff4500',   // 红色
                [TowerType.ICE]: '#00bfff',    // 蓝色
                [TowerType.THUNDER]: '#ffd700', // 金色
                [TowerType.ARROW]: '#228b22',   // 绿色
                [TowerType.CANNON]: '#8b4513',  // 棕色
                [TowerType.MAGIC]: '#9932cc',   // 紫色
                [TowerType.POISON]: '#32cd32'   // 绿色
            };
            const color = colors[this.towerType] || colors[TowerType.BASIC];

            // 绘制炮台底座（圆形）
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制炮管（矩形）
            ctx.fillStyle = '#333333';
            ctx.fillRect(size / 2 - 4, size / 4, 8, size / 2);

            // 创建纹理
            const imageAsset = new ImageAsset(canvas);
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            sprite.spriteFrame = spriteFrame;
            console.log(`Tower: 创建默认炮台图形成功`);
        } catch (error) {
            console.error('Tower: 创建默认图形失败:', error);
            sprite.color = new Color(128, 128, 128, 255);
        }
    }

    start() {
        // 注册到战斗系统
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.registerCombatEntity(this);
        }
    }

    update(deltaTime: number): void {
        if (!this._isActive) return;

        this.updateAttack(deltaTime);
        this.updateTurretRotation(deltaTime);
    }

    onDestroy() {
        // 从战斗系统注销
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.unregisterCombatEntity(this);
        }

        // 从炮台管理器移除
        const towerManager = this._getTowerManager();
        if (towerManager) {
            towerManager.removeTower(this);
        }
    }

    // ==================== 初始化 ====================

    /**
     * 初始化炮台数据
     */
    private initTowerData(): void {
        this._towerData = {
            type: this.towerType,
            level: this._level,
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            range: this.range,
            element: this.getElementForType()
        };
    }

    /**
     * 根据类型获取元素
     */
    private getElementForType(): ElementType | undefined {
        switch (this.towerType) {
            case TowerType.FIRE:
                return ElementType.FIRE;
            case TowerType.ICE:
                return ElementType.WATER;
            case TowerType.THUNDER:
                return ElementType.THUNDER;
            default:
                return undefined;
        }
    }

    /**
     * 更新炮台颜色
     */
    private updateTowerColor(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        const colors: { [key in TowerType]: string } = {
            [TowerType.BASIC]: '#808080',  // 灰色
            [TowerType.FIRE]: '#ff4500',   // 红色
            [TowerType.ICE]: '#00bfff',    // 蓝色
            [TowerType.THUNDER]: '#ffd700' // 金色
        };

        sprite.color = sprite.color.fromHEX(colors[this.towerType]);
    }

    // ==================== ICombatEntity 接口实现 ====================

    getCharacterData(): ICharacter {
        return {
            id: this.node.uuid,
            name: `炮台_${TowerType[this.towerType]}`,
            hp: 100,
            maxHp: 100,
            speed: 0,
            position: this.node.position
        };
    }

    takeDamage(damage: number): void {
        // 炮台也可以被攻击
        console.log(`炮台受到${damage}点伤害`);
    }

    heal(amount: number): void {
        // 炮台可以修复
    }

    onDeath(): void {
        this.destroy();
    }

    // ==================== 战斗逻辑 ====================

    /**
     * 更新攻击
     */
    private updateAttack(deltaTime: number): void {
        this._attackTimer += deltaTime;

        const attackInterval = 1.0 / this.attackSpeed;

        if (this._attackTimer >= attackInterval) {
            this.findAndAttackTarget();
            this._attackTimer = 0;
        }
    }

    /**
     * 查找并攻击目标
     */
    private findAndAttackTarget(): void {
        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        // 查找最近的敌人
        const target = combatSystem.findNearestEnemy(
            this.node.position,
            this.range,
            (entity: ICombatEntity) => combatSystem.isEnemy(this, entity)
        );

        if (target) {
            this._target = target;
            this.performAttack(target);
        } else {
            this._target = null;
        }
    }

    /**
     * 执行攻击
     */
    private performAttack(target: ICombatEntity): void {
        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        // 创建炮台武器
        const weapon: IWeapon = {
            id: `tower_${this.node.uuid}`,
            name: `炮台攻击`,
            type: 'explosion' as any,
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            range: this.range,
            element: this._towerData.element,
            rarity: Rarity.COMMON,
            level: this._level
        };

        combatSystem.performAttack(
            this,
            weapon,
            target,
            DEFAULT_RESISTANCES,
            0, // 无暴击
            1
        );
    }

    /**
     * 更新炮塔旋转
     */
    private updateTurretRotation(deltaTime: number): void {
        if (!this.turretSprite || !this._target) return;

        // 计算目标方向
        const targetPos = this._target.node.position;
        const currentPos = this.node.position;
        const direction = new Vec3();
        Vec3.subtract(direction, targetPos, currentPos);
        direction.normalize();

        // 计算目标角度
        const targetAngle = Math.atan2(direction.y, direction.x) * (180 / Math.PI);

        // 平滑旋转
        const currentAngle = this.turretSprite.node.angle;
        const angleDiff = this.normalizeAngle(targetAngle - currentAngle);
        const rotationStep = this.rotationSpeed * deltaTime;

        let newAngle: number;
        if (Math.abs(angleDiff) <= rotationStep) {
            newAngle = targetAngle;
        } else {
            newAngle = currentAngle + Math.sign(angleDiff) * rotationStep;
        }

        this.turretSprite.node.angle = newAngle;
    }

    /**
     * 标准化角度到 -180 ~ 180
     */
    private normalizeAngle(angle: number): number {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }

    // ==================== 公共方法 ====================

    /**
     * 激活炮台
     */
    public activate(): void {
        this._isActive = true;
        console.log('炮台已激活');
    }

    /**
     * 停用炮台
     */
    public deactivate(): void {
        this._isActive = false;
        this._target = null;
    }

    /**
     * 升级炮台
     */
    public upgrade(): void {
        this._level++;

        // 升级奖励
        this.damage = Math.floor(this.damage * 1.2);
        this.attackSpeed *= 1.1;

        // 更新数据
        this.initTowerData();

        console.log(`炮台升级! 等级: ${this._level}, 伤害: ${this.damage}`);
    }

    /**
     * 获取炮台等级
     */
    public getLevel(): number {
        return this._level;
    }

    /**
     * 获取升级费用
     */
    public getUpgradeCost(): number {
        return this._level * 50;
    }

    /**
     * 获取回收费用
     */
    public getRefundCost(): number {
        return this._level * 30;
    }

    /**
     * 是否已激活
     */
    public isActive(): boolean {
        return this._isActive;
    }

    /**
     * 设置炮台类型 (动态创建时使用)
     */
    public setTowerType(type: TowerType): void {
        this.towerType = type;
        this.initTowerData();
        this.updateTowerColor();
    }

    /**
     * 设置炮台等级
     */
    public setTowerLevel(level: number): void {
        this._level = level;
        this.initTowerData();
    }

    /**
     * 获取炮台数据
     */
    public getTowerData(): any {
        return this._towerData;
    }

    /**
     * 收纳炮台 - 将炮台收回背包
     * @returns 收纳成功返回炮台数据，失败返回null
     */
    public store(): any | null {
        if (!this._isActive) {
            console.log('炮台未激活，无法收纳');
            return null;
        }

        // 停用炮台
        this.deactivate();

        // 从战斗系统注销
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.unregisterCombatEntity(this);
        }

        // 从炮台管理器移除
        const towerManager = this._getTowerManager();
        if (towerManager) {
            towerManager.removeTower(this);
        }

        // 返回炮台数据用于背包存储
        const storeData = {
            type: this.towerType,
            level: this._level,
            damage: this.damage,
            attackSpeed: this.attackSpeed,
            range: this.range,
            element: this._towerData.element
        };

        console.log(`炮台已收纳: ${TowerType[this.towerType]} Lv.${this._level}`);

        // 销毁节点
        this.node.destroy();

        return storeData;
    }

    /**
     * 放置炮台 - 在指定位置激活炮台
     * @param position 放置位置
     */
    public place(position: Vec3): void {
        this.node.setPosition(position);
        this.activate();
        console.log(`炮台已放置在 (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
    }

    /**
     * 检查是否可以升级
     */
    public canUpgrade(maxLevel: number = 5): boolean {
        return this._level < maxLevel;
    }
}

// Ensure class registration - Updated 2025-02-25
console.log('[Tower] Class loaded and registered');
