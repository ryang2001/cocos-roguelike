/**
 * 波次系统 - Cocos Creator版本
 * 负责怪物波次生成和管理
 */

import { _decorator, Component, Node, Vec3, Label, Color, UITransform, instantiate, Prefab } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { TimePhase, ITimeEventListener } from '../types/Types';
import { TimeSystem } from './TimeSystem';
import { MonsterManager } from './MonsterManager';
import { GameManager } from '../core/GameManager';
import { HUDController } from '../ui/HUDController';

const { ccclass, property } = _decorator;

/**
 * 波次状态
 */
enum WaveState {
    IDLE = 'idle',        // 空闲 (白天)
    PREPARING = 'preparing', // 准备中 (黄昏)
    ACTIVE = 'active',    // 进行中 (夜晚)
    COMPLETED = 'completed' // 完成
}

@ccclass('WaveSystem')
export class WaveSystem extends Component implements ITimeEventListener {
    // ==================== 编辑器属性 ====================

    @property({ displayName: '怪物管理器引用' })
    monsterManagerNode: Node | null = null;

    @property({ displayName: '怪物出生点节点' })
    monsterSpawnPointsNode: Node | null = null;

    // ==================== 私有属性 ====================

    // 单例
    private static _instance: WaveSystem | null = null;
    public static get instance(): WaveSystem | null {
        return this._instance;
    }

    // 波次状态
    private _waveState: WaveState = WaveState.IDLE;

    // 当前波次配置
    private _currentWaveConfig: any = null;

    // 当前波次剩余怪物数
    private _remainingMonsters: number = 0;

    // 怪物管理器引用
    private _monsterManager: MonsterManager | null = null;

    // 出生点列表
    private readonly _spawnPoints: Vec3[] = [];

    // ==================== 生命周期 ====================

