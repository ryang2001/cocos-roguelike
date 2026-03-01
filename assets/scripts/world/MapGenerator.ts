/**
 * 地图生成器 - 模仿 Archero 设计
 * 
 * 核心设计：
 * 1. 地面在 XZ 平面（Y = 0）
 * 2. 实体高度用 Y 轴表示
 * 3. 数据驱动，从配置表加载
 * 4. 对象池管理
 */

import { _decorator, Component, Node, Vec3, UITransform, Sprite, Color, Layers, Prefab, resources, instantiate, SpriteFrame, ImageAsset, Texture2D, Vec2, Rect } from 'cc';
import { poolManager, configManager } from '../framework';

const { ccclass, property } = _decorator;

/**
 * 地形类型
 */
export enum TerrainType {
    PLAIN = 'plain',
    FOREST = 'forest',
    MOUNTAIN = 'mountain',
    VOLCANO = 'volcano',
    DESERT = 'desert',
    SWAMP = 'swamp',
    CASTLE = 'castle',
    WATER = 'water'
}

/**
 * 地图配置数据
 */
interface MapTileData {
    id: number | string;
    type: string;
    position: Vec3;
    rotation?: Vec3;
    scale?: Vec3;
}

@ccclass('MapGenerator')
export class MapGenerator extends Component {
    // ==================== 编辑器属性 ====================
    
    @property({ displayName: '瓦片大小' })
    tileSize: number = 64;
    
    @property({ displayName: '地图宽度（瓦片数）' })
    mapWidth: number = 20;
    
    @property({ displayName: '地图高度（瓦片数）' })
    mapHeight: number = 20;
    
    @property({ type: SpriteFrame, displayName: '地面瓦片贴图' })
    groundTileSprite: SpriteFrame | null = null;

    // ==================== 私有属性 ====================
    
    private _mapRoot: Node | null = null;
    private _tiles: Node[] = [];
    private _mapData: MapTileData[] = [];
    private _defaultSpriteFrame: SpriteFrame | null = null;

    // ==================== 生命周期 ====================
    
    onLoad() {
        this.createMapRoot();
    }

    // ==================== 地图创建 ====================
    
    /**
     * 创建地图根节点
     */
    private createMapRoot(): void {
        this._mapRoot = new Node('MapRoot');
        this._mapRoot.layer = Layers.Enum.DEFAULT;
        
        // 地图根节点放在场景原点
        this._mapRoot.setPosition(0, 0, 0);
        
        // 添加到场景
        if (this.node.parent) {
            this.node.parent.addChild(this._mapRoot);
        } else {
            this.node.addChild(this._mapRoot);
        }
        
        console.log('[MapGenerator] 地图根节点已创建');
    }
    
    /**
     * 生成地图
     */
    public async generateMap(): Promise<void> {
        console.log('[MapGenerator] 开始生成地图...');
        
        // 清理旧地图
        this.clearMap();
        
        // 生成瓦片
        this.generateTiles();
        
        console.log(`[MapGenerator] 地图生成完成: ${this._tiles.length} 个瓦片`);
    }
    
    /**
     * 生成瓦片
     * 使用 XZ 平面作为地面（模仿 Archero）
     */
    private generateTiles(): void {
        const halfWidth = this.mapWidth / 2;
        const halfHeight = this.mapHeight / 2;
        
        for (let x = 0; x < this.mapWidth; x++) {
            for (let z = 0; z < this.mapHeight; z++) {
                // 计算世界坐标（XZ 平面）
                const worldX = (x - halfWidth + 0.5) * this.tileSize;
                const worldZ = (z - halfHeight + 0.5) * this.tileSize;
                const worldY = 0; // 地面高度为 0
                
                // 创建瓦片
                const tile = this.createTile(worldX, worldY, worldZ, x, z);
                this._tiles.push(tile);
            }
        }
    }
    
