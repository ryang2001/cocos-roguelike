/**
 * 地图生成器
 * 负责生成随机地图纹理和地形
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, resources, Layers, Texture2D, ImageAsset, Color } from 'cc';
import { GameConfig } from '../config/GameConfig';

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
    // 地图配置
    private _tileSize: number = 64; // 每个瓦片的大小
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
    }

    /**
     * 初始化并生成地图
     */
    public async generateMap(): Promise<void> {
        console.log('MapGenerator: 开始生成地图...');

        // 加载瓦片纹理
        await this.loadTileTextures();

        // 创建地图根节点
        this.createMapRoot();

        // 生成地图数据
        this.generateMapData();

        // 创建地图渲染
        this.renderMap();

        console.log('MapGenerator: 地图生成完成');
    }

    /**
     * 加载瓦片纹理
     */
    private async loadTileTextures(): Promise<void> {
        const terrainPaths = {
            [TerrainType.GRASS]: GameConfig.TEXTURE_PATHS.TERRAIN.GRASS_01 + '/spriteFrame',
            [TerrainType.DIRT]: GameConfig.TEXTURE_PATHS.TERRAIN.DIRT_01 + '/spriteFrame',
            [TerrainType.STONE]: GameConfig.TEXTURE_PATHS.TERRAIN.STONE_01 + '/spriteFrame',
        };

        const loadPromises = Object.entries(terrainPaths).map(([type, path]) => {
            return new Promise<void>((resolve) => {
                resources.load(path, SpriteFrame, (err, spriteFrame) => {
                    if (err) {
                        console.warn(`MapGenerator: 加载地形纹理失败: ${path}`, err.message);
                    } else {
                        this._tileSprites.set(type as TerrainType, spriteFrame);
                        console.log(`MapGenerator: 加载地形纹理: ${type}`);
                    }
                    resolve();
                });
            });
        });

        await Promise.all(loadPromises);
    }

    /**
     * 创建地图根节点
     */
    private createMapRoot(): void {
        this._mapRoot = new Node('MapRoot');
        this._mapRoot.layer = Layers.Enum.UI_2D;

        // 地图根节点位置设置为世界中心
        this._mapRoot.setPosition(0, 0, 0);

        // 添加UITransform确保正确显示
        const uiTransform = this._mapRoot.addComponent(UITransform);
        uiTransform.setContentSize(GameConfig.WORLD_WIDTH, GameConfig.WORLD_HEIGHT);

        this.node.addChild(this._mapRoot);

        console.log('MapGenerator: 地图根节点已创建', this._mapRoot.position);
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
     * 使用简化的方式 - 创建大图背景而不是单个瓦片
     */
    private renderMap(): void {
        if (!this._mapRoot) return;

        console.log('MapGenerator: 渲染地图...');

        // 检查是否有纹理加载成功
        if (this._tileSprites.size === 0) {
            console.warn('MapGenerator: 没有纹理加载成功，使用程序化纹理');
            this.generateProceduralTextures();
        }

        // 简化策略：将地图分成16个大区域，每个区域使用单一主导地形类型
        const regionsX = 4;
        const regionsY = 4;
        const regionWidth = Math.ceil(this._mapWidth / regionsX);
        const regionHeight = Math.ceil(this._mapHeight / regionsY);

        for (let rx = 0; rx < regionsX; rx++) {
            for (let ry = 0; ry < regionsY; ry++) {
                // 计算区域的地形类型（使用出现最多的类型）
                const terrainCounts = new Map<TerrainType, number>();

                for (let x = rx * regionWidth; x < Math.min((rx + 1) * regionWidth, this._mapWidth); x++) {
                    for (let y = ry * regionHeight; y < Math.min((ry + 1) * regionHeight, this._mapHeight); y++) {
                        const tile = this._mapData[x]?.[y];
                        if (tile) {
                            const count = terrainCounts.get(tile.terrainType) || 0;
                            terrainCounts.set(tile.terrainType, count + 1);
                        }
                    }
                }

                // 找出主导地形
                let dominantTerrain = TerrainType.GRASS;
                let maxCount = 0;
                terrainCounts.forEach((count, terrain) => {
                    if (count > maxCount) {
                        maxCount = count;
                        dominantTerrain = terrain;
                    }
                });

                // 创建区域节点
                this.createRegionNode(
                    rx, ry, regionWidth, regionHeight, dominantTerrain
                );
            }
        }

        // 添加一些随机细节瓦片作为装饰
        this.addDetailTiles();

        console.log(`MapGenerator: 地图渲染完成 (${regionsX}x${regionsY} 区域)`);
    }

    /**
     * 创建区域节点
     */
    private createRegionNode(
        regionX: number,
        regionY: number,
        regionWidth: number,
        regionHeight: number,
        terrainType: TerrainType
    ): void {
        if (!this._mapRoot) return;

        const regionNode = new Node(`Region_${regionX}_${regionY}`);
        regionNode.layer = Layers.Enum.UI_2D;

        // 计算区域在世界坐标中的位置（基于中心）
        const worldWidth = this._mapWidth * this._tileSize;
        const worldHeight = this._mapHeight * this._tileSize;
        const regionWorldWidth = regionWidth * this._tileSize;
        const regionWorldHeight = regionHeight * this._tileSize;

        // 从左下角开始计算位置，然后偏移到中心
        const posX = regionX * regionWorldWidth - worldWidth / 2 + regionWorldWidth / 2;
        const posY = regionY * regionWorldHeight - worldHeight / 2 + regionWorldHeight / 2;

        regionNode.setPosition(posX, posY, 0);

        // 添加UITransform
        const uiTransform = regionNode.addComponent(UITransform);
        uiTransform.setContentSize(regionWorldWidth, regionWorldHeight);

        // 添加Sprite
        const sprite = regionNode.addComponent(Sprite);
        const spriteFrame = this._tileSprites.get(terrainType);

        if (spriteFrame) {
            // 使用纹理
            sprite.spriteFrame = spriteFrame;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.type = Sprite.Type.TILED;
        } else {
            // 使用纯色
            sprite.color = this.getTerrainColor(terrainType);
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }

        this._mapRoot.addChild(regionNode);
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
     * 添加细节瓦片（随机分布）
     */
    private addDetailTiles(): void {
        if (!this._mapRoot) return;

        // 只添加少量细节瓦片作为装饰
        const detailCount = 50;
        const detailNode = new Node('Details');
        detailNode.layer = Layers.Enum.UI_2D;
        this._mapRoot.addChild(detailNode);

        const worldWidth = this._mapWidth * this._tileSize;
        const worldHeight = this._mapHeight * this._tileSize;

        for (let i = 0; i < detailCount; i++) {
            const x = Math.floor(Math.random() * this._mapWidth);
            const y = Math.floor(Math.random() * this._mapHeight);
            const tile = this._mapData[x]?.[y];

            if (tile) {
                const tileNode = new Node(`Detail_${i}`);
                tileNode.layer = Layers.Enum.UI_2D;

                // 计算在世界坐标中的位置（基于中心）
                const posX = x * this._tileSize - worldWidth / 2 + this._tileSize / 2;
                const posY = y * this._tileSize - worldHeight / 2 + this._tileSize / 2;

                tileNode.setPosition(posX, posY, 1);

                const uiTransform = tileNode.addComponent(UITransform);
                uiTransform.setContentSize(this._tileSize, this._tileSize);

                const sprite = tileNode.addComponent(Sprite);

                // 优先使用纹理，否则使用纯色
                if (tile.spriteFrame) {
                    sprite.spriteFrame = tile.spriteFrame;
                    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                    sprite.color = this.getDarkerColor(0.9);
                } else {
                    sprite.color = this.getTerrainColor(tile.terrainType);
                    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
                }

                detailNode.addChild(tileNode);
            }
        }
    }

    /**
     * 获取稍暗的颜色（用于细节瓦片）
     */
    private getDarkerColor(factor: number): Color {
        return new Color(
            255 * factor,
            255 * factor,
            255 * factor,
            255
        );
    }

    /**
     * 创建单个瓦片节点（备用方法）
     */
    private createTileNode(tile: MapTile, parent: Node): void {
        const tileNode = new Node(`Tile_${tile.x}_${tile.y}`);
        tileNode.layer = Layers.Enum.UI_2D;

        // 设置位置（瓦片坐标转世界坐标）
        tileNode.setPosition(
            tile.x * this._tileSize + this._tileSize / 2,
            tile.y * this._tileSize + this._tileSize / 2,
            0
        );

        // 添加UITransform
        const uiTransform = tileNode.addComponent(UITransform);
        uiTransform.setContentSize(this._tileSize, this._tileSize);

        // 添加Sprite
        const sprite = tileNode.addComponent(Sprite);
        sprite.spriteFrame = tile.spriteFrame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        parent.addChild(tileNode);
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
