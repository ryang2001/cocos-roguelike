/**
 * 主菜单控制器 - Cocos Creator版本
 * 负责主菜单的按钮交互
 */

import { _decorator, Component, Node, Button, director } from 'cc';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {
    
    @property({
        type: Node,
        tooltip: '开始游戏按钮'
    })
    startButton: Node = null;

    @property({
        type: Node,
        tooltip: '继续游戏按钮'
    })
    loadButton: Node = null;

    @property({
        type: Node,
        tooltip: '设置按钮'
    })
    settingsButton: Node = null;

    onLoad() {
        this.initButtons();
    }

    start() {
        console.log('主菜单加载完成');
    }

    /**
     * 初始化按钮
     */
    private initButtons(): void {
        // 如果没有在编辑器中指定按钮,自动查找
        if (!this.startButton) {
            this.startButton = this.node.getChildByName('StartButton');
        }
        if (!this.loadButton) {
            this.loadButton = this.node.getChildByName('LoadButton');
        }
        if (!this.settingsButton) {
            this.settingsButton = this.node.getChildByName('SettingsButton');
        }

        // 注册按钮事件
        this.registerButtonEvents();
    }

    /**
     * 注册按钮事件
     */
    private registerButtonEvents(): void {
        // 开始游戏按钮
        if (this.startButton) {
            const button = this.startButton.getComponent(Button);
            if (button) {
                this.startButton.on(Button.EventType.CLICK, this.onStartButtonClick, this);
                console.log('开始游戏按钮事件已注册');
            }
        }

        // 继续游戏按钮
        if (this.loadButton) {
            const button = this.loadButton.getComponent(Button);
            if (button) {
                this.loadButton.on(Button.EventType.CLICK, this.onLoadButtonClick, this);
            }
        }

        // 设置按钮
        if (this.settingsButton) {
            const button = this.settingsButton.getComponent(Button);
            if (button) {
                this.settingsButton.on(Button.EventType.CLICK, this.onSettingsButtonClick, this);
            }
        }
    }

    /**
     * 开始游戏按钮点击
     */
    private onStartButtonClick(): void {
        console.log('点击开始游戏按钮');
        
        // 播放音效
        this.playClickSound();
        
        // 开始游戏
        if (GameManager.instance) {
            GameManager.instance.startGame();
        } else {
            // 如果GameManager不存在,直接加载游戏场景
            director.loadScene('GameScene');
        }
    }

    /**
     * 继续游戏按钮点击
     */
    private onLoadButtonClick(): void {
        console.log('点击继续游戏按钮');
        
        // 播放音效
        this.playClickSound();
        
        // 尝试加载存档
        if (GameManager.instance) {
            const hasSave = GameManager.instance.loadGameData();
            if (hasSave) {
                // 有存档,继续游戏
                director.loadScene('GameScene');
            } else {
                // 没有存档,提示用户
                console.log('没有找到存档');
                this.showNoSaveDialog();
            }
        }
    }

    /**
     * 设置按钮点击
     */
    private onSettingsButtonClick(): void {
        console.log('点击设置按钮');
        
        // 播放音效
        this.playClickSound();
        
        // TODO: 打开设置界面
        console.log('设置功能待实现');
    }

    /**
     * 播放点击音效
     */
    private playClickSound(): void {
        // TODO: 播放点击音效
        // const audioSource = this.node.getComponent(AudioSource);
        // if (audioSource) {
        //     audioSource.playOneShot(this.clickSound);
        // }
    }

    /**
     * 显示没有存档的提示
     */
    private showNoSaveDialog(): void {
        // TODO: 显示提示对话框
        console.log('没有找到存档,请开始新游戏');
    }

    onDestroy() {
        // 移除事件监听
        // 使用 targetOff 一次性移除当前目标的所有事件监听
        if (this.startButton && this.startButton.isValid) {
            this.startButton.targetOff(this);
        }
        if (this.loadButton && this.loadButton.isValid) {
            this.loadButton.targetOff(this);
        }
        if (this.settingsButton && this.settingsButton.isValid) {
            this.settingsButton.targetOff(this);
        }
    }
}
