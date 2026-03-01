/**
 * 地图管理器 - 基于 Archero 设计模式
 * 
 * 核心设计：
 * 1. 数据驱动：从配置表加载地图数据
 * 2. 对象池管理：复用节点，减少 GC
 * 3. 分组加载：按类型分组，异步加载
 * 4. 动态回收：远离玩家的模块自动回收
 */

import { _decorator, Component, Node, Vec3, Prefab, resources, instantiate } from 'cc';
import { poolManager, clientEvent, configManager, GameEvents } from '../framework';

const { ccclass, property } = _decorator;

/**
 * 模块类型
 */
export enum ModuleType {
    TILE = 'tile',          // 瓦片
    MONSTER = 'monster',    // 怪物
    ITEM = 'item',          // 物品
    OBSTACLE = 'obstacle',  // 障碍物
    NPC = 'npc',            // NPC
    BUILDING = 'building',  // 建筑
}

/**
 * 模块数据
 */
interface ModuleData {
    id: number | string;
    type: ModuleType;
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
    prefabPath: string;
    extra?: any;
}

@ccclass('MapManager')
export class MapManager extends Component {
    // ==================== 编辑器属性 ====================
    
    @property({ type: Node, displayName: '玩家节点' })
    playerNode: Node | null = null;
    
    @property({ displayName: '回收距离' })
    recycleDistance: number = 1000;

    // ==================== 私有属性 ====================
    
    /** 待加载的模块类型 */
    private _moduleTypes: Map<ModuleType, ModuleData[]> = new Map();
    
    /** 所有模块节点 */
    private _moduleNodes: Node[] = [];
    
    /** 模块分组节点 */
    private _groupNodes: Map<string, Node> = new Map();
    
    /** 加载完成回调 */
    private _completeCallback: Function | null = null;
    
    /** 地图根节点 */
    private _mapRoot: Node | null = null;

    // ==================== 生命周期 ====================
    
    onLoad() {
        this._mapRoot = this.node;
    }

    // ==================== 地图构建 ====================
    
    /**
     * 构建地图
     * @param mapName 地图名称/配置表名称
     * @param completeCb 完成回调
     */
    public buildMap(mapName: string, completeCb?: Function): void {
        this._completeCallback = completeCb;
        this._moduleTypes.clear();
        
        // 清理旧地图
        this.recycle();
        
        // 加载地图配置
        const mapData = configManager.queryAll(mapName);
        if (!mapData || mapData.length === 0) {
            console.warn(`[MapManager] 地图配置为空: ${mapName}`);
            this._completeCallback?.();
            return;
        }
        
        // 按类型分组
        this.groupModulesByType(mapData);
        
        // 异步加载所有模块
        this.loadAllModules();
    }
    
    /**
     * 按类型分组模块
     */
    private groupModulesByType(mapData: any[]): void {
        for (const item of mapData) {
            const type = item.type as ModuleType;
            
            if (!this._moduleTypes.has(type)) {
                this._moduleTypes.set(type, []);
            }
            
            const moduleData: ModuleData = {
                id: item.id,
                type: type,
                position: this.parseVec3(item.position),
                rotation: this.parseVec3(item.rotation, '0,0,0'),
                scale: this.parseVec3(item.scale, '1,1,1'),
                prefabPath: item.prefabPath || `${type}/${item.resName}`,
                extra: item,
            };
            
            this._moduleTypes.get(type)!.push(moduleData);
        }
    }
    
    /**
     * 解析 Vec3 字符串
     */
    private parseVec3(value: string, defaultValue: string = '0,0,0'): Vec3 {
        const str = value || defaultValue;
        const parts = str.split(',');
        return new Vec3(
            parseFloat(parts[0]) || 0,
            parseFloat(parts[1]) || 0,
            parseFloat(parts[2]) || 0
        );
    }
    
    /**
     * 加载所有模块
     */
    private async loadAllModules(): Promise<void> {
        const promises: Promise<void>[] = [];
        
        for (const [type, modules] of this._moduleTypes) {
            promises.push(this.loadModuleGroup(type, modules));
        }
        
        try {
            await Promise.all(promises);
            console.log('[MapManager] 地图加载完成');
            this._completeCallback?.();
        } catch (error) {
            console.error('[MapManager] 地图加载失败:', error);
        }
    }
    
