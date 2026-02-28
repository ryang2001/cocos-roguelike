/**
 * 玩家控制器 - Cocos Creator版本
 * 负责玩家的移动、攻击、装备管理
 */

import { _decorator, Component, Node, Vec3, input, Input, EventTouch, Camera, Sprite, resources, SpriteFrame, Color, Vec2, ImageAsset, Texture2D, UITransform } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { GameManager } from '../core/GameManager';
import { calculateDepth } from '../utils/IsometricUtils';
import {
    IPlayer,
    IWeapon,
    WeaponType,
    Rarity,
    ICharacter,
    DEFAULT_RESISTANCES,
    createDefaultPlayer,
    IItem,
    ICombatEntity
} from '../types/Types';
import { ExperienceSystem } from '../systems/ExperienceSystem';
import { Joystick } from '../ui/Joystick';

const { ccclass, property } = _decorator;

/**
 * 玩家类
 * 实现 ICombatEntity 接口以参与战斗系统
 */
@ccclass('Player')
export class Player extends Component implements ICombatEntity {
    // 显式声明 node 属性以满足接口
    declare readonly node: Node;

    // ==================== 编辑器属性 ====================

    @property({ displayName: '移动速度' })
    moveSpeed: number = GameConfig.PLAYER.BASE_SPEED;

    @property({ displayName: '初始生命值' })
    initialMaxHp: number = GameConfig.PLAYER.BASE_HP;

    @property({ displayName: '初始暴击率' })
    initialCritRate: number = GameConfig.PLAYER.BASE_CRIT_RATE;

    @property({ displayName: '初始暴击伤害' })
    initialCritDamage: number = GameConfig.PLAYER.BASE_CRIT_DAMAGE;

    @property({ displayName: '玩家职业', tooltip: '骑士/法师/圣骑士/游侠/盗贼' })
    playerClass: string = 'knight'; // knight, mage, paladin, ranger, rogue

    // ==================== 私有属性 ====================

    // 玩家数据
    private _playerData: IPlayer;

    // 移动相关
    private _moveTarget: Vec3 | null = null;
    private _isMoving: boolean = false;
    private _joystickDirection: Vec2 = new Vec2(0, 0);
    private _joystickPower: number = 0;
    private _useJoystick: boolean = false;

    // 攻击计时器 (每个武器独立)
    private readonly _weaponTimers: Map<string, number> = new Map();

    // 主相机引用 (用于坐标转换)
    private _camera: Camera | null = null;

    // 背包系统引用
    private _inventory: any = null;

    // ==================== 系统获取辅助方法 ====================

    private _getCombatSystem(): any {
        return (this.node.scene.getComponent('CombatSystem') as any)?.instance;
    }

    private _getExperienceSystem(): any {
        return (this.node.scene.getComponent('ExperienceSystem') as any)?.instance;
    }

    private _getInventorySystem(): any {
        return (this.node.scene.getComponent('InventorySystem') as any)?.instance;
    }

    // ==================== 生命周期 ====================

    onLoad() {
        // 确保节点有UITransform组件（UI渲染必需）
        let uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            uiTransform = this.node.addComponent(UITransform);
            uiTransform.setContentSize(64, 64); // 默认玩家大小
            console.log('[Player] 添加UITransform组件');
        }

        // 初始化玩家数据
        this._playerData = createDefaultPlayer();
        this._playerData.maxHp = this.initialMaxHp;
        this._playerData.hp = this.initialMaxHp;
        this._playerData.speed = this.moveSpeed;
        this._playerData.critRate = this.initialCritRate;
        this._playerData.critDamage = this.initialCritDamage;

        // 初始化武器
        this.initWeapons();

        // 注册到战斗系统
        this.registerToCombatSystem();

        // 获取主相机
        this._camera = Camera.main;

        // 注册触摸事件
        this.registerInputEvents();

        // 获取背包系统引用
        this._inventory = this._getInventorySystem();

