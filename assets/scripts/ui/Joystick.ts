/**
 * 虚拟摇杆组件
 * 点击位置创建摇杆，手指抬起后摇杆消失
 */

import { _decorator, Component, Node, Vec3, Vec2, EventTouch, UITransform, Color, Layers, Graphics } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Joystick')
export class Joystick extends Component {
    // ==================== 编辑器属性 ====================

    @property({ displayName: '摇杆半径', tooltip: '摇杆可移动的最大半径' })
    maxRadius: number = 80;

    @property({ displayName: '触发阈值', tooltip: '触发移动的最小距离' })
    minThreshold: number = 10;

    @property({ displayName: '背景颜色', tooltip: '摇杆背景的颜色' })
    bgColor: Color = new Color(100, 150, 255, 200);

    @property({ displayName: '摇杆颜色', tooltip: '摇杆控制点的颜色' })
    stickColor: Color = new Color(255, 255, 255, 255);

    // ==================== 私有属性 ====================

    // 摇杆背景节点
    private _bgNode: Node | null = null;
    // 摇杆控制点节点
    private _stickNode: Node | null = null;
    // 全屏触摸区域节点
    private _touchAreaNode: Node | null = null;

    // 触摸ID
    private _touchId: number = -1;
    // 是否正在触摸
    private _isTouching: boolean = false;
    // 摇杆中心位置（触摸开始位置，相对于父节点）
    private _centerPos: Vec3 = new Vec3();
    // 当前方向向量
    private _direction: Vec2 = new Vec2(0, 0);
    // 当前力度 (0-1)
    private _power: number = 0;

    // 回调函数
    private _onChangeCallback: ((direction: Vec2, power: number) => void) | null = null;
    private _onStartCallback: (() => void) | null = null;
    private _onEndCallback: (() => void) | null = null;
    private _onPositionCallback: ((clickX: number, clickY: number, joyX: number, joyY: number, joyZ: number) => void) | null = null;

    // ==================== 生命周期 ====================

    onLoad() {
        // 创建摇杆UI（背景和控制点）
        this.createJoystickUI();
        // 初始隐藏视觉效果
        this.hideVisuals();
    }

    start() {
        // 在start中注册事件，确保父节点已经设置好
        this.registerEvents();
    }

    /**
     * 隐藏摇杆视觉元素
     */
    private hideVisuals(): void {
        if (this._bgNode) {
            this._bgNode.active = false;
        }
        if (this._stickNode) {
            this._stickNode.active = false;
        }
    }

    /**
     * 显示摇杆视觉元素
     */
    private showVisuals(): void {
        if (this._bgNode) {
            this._bgNode.active = true;
        }
        if (this._stickNode) {
            this._stickNode.active = true;
        }
    }

    onDestroy() {
        this.unregisterEvents();
    }

    // ==================== UI创建 ====================

    /**
     * 创建摇杆UI
     * 只创建视觉元素（背景和控制点），触摸事件注册在父节点上
     */
    private createJoystickUI(): void {
        // 创建背景
        this._bgNode = new Node('JoystickBg');
        this._bgNode.layer = Layers.Enum.UI_2D;
        this.node.addChild(this._bgNode);

        const bgTransform = this._bgNode.addComponent(UITransform);
        bgTransform.setContentSize(this.maxRadius * 2, this.maxRadius * 2);

        const bgGraphics = this._bgNode.addComponent(Graphics);
        bgGraphics.fillColor = this.bgColor;
        bgGraphics.strokeColor = new Color(50, 100, 200, 255);
        bgGraphics.lineWidth = 4;
        bgGraphics.circle(0, 0, this.maxRadius - 2);
        bgGraphics.fill();
        bgGraphics.stroke();

        // 创建控制点
        this._stickNode = new Node('JoystickStick');
        this._stickNode.layer = Layers.Enum.UI_2D;
        this.node.addChild(this._stickNode);

        const stickTransform = this._stickNode.addComponent(UITransform);
        stickTransform.setContentSize(this.maxRadius * 0.6, this.maxRadius * 0.6);

        const stickGraphics = this._stickNode.addComponent(Graphics);
        stickGraphics.fillColor = this.stickColor;
        stickGraphics.strokeColor = new Color(200, 200, 200, 255);
        stickGraphics.lineWidth = 3;
        stickGraphics.circle(0, 0, this.maxRadius * 0.3 - 2);
        stickGraphics.fill();
        stickGraphics.stroke();
    }

    // ==================== 事件处理 ====================

