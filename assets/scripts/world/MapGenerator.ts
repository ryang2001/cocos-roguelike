/**
 * 地图生成器
 * 负责生成随机地图纹理和地形
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, resources, Layers, Texture2D, ImageAsset, Color, Rect, assetManager } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { cartesianToIsometric, calculateDepth } from '../utils/IsometricUtils';

const { ccclass, property } = _decorator;

// 地形类型
export enum TerrainType {
    GRASS = 'grass',
    DIRT = 'dirt',
    STONE = 'stone',
    WATER = 'water'
}

// 地图块数据
interface MapTile {
    x: number;
    y: number;
    terrainType: TerrainType;
    spriteFrame: SpriteFrame | null;
}

@ccclass('MapGenerator')
export class MapGenerator extends Component {
    // 编辑器属性：直接绑定地形纹理
    @property({ type: SpriteFrame, displayName: '草地纹理' })
    grassSpriteFrame: SpriteFrame | null = null;

    @property({ type: SpriteFrame, displayName: '泥土纹理' })
    dirtSpriteFrame: SpriteFrame | null = null;

    @property({ type: SpriteFrame, displayName: '石头纹理' })
    stoneSpriteFrame: SpriteFrame | null = null;

    // 地图配置
    private _tileSize: number = 128; // 每个瓦片的大小（增大以便清晰可见）
    private _mapWidth: number = 0;  // 地图宽度（瓦片数）
    private _mapHeight: number = 0; // 地图高度（瓦片数）

    // 瓦片精灵帧缓存
    private _tileSprites: Map<TerrainType, SpriteFrame> = new Map();

    // 地图数据
    private _mapData: MapTile[][] = [];

    // 地图根节点
    private _mapRoot: Node | null = null;

    onLoad() {
        this._mapWidth = Math.ceil(GameConfig.WORLD_WIDTH / this._tileSize);
        this._mapHeight = Math.ceil(GameConfig.WORLD_HEIGHT / this._tileSize);

        // 创建地图根节点（在onLoad中创建，确保在start前就有）
        this.createMapRoot();
    }

    start() {
        // 确保地图根节点在最底层
        if (this._mapRoot) {
            this._mapRoot.setSiblingIndex(0);
        }
    }

    /**
     * 初始化并生成地图
     */
    public async generateMap(): Promise<void> {
        console.log('MapGenerator: 开始生成地图...');

        // 加载瓦片纹理
        await this.loadTileTextures();

        // 生成地图数据
        this.generateMapData();

        // 创建地图渲染
        this.renderMap();

        console.log('MapGenerator: 地图生成完成');
    }

    /**
     * 加载瓦片纹理
     * 优先使用编辑器绑定的属性，失败时回退到resources.load
     */
    private async loadTileTextures(): Promise<void> {
        console.log('[MapGenerator] 开始加载地形纹理...');

        // 第一步：使用编辑器绑定的资源（最可靠）
        if (this.grassSpriteFrame) {
            this._tileSprites.set(TerrainType.GRASS, this.grassSpriteFrame);
            console.log('[MapGenerator] ✓ 使用编辑器绑定的草地纹理');
        }
        if (this.dirtSpriteFrame) {
            this._tileSprites.set(TerrainType.DIRT, this.dirtSpriteFrame);
            console.log('[MapGenerator] ✓ 使用编辑器绑定的泥土纹理');
        }
        if (this.stoneSpriteFrame) {
            this._tileSprites.set(TerrainType.STONE, this.stoneSpriteFrame);
            console.log('[MapGenerator] ✓ 使用编辑器绑定的石头纹理');
        }

        // 如果编辑器绑定的资源足够，直接返回
        if (this._tileSprites.size >= 3) {
            console.log(`[MapGenerator] 纹理加载完成（编辑器绑定），共 ${this._tileSprites.size} 个`);
            return;
        }

        // 第二步：尝试从resources加载缺失的纹理
        const terrainPaths: { [key: string]: string } = {};
        if (!this.grassSpriteFrame) terrainPaths[TerrainType.GRASS] = GameConfig.TEXTURE_PATHS.TERRAIN.GRASS_01;
        if (!this.dirtSpriteFrame) terrainPaths[TerrainType.DIRT] = GameConfig.TEXTURE_PATHS.TERRAIN.DIRT_01;
        if (!this.stoneSpriteFrame) terrainPaths[TerrainType.STONE] = GameConfig.TEXTURE_PATHS.TERRAIN.STONE_01;

        const loadPromises = Object.entries(terrainPaths).map(([type, path]) => {
            return new Promise<void>((resolve) => {
                // Cocos Creator 3.x 中，当图片类型设置为 sprite-frame 时，
                // 加载路径需要加上 /spriteFrame 后缀
                const spriteFramePath = `${path}/spriteFrame`;
                console.log(`[MapGenerator] 尝试加载: ${spriteFramePath}`);

                // 使用 resources.load 加载 SpriteFrame
                resources.load(spriteFramePath, SpriteFrame, (err, spriteFrame) => {
                    if (err || !spriteFrame) {
                        console.warn(`[MapGenerator] ✗ 加载失败: ${spriteFramePath}`, err?.message || '未知错误');
                        // 尝试不加后缀加载（兼容其他情况）
                        console.log(`[MapGenerator] 尝试不加后缀加载: ${path}`);
                        resources.load(path, SpriteFrame, (err2, spriteFrame2) => {
                            if (err2 || !spriteFrame2) {
                                console.warn(`[MapGenerator] ✗ 二次加载也失败: ${path}`);
                                resolve();
                                return;
                            }
                            this._tileSprites.set(type as TerrainType, spriteFrame2);
                            console.log(`[MapGenerator] ✓ 成功加载（无后缀）: ${type} (${path})`);
                            resolve();
                        });
                        return;
                    }
                    console.log(`[MapGenerator] ✓ 加载成功: ${spriteFramePath}`);

                    // 直接使用加载的SpriteFrame（Cocos 3.x中不需要克隆）
                    this._tileSprites.set(type as TerrainType, spriteFrame);
                    console.log(`[MapGenerator] ✓ 成功加载: ${type} (${spriteFramePath})`);
                    resolve();
                });
            });
        });

        await Promise.all(loadPromises);
        console.log(`[MapGenerator] 纹理加载完成，共 ${this._tileSprites.size} 个`);

        // 如果纹理加载失败，使用程序化纹理作为备用
        if (this._tileSprites.size === 0) {
            console.warn('[MapGenerator] 没有外部纹理加载成功，使用程序化纹理');
            await this.generateProceduralTextures();
        }
    }

    /**
     * 创建地图根节点
     * 在2.5D等距视角中，地图根节点保持在(0,0,0)
     * 瓦片通过等距坐标转换函数计算实际位置
     */
    private createMapRoot(): void {
        this._mapRoot = new Node('MapRoot');
        this._mapRoot.layer = Layers.Enum.UI_2D;

        // 在等距视角中，地图根节点保持在原点
        // 所有瓦片的位置都通过 cartesianToIsometric 计算
        this._mapRoot.setPosition(0, 0, 0);

        // 添加UITransform
        const uiTransform = this._mapRoot.addComponent(UITransform);
        uiTransform.setContentSize(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);

        // 添加到父节点（worldNode）
        if (this.node.parent) {
            this.node.parent.addChild(this._mapRoot);
            console.log('[MapGenerator] 地图根节点已创建并添加到父节点');
        } else {
            this.node.addChild(this._mapRoot);
            console.log('[MapGenerator] 地图根节点已添加到当前节点');
        }

        // 确保地图根节点是第一个子节点（在最底层）
        this._mapRoot.setSiblingIndex(0);

        console.log(`[MapGenerator] 地图根节点位置: (0, 0, 0) - 等距视角`);
    }

    /**
     * 生成地图数据
     * 使用简单的噪声算法生成自然的地形分布
     */
    private generateMapData(): void {
        this._mapData = [];

        // 中心点（城堡位置）
        const centerX = Math.floor(this._mapWidth / 2);
        const centerY = Math.floor(this._mapHeight / 2);

        for (let x = 0; x < this._mapWidth; x++) {
            this._mapData[x] = [];
            for (let y = 0; y < this._mapHeight; y++) {
                // 计算到中心的距离
                const distanceToCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                );
                const maxDistance = Math.sqrt(
                    Math.pow(this._mapWidth / 2, 2) + Math.pow(this._mapHeight / 2, 2)
                );
                const normalizedDistance = distanceToCenter / maxDistance;

                // 基于距离和随机噪声决定地形类型
                const noise = Math.random();
                let terrainType: TerrainType;

                if (normalizedDistance < 0.15) {
                    // 中心区域：主要是草地（城堡周围）
                    terrainType = noise < 0.9 ? TerrainType.GRASS : TerrainType.DIRT;
                } else if (normalizedDistance < 0.4) {
                    // 中间区域：草地和泥土混合
                    if (noise < 0.6) {
                        terrainType = TerrainType.GRASS;
                    } else if (noise < 0.9) {
                        terrainType = TerrainType.DIRT;
                    } else {
                        terrainType = TerrainType.STONE;
                    }
                } else if (normalizedDistance < 0.7) {
                    // 外围区域：泥土和石头混合
                    if (noise < 0.3) {
                        terrainType = TerrainType.GRASS;
                    } else if (noise < 0.7) {
                        terrainType = TerrainType.DIRT;
                    } else {
                        terrainType = TerrainType.STONE;
                    }
                } else {
                    // 边缘区域：主要是石头
                    terrainType = noise < 0.4 ? TerrainType.DIRT : TerrainType.STONE;
                }

                // 创建地图块数据
                this._mapData[x][y] = {
                    x,
                    y,
                    terrainType,
                    spriteFrame: this._tileSprites.get(terrainType) || null
                };
            }
        }

        // 添加一些随机的特殊区域（小片草地或石头区域）
        this.addRandomFeatures();

        console.log(`MapGenerator: 地图数据生成完成 (${this._mapWidth}x${this._mapHeight})`);
    }

    /**
     * 添加随机特征（小片特殊地形）
     */
    private addRandomFeatures(): void {
        const featureCount = 20; // 特征数量

        for (let i = 0; i < featureCount; i++) {
            const centerX = Math.floor(Math.random() * this._mapWidth);
            const centerY = Math.floor(Math.random() * this._mapHeight);
            const radius = 3 + Math.floor(Math.random() * 8); // 3-10的半径
            const terrainType = Math.random() < 0.5 ? TerrainType.GRASS : TerrainType.STONE;

            // 在圆形区域内设置地形
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;

                    // 检查边界
                    if (x < 0 || x >= this._mapWidth || y < 0 || y >= this._mapHeight) {
                        continue;
                    }

                    // 圆形检查
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius) {
                        // 边缘渐变
                        const probability = 1 - (distance / radius) * 0.5;
                        if (Math.random() < probability) {
                            this._mapData[x][y].terrainType = terrainType;
                            this._mapData[x][y].spriteFrame = this._tileSprites.get(terrainType) || null;
                        }
                    }
                }
            }
        }
    }

    /**
     * 渲染地图
     * 使用网格状瓦片布局，每个瓦片显示对应的纹理
     */
    private renderMap(): void {
        if (!this._mapRoot) return;

        console.log('MapGenerator: 渲染地图...');
        console.log(`MapGenerator: 可用纹理数量: ${this._tileSprites.size}`);
        console.log(`MapGenerator: 纹理类型: ${Array.from(this._tileSprites.keys()).join(', ')}`);
        console.log(`MapGenerator: 地图尺寸: ${this._mapWidth}x${this._mapHeight} 瓦片`);

        // 检查是否有纹理
        if (this._tileSprites.size === 0) {
            console.warn('MapGenerator: 没有纹理可用，使用程序化纹理');
            this.generateProceduralTextures();
        }

        // 使用瓦片网格布局渲染地图
        // 为了性能，我们将地图分成多个区块，每个区块包含多个瓦片
        const chunkSize = 8; // 每个区块8x8个瓦片
        const chunksX = Math.ceil(this._mapWidth / chunkSize);
        const chunksY = Math.ceil(this._mapHeight / chunkSize);

        let tileCount = 0;

        for (let cx = 0; cx < chunksX; cx++) {
            for (let cy = 0; cy < chunksY; cy++) {
                tileCount += this.createChunkNode(cx, cy, chunkSize);
            }
        }

        console.log(`MapGenerator: 地图渲染完成 (${chunksX}x${chunksY} 区块, ${tileCount} 个瓦片)`);

        // 在中心创建一个测试瓦片（确保玩家位置有地面）
        this.createCenterTestTile();
    }

    /**
     * 在地图中心创建一个测试瓦片
     */
    private createCenterTestTile(): void {
        if (!this._mapRoot) return;

        const centerX = Math.floor(this._mapWidth / 2);
        const centerY = Math.floor(this._mapHeight / 2);
        const tile = this._mapData[centerX]?.[centerY];

        if (!tile) return;

        console.log(`[MapGenerator] 创建中心测试瓦片 at (${centerX}, ${centerY}), 类型: ${tile.terrainType}`);

        const tileNode = new Node('CenterTestTile');
        tileNode.layer = Layers.Enum.UI_2D;

        // 计算笛卡尔世界坐标（中心）
        const cartX = (centerX - this._mapWidth / 2) * this._tileSize;
        const cartY = (centerY - this._mapHeight / 2) * this._tileSize;

        // 转换为等距坐标（2.5D效果）
        const isoPos = cartesianToIsometric(cartX, cartY);
        const depth = calculateDepth(cartY, cartX);

        tileNode.setPosition(isoPos.x, isoPos.y, depth);

        console.log(`[MapGenerator] 测试瓦片位置: cart=(${cartX.toFixed(0)}, ${cartY.toFixed(0)}) iso=(${isoPos.x.toFixed(0)}, ${isoPos.y.toFixed(0)})`);

        const uiTransform = tileNode.addComponent(UITransform);
        uiTransform.anchorPoint.set(0.5, 0.5);

        const spriteFrame = this._tileSprites.get(tile.terrainType);

        if (spriteFrame) {
            const sprite = tileNode.addComponent(Sprite);
            sprite.spriteFrame = spriteFrame;
            sprite.sizeMode = Sprite.SizeMode.RAW;
            sprite.type = Sprite.Type.SIMPLE;
            sprite.trim = false;
            sprite.color = Color.YELLOW; // 黄色调便于识别
            uiTransform.setContentSize(this._tileSize, this._tileSize * 0.5);
            console.log('[MapGenerator] 测试瓦片使用纹理:', tile.terrainType);
        } else {
            // 使用 Sprite 组件显示红色
            const sprite = tileNode.addComponent(Sprite);
            sprite.color = Color.RED;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            uiTransform.setContentSize(this._tileSize, this._tileSize * 0.5);
            console.warn('[MapGenerator] 测试瓦片无纹理，使用红色');
        }

        this._mapRoot.addChild(tileNode);
    }

    /**
     * 创建区块节点（包含多个瓦片）- 2.5D等距视角
     * 渲染顺序：从左上到右下，确保深度正确
     */
    private createChunkNode(chunkX: number, chunkY: number, chunkSize: number): number {
        if (!this._mapRoot) return 0;

        const startX = chunkX * chunkSize;
        const startY = chunkY * chunkSize;
        const endX = Math.min(startX + chunkSize, this._mapWidth);
        const endY = Math.min(startY + chunkSize, this._mapHeight);

        let tileCount = 0;

        // 收集所有瓦片数据
        const tiles: MapTile[] = [];
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const tile = this._mapData[x]?.[y];
                if (tile) {
                    tiles.push(tile);
                }
            }
        }

        // 按等距深度排序（从左上到右下）
        // 在等距视角中，x+y 越小表示越靠后（越远）
        tiles.sort((a, b) => {
            const depthA = a.x + a.y;
            const depthB = b.x + b.y;
            return depthA - depthB;
        });

        // 按排序后的顺序创建瓦片节点
        for (const tile of tiles) {
            this.createTileNode(tile);
            tileCount++;
        }

        return tileCount;
    }

    /**
     * 创建单个瓦片节点
     * 使用2.5D等距坐标放置，产生斜45度视角效果
     */
    private createTileNode(tile: MapTile): void {
        if (!this._mapRoot) return;

        const tileNode = new Node(`Tile_${tile.x}_${tile.y}`);
        tileNode.layer = Layers.Enum.UI_2D;

        // 计算笛卡尔世界坐标（以地图中心为原点）
        const cartX = (tile.x - this._mapWidth / 2) * this._tileSize;
        const cartY = (tile.y - this._mapHeight / 2) * this._tileSize;

        // 转换为等距坐标（2.5D效果）
        const isoPos = cartesianToIsometric(cartX, cartY);
        const depth = calculateDepth(cartY, cartX);

        // 设置位置（使用等距坐标）
        tileNode.setPosition(isoPos.x, isoPos.y, depth);

        // 添加UITransform
        const uiTransform = tileNode.addComponent(UITransform);
        uiTransform.anchorPoint.set(0.5, 0.5); // 中心锚点

        const spriteFrame = this._tileSprites.get(tile.terrainType);

        if (spriteFrame) {
            // 使用纹理
            const sprite = tileNode.addComponent(Sprite);
            sprite.spriteFrame = spriteFrame;
            sprite.sizeMode = Sprite.SizeMode.RAW; // 使用原始纹理尺寸
            sprite.type = Sprite.Type.SIMPLE;
            sprite.trim = false;
            sprite.color = Color.WHITE;
            // 设置瓦片实际显示尺寸（等距视角下高度减半）
            uiTransform.setContentSize(this._tileSize, this._tileSize * 0.5);
        } else {
            // 没有纹理时，创建纯色纹理
            const sprite = tileNode.addComponent(Sprite);
            sprite.spriteFrame = this.createColorSpriteFrame(this.getTerrainColor(tile.terrainType));
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.color = Color.WHITE;
            uiTransform.setContentSize(this._tileSize, this._tileSize * 0.5);
        }

        // 添加到地图根节点
        this._mapRoot.addChild(tileNode);

        // 调试信息：只打印中心区域的瓦片
        if (tile.x === Math.floor(this._mapWidth / 2) && tile.y === Math.floor(this._mapHeight / 2)) {
            console.log(`[MapGenerator] 中心瓦片: cart=(${cartX.toFixed(0)}, ${cartY.toFixed(0)}) iso=(${isoPos.x.toFixed(0)}, ${isoPos.y.toFixed(0)}) depth=${depth.toFixed(3)}`);
        }
    }

    /**
     * 获取地形颜色（当没有纹理时使用）
     */
    private getTerrainColor(terrainType: TerrainType): Color {
        switch (terrainType) {
            case TerrainType.GRASS:
                return new Color(74, 140, 74, 255); // 绿色
            case TerrainType.DIRT:
                return new Color(139, 90, 43, 255); // 棕色
            case TerrainType.STONE:
                return new Color(122, 122, 122, 255); // 灰色
            case TerrainType.WATER:
                return new Color(65, 105, 225, 255); // 蓝色
            default:
                return new Color(100, 100, 100, 255);
        }
    }

    /**
     * 创建纯色SpriteFrame（备用）
     */
    private createColorSpriteFrame(color: Color): SpriteFrame {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return new SpriteFrame();
        }

        // 填充颜色
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
        ctx.fillRect(0, 0, 64, 64);

        // 创建纹理
        const imageAsset = new ImageAsset(canvas);
        const texture = new Texture2D();
        texture.image = imageAsset;

        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        spriteFrame.rect = new Rect(0, 0, 64, 64);
        spriteFrame.packable = false;

        return spriteFrame;
    }

    /**
     * 生成随机地图纹理（程序化生成）
     * 当没有纹理资源时使用此方法
     */
    public async generateProceduralMap(): Promise<void> {
        console.log('MapGenerator: 使用程序化纹理生成地图...');

        // 创建地图根节点
        this.createMapRoot();

        // 使用Canvas API生成程序化纹理
        await this.generateProceduralTextures();

        // 生成地图数据
        this.generateMapData();

        // 渲染地图
        this.renderMap();

        console.log('MapGenerator: 程序化地图生成完成');
    }

    /**
     * 生成程序化纹理
     */
    private async generateProceduralTextures(): Promise<void> {
        // 创建草地纹理
        const grassSpriteFrame = this.createNoiseTexture(
            '#4a8c4a', '#5a9c5a', 64, 'grass'
        );
        this._tileSprites.set(TerrainType.GRASS, grassSpriteFrame);

        // 创建泥土纹理
        const dirtSpriteFrame = this.createNoiseTexture(
            '#8b5a2b', '#9b6a3b', 64, 'dirt'
        );
        this._tileSprites.set(TerrainType.DIRT, dirtSpriteFrame);

        // 创建石头纹理
        const stoneSpriteFrame = this.createNoiseTexture(
            '#7a7a7a', '#8a8a8a', 64, 'stone'
        );
        this._tileSprites.set(TerrainType.STONE, stoneSpriteFrame);

        console.log('MapGenerator: 程序化纹理生成完成');
    }

    /**
     * 创建噪声纹理
     */
    private createNoiseTexture(
        color1: string,
        color2: string,
        size: number,
        type: string
    ): SpriteFrame {
        // 创建Canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('MapGenerator: 无法创建Canvas上下文');
            return new SpriteFrame();
        }

        // 填充基础颜色
        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);

        // 添加噪声
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = 2 + Math.random() * 4;
            const h = 2 + Math.random() * 4;

            ctx.fillStyle = Math.random() < 0.5 ? color2 : color1;
            ctx.globalAlpha = 0.3 + Math.random() * 0.3;
            ctx.fillRect(x, y, w, h);
        }

        // 添加一些细节纹理
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 2 + Math.random() * 3;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color2;
            ctx.fill();
        }

        // 添加边框
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, size, size);

        // 创建ImageAsset
        const imageAsset = new ImageAsset(canvas);

        // 创建Texture2D
        const texture = new Texture2D();
        texture.image = imageAsset;

        // 创建SpriteFrame
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        spriteFrame.rect = new Rect(0, 0, texture.width, texture.height);
        spriteFrame.packable = false;

        return spriteFrame;
    }

    /**
     * 获取地图根节点
     */
    public getMapRoot(): Node | null {
        return this._mapRoot;
    }

    /**
     * 获取指定位置的地面类型
     */
    public getTerrainAt(x: number, y: number): TerrainType | null {
        const tileX = Math.floor((x + GameConfig.WORLD_WIDTH / 2) / this._tileSize);
        const tileY = Math.floor((y + GameConfig.WORLD_HEIGHT / 2) / this._tileSize);

        if (tileX < 0 || tileX >= this._mapWidth || tileY < 0 || tileY >= this._mapHeight) {
            return null;
        }

        return this._mapData[tileX]?.[tileY]?.terrainType || null;
    }
}
