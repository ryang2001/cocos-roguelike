/**
 * 游戏管理器 - Cocos Creator版本
 * 负责游戏的整体流程控制
 */

import { _decorator, Component, Node, director, Prefab, instantiate, resources, Vec3, Camera, Canvas, Layers, Sprite, SpriteFrame, UITransform, Label, Color } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { WaveSystem } from '../systems/WaveSystem';
import { AssetManager } from '../systems/AssetManager';
import { MonsterManager } from '../systems/MonsterManager';
import { MapGenerator } from '../world/MapGenerator';
import { Joystick } from '../ui/Joystick';
// 显式导入实体类以确保模块加载（预制体依赖）
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';
import { Item } from '../entities/Item';
import { Tower } from '../entities/Tower';
import { Castle } from '../entities/Castle';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // 单例
    private static _instance: GameManager = null;
    public static get instance(): GameManager {
        return this._instance;
    }

    // 游戏状态
    private _isPaused: boolean = false;
    private _gameTime: number = 0;
    private _currentDay: number = 1;

    // 游戏数据
    private _playerData: any = null;
    private _inventoryData: any[] = [];

    // 场景初始化
    private _worldNode: Node | null = null;
    private _playerNode: Node | null = null;
    private _cameraNode: Node | null = null;
    private _prefabCache: Map<string, Prefab> = new Map();

    // Canvas分层
    private _uiCanvas: Canvas | null = null;      // UI Canvas - 用于摇杆、Debug等，跟随玩家
    private _worldCanvas: Canvas | null = null;   // World Canvas - 用于游戏世界

    // 摇杆节点
    private _joystickNode: Node | null = null;

    // 调试信息
    private _lastMouseClickPos: Vec3 | null = null;
    private _joystickCreatePos: Vec3 | null = null;

    // 防止重复初始化
    private _isSceneInitialized: boolean = false;

    // Prefab路径
    private readonly PREFAB_PATHS = {
        player: 'prefabs/Player',
        monster: 'prefabs/Monster',
        tower: 'prefabs/Tower',
        item: 'prefabs/Item'
    };

    onLoad() {
        if (GameManager._instance === null) {
            GameManager._instance = this;
            director.addPersistRootNode(this.node);
        } else {
            this.node.destroy();
            return;
        }

        this.initGame();
    }

    /**
     * 每帧更新
     */
    update(deltaTime: number): void {
        // 更新摄像机跟随玩家
        this.updateCameraFollow();

        // 更新UICanvas位置（跟随玩家，使UI元素保持相对固定）
        this.updateUICanvasPosition();

        // 更新游戏时间
        this.updateGameTime(deltaTime);

        // 更新Debug显示
        this.updateDebugDisplay();
    }

    /**
     * 更新Debug显示
     */
    private updateDebugDisplay(): void {
        if (!this._debugLabel) return;

        const playerPos = this._playerNode ? `(${Math.floor(this._playerNode.position.x)},${Math.floor(this._playerNode.position.y)},${Math.floor(this._playerNode.position.z)})` : 'N/A';

        // UICanvas Camera位置
        let cameraPos = 'N/A';
        const uiCamera = this._uiCanvas?.getComponent(Camera);
        if (uiCamera) {
            const pos = uiCamera.node.position;
            cameraPos = `(${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)})`;
        }

        // UICanvas位置
        let uiCanvasPos = 'N/A';
        if (this._uiCanvas) {
            const pos = this._uiCanvas.node.position;
            uiCanvasPos = `(${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)})`;
        }

        // 获取摇杆信息
        let joystickInfo = 'N/A';
        if (this._joystickNode) {
            const pos = this._joystickNode.position;
            const joystick = this._joystickNode.getComponent(Joystick);
            if (joystick) {
                const dir = joystick.getDirection();
                const power = joystick.getPower();
                const touching = joystick.isTouching();
                joystickInfo = `(${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}) T:${touching ? 1 : 0} P:${power.toFixed(2)}`;
            } else {
                joystickInfo = `(${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}) [无组件]`;
            }
        }

        this._debugLabel.string =
            `Player:${playerPos}\n` +
            `Camera:${cameraPos}\n` +
            `UICanvas:${uiCanvasPos}\n` +
            `Joystick:${joystickInfo}\n` +
            `Click:${this._lastMouseClickPos}\n` +
            `JSCreate:${this._joystickCreationPos}`;
    }

    /**
     * 更新摄像机跟随玩家
     * 使用UICanvas的Camera
     */
    private updateCameraFollow(): void {
        if (!this._playerNode) return;

        // 获取UICanvas的Camera
        const uiCamera = this._uiCanvas?.getComponent(Camera);
        if (!uiCamera) return;

        // 获取玩家位置
        const playerPos = this._playerNode.position;

        // 设置Camera位置跟随玩家
        const cameraNode = uiCamera.node;
        cameraNode.setPosition(playerPos.x, playerPos.y, cameraNode.position.z);
    }

    /**
     * 初始化游戏
     */
    private initGame(): void {
        console.log(`[${GameConfig.GAME_NAME}] 游戏初始化`);
        console.log(`版本: ${GameConfig.VERSION}`);

        // 初始化玩家数据
        this.initPlayerData();

        // 初始化背包
        this.initInventory();

        // 如果当前在GameScene，直接初始化场景
        if (director.getScene().name === 'GameScene') {
            this.scheduleOnce(() => {
                this.initGameScene();
            }, 0.1);
        }
    }

    /**
     * 初始化玩家数据
     */
    private initPlayerData(): void {
        this._playerData = {
            hp: GameConfig.PLAYER.BASE_HP,
            maxHp: GameConfig.PLAYER.BASE_HP,
            speed: GameConfig.PLAYER.BASE_SPEED,
            critRate: GameConfig.PLAYER.BASE_CRIT_RATE,
            critDamage: GameConfig.PLAYER.BASE_CRIT_DAMAGE,
            level: 1,
            exp: 0,
            gold: 0
        };
    }

    /**
     * 初始化背包
     */
    private initInventory(): void {
        this._inventoryData = [];
        for (let i = 0; i < GameConfig.PLAYER.INVENTORY_SIZE; i++) {
            this._inventoryData.push(null);
        }
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        console.log('游戏开始');
        this._gameTime = 0;
        this._currentDay = 1;
        this._isPaused = false;

        // 加载游戏场景
        director.loadScene('GameScene', () => {
            // 场景加载完成后初始化
            this.scheduleOnce(() => {
                this.initGameScene();
            }, 0.1);
        });
    }

    /**
     * 暂停游戏
     */
    public pauseGame(): void {
        this._isPaused = true;
        console.log('游戏暂停');
    }

    /**
     * 继续游戏
     */
    public resumeGame(): void {
        this._isPaused = false;
        console.log('游戏继续');
    }

    /**
     * 游戏结束
     */
    public gameOver(victory: boolean): void {
        console.log(victory ? '游戏胜利!' : '游戏失败!');

        // 保存游戏数据
        this.saveGameData();

        // 加载游戏结束场景
        director.loadScene('GameOverScene');
    }

    /**
     * 更新游戏时间
     */
    public updateGameTime(deltaTime: number): void {
        if (this._isPaused) return;

        this._gameTime += deltaTime * 1000; // 转换为毫秒

        // 检查天数变化
        const dayProgress = this._gameTime % GameConfig.DAY_DURATION;
        const newDay = Math.floor(this._gameTime / GameConfig.DAY_DURATION) + 1;

        if (newDay > this._currentDay && newDay <= GameConfig.TOTAL_DAYS) {
            this._currentDay = newDay;
            this.onDayChange(newDay);
        }

        // 检查游戏结束
        if (this._currentDay > GameConfig.TOTAL_DAYS) {
            this.gameOver(true);
        }
    }

    /**
     * 天数变化
     */
    private onDayChange(day: number): void {
        console.log(`第${day}天开始`);

        // 触发波次事件
        this.triggerWave(day);
    }

    /**
     * 触发波次
     */
    private triggerWave(day: number): void {
        console.log(`第${day}天波次开始`);

        // 获取WaveSystem组件
        const waveSystem = this.node.getComponent(WaveSystem);
        if (!waveSystem) {
            console.warn('WaveSystem组件未找到，无法触发波次');
            return;
        }

        // 波次由WaveSystem的时间监听器自动触发
        // 这里可以添加额外的波次触发逻辑，如手动触发测试
        console.log('WaveSystem将通过时间监听器自动触发波次');
    }

    /**
     * 保存游戏数据
     */
    private saveGameData(): void {
        const saveData = {
            player: this._playerData,
            inventory: this._inventoryData,
            gameTime: this._gameTime,
            currentDay: this._currentDay
        };

        // 使用抖音小游戏存储API
        if (typeof tt !== 'undefined') {
            tt.setStorageSync('roguelike_save', JSON.stringify(saveData));
        } else {
            localStorage.setItem('roguelike_save', JSON.stringify(saveData));
        }
    }

    /**
     * 加载游戏数据
     */
    public loadGameData(): boolean {
        let saveDataStr: string | null = null;

        // 使用抖音小游戏存储API
        if (typeof tt !== 'undefined') {
            saveDataStr = tt.getStorageSync('roguelike_save');
        } else {
            saveDataStr = localStorage.getItem('roguelike_save');
        }

        if (saveDataStr) {
            try {
                const saveData = JSON.parse(saveDataStr);
                this._playerData = saveData.player;
                this._inventoryData = saveData.inventory;
                this._gameTime = saveData.gameTime;
                this._currentDay = saveData.currentDay;
                return true;
            } catch (e) {
                console.error('加载存档失败:', e);
                return false;
            }
        }

        return false;
    }

    // Getter方法
    public get isPaused(): boolean {
        return this._isPaused;
    }

    public get gameTime(): number {
        return this._gameTime;
    }

    public get currentDay(): number {
        return this._currentDay;
    }

    public get playerData(): any {
        return this._playerData;
    }

    public get inventoryData(): any[] {
        return this._inventoryData;
    }

    // ==================== 场景初始化方法 ====================

    /**
     * 初始化游戏场景
     * 在GameScene加载完成后调用
     */
    public async initGameScene(): Promise<void> {
        // 防止重复初始化
        if (this._isSceneInitialized) {
            console.log('GameManager: 场景已经初始化，跳过');
            return;
        }
        this._isSceneInitialized = true;

        console.log('GameManager: 初始化游戏场景');

        // 先设置摄像机和Canvas（会检查并使用已存在的节点）
        this.setupCamera();

        // 创建世界根节点
        this.createWorldNode();

        // 生成地图
        await this.generateMap();

        // 预加载资源
        await this.preloadAssets();

        // 加载Prefab
        await this.loadPrefabs();

        // 创建系统管理器节点
        this.createSystemManagers();

        // 创建游戏对象
        this.createGameObjects();

        console.log('GameManager: 场景初始化完成');
    }

    /**
     * 创建世界根节点
     * 直接挂载到场景下（不再使用WorldCanvas）
     */
    private createWorldNode(): void {
        const scene = director.getScene();
        if (!scene) {
            console.error('GameManager: 未找到场景，无法创建World节点');
            return;
        }

        // 检查是否已存在World节点
        this._worldNode = scene.getChildByName('World');
        if (this._worldNode && this._worldNode.isValid) {
            console.log('GameManager: 使用已存在的World节点');
            return;
        }

        this._worldNode = new Node('World');
        this._worldNode.layer = Layers.Enum.UI_2D;

        // 添加UITransform
        const worldTransform = this._worldNode.addComponent(UITransform);
        worldTransform.setContentSize(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);

        // 挂载到场景（不再挂载到WorldCanvas）
        scene.addChild(this._worldNode);
        console.log('GameManager: World节点已挂载到场景');
    }

    /**
     * 生成地图
     */
    private async generateMap(): Promise<void> {
        if (!this._worldNode) return;

        console.log('GameManager: 生成地图...');

        // 创建地图生成器节点
        const mapGeneratorNode = new Node('MapGenerator');
        mapGeneratorNode.layer = Layers.Enum.UI_2D;

        // 添加UITransform
        const mapGenTransform = mapGeneratorNode.addComponent(UITransform);
        mapGenTransform.setContentSize(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);

        this._worldNode.addChild(mapGeneratorNode);

        // 添加地图生成器组件
        const mapGenerator = mapGeneratorNode.addComponent(MapGenerator);
        if (mapGenerator) {
            // 尝试使用纹理生成地图，如果失败则使用程序化生成
            try {
                await mapGenerator.generateMap();
            } catch (err) {
                console.warn('GameManager: 纹理地图生成失败，使用程序化生成', err);
                await mapGenerator.generateProceduralMap();
            }
        }

        console.log('GameManager: 地图生成完成');
    }

    /**
     * 创建系统管理器节点
     */
    private createSystemManagers(): void {
        if (!this._worldNode) return;

        // 创建 MonsterManager
        const monsterManagerNode = new Node('MonsterManager');
        monsterManagerNode.layer = Layers.Enum.UI_2D;
        this._worldNode.addChild(monsterManagerNode);

        // 添加 MonsterManager 组件并设置 prefab
        const monsterManager = monsterManagerNode.addComponent('MonsterManager') as any;
        if (monsterManager) {
            const monsterPrefab = this._prefabCache.get('monster');
            if (monsterPrefab) {
                monsterManager.monsterPrefab = monsterPrefab;
                console.log('GameManager: MonsterManager 已创建并设置预制体');
            }
        }
    }

    /**
     * 预加载资源
     */
    private async preloadAssets(): Promise<void> {
        console.log('GameManager: 预加载资源...');

        const assetManager = AssetManager.instance;
        if (assetManager) {
            await assetManager.preloadCharacterSprites();
            await assetManager.preloadMonsterSprites();
            await assetManager.preloadWeaponIcons();
            await assetManager.preloadUIAssets();
        }

        console.log('GameManager: 资源预加载完成');
    }

    /**
     * 加载所有Prefab
     */
    private async loadPrefabs(): Promise<void> {
        console.log('GameManager: 加载Prefab...');

        const loadPromises = Object.entries(this.PREFAB_PATHS).map(([key, path]) => {
            return new Promise<void>((resolve) => {
                resources.load(path, Prefab, (err, prefab) => {
                    if (err) {
                        console.warn(`加载Prefab失败: ${path}`, err.message);
                    } else if (prefab) {
                        this._prefabCache.set(key, prefab);
                        console.log(`✓ 加载Prefab: ${key}`);
                    }
                    resolve();
                });
            });
        });

        await Promise.all(loadPromises);
        console.log(`GameManager: 已加载 ${this._prefabCache.size} 个Prefab`);
    }

    /**
     * 创建游戏对象
     */
    private createGameObjects(): void {
        // 创建玩家
        this.createPlayer();

        // 创建城堡
        this.createCastle();

        // 创建初始怪物（测试用）
        this.createTestMonsters();

        // 创建测试炮台
        this.createTestTowers();

        // 创建Debug显示
        this.createDebugDisplay();
    }

    /**
     * 创建Debug坐标显示
     * Debug信息显示在UICanvas上，跟随玩家移动
     */
    private createDebugDisplay(): void {
        // 如果已经创建过Debug显示，直接返回
        if (this._debugLabel && this._debugLabel.isValid) {
            console.log('GameManager: Debug显示已存在，跳过创建');
            return;
        }

        // 使用UICanvas作为父节点
        if (!this._uiCanvas) {
            console.warn('GameManager: UICanvas未创建，无法创建Debug显示');
            return;
        }

        // 检查是否已存在Debug节点
        const existingDebug = this._uiCanvas.node.getChildByName('DebugInfo');
        if (existingDebug && existingDebug.isValid) {
            console.log('GameManager: 使用已存在的Debug节点');
            this._debugLabel = existingDebug.getComponent(Label);
            return;
        }

        // 创建Debug节点
        const debugNode = new Node('DebugInfo');
        debugNode.layer = Layers.Enum.UI_2D;

        // 添加UITransform
        const debugTransform = debugNode.addComponent(UITransform);
        debugTransform.setContentSize(400, 120);
        debugTransform.anchorPoint.set(0, 1); // 左上角锚点

        // 添加Label
        this._debugLabel = debugNode.addComponent(Label);
        this._debugLabel.fontSize = 18;
        this._debugLabel.color = new Color(255, 255, 255, 255);
        this._debugLabel.string = 'Player: (0, 0)';

        this._uiCanvas.node.addChild(debugNode);

        // 设置位置在左上角（相对于UICanvas中心）
        const canvasWidth = GameConfig.DESIGN_WIDTH;
        const canvasHeight = GameConfig.DESIGN_HEIGHT;
        debugNode.setPosition(
            -canvasWidth / 2 + 10,
            canvasHeight / 2 - 10,
            0
        );

        console.log('GameManager: Debug显示已创建（挂载到UICanvas）');
    }

    /**
     * 创建玩家
     */
    private createPlayer(): void {
        const playerPrefab = this._prefabCache.get('player');
        if (!playerPrefab) {
            console.error('GameManager: 玩家Prefab未加载');
            return;
        }

        // 实例化玩家
        this._playerNode = instantiate(playerPrefab);
        this._playerNode.name = 'Player';

        // 设置玩家位置（世界中心）
        const worldCenter = new Vec3(
            GameConfig.WORLD_WIDTH / 2,
            GameConfig.WORLD_HEIGHT / 2,
            0
        );
        this._playerNode.setPosition(worldCenter);

        // 添加到世界
        if (this._worldNode) {
            this._worldNode.addChild(this._playerNode);
        }

        console.log('GameManager: 玩家已创建', worldCenter);

        // 创建摇杆（UICanvas已在initGameScene中创建）
        this.createJoystick();
    }

    /**
     * 创建虚拟摇杆
     * 摇杆挂载到UICanvas，初始隐藏，点击时显示在点击位置
     */
    private createJoystick(): void {
        // 如果已经创建过摇杆，直接返回
        if (this._joystickNode && this._joystickNode.isValid) {
            console.log('GameManager: 摇杆已存在，跳过创建');
            return;
        }

        // 使用UICanvas作为摇杆父节点
        if (!this._uiCanvas) {
            console.error('GameManager: UICanvas未创建，无法创建摇杆');
            return;
        }

        console.log('GameManager: 开始创建摇杆...');

        // 检查是否已存在摇杆节点
        this._joystickNode = this._uiCanvas.node.getChildByName('Joystick');
        if (this._joystickNode && this._joystickNode.isValid) {
            console.log('GameManager: 使用已存在的摇杆节点');
        } else {
            this._joystickNode = new Node('Joystick');
            this._joystickNode.layer = Layers.Enum.UI_2D;

            // 添加到UICanvas
            this._uiCanvas.node.addChild(this._joystickNode);
            console.log('GameManager: 摇杆节点已添加到UICanvas');
        }

        // 检查是否已有Joystick组件
        let joystick = this._joystickNode.getComponent(Joystick);
        if (!joystick) {
            // 添加摇杆组件
            joystick = this._joystickNode.addComponent(Joystick);
            console.log('GameManager: 添加Joystick组件');
        } else {
            console.log('GameManager: 使用已存在的Joystick组件');
        }

        if (joystick) {
            // 绑定摇杆事件到玩家
            const player = this._playerNode?.getComponent(Player);
            if (player) {
                joystick.onChange((direction, power) => {
                    player.setJoystickInput(direction, power);
                });
                console.log('GameManager: 摇杆已绑定到玩家');
            } else {
                console.warn('GameManager: 未找到玩家组件，摇杆未绑定');
            }

            // 绑定调试位置回调
            joystick.onPosition((mouseX, mouseY, joystickX, joystickY, joystickZ) => {
                this._lastMouseClickPos = `(${Math.floor(mouseX)},${Math.floor(mouseY)},0)`;
                this._joystickCreationPos = `(${Math.floor(joystickX)},${Math.floor(joystickY)},${Math.floor(joystickZ)})`;
            });
        }

        console.log('GameManager: 虚拟摇杆创建完成');
    }

    /**
     * 更新摇杆位置
     * 注意：现在摇杆是UI层元素，固定在屏幕左下角，不需要每帧更新位置
     */
    private updateJoystickPosition(): void {
        // UI层摇杆固定在屏幕位置，不需要跟随玩家移动
        // 摇杆位置在createJoystick中已经设置为屏幕左下角
        // 如果需要动态调整摇杆位置，可以在这里添加逻辑
    }

    /**
     * 设置摄像机和Canvas
     * 只保留UICanvas的Camera，删除其他所有Camera
     * - UICanvas 用于所有UI元素，使用它自己的Camera
     * - World 内容直接作为场景子节点
     *
     * 版本: 2025-02-26-v9 - 只保留UICanvas Camera
     */
    private setupCamera(): void {
        const scene = director.getScene();
        if (!scene) {
            console.warn('GameManager: 未找到场景');
            return;
        }

        // ========== 第1步：先创建UICanvas（让它自动创建Camera）==========
        let uiCanvasNode = scene.getChildByName('UICanvas');
        if (uiCanvasNode && uiCanvasNode.isValid) {
            console.log('GameManager: 使用已存在的UICanvas');
            this._uiCanvas = uiCanvasNode.getComponent(Canvas);
            // 确保UICanvas有Camera
            if (!uiCanvasNode.getComponent(Camera)) {
                console.log('GameManager: UICanvas缺少Camera，添加Camera');
                const camera = uiCanvasNode.addComponent(Camera);
                camera.projection = Camera.ProjectionType.ORTHO;
                camera.orthoHeight = GameConfig.DESIGN_HEIGHT / 2;
                camera.near = 0.1;
                camera.far = 10000;
                camera.visibility = Layers.Enum.UI_2D;
                camera.priority = 0;
            }
        } else {
            uiCanvasNode = new Node('UICanvas');
            this._uiCanvas = uiCanvasNode.addComponent(Canvas);
            const uiTransform = uiCanvasNode.addComponent(UITransform);
            uiTransform.setContentSize(GameConfig.DESIGN_WIDTH, GameConfig.DESIGN_HEIGHT);
            uiCanvasNode.layer = Layers.Enum.UI_2D;
            scene.addChild(uiCanvasNode);
            console.log('GameManager: 创建UICanvas（自动创建Camera）');
        }

        // 配置UICanvas的Camera
        const uiCamera = uiCanvasNode.getComponent(Camera);
        if (uiCamera) {
            uiCamera.projection = Camera.ProjectionType.ORTHO;
            uiCamera.orthoHeight = GameConfig.DESIGN_HEIGHT / 2;
            uiCamera.near = 0.1;
            uiCamera.far = 10000;
            uiCamera.visibility = Layers.Enum.UI_2D;
            uiCamera.priority = 0;
            console.log('GameManager: UICanvas Camera已配置');
        }

        // ========== 第2步：删除MainCamera和WorldCanvas（保留编辑器Camera）==========
        this.deleteMainCamera(scene);
        this.cleanupExtraNodes(scene);

        // 保存Camera节点引用
        this._cameraNode = uiCamera ? uiCamera.node : null;

        // 注意：World内容直接放在场景下，不需要Canvas
        this._worldCanvas = null;

        console.log('GameManager: 摄像机设置完成（只保留UICanvas Camera）');
    }

    /**
     * 删除MainCamera节点（只删除我们创建的，保留编辑器Camera）
     */
    private deleteMainCamera(scene: Node): void {
        const mainCamera = scene.getChildByName('MainCamera');
        if (mainCamera && mainCamera.isValid) {
            console.log('GameManager: 删除MainCamera节点');
            mainCamera.destroy();
        }
    }

    /**
     * 清理场景中多余的Camera
     * 只删除特定节点上的Camera（如UICanvas自动创建的）
     */
    private cleanupExtraCameras(scene: Node): void {
        // 只清理特定节点上的Camera，不碰编辑器的Camera
        const nodesToClean = ['UICanvas', 'WorldCanvas', 'Canvas'];

        for (const nodeName of nodesToClean) {
            const node = scene.getChildByName(nodeName);
            if (node && node.isValid) {
                const camera = node.getComponent(Camera);
                if (camera) {
                    console.log(`GameManager: 删除 ${nodeName} 上的Camera`);
                    camera.destroy();
                }
            }
        }
    }

    /**
     * 清理场景中多余的节点（如WorldCanvas）
     */
    private cleanupExtraNodes(scene: Node): void {
        // 删除已存在的 WorldCanvas
        const worldCanvas = scene.getChildByName('WorldCanvas');
        if (worldCanvas && worldCanvas.isValid) {
            console.log('GameManager: 删除已存在的WorldCanvas');
            worldCanvas.destroy();
        }
    }

    /**
     * 删除Canvas自动创建的Camera
     */
    private removeAutoCreatedCamera(node: Node): void {
        const camera = node.getComponent(Camera);
        if (camera) {
            console.log(`GameManager: 删除 ${node.name} 自动创建的Camera`);
            camera.destroy();
        }
    }

    /**
     * 更新UICanvas位置
     * UICanvas 固定在屏幕中心，不跟随玩家
     */
    private updateUICanvasPosition(): void {
        // UICanvas 固定在屏幕位置，不需要更新
        // UI元素（摇杆、Debug等）相对于UICanvas保持固定位置
    }

    /**
     * 创建城堡
     */
    private createCastle(): void {
        const castle = new Node('Castle');

        // 添加Sprite组件并设置城堡贴图
        const sprite = castle.addComponent(Sprite);
        resources.load(GameConfig.TEXTURE_PATHS.TOWERS.BASIC + '/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (!err && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            }
        });

        // 设置城堡位置（玩家附近）
        const castlePos = new Vec3(
            GameConfig.WORLD_WIDTH / 2 - 200,
            GameConfig.WORLD_HEIGHT / 2,
            0
        );
        castle.setPosition(castlePos);

        if (this._worldNode) {
            this._worldNode.addChild(castle);
        }

        console.log('GameManager: 城堡已创建', castlePos);
    }

    /**
     * 创建测试怪物
     */
    private createTestMonsters(): void {
        const monsterPrefab = this._prefabCache.get('monster');
        if (!monsterPrefab) {
            console.warn('GameManager: 怪物Prefab未加载');
            return;
        }

        // 创建不同类型的测试怪物
        const monsterTypes = ['slime', 'goblin', 'skeleton', 'wolf'];
        const positions = [
            new Vec3(GameConfig.WORLD_WIDTH / 2 + 300, GameConfig.WORLD_HEIGHT / 2, 0),
            new Vec3(GameConfig.WORLD_WIDTH / 2 + 400, GameConfig.WORLD_HEIGHT / 2 + 100, 0),
            new Vec3(GameConfig.WORLD_WIDTH / 2 + 500, GameConfig.WORLD_HEIGHT / 2 - 100, 0),
            new Vec3(GameConfig.WORLD_WIDTH / 2 + 600, GameConfig.WORLD_HEIGHT / 2, 0),
        ];

        for (let i = 0; i < monsterTypes.length; i++) {
            const monster = instantiate(monsterPrefab);
            monster.name = `Monster_${monsterTypes[i]}`;
            monster.setPosition(positions[i]);

            // 设置怪物类型
            const monsterComp = monster.getComponent('Monster');
            if (monsterComp) {
                (monsterComp as any).monsterType = monsterTypes[i];
                (monsterComp as any).isElite = i === 3; // 最后一个设为精英
            }

            if (this._worldNode) {
                this._worldNode.addChild(monster);
            }
        }

        console.log('GameManager: 测试怪物已创建');
    }

    /**
     * 创建测试炮台
     */
    private createTestTowers(): void {
        const towerPrefab = this._prefabCache.get('tower');
        if (!towerPrefab) {
            console.warn('GameManager: 炮台Prefab未加载');
            return;
        }

        // 在城堡周围创建几个炮台
        const towerPositions = [
            new Vec3(GameConfig.WORLD_WIDTH / 2 - 300, GameConfig.WORLD_HEIGHT / 2 + 150, 0),
            new Vec3(GameConfig.WORLD_WIDTH / 2 - 300, GameConfig.WORLD_HEIGHT / 2 - 150, 0),
            new Vec3(GameConfig.WORLD_WIDTH / 2 - 100, GameConfig.WORLD_HEIGHT / 2 + 200, 0),
        ];

        for (let i = 0; i < towerPositions.length; i++) {
            const tower = instantiate(towerPrefab);
            tower.name = `Tower_${i}`;
            tower.setPosition(towerPositions[i]);

            if (this._worldNode) {
                this._worldNode.addChild(tower);
            }
        }

        console.log('GameManager: 测试炮台已创建');
    }

    /**
     * 获取玩家节点
     */
    public getPlayerNode(): Node | null {
        return this._playerNode;
    }
}
