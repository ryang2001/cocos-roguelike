/**
 * 时间系统 - Cocos Creator版本
 * 负责游戏时间流逝和昼夜循环
 */

import { _decorator, Component } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { TimePhase, ITimePhase } from '../types/Types';

const { ccclass } = _decorator;

/**
 * 时间事件监听器接口
 */
export interface ITimeEventListener {
    onTimePhaseChange?(oldPhase: TimePhase, newPhase: TimePhase): void;
    onDayChange?(oldDay: number, newDay: number): void;
    onDawnStart?(): void;
    onDayStart?(): void;
    onDuskStart?(): void;
    onNightStart?(): void;
}

@ccclass('TimeSystem')
export class TimeSystem extends Component {
    // 单例
    private static _instance: TimeSystem | null = null;
    public static get instance(): TimeSystem | null {
        return this._instance;
    }

    // ==================== 私有属性 ====================

    // 游戏时间 (毫秒)
    private _gameTime: number = 0;

    // 当前天数 (1-3)
    private _currentDay: number = 1;

    // 当前时间阶段
    private _timePhase: TimePhase = TimePhase.DAY;

    // 是否暂停
    private _isPaused: boolean = false;

    // 时间监听器
    private readonly _listeners: ITimeEventListener[] = [];

    // 常量 (秒转换为毫秒)
    private readonly DAY_SECONDS: number = GameConfig.DAY_DURATION / 1000; // 600秒
    private readonly TOTAL_DAYS: number = GameConfig.TOTAL_DAYS; // 3天

    // ==================== 生命周期 ====================

    onLoad() {
        if (TimeSystem._instance === null) {
            TimeSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }
    }

    onDestroy() {
        if (TimeSystem._instance === this) {
            TimeSystem._instance = null;
        }
        this._listeners.length = 0;
    }

    update(deltaTime: number): void {
        if (this._isPaused) return;

        this._gameTime += deltaTime * 1000; // 转换为毫秒

        // 检查天数变化
        this.checkDayChange();

        // 检查时间阶段变化
        this.checkTimePhaseChange();

        // 检查游戏结束
        this.checkGameEnd();
    }

    // ==================== 时间更新 ====================

    /**
     * 检查天数变化
     */
    private checkDayChange(): void {
        const newDay = this.getCurrentDayNumber();

        if (newDay > this._currentDay && newDay <= this.TOTAL_DAYS) {
            const oldDay = this._currentDay;
            this._currentDay = newDay;

            console.log(`第${newDay}天开始`);

            this.notifyDayChange(oldDay, newDay);
        }
    }

    /**
     * 检查时间阶段变化
     */
    private checkTimePhaseChange(): void {
        const newPhase = this.calculateTimePhase();

        if (newPhase !== this._timePhase) {
            const oldPhase = this._timePhase;
            this._timePhase = newPhase;

            console.log(`时间阶段: ${TimePhase[oldPhase]} -> ${TimePhase[newPhase]}`);

            this.notifyTimePhaseChange(oldPhase, newPhase);
            this.notifyPhaseEvent(newPhase);
        }
    }

    /**
     * 检查游戏结束
     */
    private checkGameEnd(): void {
        if (this._currentDay > this.TOTAL_DAYS) {
            // 第3天结束，游戏胜利
            this.onGameEnd(true);
        }
    }

    /**
     * 计算当前时间阶段
     */
    private calculateTimePhase(): TimePhase {
        const dayProgress = this.getDayProgress(); // 0-1

        const dawn = GameConfig.TIME_PHASES.DAWN;
        const day = GameConfig.TIME_PHASES.DAY;
        const dusk = GameConfig.TIME_PHASES.DUSK;
        const night = GameConfig.TIME_PHASES.NIGHT;

        if (dayProgress >= night.start) {
            return TimePhase.NIGHT;
        } else if (dayProgress >= dusk.start) {
            return TimePhase.DUSK;
        } else if (dayProgress >= day.start) {
            return TimePhase.DAY;
        } else {
            return TimePhase.DAWN;
        }
    }

    // ==================== 事件通知 ====================

    /**
     * 通知天数变化
     */
    private notifyDayChange(oldDay: number, newDay: number): void {
        for (const listener of this._listeners) {
            if (listener.onDayChange) {
                listener.onDayChange(oldDay, newDay);
            }
        }
    }

    /**
     * 通知时间阶段变化
     */
    private notifyTimePhaseChange(oldPhase: TimePhase, newPhase: TimePhase): void {
        for (const listener of this._listeners) {
            if (listener.onTimePhaseChange) {
                listener.onTimePhaseChange(oldPhase, newPhase);
            }
        }
    }

