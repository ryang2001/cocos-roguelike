/**
 * UI 管理器 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. UI 面板的打开、关闭、缓存
 * 2. UI 层级管理
 * 3. UI 预加载
 * 
 * 使用方式：
 * - uiManager.openPanel('HUDPanel', prefab)
 * - uiManager.closePanel('HUDPanel')
 * - uiManager.showTip('获得金币 +100')
 */

import { _decorator, Node, Prefab, instantiate, resources, isValid, Vec3 } from 'cc';

/** UI 层级 */
export enum UILayer {
    BOTTOM = 0,     // 底层（背景）
    NORMAL = 1,     // 普通层（HUD、主界面）
    POPUP = 2,      // 弹窗层（对话框、提示）
    TOP = 3,        // 顶层（Loading、Toast）
    GUIDE = 4,      // 引导层
}

/** UI 面板信息 */
interface PanelInfo {
    node: Node;
    layer: UILayer;
    cache: boolean;     // 关闭时是否缓存
    prefab: Prefab | null;
}

/**
 * UI 管理器
 */
class UIManager {
    private static _instance: UIManager | null = null;
    
    public static get instance(): UIManager {
        if (!this._instance) {
            this._instance = new UIManager();
        }
        return this._instance;
    }

    /** UI 根节点 */
    private _root: Node | null = null;
    
    /** 层级节点 */
    private _layerNodes: Map<UILayer, Node> = new Map();
    
    /** 面板缓存 { panelName: PanelInfo } */
    private _panels: Map<string, PanelInfo> = new Map();
    
    /** 预制体缓存 { prefabPath: Prefab } */
    private _prefabCache: Map<string, Prefab> = new Map();

    /**
     * 初始化 UI 管理器
     * @param root UI 根节点
     */
    public init(root: Node): void {
        this._root = root;
        
        // 创建层级节点
        for (const layer of [UILayer.BOTTOM, UILayer.NORMAL, UILayer.POPUP, UILayer.TOP, UILayer.GUIDE]) {
            const layerNode = new Node(`Layer_${layer}`);
            layerNode.layer = root.layer;
            root.addChild(layerNode);
            this._layerNodes.set(layer, layerNode);
        }
        
        console.log('[UIManager] 初始化完成');
    }

    /**
     * 打开面板
     * @param name 面板名称
     * @param prefab 预制体（可选，如果已缓存则不需要）
     * @param layer 层级（默认 NORMAL）
     * @param cache 是否缓存（默认 true）
     * @param data 传递给面板的数据
     */
    public openPanel(
        name: string,
        prefab?: Prefab,
        layer: UILayer = UILayer.NORMAL,
        cache: boolean = true,
        data?: any
    ): Node | null {
        // 检查是否已打开
        const existingPanel = this._panels.get(name);
        if (existingPanel && isValid(existingPanel.node)) {
            existingPanel.node.active = true;
            this.updateLayer(existingPanel.node, layer);
            return existingPanel.node;
        }
        
        // 获取或创建节点
        let node: Node | null = null;
        
        if (prefab) {
            node = instantiate(prefab);
            this._prefabCache.set(name, prefab);
        } else if (existingPanel?.prefab) {
            node = instantiate(existingPanel.prefab);
        } else {
            console.error(`[UIManager] 未找到面板预制体: ${name}`);
            return null;
        }
        
        node.name = name;
        
        // 添加到层级节点
        const layerNode = this._layerNodes.get(layer);
        if (layerNode) {
            layerNode.addChild(node);
        } else if (this._root) {
            this._root.addChild(node);
        }
        
        // 缓存面板信息
        this._panels.set(name, {
            node,
            layer,
            cache,
            prefab: prefab || existingPanel?.prefab || null
        });
        
        // 调用面板的 onOpen 方法（如果存在）
        const panelComp = node.getComponent('UIPanel');
        if (panelComp && (panelComp as any).onOpen) {
            (panelComp as any).onOpen(data);
        }
        
        console.log(`[UIManager] 打开面板: ${name}`);
        return node;
    }

    /**
     * 关闭面板
     * @param name 面板名称
     * @param destroy 是否销毁（默认 false，使用缓存）
     */
    public closePanel(name: string, destroy: boolean = false): void {
        const panel = this._panels.get(name);
        if (!panel || !isValid(panel.node)) {
            return;
        }
        
        // 调用面板的 onClose 方法
        const panelComp = panel.node.getComponent('UIPanel');
        if (panelComp && (panelComp as any).onClose) {
            (panelComp as any).onClose();
        }
        
        if (destroy || !panel.cache) {
            // 销毁节点
            panel.node.destroy();
            this._panels.delete(name);
        } else {
            // 隐藏节点（缓存）
            panel.node.active = false;
        }
        
        console.log(`[UIManager] 关闭面板: ${name}`);
    }

    /**
     * 预加载面板预制体
     * @param name 面板名称
     * @param path 预制体路径
     */
    public preloadPanel(name: string, path: string): Promise<Prefab> {
        return new Promise((resolve, reject) => {
            resources.load(path, Prefab, (err, prefab) => {
                if (err) {
                    console.error(`[UIManager] 预加载失败: ${path}`, err);
                    reject(err);
                    return;
                }
                
                this._prefabCache.set(name, prefab);
                console.log(`[UIManager] 预加载完成: ${name}`);
                resolve(prefab);
            });
        });
    }

    /**
     * 获取面板节点
     * @param name 面板名称
     */
    public getPanel(name: string): Node | null {
        const panel = this._panels.get(name);
        return panel?.node || null;
    }

    /**
     * 检查面板是否打开
     * @param name 面板名称
     */
    public isPanelOpen(name: string): boolean {
        const panel = this._panels.get(name);
        return panel !== undefined && isValid(panel.node) && panel.node.active;
    }

    /**
     * 更新节点层级
     */
    private updateLayer(node: Node, layer: UILayer): void {
        const layerNode = this._layerNodes.get(layer);
        if (layerNode && node.parent !== layerNode) {
            node.removeFromParent();
            layerNode.addChild(node);
        }
    }

    /**
     * 显示提示信息
     * @param message 提示内容
     * @param duration 持续时间（秒）
     */
    public showTip(message: string, duration: number = 2): void {
        // 创建提示节点
        const tipNode = new Node('Tip');
        
        // 添加到顶层
        const topLayer = this._layerNodes.get(UILayer.TOP);
        if (topLayer) {
            topLayer.addChild(tipNode);
        }
        
        // TODO: 添加 Label 组件显示文本
        
        // 定时销毁
        setTimeout(() => {
            if (isValid(tipNode)) {
                tipNode.destroy();
            }
        }, duration * 1000);
        
        console.log(`[UIManager] Tip: ${message}`);
    }

    /**
     * 关闭所有面板
     * @param exclude 排除的面板名称
     */
    public closeAll(exclude: string[] = []): void {
        for (const [name, panel] of this._panels) {
            if (!exclude.includes(name) && isValid(panel.node)) {
                this.closePanel(name);
            }
        }
    }

    /**
     * 清空所有缓存
     */
    public clear(): void {
        for (const panel of this._panels.values()) {
            if (isValid(panel.node)) {
                panel.node.destroy();
            }
        }
        
        this._panels.clear();
        this._prefabCache.clear();
        
        console.log('[UIManager] 清空所有缓存');
    }
}

// 导出单例
export const uiManager = UIManager.instance;
export { UIManager };
