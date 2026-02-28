/**
 * 城堡 - Cocos Creator版本
 * 玩家的基地，需要保护
 */

import { _decorator, Component, Node, Sprite, Color, Vec3, UITransform } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { ICastleState, TimePhase } from '../types/Types';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('Castle')
export class Castle extends Component {
    // ==================== 编辑器属性 ====================

    @property({ displayName: '最大生命值' })
    maxHp: number = 1000;

    @property({ displayName: '是否可被摧毁' })
    canBeDestroyed: boolean = true;

    @property({ displayName: '白天回血速度(每秒)' })
    dayRegenRate: number = 5;

    @property({ displayName: '回血间隔(秒)' })
    regenInterval: number = 1;

    // ==================== 私有属性 ====================

    // 单例
    private static _instance: Castle | null = null;
    public static get instance(): Castle | null {
        return this._instance;
    }

    // 当前生命值
    private _currentHp: number = 0;

    // 是否已摧毁
    private _isDestroyed: boolean = false;

    // HPBar 引用
    private _hpBarNode: Node | null = null;

    // 回血计时器
    private _regenTimer: number = 0;

    // ==================== 系统获取辅助方法 ====================

    private _getTimeSystem(): any {
        return (this.node.scene.getComponent('TimeSystem') as any)?.instance;
    }

    // ==================== 生命周期 ====================

    onLoad() {
        if (Castle._instance === null) {
            Castle._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 确保节点有UITransform组件（UI渲染必需）
        let uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            uiTransform = this.node.addComponent(UITransform);
            uiTransform.setContentSize(128, 128); // 城堡大小
            console.log('[Castle] 添加UITransform组件');
        }

        this._currentHp = this.maxHp;

        // 查找 HPBar
        this.findHPBar();

        // 设置城堡颜色
        this.updateCastleColor();
    }

    start() {
        this.updateHPBar();
    }

    update(deltaTime: number): void {
        if (this._isDestroyed) return;

        // 白天自动回血
        this.updateDayRegen(deltaTime);
    }

    /**
     * 白天自动回血
     */
    private updateDayRegen(deltaTime: number): void {
        // 检查是否是白天
        const timeSystem = this._getTimeSystem();
        if (!timeSystem) return;

        const currentPhase = timeSystem.getTimePhase();
        const isDaytime = currentPhase === TimePhase.DAY || currentPhase === TimePhase.DAWN;

        // 只有在白天且未满血时才回血
        if (!isDaytime || this._currentHp >= this.maxHp) return;

        this._regenTimer += deltaTime;

        if (this._regenTimer >= this.regenInterval) {
            this._regenTimer = 0;

            // 回血
            const regenAmount = this.dayRegenRate * this.regenInterval;
            this.heal(regenAmount);

            if (this.dayRegenRate > 0) {
                console.log(`城堡白天自动回血 +${regenAmount} (${this._currentHp}/${this.maxHp})`);
            }
        }
    }

    // ==================== 生命值管理 ====================

    /**
     * 受到伤害
     */
    public takeDamage(damage: number): void {
        if (this._isDestroyed || !this.canBeDestroyed) return;

        this._currentHp -= damage;

        console.log(`城堡受到${damage}点伤害,剩余生命: ${this._currentHp}/${this.maxHp}`);

        if (this._currentHp <= 0) {
            this._currentHp = 0;
            this.onDestroyed();
        }

        this.updateHPBar();
        this.updateCastleColor();
    }

    /**
     * 治疗
     */
    public heal(amount: number): void {
        if (this._isDestroyed) return;

        this._currentHp = Math.min(this._currentHp + amount, this.maxHp);

        console.log(`城堡恢复${amount}点生命,当前生命: ${this._currentHp}/${this.maxHp}`);

        this.updateHPBar();
        this.updateCastleColor();
    }

    /**
     * 城堡被摧毁
     */
    private onDestroyed(): void {
        if (this._isDestroyed) return;

        this._isDestroyed = true;

        console.log('城堡被摧毁!游戏失败!');

        // 触发游戏失败
        GameManager.instance.gameOver(false);
    }

    // ==================== 视觉效果 ====================

    /**
     * 查找 HPBar
     */
    private findHPBar(): void {
        // 查找子节点中的 HPBar
        for (const child of this.node.children) {
            if (child.name === 'HPBar' || child.name === 'HPBarContainer') {
                this._hpBarNode = child;
                break;
            }
        }
    }

    /**
     * 更新 HPBar 显示
     */
    private updateHPBar(): void {
        if (!this._hpBarNode) return;

        const hpPercent = this.getHpPercent();

        // 查找 HPBar 中的 Fill 节点
        for (const child of this._hpBarNode.children) {
            if (child.name === 'Fill' || child.name === 'Bar') {
                const uiTransform = child.getComponent('UITransform') as any;
                if (uiTransform && uiTransform.setContentSize) {
                    const originalWidth = 200; // 假设原始宽度为200
                    uiTransform.setContentSize(originalWidth * hpPercent, uiTransform.contentSize.height);
                }

                // 更新颜色 (绿色 -> 黄色 -> 红色)
                const sprite = child.getComponent(Sprite);
                if (sprite) {
                    if (hpPercent > 0.6) {
                        sprite.color = new Color().fromHEX('#4CAF50'); // 绿色
                    } else if (hpPercent > 0.3) {
                        sprite.color = new Color().fromHEX('#FFC107'); // 黄色
                    } else {
                        sprite.color = new Color().fromHEX('#F44336'); // 红色
                    }
                }
            }
        }
    }

    /**
     * 更新城堡颜色 (根据血量)
     */
    private updateCastleColor(): void {
        const sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        if (this._isDestroyed) {
            // 摧毁后变暗
            sprite.color = new Color().fromHEX('#424242');
            sprite.grayscale = true;
        } else {
            const hpPercent = this.getHpPercent();
            // 根据血量调整亮度
            const brightness = Math.floor(128 + 127 * hpPercent);
            sprite.color = new Color(brightness, brightness, brightness, 255);
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 重置城堡
     */
    public reset(): void {
        this._currentHp = this.maxHp;
        this._isDestroyed = false;

        this.updateHPBar();
        this.updateCastleColor();
    }

    /**
     * 获取生命值百分比
     */
    public getHpPercent(): number {
        return this.maxHp > 0 ? this._currentHp / this.maxHp : 0;
    }

    /**
     * 获取城堡状态
     */
    public getCastleState(): ICastleState {
        return {
            hp: this._currentHp,
            maxHp: this.maxHp,
            isDestroyed: this._isDestroyed
        };
    }

    /**
     * 是否已摧毁
     */
    public isDestroyed(): boolean {
        return this._isDestroyed;
    }

    // ==================== Getter 方法 ====================

    public get currentHp(): number {
        return this._currentHp;
    }

    public get getMaxHp(): number {
        return this.maxHp;
    }
}

// Ensure class registration - Updated 2025-02-25
console.log('[Castle] Class loaded and registered');