    /**
     * 通知阶段特定事件
     */
    private notifyPhaseEvent(phase: TimePhase): void {
        for (const listener of this._listeners) {
            switch (phase) {
                case TimePhase.DAWN:
                    if (listener.onDawnStart) listener.onDawnStart();
                    break;
                case TimePhase.DAY:
                    if (listener.onDayStart) listener.onDayStart();
                    break;
                case TimePhase.DUSK:
                    if (listener.onDuskStart) listener.onDuskStart();
                    break;
                case TimePhase.NIGHT:
                    if (listener.onNightStart) listener.onNightStart();
                    break;
            }
        }
    }

    /**
     * 游戏结束回调
     */
    private onGameEnd(victory: boolean): void {
        // 由 GameManager 处理
        console.log(victory ? '游戏胜利!' : '游戏失败!');
    }

    // ==================== 监听器管理 ====================

    /**
     * 添加监听器
     */
    addListener(listener: ITimeEventListener): void {
        if (!this._listeners.includes(listener)) {
            this._listeners.push(listener);
        }
    }

    /**
     * 移除监听器
     */
    removeListener(listener: ITimeEventListener): void {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
            this._listeners.splice(index, 1);
        }
    }

    // ==================== 公共方法 ====================

    /**
     * 暂停时间
     */
    pause(): void {
        this._isPaused = true;
    }

    /**
     * 恢复时间
     */
    resume(): void {
        this._isPaused = false;
    }

    /**
     * 重置时间
     */
    reset(): void {
        this._gameTime = 0;
        this._currentDay = 1;
        this._timePhase = TimePhase.DAY;
        this._isPaused = false;
    }

    /**
     * 设置游戏时间 (用于测试)
     */
    setGameTime(time: number): void {
        this._gameTime = time;
        this.checkDayChange();
        this.checkTimePhaseChange();
    }

    // ==================== Getter 方法 ====================

    /**
     * 获取游戏时间 (毫秒)
     */
    getGameTime(): number {
        return this._gameTime;
    }

    /**
     * 获取游戏时间 (秒)
     */
    getGameTimeSeconds(): number {
        return Math.floor(this._gameTime / 1000);
    }

    /**
     * 获取当前天数 (1-3)
     */
    getCurrentDay(): number {
        return this._currentDay;
    }

    /**
     * 获取当前天数编号 (基于总时间计算)
     */
    getCurrentDayNumber(): number {
        return Math.floor(this._gameTime / GameConfig.DAY_DURATION) + 1;
    }

    /**
     * 获取当前时间阶段
     */
    getTimePhase(): TimePhase {
        return this._timePhase;
    }

    /**
     * 获取当天进度 (0-1)
     */
    getDayProgress(): number {
        const timeInDay = this._gameTime % GameConfig.DAY_DURATION;
        return timeInDay / GameConfig.DAY_DURATION;
    }

    /**
     * 获取总进度 (0-1)
     */
    getTotalProgress(): number {
        return Math.min(1, this._gameTime / (this.TOTAL_DAYS * GameConfig.DAY_DURATION));
    }

    /**
     * 获取剩余时间 (秒)
     */
    getRemainingTime(): number {
        const totalTime = this.TOTAL_DAYS * this.DAY_SECONDS;
        return Math.max(0, totalTime - this.getGameTimeSeconds());
    }

    /**
     * 获取当天剩余时间 (秒)
     */
    getDayRemainingTime(): number {
        const timeInDay = this.getGameTimeSeconds() % this.DAY_SECONDS;
        return Math.max(0, this.DAY_SECONDS - timeInDay);
    }

    /**
     * 是否是夜晚
     */
    isNight(): boolean {
        return this._timePhase === TimePhase.NIGHT;
    }

    /**
     * 是否是白天
     */
    isDay(): boolean {
        return this._timePhase === TimePhase.DAY;
    }

    /**
     * 获取格式化的时间字符串
     */
    getFormattedTime(): string {
        const minutes = Math.floor(this.getGameTimeSeconds() / 60);
        const seconds = this.getGameTimeSeconds() % 60;

        const day = this.getCurrentDay();
        const totalDays = this.TOTAL_DAYS;

        return `第${day}/${totalDays}天 ${minutes}分${seconds}秒`;
    }

    /**
     * 获取格式化的阶段名称
     */
    getPhaseName(): string {
        return GameConfig.TIME_PHASES[TimePhase[this._timePhase] as keyof typeof GameConfig.TIME_PHASES]?.name || '未知';
    }
}