    /**
     * 注册触摸事件
     * 事件注册在父节点（UICanvas）上，实现全屏触摸检测
     */
    private registerEvents(): void {
        const parentNode = this.node.parent;
        if (!parentNode) {
            console.warn('[Joystick] 无法注册事件：父节点不存在');
            return;
        }

        parentNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        parentNode.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        parentNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        parentNode.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**
     * 注销触摸事件
     */
    private unregisterEvents(): void {
        const parentNode = this.node.parent;
        if (!parentNode) return;

        parentNode.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        parentNode.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        parentNode.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        parentNode.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /**
     * 触摸开始 - 在触摸位置显示摇杆
     */
    private onTouchStart(event: EventTouch): void {
        if (this._isTouching) return;

        this._touchId = event.getID();
        this._isTouching = true;

        // 获取相对于UICanvas的触摸坐标
        const touchLocation = event.getLocation();

        // 直接使用相对于UICanvas的坐标（getLocation已返回相对坐标）
        this._centerPos.set(touchLocation.x, touchLocation.y, 0);

        // 向GameManager报告鼠标点击位置和摇杆创建位置（用于Debug显示）
        if (this._onPositionCallback) {
            this._onPositionCallback(touchLocation.x, touchLocation.y, this._centerPos.x, this._centerPos.y, this._centerPos.z);
        }

        // 移动视觉元素到触摸位置（Joystick节点保持在(0,0)，只移动子节点）
        if (this._bgNode) {
            this._bgNode.setPosition(this._centerPos);
        }

        // 显示摇杆视觉元素
        this.showVisuals();

        // 重置控制点位置到背景中心
        if (this._stickNode) {
            this._stickNode.setPosition(this._centerPos);
        }

        // 触发开始回调
        if (this._onStartCallback) {
            this._onStartCallback();
        }

        // 计算初始方向
        this.updateJoystickData(new Vec2(0, 0));
    }

    /**
     * 触摸移动
     */
    private onTouchMove(event: EventTouch): void {
        if (!this._isTouching || event.getID() !== this._touchId) return;

        // 获取相对于UICanvas的触摸坐标
        const touchLocation = event.getLocation();

        // 计算相对于摇杆中心的位置（直接使用相对坐标）
        const relativePos = new Vec2(
            touchLocation.x - this._centerPos.x,
            touchLocation.y - this._centerPos.y
        );

        // 更新摇杆数据和控制点位置
        this.updateJoystickData(relativePos);
    }

    /**
     * 触摸结束 - 隐藏摇杆
     */
    private onTouchEnd(event: EventTouch): void {
        if (event.getID() !== this._touchId) return;

        this._isTouching = false;
        this._touchId = -1;

        // 隐藏摇杆视觉元素
        this.hideVisuals();

        // 重置数据
        this._direction.set(0, 0);
        this._power = 0;

        // 触发结束回调
        if (this._onEndCallback) {
            this._onEndCallback();
        }

        // 触发变化回调（通知移动停止）
        if (this._onChangeCallback) {
            this._onChangeCallback(this._direction, this._power);
        }
    }

    /**
     * 更新摇杆数据和控制点位置
     */
    private updateJoystickData(relativePos: Vec2): void {
        const distance = relativePos.length();

        // 限制控制点在最大半径内
        let clampedPos = relativePos.clone();
        if (distance > this.maxRadius) {
            const scale = this.maxRadius / distance;
            clampedPos.x *= scale;
            clampedPos.y *= scale;
        }

        // 更新控制点位置（相对于中心位置）
        if (this._stickNode) {
            this._stickNode.setPosition(
                this._centerPos.x + clampedPos.x,
                this._centerPos.y + clampedPos.y,
                0
            );
        }

        // 计算方向和力度
        if (distance < this.minThreshold) {
            this._direction.set(0, 0);
            this._power = 0;
        } else {
            this._direction.x = relativePos.x / distance;
            this._direction.y = relativePos.y / distance;
            this._power = Math.min(distance / this.maxRadius, 1);
        }

        // 触发变化回调
        if (this._onChangeCallback) {
            this._onChangeCallback(this._direction, this._power);
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 设置方向变化回调
     */
    public onChange(callback: (direction: Vec2, power: number) => void): void {
        this._onChangeCallback = callback;
    }

    /**
     * 设置触摸开始回调
     */
    public onStart(callback: () => void): void {
        this._onStartCallback = callback;
    }

    /**
     * 设置调试位置回调
     * 用于报告鼠标点击位置和摇杆创建位置
     */
    public onPosition(callback: (clickX: number, clickY: number, joyX: number, joyY: number, joyZ: number) => void): void {
        this._onPositionCallback = callback;
    }

    /**
     * 获取当前方向向量
     */
    public getDirection(): Vec2 {
        return this._direction.clone();
    }

    /**
     * 获取当前力度
     */
    public getPower(): number {
        return this._power;
    }

    /**
     * 是否正在触摸
     */
    public isTouching(): boolean {
        return this._isTouching;
    }
}
