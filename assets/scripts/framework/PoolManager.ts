/**
 * 对象池管理器 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. 复用节点对象，减少创建销毁开销
 * 2. 支持预制体和动态创建的节点
 * 3. 自动扩容机制
 * 
 * 使用方式：
 * - PoolManager.instance.getNode('Bullet', prefab, parent)
 * - PoolManager.instance.putNode(node)
 */

import { _decorator, Node, Prefab, instantiate, isValid } from 'cc';

class PoolManager {
    private static _instance: PoolManager | null = null;
    
    public static get instance(): PoolManager {
        if (!this._instance) {
            this._instance = new PoolManager();
        }
        return this._instance;
    }

    /** 对象池字典 { prefabName: Node[] } */
    private _pool: Map<string, Node[]> = new Map();
    
    /** 预制体缓存 { prefabName: Prefab } */
    private _prefabCache: Map<string, Prefab> = new Map();
    
    /** 节点名称映射（用于反向查找） */
    private _nodeNameMap: Map<Node, string> = new Map();

    /**
     * 从对象池获取节点
     * @param name 节点名称/预制体名称
     * @param prefab 预制体（可选，如果池中没有则用此创建）
     * @param parent 父节点
     * @returns 节点实例
     */
    public getNode(name: string, prefab?: Prefab, parent?: Node): Node {
        let node: Node | null = null;
        
        // 尝试从池中获取
        const pool = this._pool.get(name);
        if (pool && pool.length > 0) {
            node = pool.pop()!;
            
            // 检查节点是否有效
            if (!isValid(node)) {
                node = null;
            }
        }
        
        // 池中没有或节点无效，创建新节点
        if (!node) {
            if (prefab) {
                node = instantiate(prefab);
                this._prefabCache.set(name, prefab);
            } else {
                node = new Node(name);
            }
        }
        
        // 记录节点名称映射
        this._nodeNameMap.set(node, name);
        
        // 设置父节点
        if (parent && isValid(parent)) {
            parent.addChild(node);
        }
        
        // 激活节点
        node.active = true;
        
        return node;
    }

    /**
     * 将节点放回对象池
     * @param node 要回收的节点
     */
    public putNode(node: Node): void {
        if (!isValid(node)) {
            return;
        }
        
        // 获取节点对应的名称
        let name = this._nodeNameMap.get(node);
        if (!name) {
            name = node.name;
        }
        
        // 移除名称映射
        this._nodeNameMap.delete(node);
        
        // 停止所有动作
        // node.stopAllActions();
        
        // 从父节点移除
        if (node.parent) {
            node.removeFromParent();
        }
        
        // 隐藏节点
        node.active = false;
        
        // 放入池中
        if (!this._pool.has(name)) {
            this._pool.set(name, []);
        }
        this._pool.get(name)!.push(node);
    }

    /**
     * 预热对象池（预先创建一定数量的节点）
     * @param name 节点名称
     * @param prefab 预制体
     * @param count 预热数量
     * @param parent 临时父节点（可选）
     */
    public warmup(name: string, prefab: Prefab, count: number, parent?: Node): void {
        // 缓存预制体
        this._prefabCache.set(name, prefab);
        
        // 创建节点并放入池中
        for (let i = 0; i < count; i++) {
            const node = instantiate(prefab);
            node.active = false;
            
            if (parent && isValid(parent)) {
                parent.addChild(node);
            }
            
            this._nodeNameMap.set(node, name);
            this.putNode(node);
        }
        
        console.log(`[PoolManager] 预热完成: ${name} x${count}`);
    }

    /**
     * 清空指定名称的对象池
     * @param name 节点名称
     */
    public clear(name: string): void {
        const pool = this._pool.get(name);
        if (pool) {
            // 销毁所有节点
            for (const node of pool) {
                if (isValid(node)) {
                    this._nodeNameMap.delete(node);
                    node.destroy();
                }
            }
            pool.length = 0;
            this._pool.delete(name);
        }
        
        // 移除预制体缓存
        this._prefabCache.delete(name);
        
        console.log(`[PoolManager] 清空对象池: ${name}`);
    }

    /**
     * 清空所有对象池
     */
    public clearAll(): void {
        // 销毁所有节点
        for (const [name, pool] of this._pool) {
            for (const node of pool) {
                if (isValid(node)) {
                    node.destroy();
                }
            }
        }
        
        this._pool.clear();
        this._prefabCache.clear();
        this._nodeNameMap.clear();
        
        console.log('[PoolManager] 清空所有对象池');
    }

    /**
     * 获取对象池状态
     */
    public getStatus(): { name: string; count: number }[] {
        const status: { name: string; count: number }[] = [];
        
        for (const [name, pool] of this._pool) {
            status.push({ name, count: pool.length });
        }
        
        return status;
    }

    /**
     * 获取对象池总节点数
     */
    public getTotalCount(): number {
        let total = 0;
        for (const pool of this._pool.values()) {
            total += pool.length;
        }
        return total;
    }
}

// 导出单例
export const poolManager = PoolManager.instance;
export { PoolManager };