    /**
     * 加载模块组
     */
    private async loadModuleGroup(type: ModuleType, modules: ModuleData[]): Promise<void> {
        // 创建分组节点
        const groupName = `${type}Group`;
        let groupNode = this._groupNodes.get(groupName);
        
        if (!groupNode) {
            groupNode = new Node(groupName);
            groupNode.parent = this._mapRoot;
            this._groupNodes.set(groupName, groupNode);
        }
        
        // 加载每个模块
        const promises = modules.map(module => this.loadModule(module, groupNode!));
        await Promise.all(promises);
    }
    
    /**
     * 加载单个模块
     */
    private async loadModule(module: ModuleData, parent: Node): Promise<void> {
        return new Promise((resolve, reject) => {
            // 尝试从对象池获取
            const node = poolManager.getNode(module.prefabPath);
            
            if (node) {
                this.setupModuleNode(node, module, parent);
                resolve();
                return;
            }
            
            // 加载预制体
            resources.load(module.prefabPath, Prefab, (err, prefab) => {
                if (err) {
                    console.warn(`[MapManager] 加载预制体失败: ${module.prefabPath}`);
                    // 创建默认节点
                    const defaultNode = new Node(`Module_${module.id}`);
                    this.setupModuleNode(defaultNode, module, parent);
                    resolve();
                    return;
                }
                
                const node = poolManager.getNode(module.prefabPath, prefab, parent);
                this.setupModuleNode(node, module, parent);
                resolve();
            });
        });
    }
    
    /**
     * 设置模块节点
     */
    private setupModuleNode(node: Node, module: ModuleData, parent: Node): void {
        node.parent = parent;
        node.setPosition(module.position);
        node.eulerAngles = module.rotation;
        node.setScale(module.scale);
        node.name = `Module_${module.id}`;
        
        // 存储模块数据
        (node as any)._moduleData = module;
        
        this._moduleNodes.push(node);
        
        // 触发事件
        clientEvent.emit('map:moduleLoaded', { node, module });
    }

    // ==================== 回收机制 ====================
    
    /**
     * 回收所有模块
     */
    public recycle(): void {
        // 回收所有模块节点
        for (const node of this._moduleNodes) {
            if (node && node.isValid) {
                poolManager.putNode(node);
            }
        }
        
        this._moduleNodes = [];
        
        // 清理分组节点
        for (const groupNode of this._groupNodes.values()) {
            if (groupNode && groupNode.isValid) {
                groupNode.removeAllChildren();
            }
        }
        
        this._groupNodes.clear();
        this._moduleTypes.clear();
    }
    
    /**
     * 回收远离玩家的模块
     */
    public recycleDistantModules(): void {
        if (!this.playerNode) return;
        
        const playerPos = this.playerNode.worldPosition;
        
        for (let i = this._moduleNodes.length - 1; i >= 0; i--) {
            const node = this._moduleNodes[i];
            
            if (!node || !node.isValid) {
                this._moduleNodes.splice(i, 1);
                continue;
            }
            
            const distance = Vec3.distance(node.worldPosition, playerPos);
            
            if (distance > this.recycleDistance) {
                poolManager.putNode(node);
                this._moduleNodes.splice(i, 1);
            }
        }
    }

    // ==================== 工具方法 ====================
    
    /**
     * 获取指定类型的所有模块
     */
    public getModulesByType(type: ModuleType): Node[] {
        const groupName = `${type}Group`;
        const groupNode = this._groupNodes.get(groupName);
        
        if (!groupNode) return [];
        
        return groupNode.children.filter(child => child.isValid);
    }
    
    /**
     * 获取地图根节点
     */
    public getMapRoot(): Node | null {
        return this._mapRoot;
    }
    
    /**
     * 获取模块数量
     */
    public getModuleCount(): number {
        return this._moduleNodes.length;
    }
}
