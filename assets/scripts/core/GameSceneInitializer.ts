/**
 * 游戏场景初始化器
 * 负责在GameScene中创建玩家、怪物、炮台等游戏对象
 */

import { _decorator, Component, Node, Prefab, instantiate, resources, Vec3, Camera, Canvas, Layers, director, Sprite, SpriteFrame } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { AssetManager } from '../systems/AssetManager';
import { MapGenerator } from '../world/MapGenerator';
import { CameraController } from '../systems/CameraController';

const { ccclass, property } = _decorator;

@ccclass('GameSceneInitializer')
export class GameSceneInitializer extends Component {

    // ==================== 编辑器属性 ====================

    @property({ type: MapGenerator, displayName: '地图生成器' })
    mapGenerator: MapGenerator | null = null;

    @property({ type: CameraController, displayName: '摄像机控制器' })
    cameraController: CameraController | null = null;

    // Prefab路径（代码中动态加载）
    private readonly PREFAB_PATHS = {
        player: 'prefabs/Player',
        monster: 'prefabs/Monster',
        tower: 'prefabs/Tower',
        item: 'prefabs/Item'
    };

    // Prefab缓存
    private _prefabCache: Map<string, Prefab> = new Map();

    // 场景节点引用
    private _playerNode: Node | null = null;
    private _worldNode: Node | null = null;

    async onLoad() {
        console.log('GameSceneInitializer: 开始初始化场景');

        // 创建世界根节点
        this.createWorldNode();

        // 生成地图
        await this.generateMap();

        // 预加载资源
        await this.preloadAssets();

        // 加载Prefab
        await this.loadPrefabs();

        // 创建游戏对象
        this.createGameObjects();

        // 设置摄像机
        this.setupCameraWithMap();

        console.log('GameSceneInitializer: 场景初始化完成');
    }

    /**
     * 创建世界根节点
     */
    private createWorldNode(): void {
        this._worldNode = new Node('World');
        this._worldNode.layer = Layers.Enum.UI_2D;
        this.node.addChild(this._worldNode);
    }

    /**
     * 生成地图
     */
    private async generateMap(): Promise<void> {
        console.log('GameSceneInitializer: 开始生成地图...');

        // 如果编辑器中未指定MapGenerator，动态创建一个
        if (!this.mapGenerator) {
            const mapGenNode = new Node('MapGenerator');
            this.node.addChild(mapGenNode);
            this.mapGenerator = mapGenNode.addComponent(MapGenerator);

            // 配置地图参数
            this.mapGenerator.tileSize = 64;
            this.mapGenerator.mapWidth = Math.floor(GameConfig.WORLD_WIDTH / 64);
            this.mapGenerator.mapHeight = Math.floor(GameConfig.WORLD_HEIGHT / 64);
        }

        // 生成地图
        await this.mapGenerator.generateMap();

        console.log('GameSceneInitializer: 地图生成完成');
    }

    /**
     * 预加载资源
     */
    private async preloadAssets(): Promise<void> {
        console.log('GameSceneInitializer: 预加载资源...');

        const assetManager = AssetManager.instance;
        if (assetManager) {
            await assetManager.preloadCharacterSprites();
            await assetManager.preloadMonsterSprites();
            await assetManager.preloadWeaponIcons();
            await assetManager.preloadUIAssets();
        }

        console.log('GameSceneInitializer: 资源预加载完成');
    }

    /**
     * 加载所有Prefab
     */
    private async loadPrefabs(): Promise<void> {
        console.log('GameSceneInitializer: 加载Prefab...');

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
        console.log(`GameSceneInitializer: 已加载 ${this._prefabCache.size} 个Prefab`);
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
    }

