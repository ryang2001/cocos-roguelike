/**
 * 事件系统 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. 模块间解耦通信
 * 2. 支持一对多订阅
 * 3. 支持一次性监听
 * 
 * 使用方式：
 * - clientEvent.on('player:died', this.onPlayerDied, this)
 * - clientEvent.emit('player:died', { killer: 'monster' })
 * - clientEvent.off('player:died', this.onPlayerDied, this)
 */

/**
 * 事件监听器
 */
interface EventListener {
    callback: Function;
    target: any;
    once: boolean;
}

/**
 * 事件管理器
 */
class ClientEvent {
    private static _instance: ClientEvent | null = null;
    
    public static get instance(): ClientEvent {
        if (!this._instance) {
            this._instance = new ClientEvent();
        }
        return this._instance;
    }

    /** 事件监听器字典 { eventName: EventListener[] } */
    private _events: Map<string, EventListener[]> = new Map();

    /**
     * 注册事件监听
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param target 回调目标（用于移除监听）
     */
    public on(eventName: string, callback: Function, target?: any): void {
        this.addListener(eventName, callback, target, false);
    }

    /**
     * 注册一次性事件监听（触发后自动移除）
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    public once(eventName: string, callback: Function, target?: any): void {
        this.addListener(eventName, callback, target, true);
    }

    /**
     * 添加监听器
     */
    private addListener(eventName: string, callback: Function, target: any, once: boolean): void {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        
        const listeners = this._events.get(eventName)!;
        
        // 检查是否已存在相同监听
        for (const listener of listeners) {
            if (listener.callback === callback && listener.target === target) {
                console.warn(`[ClientEvent] 监听器已存在: ${eventName}`);
                return;
            }
        }
        
        listeners.push({ callback, target, once });
    }

    /**
     * 移除事件监听
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    public off(eventName: string, callback: Function, target?: any): void {
        const listeners = this._events.get(eventName);
        if (!listeners) return;
        
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            if (listener.callback === callback && listener.target === target) {
                listeners.splice(i, 1);
                break;
            }
        }
        
        // 如果没有监听器了，移除事件
        if (listeners.length === 0) {
            this._events.delete(eventName);
        }
    }

    /**
     * 移除目标的所有事件监听
     * @param target 目标对象
     */
    public offAllByTarget(target: any): void {
        for (const [eventName, listeners] of this._events) {
            for (let i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i].target === target) {
                    listeners.splice(i, 1);
                }
            }
            
            if (listeners.length === 0) {
                this._events.delete(eventName);
            }
        }
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param args 参数
     */
    public emit(eventName: string, ...args: any[]): void {
        const listeners = this._events.get(eventName);
        if (!listeners || listeners.length === 0) return;
        
        // 复制一份，防止在回调中修改数组
        const listenersCopy = [...listeners];
        
        for (const listener of listenersCopy) {
            try {
                listener.callback.call(listener.target, ...args);
            } catch (error) {
                console.error(`[ClientEvent] 事件回调错误: ${eventName}`, error);
            }
        }
        
        // 移除一次性监听
        for (let i = listeners.length - 1; i >= 0; i--) {
            if (listeners[i].once) {
                listeners.splice(i, 1);
            }
        }
        
        if (listeners.length === 0) {
            this._events.delete(eventName);
        }
    }

    /**
     * 检查是否有事件监听
     * @param eventName 事件名称
     */
    public has(eventName: string): boolean {
        const listeners = this._events.get(eventName);
        return listeners !== undefined && listeners.length > 0;
    }

    /**
     * 清空所有事件监听
     */
    public clear(): void {
        this._events.clear();
    }

    /**
     * 获取事件状态
     */
    public getStatus(): { eventName: string; listenerCount: number }[] {
        const status: { eventName: string; listenerCount: number }[] = [];
        
        for (const [eventName, listeners] of this._events) {
            status.push({ eventName, listenerCount: listeners.length });
        }
        
        return status;
    }
}

/**
 * 游戏事件名称定义
 */
export const GameEvents = {
    // 玩家事件
    PLAYER_DIED: 'player:died',
    PLAYER_HP_CHANGED: 'player:hpChanged',
    PLAYER_LEVEL_UP: 'player:levelUp',
    PLAYER_EXP_CHANGED: 'player:expChanged',
    PLAYER_MOVE: 'player:move',
    PLAYER_STOP: 'player:stop',
    
    // 怪物事件
    MONSTER_SPAWNED: 'monster:spawned',
    MONSTER_DIED: 'monster:died',
    MONSTER_REACH_CASTLE: 'monster:reachCastle',
    
    // 塔事件
    TOWER_PLACED: 'tower:placed',
    TOWER_UPGRADED: 'tower:upgraded',
    TOWER_SOLD: 'tower:sold',
    TOWER_ATTACK: 'tower:attack',
    
    // 波次事件
    WAVE_START: 'wave:start',
    WAVE_END: 'wave:end',
    WAVE_ALL_CLEAR: 'wave:allClear',
    
    // 游戏事件
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    GAME_WIN: 'game:win',
    
    // 金币事件
    GOLD_CHANGED: 'gold:changed',
    
    // 物品事件
    ITEM_PICKUP: 'item:pickup',
    ITEM_DROP: 'item:drop',
    
    // 技能事件
    SKILL_UNLOCKED: 'skill:unlocked',
    SKILL_USED: 'skill:used',
    SKILL_COOLDOWN: 'skill:cooldown',
    
    // UI事件
    UI_SHOW_TOWER_MENU: 'ui:showTowerMenu',
    UI_HIDE_TOWER_MENU: 'ui:hideTowerMenu',
    UI_SHOW_SHOP: 'ui:showShop',
    UI_HIDE_SHOP: 'ui:hideShop',
};

// 导出单例
export const clientEvent = ClientEvent.instance;
export { ClientEvent };