    /**
     * 创建单个瓦片
     */
    private createTile(worldX: number, worldY: number, worldZ: number, tileX: number, tileZ: number): Node {
        const tileNode = new Node(`Tile_${tileX}_${tileZ}`);
        tileNode.layer = Layers.Enum.DEFAULT;
        
        // 设置位置（XZ 平面）
        tileNode.setPosition(worldX, worldY, worldZ);
        
        // 添加 UITransform（用于 2D 渲染）
        const transform = tileNode.addComponent(UITransform);
        transform.setContentSize(this.tileSize, this.tileSize);
        
        // 添加 Sprite
        const sprite = tileNode.addComponent(Sprite);
        
        // 设置 SpriteFrame
        if (this.groundTileSprite) {
            sprite.spriteFrame = this.groundTileSprite;
        }
        // 如果没有设置贴图，Sprite 会使用默认的白色贴图
        
        // 设置颜色（棋盘格效果）
        sprite.color = this.getTileColor(tileX, tileZ);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        
        // 添加到地图根节点
        if (this._mapRoot) {
            this._mapRoot.addChild(tileNode);
        }
        
        return tileNode;
    }
    
    /**
     * 获取瓦片颜色（根据位置）
     */
    private getTileColor(tileX: number, tileZ: number): Color {
        // 棋盘格效果
        const isEven = (tileX + tileZ) % 2 === 0;
        
        if (isEven) {
            return new Color(144, 238, 144, 255); // 浅绿色
        } else {
            return new Color(124, 218, 124, 255); // 深绿色
        }
    }
    
    /**
     * 清理地图
     */
    public clearMap(): void {
        // 回收所有瓦片
        for (const tile of this._tiles) {
            if (tile && tile.isValid) {
                tile.destroy();
            }
        }
        
        this._tiles = [];
        this._mapData = [];
    }

    // ==================== 从配置加载 ====================
    
    /**
     * 从配置表加载地图
     * @param configName 配置表名称
     */
    public async loadFromConfig(configName: string): Promise<void> {
        console.log(`[MapGenerator] 从配置加载地图: ${configName}`);
        
        // 清理旧地图
        this.clearMap();
        
        // 获取配置数据
        const mapData = configManager.queryAll(configName);
        if (!mapData || mapData.length === 0) {
            console.warn(`[MapGenerator] 配置表为空: ${configName}`);
            return;
        }
        
        // 创建地图元素
        for (const item of mapData) {
            await this.createMapElement(item);
        }
        
        console.log(`[MapGenerator] 配置地图加载完成: ${this._tiles.length} 个元素`);
    }
    
    /**
     * 创建地图元素
     */
    private async createMapElement(data: any): Promise<void> {
        // 解析位置
        const position = this.parsePosition(data.position);
        
        // 创建节点
        const node = new Node(`MapElement_${data.id}`);
        node.layer = Layers.Enum.DEFAULT;
        node.setPosition(position);
        
        // 添加到地图
        if (this._mapRoot) {
            this._mapRoot.addChild(node);
        }
        
        this._tiles.push(node);
    }
    
    /**
     * 解析位置字符串
     * 格式: "x,y,z" 或 "x,y"
     */
    private parsePosition(posStr: string): Vec3 {
        if (!posStr) return new Vec3(0, 0, 0);
        
        const parts = posStr.split(',');
        const x = parseFloat(parts[0]) || 0;
        const y = parseFloat(parts[1]) || 0;
        const z = parseFloat(parts[2]) || 0;
        
        return new Vec3(x, y, z);
    }

    // ==================== 工具方法 ====================
    
    /**
     * 获取地图根节点
     */
    public getMapRoot(): Node | null {
        return this._mapRoot;
    }
    
    /**
     * 获取瓦片数量
     */
    public getTileCount(): number {
        return this._tiles.length;
    }
    
    /**
     * 世界坐标转瓦片坐标
     */
    public worldToTile(worldX: number, worldZ: number): { x: number; z: number } {
        const halfWidth = this.mapWidth / 2;
        const halfHeight = this.mapHeight / 2;
        
        const tileX = Math.floor(worldX / this.tileSize + halfWidth);
        const tileZ = Math.floor(worldZ / this.tileSize + halfHeight);
        
        return { x: tileX, z: tileZ };
    }
    
    /**
     * 瓦片坐标转世界坐标
     */
    public tileToWorld(tileX: number, tileZ: number): Vec3 {
        const halfWidth = this.mapWidth / 2;
        const halfHeight = this.mapHeight / 2;
        
        const worldX = (tileX - halfWidth + 0.5) * this.tileSize;
        const worldZ = (tileZ - halfHeight + 0.5) * this.tileSize;
        
        return new Vec3(worldX, 0, worldZ);
    }
}
