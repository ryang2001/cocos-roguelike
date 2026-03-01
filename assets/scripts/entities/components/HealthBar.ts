/**
 * 血条组件 - 基于 Archero 设计模式
 * 
 * 功能：
 * 1. 显示实体血量
 * 2. 跟随实体移动
 * 3. 支持平滑动画
 */

import { _decorator, Component, Node, UITransform, Sprite, Color, Vec3, tween, UIOpacity } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('HealthBar')
export class HealthBar extends Component {
    // ==================== 编辑器属性 ====================
    
    @property({ type: Node, displayName: '血条背景' })
    background: Node | null = null;
    
    @property({ type: Node, displayName: '血条前景' })
    foreground: Node | null = null;
    
    @property({ displayName: '血条宽度' })
    barWidth: number = 50;
    
    @property({ displayName: '血条高度' })
    barHeight: number = 6;
    
    @property({ displayName: 'Y轴偏移' })
    offsetY: number = 40;
    
    @property({ displayName: '平滑动画时间' })
    animDuration: number = 0.2;

    // ==================== 私有属性 ====================
    
    private _currentHp: number = 100;
    private _maxHp: number = 100;
    private _targetWidth: number = 50;
    private _owner: Node | null = null;
    private _foregroundTransform: UITransform | null = null;
    private _foregroundSprite: Sprite | null = null;

    // ==================== 生命周期 ====================
    
    onLoad() {
        // 如果没有设置前景节点，创建默认血条
        if (!this.foreground) {
            this.createDefaultHealthBar();
        }
        
        if (this.foreground) {
            this._foregroundTransform = this.foreground.getComponent(UITransform);
            this._foregroundSprite = this.foreground.getComponent(Sprite);
        }
    }
    
    lateUpdate(deltaTime: number) {
        // 跟随拥有者
        if (this._owner && this._owner.isValid) {
            this.updatePosition();
        }
    }

    // ==================== 初始化 ====================
    
    /**
     * 创建默认血条
     */
    private createDefaultHealthBar(): void {
        // 创建背景
        this.background = new Node('Bg');
        this.background.parent = this.node;
        const bgTransform = this.background.addComponent(UITransform);
        bgTransform.setContentSize(this.barWidth + 2, this.barHeight + 2);
        const bgSprite = this.background.addComponent(Sprite);
        bgSprite.color = new Color(50, 50, 50, 200);
        bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        
        // 创建前景
        this.foreground = new Node('Fg');
        this.foreground.parent = this.node;
        this._foregroundTransform = this.foreground.addComponent(UITransform);
        this._foregroundTransform.setContentSize(this.barWidth, this.barHeight);
        this._foregroundSprite = this.foreground.addComponent(Sprite);
        this._foregroundSprite.color = new Color(220, 50, 50, 255);
        this._foregroundSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        
        this._targetWidth = this.barWidth;
    }
    
    /**
     * 初始化血条
     * @param owner 拥有者节点
     * @param maxHp 最大血量
     * @param currentHp 当前血量
     */
    public init(owner: Node, maxHp: number, currentHp?: number): void {
        this._owner = owner;
        this._maxHp = maxHp;
        this._currentHp = currentHp !== undefined ? currentHp : maxHp;
        
        this.updateBarWidth();
    }

    // ==================== 血量更新 ====================
    
    /**
     * 设置血量
     * @param currentHp 当前血量
     * @param maxHp 最大血量（可选）
     */
    public setHp(currentHp: number, maxHp?: number): void {
        if (maxHp !== undefined) {
            this._maxHp = maxHp;
        }
        
        this._currentHp = Math.max(0, Math.min(currentHp, this._maxHp));
        this.updateBarWidth(true);
    }
    
    /**
     * 更新血条宽度
     */
    private updateBarWidth(animated: boolean = false): void {
        if (!this._foregroundTransform) return;
        
        const ratio = this._currentHp / this._maxHp;
        this._targetWidth = this.barWidth * ratio;
        
        if (animated && this.animDuration > 0) {
            // 平滑动画
            const currentWidth = this._foregroundTransform.width;
            tween({ width: currentWidth })
                .to(this.animDuration, { width: this._targetWidth }, {
                    onUpdate: (target: any) => {
                        if (this._foregroundTransform) {
                            this._foregroundTransform.setContentSize(target.width, this.barHeight);
                        }
                    }
                })
                .start();
        } else {
            this._foregroundTransform.setContentSize(this._targetWidth, this.barHeight);
        }
        
        // 更新颜色
        this.updateColor(ratio);
    }
    
    /**
     * 根据血量比例更新颜色
     */
    private updateColor(ratio: number): void {
        if (!this._foregroundSprite) return;
        
        if (ratio > 0.6) {
            // 绿色
            this._foregroundSprite.color = new Color(50, 200, 50, 255);
        } else if (ratio > 0.3) {
            // 黄色
            this._foregroundSprite.color = new Color(220, 200, 50, 255);
        } else {
            // 红色
            this._foregroundSprite.color = new Color(220, 50, 50, 255);
        }
    }

    // ==================== 位置更新 ====================
    
    /**
     * 更新位置（跟随拥有者）
     */
    private updatePosition(): void {
        if (!this._owner) return;
        
        const ownerPos = this._owner.position;
        this.node.setPosition(ownerPos.x, ownerPos.y + this.offsetY, 0);
    }

    // ==================== 显示/隐藏 ====================
    
    /**
     * 显示血条
     */
    public show(): void {
        this.node.active = true;
    }
    
    /**
     * 隐藏血条
     */
    public hide(): void {
        this.node.active = false;
    }
    
    /**
     * 淡出并销毁
     */
    public fadeOutAndDestroy(duration: number = 0.5): void {
        const opacity = this.node.getComponent(UIOpacity);
        if (!opacity) {
            this.node.destroy();
            return;
        }
        
        tween(opacity)
            .to(duration, { opacity: 0 })
            .call(() => {
                this.node.destroy();
            })
            .start();
    }

    // ==================== Getter ====================
    
    public get currentHp(): number {
        return this._currentHp;
    }
    
    public get maxHp(): number {
        return this._maxHp;
    }
    
    public get hpRatio(): number {
        return this._currentHp / this._maxHp;
    }
}
