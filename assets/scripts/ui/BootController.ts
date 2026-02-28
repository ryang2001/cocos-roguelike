/**
 * 启动场景控制器 - Cocos Creator版本
 * 负责游戏启动和资源加载
 */

import { _decorator, Component, Node, Label, ProgressBar, director, resources, AssetManager } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BootController')
export class BootController extends Component {
    
    @property({
        type: Label,
        tooltip: '加载进度文本'
    })
    loadingText: Label = null;

    @property({
        type: ProgressBar,
        tooltip: '加载进度条'
    })
    progressBar: ProgressBar = null;

    @property({
        type: Label,
        tooltip: '游戏标题'
    })
    titleLabel: Label = null;

    private _loadingProgress: number = 0;
    private _isLoadComplete: boolean = false;

    onLoad() {
        console.log('启动场景加载');
        this.initUI();
    }

    start() {
        // 开始加载资源
        this.loadResources();
    }

    /**
     * 初始化UI
     */
    private initUI(): void {
        // 设置标题
        if (this.titleLabel) {
            this.titleLabel.string = '继续下一关';
        }

        // 设置初始进度
        if (this.loadingText) {
            this.loadingText.string = '加载中... 0%';
        }

        if (this.progressBar) {
            this.progressBar.progress = 0;
        }
    }

    /**
     * 加载资源
     */
    private loadResources(): void {
        console.log('开始加载游戏资源');

        // 模拟加载进度
        this.simulateLoading();

        // 实际加载资源
        // this.loadGameResources();
    }

    /**
     * 模拟加载进度
     */
    private simulateLoading(): void {
        const totalSteps = 10;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / totalSteps;
            
            this.updateProgress(progress, `加载中... ${Math.floor(progress * 100)}%`);

            if (currentStep >= totalSteps) {
                clearInterval(interval);
                this.onLoadComplete();
            }
        }, 200);
    }

    /**
     * 实际加载游戏资源
     */
    private loadGameResources(): void {
        // 预加载场景
        director.preloadScene('MainMenuScene', (err) => {
            if (err) {
                console.error('预加载主菜单场景失败', err);
                return;
            }
            console.log('主菜单场景预加载完成');
            this.updateProgress(0.5, '加载场景... 50%');
        });

        // 预加载游戏场景
        director.preloadScene('GameScene', (err) => {
            if (err) {
                console.error('预加载游戏场景失败', err);
                return;
            }
            console.log('游戏场景预加载完成');
            this.updateProgress(1.0, '加载完成 100%');
            this.onLoadComplete();
        });
    }

    /**
     * 更新加载进度
     */
    private updateProgress(progress: number, text: string): void {
        this._loadingProgress = progress;

        if (this.progressBar) {
            this.progressBar.progress = progress;
        }

        if (this.loadingText) {
            this.loadingText.string = text;
        }
    }

    /**
     * 加载完成
     */
    private onLoadComplete(): void {
        if (this._isLoadComplete) return;
        
        this._isLoadComplete = true;
        console.log('资源加载完成');

        // 更新UI
        this.updateProgress(1.0, '点击任意位置开始');

        // 延迟1秒后进入主菜单
        this.scheduleOnce(() => {
            this.enterMainMenu();
        }, 1.0);
    }

    /**
     * 进入主菜单
     */
    private enterMainMenu(): void {
        console.log('进入主菜单');
        director.loadScene('MainMenuScene');
    }

    onDestroy() {
        // 清理定时器
        // 注意: setInterval 返回的定时器ID需要保存以便清理
        // 当前实现中定时器会自动清理，因为场景切换后组件会被销毁
        this.unscheduleAllCallbacks();
    }
}