    /**
     * 创建玩家
     */
    private createPlayer(): void {
        const playerPrefab = this._prefabCache.get('player');
        if (!playerPrefab) {
            console.error('GameSceneInitializer: 玩家Prefab未加载');
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

        console.log('GameSceneInitializer: 玩家已创建', worldCenter);

        // 设置摄像机跟随玩家
        this.setupCamera();
    }

    /**
     * 设置摄像机
     */
    private setupCamera(): void {
        const canvas = this.node.getComponentInChildren(Canvas);
        if (!canvas) {
            console.warn('GameSceneInitializer: 未找到Canvas');
            return;
        }

        // 获取或创建摄像机
        let camera = this.node.getComponentInChildren(Camera);
        if (!camera) {
            const cameraNode = new Node('MainCamera');
            camera = cameraNode.addComponent(Camera);
            camera.projection = Camera.ProjectionType.ORTHO;
            camera.orthoHeight = 360;
            camera.visibility = Layers.Enum.UI_2D;
            canvas.node.addChild(cameraNode);
        }

        // 设置摄像机跟随脚本
        const cameraController = camera.node.getComponent('CameraController');
        if (cameraController && this._playerNode) {
            (cameraController as any).target = this._playerNode;
        }

        console.log('GameSceneInitializer: 摄像机已设置');
    }

    /**
     * 设置摄像机（与地图联动）
     */
    private setupCameraWithMap(): void {
        const canvas = this.node.getComponentInChildren(Canvas);
        if (!canvas) {
            console.warn('GameSceneInitializer: 未找到Canvas');
            return;
        }

        // 如果编辑器中未指定CameraController，动态创建一个
        if (!this.cameraController) {
            // 查找现有摄像机
            let camera = this.node.getComponentInChildren(Camera);
            let cameraNode: Node;

            if (!camera) {
                // 创建新的摄像机节点
                cameraNode = new Node('MainCamera');
                camera = cameraNode.addComponent(Camera);
                camera.projection = Camera.ProjectionType.ORTHO;
                camera.orthoHeight = 360;
                camera.visibility = Layers.Enum.UI_2D;
                canvas.node.addChild(cameraNode);
            } else {
                cameraNode = camera.node;
            }

            // 添加CameraController组件
            this.cameraController = cameraNode.getComponent(CameraController);
            if (!this.cameraController) {
                this.cameraController = cameraNode.addComponent(CameraController);
            }
        }

        // 配置摄像机控制器
        if (this.cameraController) {
            // 设置跟随目标为玩家
            if (this._playerNode) {
                this.cameraController.setTarget(this._playerNode);
            }

            // 使用地图尺寸自动适配边界
            if (this.mapGenerator) {
                const mapWidth = this.mapGenerator.mapWidth * this.mapGenerator.tileSize;
                const mapHeight = this.mapGenerator.mapHeight * this.mapGenerator.tileSize;
                this.cameraController.fitBoundsToMap(mapWidth, mapHeight);
            } else {
                // 如果没有地图生成器，使用配置的世界尺寸
                this.cameraController.fitBoundsToMap(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);
            }

            // 启用边界限制
            this.cameraController.setEnableBounds(true);

            console.log('GameSceneInitializer: 摄像机已配置，跟随玩家并限制在地图范围内');
        }
    }

    /**
     * 创建城堡
     */
    private createCastle(): void {
        // 城堡暂时没有Prefab，创建一个简单的节点作为占位
        const castle = new Node('Castle');

        // 添加Sprite组件并设置城堡贴图
        const sprite = castle.addComponent(Sprite);
        const towerPath = `${GameConfig.TEXTURE_PATHS.TOWERS.BASIC}/spriteFrame`;
        resources.load(towerPath, SpriteFrame, (err, spriteFrame) => {
            if (!err && spriteFrame) {
                sprite.spriteFrame = spriteFrame;
            } else {
                // 尝试不加后缀
                resources.load(GameConfig.TEXTURE_PATHS.TOWERS.BASIC, SpriteFrame, (err2, spriteFrame2) => {
                    if (!err2 && spriteFrame2) {
                        sprite.spriteFrame = spriteFrame2;
                    }
                });
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

        console.log('GameSceneInitializer: 城堡已创建', castlePos);
    }

    /**
     * 创建测试怪物
     */
    private createTestMonsters(): void {
        const monsterPrefab = this._prefabCache.get('monster');
        if (!monsterPrefab) {
            console.warn('GameSceneInitializer: 怪物Prefab未加载');
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

        console.log('GameSceneInitializer: 测试怪物已创建');
    }

    /**
     * 创建测试炮台
     */
    private createTestTowers(): void {
        const towerPrefab = this._prefabCache.get('tower');
        if (!towerPrefab) {
            console.warn('GameSceneInitializer: 炮台Prefab未加载');
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

        console.log('GameSceneInitializer: 测试炮台已创建');
    }

    /**
     * 获取玩家节点
     */
    public getPlayerNode(): Node | null {
        return this._playerNode;
    }
}