        // 加载AI生成的玩家精灵图
        this.loadPlayerSprite();
    }

    /**
     * 加载AI生成的玩家精灵图
     */
    private loadPlayerSprite(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) {
            console.warn(`Player: 节点上没有Sprite组件，无法加载精灵图`);
            return;
        }

        // 根据职业获取对应的路径
        const texturePath = this.getPlayerTexturePath();
        if (!texturePath) {
            console.warn(`Player: 未找到职业 ${this.playerClass} 的贴图路径`);
            this.createDefaultPlayerSprite(sprite);
            return;
        }

        // 动态加载精灵图（Cocos 3.x 需要加上 /spriteFrame 后缀）
        const spriteFramePath = `${texturePath}/spriteFrame`;
        resources.load(spriteFramePath, SpriteFrame, (err, spriteFrame) => {
            if (err || !spriteFrame) {
                console.warn(`Player: 加载精灵图失败 ${spriteFramePath}，尝试不加后缀...`);
                // 尝试不加后缀加载
                resources.load(texturePath, SpriteFrame, (err2, spriteFrame2) => {
                    if (err2 || !spriteFrame2) {
                        console.warn(`Player: 二次加载也失败，使用默认图形`);
                        this.createDefaultPlayerSprite(sprite);
                        return;
                    }
                    sprite.spriteFrame = spriteFrame2;
                    sprite.sizeMode = Sprite.SizeMode.RAW;
                    console.log(`Player: 成功加载精灵图（无后缀） ${texturePath}`);
                });
                return;
            }

            sprite.spriteFrame = spriteFrame;
            sprite.sizeMode = Sprite.SizeMode.RAW; // 使用原始尺寸
            console.log(`Player: 成功加载精灵图 ${spriteFramePath}`);
        });
    }

    /**
     * 创建默认玩家图形（当纹理加载失败时使用）
     */
    private createDefaultPlayerSprite(sprite: Sprite): void {
        try {
            const canvas = document.createElement('canvas');
            const size = 64;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // 如果连Canvas都不行，使用纯色
                sprite.color = new Color(0, 100, 255, 255);
                return;
            }

            // 清空画布
            ctx.clearRect(0, 0, size, size);

            // 根据职业选择颜色
            const classColors: { [key: string]: string } = {
                'knight': '#4169E1',  // 皇家蓝
                'mage': '#9932CC',    // 深紫
                'paladin': '#FFD700', // 金色
                'ranger': '#228B22',  // 森林绿
                'rogue': '#DC143C'    // 深红
            };
            const color = classColors[this.playerClass] || classColors['knight'];

            // 绘制圆形玩家图标
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 绘制职业标识（简单几何形状）
            ctx.fillStyle = '#FFFFFF';
            if (this.playerClass === 'knight') {
                // 剑形
                ctx.fillRect(size / 2 - 4, size / 4, 8, size / 2);
                ctx.fillRect(size / 4, size / 2 - 2, size / 2, 4);
            } else if (this.playerClass === 'mage') {
                // 星形
                this.drawStar(ctx, size / 2, size / 2, 5, size / 3, size / 6);
            } else {
                // 默认圆形
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 6, 0, Math.PI * 2);
                ctx.fill();
            }

            // 创建纹理
            const imageAsset = new ImageAsset(canvas);
            const texture = new Texture2D();
            texture.image = imageAsset;

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;

            sprite.spriteFrame = spriteFrame;
            console.log(`Player: 创建默认${this.playerClass}图形成功`);
        } catch (error) {
            console.error('Player: 创建默认图形失败:', error);
            // 使用纯色作为最后的fallback
            sprite.color = new Color(0, 100, 255, 255);
        }
    }

    /**
     * 绘制星形
     */
    private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number): void {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 获取玩家精灵图路径
     */
    private getPlayerTexturePath(): string | null {
        const pathMap: { [key: string]: string } = {
            'knight': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_KNIGHT,
            'mage': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_MAGE,
            'paladin': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_PALADIN,
            'ranger': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_RANGER,
            'rogue': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_ROGUE,
        };
        return pathMap[this.playerClass] || pathMap['knight'];
    }

    start() {
        // 设置初始位置（世界中心 - 2.5D等距视角中心为原点）
        const startPos = new Vec3(0, 0, 0);
        this.node.setPosition(startPos);
        console.log(`[Player] 初始位置: (${startPos.x}, ${startPos.y}, ${startPos.z})`);
    }

    update(deltaTime: number) {
        // 更新深度排序（2.5D等距视角）
        this.updateDepthSorting();

        // 更新移动
        this.updateMovement(deltaTime);

        // 更新攻击
        this.updateAttack(deltaTime);
    }

    onDestroy() {
        // 从战斗系统注销
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.unregisterCombatEntity(this);
        }

        // 注意：全局输入事件已移除，只使用摇杆控制
    }

    // ==================== ICombatEntity 接口实现 ====================

    /**
     * 获取角色数据
     */
    getCharacterData(): ICharacter {
        return {
            id: this._playerData.id,
            name: this._playerData.name,
            hp: this._playerData.hp,
            maxHp: this._playerData.maxHp,
            speed: this._playerData.speed,
            position: this.node.position
        };
    }

    /**
     * 更新深度排序（2.5D等距视角）
     * 根据Y坐标调整z轴，实现正确的遮挡关系
     */
    private updateDepthSorting(): void {
        const depth = calculateDepth(this.node.position.y, this.node.position.x);

        // 只有当深度变化时才更新位置
        if (Math.abs(this.node.position.z - depth) > 0.001) {
            this.node.setPosition(
                this.node.position.x,
                this.node.position.y,
                depth
            );
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(damage: number): void {
        // 应用防御减伤
        const reducedDamage = this.calculateReducedDamage(damage);
        this._playerData.hp -= reducedDamage;

        console.log(`玩家受到${reducedDamage}点伤害 (原始${damage}),剩余生命: ${this._playerData.hp}/${this._playerData.maxHp}`);

        if (this._playerData.hp <= 0) {
            this._playerData.hp = 0;
            this.onDeath();
        }
    }

    /**
     * 治疗
     */
    heal(amount: number): void {
        this._playerData.hp = Math.min(this._playerData.hp + amount, this._playerData.maxHp);
        console.log(`玩家恢复${amount}点生命,当前生命: ${this._playerData.hp}/${this._playerData.maxHp}`);
    }

    /**
     * 死亡处理
     */
    onDeath(): void {
        console.log('玩家死亡');
        GameManager.instance.gameOver(false);
    }

    // ==================== 初始化 ====================

    /**
     * 初始化武器
     */
    private initWeapons(): void {
        // 默认装备一把剑
        const sword: IWeapon = {
            id: 'default_sword',
            name: '新手剑',
            type: WeaponType.SWORD,
            damage: GameConfig.WEAPONS.SWORD.baseDamage,
            attackSpeed: GameConfig.WEAPONS.SWORD.attackSpeed,
            range: GameConfig.WEAPONS.SWORD.range,
            element: undefined,
            rarity: Rarity.COMMON,
            level: 1
        };

        this._playerData.weapons.push(sword);
        this._weaponTimers.set(sword.id, 0);
    }

    /**
     * 注册到战斗系统
     */
    private registerToCombatSystem(): void {
        const combatSystem = this._getCombatSystem();
        if (combatSystem) {
            combatSystem.registerCombatEntity(this);
        }
    }

    // ==================== 输入处理 ====================

    /**
     * 注册输入事件
     */
    private registerInputEvents(): void {
        // 不再注册全局触摸事件，只使用摇杆控制
        console.log('Player: 使用摇杆控制，跳过全局触摸事件注册');
    }

    /**
     * 触摸开始
     */
    private onTouchStart(event: EventTouch): void {
        const worldPos = this.screenToWorld(event.getUILocation());
        this.setMoveTarget(worldPos);
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch): void {
        const worldPos = this.screenToWorld(event.getUILocation());
        this.setMoveTarget(worldPos);
    }

    /**
     * 触摸结束
     */
    private onTouchEnd(event: EventTouch): void {
        this._moveTarget = null;
        this._isMoving = false;
    }

    /**
     * 屏幕坐标转世界坐标
     */
    private screenToWorld(screenPos: { x: number; y: number }): Vec3 {
        if (!this._camera) {
            return new Vec3(screenPos.x, screenPos.y, 0);
        }

        const worldPos = new Vec3();
        this._camera.screenToWorld(new Vec3(screenPos.x, screenPos.y, 0), worldPos);
        return worldPos;
    }

    // ==================== 移动系统 ====================

    /**
     * 设置移动目标
     */
    private setMoveTarget(target: Vec3): void {
        this._moveTarget = target;
        this._isMoving = true;
    }

    /**
     * 更新移动
     */
    private updateMovement(deltaTime: number): void {
        if (!this._playerData) return;

        // 如果有摇杆输入，优先使用摇杆控制
        if (this._useJoystick && this._joystickPower > 0) {
            this.updateJoystickMovement(deltaTime);
            return;
        }

        // 否则使用触摸点移动
        if (!this._isMoving || !this._moveTarget) return;

        const currentPos = this.node.getPosition();
        const direction = new Vec3();
        Vec3.subtract(direction, this._moveTarget, currentPos);
        direction.normalize();

        // 计算移动距离
        const moveDistance = this.moveSpeed * deltaTime;
        const distanceToTarget = Vec3.distance(currentPos, this._moveTarget);

        if (distanceToTarget <= moveDistance) {
            // 到达目标
            this.node.setPosition(this._moveTarget);
            this._isMoving = false;
            this._moveTarget = null;
        } else {
            // 继续移动
            const newPos = new Vec3();
            Vec3.scaleAndAdd(newPos, currentPos, direction, moveDistance);
            this.node.setPosition(newPos);
        }

        // 更新玩家数据中的位置
        this._playerData.position = this.node.position;
    }

    /**
     * 更新摇杆移动
     */
    private updateJoystickMovement(deltaTime: number): void {
        if (this._joystickPower <= 0) return;
        if (!this._playerData) return;

        const currentPos = this.node.getPosition();

        // 将摇杆方向转换为世界坐标方向
        const moveDirection = new Vec3(this._joystickDirection.x, this._joystickDirection.y, 0);

        // 计算移动距离（根据力度调整）
        const moveDistance = this.moveSpeed * deltaTime * this._joystickPower;

        // 计算新位置
        const newPos = new Vec3();
        Vec3.scaleAndAdd(newPos, currentPos, moveDirection, moveDistance);

        this.node.setPosition(newPos);

        // 更新玩家数据中的位置
        this._playerData.position = this.node.position;
    }

    /**
     * 设置摇杆输入
     * 由 Joystick 组件调用
     */
    public setJoystickInput(direction: Vec2, power: number): void {
        this._joystickDirection.set(direction);
        this._joystickPower = power;
        this._useJoystick = power > 0;

        // 清除触摸移动目标
        if (this._useJoystick) {
            this._moveTarget = null;
            this._isMoving = false;
        }
    }

    // ==================== 战斗系统 ====================

    /**
     * 更新攻击
     */
    private updateAttack(deltaTime: number): void {
        if (!this._playerData) return;

        const combatSystem = this._getCombatSystem();
        if (!combatSystem) return;

        // 遍历所有武器
        for (const weapon of this._playerData.weapons) {
            const timer = this._weaponTimers.get(weapon.id) || 0;
            const newTimer = timer + deltaTime;

            const attackInterval = 1.0 / weapon.attackSpeed;

            if (newTimer >= attackInterval) {
                this.performAttack(weapon, combatSystem);
                this._weaponTimers.set(weapon.id, 0);
            } else {
                this._weaponTimers.set(weapon.id, newTimer);
            }
        }
    }

    /**
     * 执行攻击
     */
    private performAttack(weapon: IWeapon, combatSystem: CombatSystem): void {
        // 查找范围内的敌人
        const enemies = combatSystem.findEnemiesInRange(
            this.node.position,
            weapon.range,
            (entity: ICombatEntity) => combatSystem.isEnemy(this, entity)
        );

        if (enemies.length > 0) {
            // 攻击最近的敌人
            const target = enemies[0];

            combatSystem.performAttack(
                this,
                weapon,
                target,
                DEFAULT_RESISTANCES, // 怪物抗性由怪物自己处理
                this._playerData.critRate,
                this._playerData.critDamage
            );
        }
    }

    /**
     * 计算减少后的伤害 (防御)
     */
    private calculateReducedDamage(damage: number): number {
        // 简单的防御公式: 伤害 = 原始伤害 / (1 + 防御/100)
        const defense = this._playerData.defense || 0;
        const multiplier = 1 / (1 + defense / 100);
        return Math.max(1, Math.floor(damage * multiplier));
    }

    // ==================== 武器管理 ====================

    /**
     * 添加武器
     */
    public addWeapon(weapon: IWeapon): void {
        this._playerData.weapons.push(weapon);
        this._weaponTimers.set(weapon.id, 0);
        console.log(`装备武器: ${weapon.name} (${weapon.type})`);
    }

    /**
     * 移除武器
     */
    public removeWeapon(weaponId: string): void {
        const index = this._playerData.weapons.findIndex(w => w.id === weaponId);
        if (index !== -1) {
            this._playerData.weapons.splice(index, 1);
            this._weaponTimers.delete(weaponId);
        }
    }

    // ==================== 经验和等级 ====================

    /**
     * 增加经验值
     */
    public addExp(amount: number): void {
        const levelsGained = ExperienceSystem.addExp(this._playerData, amount);
        console.log(`获得${amount}经验,当前经验: ${this._playerData.exp}`);

        if (levelsGained > 0) {
            console.log(`升级! 当前等级: ${this._playerData.level}, HP: ${this._playerData.hp}/${this._playerData.maxHp}`);
        }
    }

    /**
     * 添加金币
     */
    public addGold(amount: number): void {
        this._playerData.gold += amount;

        // 同时更新背包系统的金币
        if (this._inventory) {
            this._inventory.addGold(amount);
        }

        console.log(`获得${amount}金币,当前金币: ${this._playerData.gold}`);
    }

    /**
     * 花费金币
     */
    public spendGold(amount: number): boolean {
        if (this._playerData.gold < amount) return false;

        // 先从背包系统扣除
        if (this._inventory && !this._inventory.spendGold(amount)) {
            return false;
        }

        this._playerData.gold -= amount;
        console.log(`花费${amount}金币,剩余金币: ${this._playerData.gold}`);
        return true;
    }

    /**
     * 添加物品到背包
     */
    public addToInventory(item: IItem, count: number = 1): boolean {
        if (!this._inventory) return false;
        return this._inventory.addItem(item, count);
    }

    /**
     * 获取背包系统
     */
    public getInventory(): any {
        return this._inventory;
    }

    // ==================== Getter 方法 ====================

    public get playerData(): IPlayer {
        return this._playerData;
    }

    public get currentHp(): number {
        return this._playerData.hp;
    }

    public get maxHp(): number {
        return this._playerData.maxHp;
    }

    public get level(): number {
        return this._playerData.level;
    }

    public get exp(): number {
        return this._playerData.exp;
    }

    public get gold(): number {
        return this._playerData.gold;
    }

    public get weapons(): IWeapon[] {
        return this._playerData.weapons;
    }
}

// Ensure class registration
console.log('[Player] Class loaded and registered');
