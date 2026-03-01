/**
 * 游戏管理器 - 整合 Camera 和地图系统
 * 
 * 职责：
 * 1. 初始化游戏场景
 * 2. 管理 Camera 跟随
 * 3. 管理地图生成
 * 4. 协调各系统工作
 */

import { _decorator, Component, Node, Vec3, find } from 'cc';
import { GameCamera } from '../systems/GameCamera';
import { MapGenerator } from '../world/MapGenerator';
import { clientEvent, GameEvents } from '../framework';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // ==================== 编辑器属性 ====================
    
    @property({ type: GameCamera, displayName: '游戏摄像机' })
    gameCamera: GameCamera | null = null;
    
    @property({ type: MapGenerator, displayName: '地图生成器' })
    mapGenerator: MapGenerator | null = null;
    
    @property({ type: Node, displayName: '玩家节点' })
    playerNode: Node | null = null;

    // ==================== 私有属性 ====================
    
    private _isInitialized: boolean = false;

    // ==================== 生命周期 ====================
    
    onLoad() {
        this.initSingleton();
    }
    
    start() {
        this.initGame();
    }
    
    onDestroy() {
        this.unregisterEvents();
    }

    // ==================== 初始化 ====================
    
    /**
     * 初始化单例
     */
    private initSingleton(): void {
        // GameManager 作为单例使用
        // 可以通过 find('GameManager') 获取
    }
    
    /**
     * 初始化游戏
     */
    private async initGame(): Promise<void> {
        console.log('[GameManager] 开始初始化游戏...');
        
        // 1. 查找必要的节点
        this.findRequiredNodes();
        
        // 2. 初始化 Camera
        this.initCamera();
        
        // 3. 生成地图
        await this.initMap();
        
        // 4. 注册事件
        this.registerEvents();
        
        this._isInitialized = true;
        
        console.log('[GameManager] 游戏初始化完成');
    }
    
    /**
     * 查找必要的节点
     */
    private findRequiredNodes(): void {
        // 查找 Camera
        if (!this.gameCamera) {
            const cameraNode = find('Main Camera');
            if (cameraNode) {
                this.gameCamera = cameraNode.getComponent(GameCamera);
                if (!this.gameCamera) {
                    this.gameCamera = cameraNode.addComponent(GameCamera);
                }
            }
        }
        
        // 查找 MapGenerator
        if (!this.mapGenerator) {
            this.mapGenerator = this.node.getComponent(MapGenerator);
            if (!this.mapGenerator) {
                this.mapGenerator = this.node.addComponent(MapGenerator);
            }
        }
        
        // 查找玩家
        if (!this.playerNode) {
            this.playerNode = find('Player');
        }
    }
    
    /**
     * 初始化 Camera
     */
    private initCamera(): void {
        if (!this.gameCamera) {
            console.warn('[GameManager] 未找到 GameCamera');
            return;
        }
        
        // 设置跟随目标
        if (this.playerNode) {
            this.gameCamera.setFollowTarget(this.playerNode);
            
            // 计算并设置 Camera 初始位置
            const playerPos = this.playerNode.worldPosition;
            this.gameCamera.calculateAndSetPosition(playerPos);
            
            console.log('[GameManager] Camera 已设置跟随玩家');
        }
    }
    
    /**
     * 初始化地图
     */
    private async initMap(): Promise<void> {
        if (!this.mapGenerator) {
            console.warn('[GameManager] 未找到 MapGenerator');
            return;
        }
        
        // 生成地图
        await this.mapGenerator.generateMap();
        
        console.log('[GameManager] 地图已生成');
    }

    // ==================== 事件处理 ====================
    
    /**
     * 注册事件
     */
    private registerEvents(): void {
        clientEvent.on(GameEvents.PLAYER_SPAWNED, this.onPlayerSpawned, this);
        clientEvent.on(GameEvents.PLAYER_DIED, this.onPlayerDied, this);
    }
    
    /**
     * 取消注册事件
     */
    private unregisterEvents(): void {
        clientEvent.off(GameEvents.PLAYER_SPAWNED, this.onPlayerSpawned, this);
        clientEvent.off(GameEvents.PLAYER_DIED, this.onPlayerDied, this);
    }
    
    /**
     * 玩家出生事件
     */
    private onPlayerSpawned(player: Node): void {
        this.playerNode = player;
        
        if (this.gameCamera) {
            this.gameCamera.setFollowTarget(player);
        }
    }
    
    /**
     * 玩家死亡事件
     */
    private onPlayerDied(): void {
        console.log('[GameManager] 玩家死亡');
        
        // 可以在这里处理游戏结束逻辑
    }

    // ==================== 公共方法 ====================
    
    /**
     * 重新开始游戏
     */
    public async restartGame(): Promise<void> {
        console.log('[GameManager] 重新开始游戏');
        
        // 清理地图
        if (this.mapGenerator) {
            this.mapGenerator.clearMap();
        }
        
        // 重置 Camera
        if (this.gameCamera) {
            this.gameCamera.resetCamera();
        }
        
        // 重新初始化
        await this.initGame();
    }
    
    /**
     * 获取是否已初始化
     */
    public isInitialized(): boolean {
        return this._isInitialized;
    }
}