    onLoad() {
        if (WaveSystem._instance === null) {
            WaveSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 自动查找引用 (如果编辑器未配置)
        this.autoConfigureReferences();

        // 初始化出生点
        this.initSpawnPoints();
    }

    /**
     * 自动配置组件引用
     */
    private autoConfigureReferences(): void {
        // 如果编辑器已配置，使用编辑器配置
        if (this.monsterManagerNode) {
            this._monsterManager = this.monsterManagerNode.getComponent(MonsterManager);
        } else {
            // 自动查找 MonsterManager
            const monsterManagerNode = this.node.scene.getChildByName('MonsterManager');
            if (monsterManagerNode) {
                this._monsterManager = monsterManagerNode.getComponent(MonsterManager);
                this.monsterManagerNode = monsterManagerNode;
                console.log('WaveSystem: 自动找到 MonsterManager');
            }
        }

        // 如果编辑器未配置 spawnPointsNode，自动查找
        if (!this.monsterSpawnPointsNode) {
            const worldContainer = this.node.scene.getChildByName('WorldContainer');
            if (worldContainer) {
                const spawnPointsNode = worldContainer.getChildByName('MonsterSpawnPoints');
                if (spawnPointsNode) {
                    this.monsterSpawnPointsNode = spawnPointsNode;
                    console.log('WaveSystem: 自动找到 MonsterSpawnPoints');
                }
            }
        }
    }

    start() {
        // 注册时间监听器
        const timeSystem = TimeSystem.instance;
        if (timeSystem) {
            timeSystem.addListener(this);
        }
    }

    onDestroy() {
        if (WaveSystem._instance === this) {
            WaveSystem._instance = null;
        }

        // 移除时间监听器
        const timeSystem = TimeSystem.instance;
        if (timeSystem) {
            timeSystem.removeListener(this);
        }
    }

    update(deltaTime: number): void {
        // 检查波次完成
        if (this._waveState === WaveState.ACTIVE) {
            this.checkWaveComplete();
        }
    }

    // ==================== 初始化 ====================

    /**
     * 初始化出生点
     */
    private initSpawnPoints(): void {
        // 定义出生点位置和名称
        const spawnPointConfigs = [
            { name: 'SpawnPoint_1', position: new Vec3(500, 500, 0) },
            { name: 'SpawnPoint_2', position: new Vec3(2500, 500, 0) },
            { name: 'SpawnPoint_3', position: new Vec3(500, 2500, 0) },
            { name: 'SpawnPoint_4', position: new Vec3(2500, 2500, 0) }
        ];

        if (!this.monsterSpawnPointsNode) {
            // 如果没有指定出生点节点，使用默认位置
            for (const config of spawnPointConfigs) {
                this._spawnPoints.push(config.position.clone());
            }
            console.log('WaveSystem: 使用默认出生点位置');
            return;
        }

        // 从子节点获取出生点位置，或自动创建/设置位置
        const children = this.monsterSpawnPointsNode.children;
        const foundPoints = new Set<string>();

        for (const child of children) {
            if (child.name.startsWith('SpawnPoint') || child.name.startsWith('spawn')) {
                // 查找对应的配置
                const config = spawnPointConfigs.find(c => child.name === c.name);
                if (config) {
                    // 如果节点位置接近原点(未设置)，设置为配置位置
                    if (Vec3.distance(child.position, Vec3.ZERO) < 10) {
                        child.setPosition(config.position);
                        console.log(`WaveSystem: 设置 ${child.name} 位置为 (${config.position.x}, ${config.position.y})`);
                    }
                    this._spawnPoints.push(child.position.clone());
                    foundPoints.add(child.name);
                } else {
                    this._spawnPoints.push(child.position.clone());
                }
            }
        }

        // 如果某些出生点不存在，创建它们
        for (const config of spawnPointConfigs) {
            if (!foundPoints.has(config.name)) {
                console.warn(`WaveSystem: 未找到 ${config.name}，将使用默认位置`);
                this._spawnPoints.push(config.position.clone());
            }
        }

        // 如果没有找到任何出生点，使用默认位置
        if (this._spawnPoints.length === 0) {
            for (const config of spawnPointConfigs) {
                this._spawnPoints.push(config.position.clone());
            }
        }

        console.log(`WaveSystem: 初始化了${this._spawnPoints.length}个出生点`);
    }

    // ==================== ITimeEventListener 实现 ====================

    onDuskStart(): void {
        console.log('黄昏开始，准备波次...');
        this._waveState = WaveState.PREPARING;

        // 获取当前波次配置
        const currentDay = TimeSystem.instance?.getCurrentDay() || 1;
        this._currentWaveConfig = this.getWaveConfig(currentDay);

        // 显示波次警告
        this.showWaveWarning();
    }

    onNightStart(): void {
        console.log('夜晚开始，波次开始!');
        this._waveState = WaveState.ACTIVE;
        this.startWave();
    }

    onDayStart(): void {
        console.log('白天开始，波次结束');
        this._waveState = WaveState.IDLE;
    }

    // ==================== 波次管理 ====================

    /**
     * 获取波次配置
     */
    private getWaveConfig(day: number): any {
        switch (day) {
            case 1:
                return GameConfig.WAVES.DAY_1;
            case 2:
                return GameConfig.WAVES.DAY_2;
            case 3:
                return GameConfig.WAVES.DAY_3;
            default:
                return GameConfig.WAVES.DAY_1;
        }
    }

    /**
     * 开始波次
     */
    private startWave(): void {
        if (!this._monsterManager) {
            console.error('WaveSystem: 怪物管理器未设置');
            return;
        }

        // 计算总怪物数
        this._remainingMonsters = this.calculateTotalMonsters(this._currentWaveConfig);

        console.log(`开始波次，总怪物数: ${this._remainingMonsters}`);

        // 生成波次怪物
        this._monsterManager.spawnWaveMonsters(this._currentWaveConfig, this._spawnPoints);
    }

    /**
     * 计算总怪物数
     */
    private calculateTotalMonsters(waveConfig: any): number {
        let total = 0;

        for (const count of Object.values(waveConfig.monsters)) {
            total += count as number;
        }

        total += waveConfig.elites || 0;

        if (waveConfig.boss) {
            total += 1;
        }

        return total;
    }

    /**
     * 检查波次完成
     */
    private checkWaveComplete(): void {
        if (!this._monsterManager) return;

        const activeCount = this._monsterManager.getActiveMonsterCount();

        if (activeCount === 0 && this._remainingMonsters > 0) {
            // 所有怪物已被清除
            this._waveState = WaveState.COMPLETED;
            console.log('波次完成!');

            this.onWaveComplete();
        }
    }

    /**
     * 波次完成
     */
    private onWaveComplete(): void {
        // 可以添加波次完成奖励
        console.log('恭喜!成功防御本次波次');

        // 等待白天到来
    }

    /**
     * 显示波次警告
     */
    private showWaveWarning(): void {
        const currentDay = TimeSystem.instance?.getCurrentDay() || 1;
        const waveConfig = this.getWaveConfig(currentDay);

        console.log('=== 波次警告 ===');
        console.log(`第${currentDay}天波次即将到来`);

        for (const [monsterType, count] of Object.entries(waveConfig.monsters)) {
            console.log(`${monsterType}: ${count}只`);
        }

        console.log(`精英怪: ${waveConfig.elites}只`);
        if (waveConfig.boss) {
            console.log(`Boss: ${waveConfig.boss}`);
        }

        // 创建视觉警告
        this.createWaveWarningUI(currentDay, waveConfig);
    }

    /**
     * 创建波次警告UI
     */
    private createWaveWarningUI(day: number, waveConfig: any): void {
        // 查找Canvas节点
        const canvas = this.node.scene.getChildByName('Canvas');
        if (!canvas) {
            console.warn('WaveSystem: Canvas节点未找到，无法显示警告UI');
            return;
        }

        // 创建警告容器节点
        const warningNode = new Node('WaveWarning');
        const uiTransform = warningNode.addComponent(UITransform);
        uiTransform.setContentSize(600, 400);

        // 居中显示
        warningNode.setPosition(0, 100, 0);

        // 标题标签
        const titleLabel = new Node('TitleLabel');
        const titleTransform = titleLabel.addComponent(UITransform);
        titleTransform.setContentSize(600, 80);
        titleLabel.setPosition(0, 120, 0);

        const titleComponent = titleLabel.addComponent(Label);
        titleComponent.string = `⚠️ 第${day}天波次来袭!`;
        titleComponent.fontSize = 48;
        titleComponent.lineHeight = 60;
        titleComponent.color = new Color().fromHEX('#FFD700'); // 金色
        titleComponent.horizontalAlign = Label.HorizontalAlign.CENTER;

        // 怪物信息标签
        const infoLabel = new Node('InfoLabel');
        const infoTransform = infoLabel.addComponent(UITransform);
        infoTransform.setContentSize(600, 200);
        infoLabel.setPosition(0, 0, 0);

        const infoComponent = infoLabel.addComponent(Label);
        let infoText = `即将到来:\n`;

        for (const [monsterType, count] of Object.entries(waveConfig.monsters)) {
            if (count > 0) {
                const monsterName = this.getMonsterDisplayName(monsterType);
                infoText += `${monsterName} x${count}\n`;
            }
        }

        if (waveConfig.elites > 0) {
            infoText += `精英怪 x${waveConfig.elites}\n`;
        }

        if (waveConfig.boss) {
            const bossName = this.getBossDisplayName(waveConfig.boss);
            infoText += `\n🔴 Boss: ${bossName} 🔴`;
        }

        infoComponent.string = infoText;
        infoComponent.fontSize = 28;
        infoComponent.lineHeight = 40;
        infoComponent.color = new Color().fromHEX('#FFFFFF');
        infoComponent.horizontalAlign = Label.HorizontalAlign.CENTER;

        // 添加到警告节点
        warningNode.addChild(titleLabel);
        warningNode.addChild(infoLabel);
        canvas.addChild(warningNode);

        // 动画效果：3秒后淡出移除
        this.scheduleOnce(() => {
            this.fadeOutAndDestroy(warningNode, 1.0);
        }, 3.0);

        // 更新HUD控制器
        const hudController = HUDController.instance;
        if (hudController) {
            // HUD会在update中自动更新显示
            console.log('WaveSystem: 警告UI已显示，HUD将更新');
        }
    }

    /**
     * 淡出并销毁节点
     */
    private fadeOutAndDestroy(node: Node, duration: number): void {
        let elapsed = 0;

        this.schedule((dt: number) => {
            elapsed += dt;
            const progress = elapsed / duration;

            if (progress >= 1) {
                node.destroy();
                return false;
            }

            // 淡出效果
            const opacity = 1 - progress;
            node.getChildren().forEach((child) => {
                const label = child.getComponent(Label);
                if (label) {
                    label.color = new Color(
                        label.color.r,
                        label.color.g,
                        label.color.b,
                        Math.floor(255 * opacity)
                    );
                }
            });

            return true;
        });
    }

    /**
     * 获取怪物显示名称
     */
    private getMonsterDisplayName(monsterType: string): string {
        const nameMap: { [key: string]: string } = {
            'slime': '史莱姆',
            'goblin': '哥布林',
            'skeleton': '骷髅',
            'wolf': '狼',
            'orc': '兽人',
            'demon': '恶魔'
        };
        return nameMap[monsterType] || monsterType;
    }

    /**
     * 获取Boss显示名称
     */
    private getBossDisplayName(bossType: string): string {
        const bossNameMap: { [key: string]: string } = {
            'skeleton_king': '骷髅王',
            'demon_lord': '魔王',
            'dragon_boss': '龙王'
        };
        return bossNameMap[bossType] || bossType;
    }

    // ==================== 公共方法 ====================

    /**
     * 手动触发波次 (用于测试)
     */
    public triggerWaveManually(day: number = 1): void {
        this._currentWaveConfig = this.getWaveConfig(day);
        this._waveState = WaveState.ACTIVE;
        this.startWave();
    }

    /**
     * 获取波次状态
     */
    public getWaveState(): WaveState {
        return this._waveState;
    }

    /**
     * 获取剩余怪物数
     */
    public getRemainingMonsters(): number {
        if (!this._monsterManager) return 0;
        return this._monsterManager.getActiveMonsterCount();
    }

    /**
     * 是否是波次进行中
     */
    public isWaveActive(): boolean {
        return this._waveState === WaveState.ACTIVE;
    }

    /**
     * 重置波次系统
     */
    public reset(): void {
        this._waveState = WaveState.IDLE;
        this._remainingMonsters = 0;
        this._currentWaveConfig = null;
    }
}
