/**
 * 游戏结束场景控制器 - Cocos Creator版本
 * 负责显示游戏结果和处理重试/返回操作
 */

import { _decorator, Component, Node, Label, Button, director } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('GameOverController')
export class GameOverController extends Component {
    
    @property({
        type: Label,
        tooltip: '结果标题'
    })
    titleLabel: Label = null;

    @property({
        type: Label,
        tooltip: '统计数据文本'
    })
    statsLabel: Label = null;

    @property({
        type: Node,
        tooltip: '重试按钮'
    })
    retryButton: Node = null;

    @property({
        type: Node,
        tooltip: '返回菜单按钮'
    })
    menuButton: Node = null;

    private _isVictory: boolean = false;
    private _gameStats: any = null;

    onLoad() {
        // 获取游戏结果
        this.loadGameResult();
        
        // 初始化UI
        this.initUI();
        
        // 注册事件
        this.registerEvents();
    }

    start() {
        console.log('游戏结束场景加载');
    }

    /**
     * 加载游戏结果
     */
    private loadGameResult(): void {
        // 从GameManager获取结果
        if (GameManager.instance) {
            this._gameStats = {
                day: GameManager.instance.currentDay,
                gameTime: GameManager.instance.gameTime,
                playerData: GameManager.instance.playerData
            };
        } else {
            // 默认数据
            this._gameStats = {
                day: 1,
                gameTime: 0,
                playerData: null
            };
        }

        // TODO: 从场景参数获取胜利/失败状态
        this._isVictory = false;
    }

    /**
     * 初始化UI
     */
    private initUI(): void {
        // 设置标题
        if (this.titleLabel) {
            this.titleLabel.string = this._isVictory ? '🎉 胜利!' : '💀 游戏结束';
            this.titleLabel.color = this._isVictory ? 
                new cc.Color(76, 175, 80) : // 绿色
                new cc.Color(244, 67, 54);  // 红色
        }

        // 设置统计数据
        if (this.statsLabel) {
            const stats = this.generateStatsText();
            this.statsLabel.string = stats;
        }
    }

    /**
     * 生成统计文本
     */
    private generateStatsText(): string {
        const gameTime = Math.floor(this._gameStats.gameTime / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;

        let stats = `存活天数: ${this._gameStats.day} / 3\n`;
        stats += `游戏时长: ${minutes}分${seconds}秒\n`;
        
        if (this._gameStats.playerData) {
            stats += `等级: ${this._gameStats.playerData.level || 1}\n`;
            stats += `金币: ${this._gameStats.playerData.gold || 0}`;
        }

        return stats;
    }

    /**
     * 注册事件
     */
    private registerEvents(): void {
        // 重试按钮
        if (this.retryButton) {
            const button = this.retryButton.getComponent(Button);
            if (button) {
                this.retryButton.on(Button.EventType.CLICK, this.onRetryClick, this);
            }
        }

        // 返回菜单按钮
        if (this.menuButton) {
            const button = this.menuButton.getComponent(Button);
            if (button) {
                this.menuButton.on(Button.EventType.CLICK, this.onMenuClick, this);
            }
        }
    }

    /**
     * 重试按钮点击
     */
    private onRetryClick(): void {
        console.log('重试游戏');
        
        // 播放音效
        this.playClickSound();
        
        // 重新开始游戏
        if (GameManager.instance) {
            GameManager.instance.startGame();
        } else {
            director.loadScene('GameScene');
        }
    }

    /**
     * 返回菜单按钮点击
     */
    private onMenuClick(): void {
        console.log('返回主菜单');
        
        // 播放音效
        this.playClickSound();
        
        // 返回主菜单
        director.loadScene('MainMenuScene');
    }

    /**
     * 播放点击音效
     */
    private playClickSound(): void {
        // TODO: 播放点击音效
    }

    onDestroy() {
        // 移除事件监听
        // 使用 targetOff 一次性移除当前目标的所有事件监听
        if (this.retryButton && this.retryButton.isValid) {
            this.retryButton.targetOff(this);
        }

        if (this.menuButton && this.menuButton.isValid) {
            this.menuButton.targetOff(this);
        }
    }
}
