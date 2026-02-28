/**
 * HUD 控制器 - Cocos Creator版本
 * 负责更新游戏界面上的所有 HUD 元素
 */

import { _decorator, Component, Node, Label, ProgressBar, Sprite, instantiate, Prefab, Vec3, UITransform, Color } from 'cc';
import { TimeSystem } from '../systems/TimeSystem';
import { Player } from '../entities/Player';
import { Castle } from '../entities/Castle';
import { WaveSystem } from '../systems/WaveSystem';
import { MonsterManager } from '../systems/MonsterManager';

const { ccclass, property } = _decorator;

@ccclass('HUDController')
export class HUDController extends Component {
    // ==================== 顶部状态栏 ====================

    @property({ type: Label, displayName: '天数标签' })
    dayLabel: Label | null = null;

    @property({ type: Label, displayName: '时间阶段标签' })
    timePhaseLabel: Label | null = null;

    @property({ type: Label, displayName: '金币标签' })
    goldLabel: Label | null = null;

    @property({ type: Label, displayName: '击杀数标签' })
    killLabel: Label | null = null;

    // ==================== 玩家状态 ====================

    @property({ type: Label, displayName: '等级标签' })
    levelLabel: Label | null = null;

    @property({ type: Label, displayName: '经验标签' })
    expLabel: Label | null = null;

    @property({ type: ProgressBar, displayName: '经验进度条' })
    expProgressBar: ProgressBar | null = null;

    @property({ type: ProgressBar, displayName: '玩家血条' })
    hpProgressBar: ProgressBar | null = null;

    // ==================== 城堡状态 ====================

    @property({ type: Label, displayName: '城堡血量标签' })
    castleHpLabel: Label | null = null;

    @property({ type: ProgressBar, displayName: '城堡血条' })
    castleHpProgressBar: ProgressBar | null = null;

    // ==================== 波次信息 ====================

    @property({ type: Label, displayName: '波次信息标签' })
    waveInfoLabel: Label | null = null;

    @property({ type: Label, displayName: '剩余怪物标签' })
    remainingMonstersLabel: Label | null = null;

    // ==================== 私有属性 ====================

    // 单例
    private static _instance: HUDController | null = null;
    public static get instance(): HUDController | null {
        return this._instance;
    }

    // 引用
    private _player: Player | null = null;
    private _castle: Castle | null = null;
    private _waveSystem: WaveSystem | null = null;
    private _monsterManager: MonsterManager | null = null;
    private _timeSystem: TimeSystem | null = null;

    // 缓存
    private _lastUpdateTime: number = 0;
    private readonly _updateInterval: number = 0.1; // 每0.1秒更新一次

    // ==================== 生命周期 ====================

    onLoad() {
        if (HUDController._instance === null) {
            HUDController._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 查找玩家引用
        this.findReferences();
    }

    start() {
        // 初始化显示
        this.updateAll();
    }

    update(deltaTime: number): void {
        // 限制更新频率
        this._lastUpdateTime += deltaTime;
        if (this._lastUpdateTime < this._updateInterval) return;

        this._lastUpdateTime = 0;
        this.updateAll();
    }

    // ==================== 引用查找 ====================

    /**
     * 查找系统引用
     */
    private findReferences(): void {
        // 查找玩家
        const playerNode = this.node.scene.getChildByPath('WorldContainer/Player');
        if (playerNode) {
            this._player = playerNode.getComponent(Player);
        }

        // 查找城堡
        const castleNode = this.node.scene.getChildByPath('WorldContainer/Castle');
        if (castleNode) {
            this._castle = castleNode.getComponent(Castle);
        }

        // 查找系统组件
        this._timeSystem = TimeSystem.instance;
        this._waveSystem = WaveSystem.instance;

        // 查找怪物管理器
        const monsterManagerNode = this.node.scene.getChildByName('MonsterManager');
        if (monsterManagerNode) {
            this._monsterManager = monsterManagerNode.getComponent(MonsterManager);
        }

        // 自动查找Canvas中的Label组件
        this.findLabelReferences();
    }

    /**
     * 自动查找Canvas中的Label引用
     */
    private findLabelReferences(): void {
        const canvas = this.node.scene.getChildByName('Canvas');
        if (!canvas) {
            console.warn('HUDController: Canvas节点未找到，跳过Label自动查找');
            return;
        }

        // 如果编辑器已经配置了引用，跳过自动查找
        if (this.dayLabel || this.timePhaseLabel || this.goldLabel) {
            console.log('HUDController: 使用编辑器配置的Label引用');
            return;
        }

        // 递归查找所有Label组件
        const labels: { [key: string]: Label | null } = {
            'DayLabel': null,
            'TimeLabel': null,
            'GoldLabel': null,
            'KillLabel': null,
            'LevelLabel': null,
            'ExpLabel': null,
            'HpLabel': null,
            'CastleHpLabel': null,
            'WaveLabel': null,
            'RemainingLabel': null
        };

        this.collectLabels(canvas, labels);

        // 自动分配引用
        this.dayLabel = labels['DayLabel'];
        this.timePhaseLabel = labels['TimeLabel'];
        this.goldLabel = labels['GoldLabel'];
        this.killLabel = labels['KillLabel'];
        this.levelLabel = labels['LevelLabel'];
        this.expLabel = labels['ExpLabel'];
        this.castleHpLabel = labels['CastleHpLabel'];
        this.waveInfoLabel = labels['WaveLabel'];
        this.remainingMonstersLabel = labels['RemainingLabel'];

        console.log('HUDController: 自动查找Label引用完成');
    }

    /**
     * 递归收集Label组件
     */
    private collectLabels(parent: Node, labels: { [key: string]: Label | null }): void {
        for (const child of parent.children) {
            // 根据节点名称匹配
            const nodeName = child.name.toLowerCase();
            const label = child.getComponent(Label);

            if (label) {
                if (nodeName.includes('day') && !labels['DayLabel']) {
                    labels['DayLabel'] = label;
                } else if (nodeName.includes('time') && !labels['TimeLabel']) {
                    labels['TimeLabel'] = label;
                } else if (nodeName.includes('gold') && !labels['GoldLabel']) {
                    labels['GoldLabel'] = label;
                } else if (nodeName.includes('kill') && !labels['KillLabel']) {
                    labels['KillLabel'] = label;
                } else if (nodeName.includes('level') && !labels['LevelLabel']) {
                    labels['LevelLabel'] = label;
                } else if (nodeName.includes('exp') && !labels['ExpLabel']) {
                    labels['ExpLabel'] = label;
                } else if (nodeName.includes('castle') && nodeName.includes('hp') && !labels['CastleHpLabel']) {
                    labels['CastleHpLabel'] = label;
                } else if (nodeName.includes('wave') && !labels['WaveLabel']) {
                    labels['WaveLabel'] = label;
                } else if (nodeName.includes('remain') && !labels['RemainingLabel']) {
                    labels['RemainingLabel'] = label;
                }
            }

            // 递归子节点
            this.collectLabels(child, labels);
        }
    }

    // ==================== 更新方法 ====================

    /**
     * 更新所有 HUD 元素
     */
    private updateAll(): void {
        this.updateTimeInfo();
        this.updatePlayerInfo();
        this.updateCastleInfo();
        this.updateWaveInfo();
    }

    /**
     * 更新时间信息
     */
    private updateTimeInfo(): void {
        if (!this._timeSystem) return;

        // 更新天数
        if (this.dayLabel) {
            const currentDay = this._timeSystem.getCurrentDay();
            const totalDays = 3;
            this.dayLabel.string = `第 ${currentDay}/${totalDays} 天`;
        }

        // 更新时间阶段
        if (this.timePhaseLabel) {
            const phaseName = this._timeSystem.getPhaseName();
            const gameTime = this._timeSystem.getGameTimeSeconds();
            const minutes = Math.floor(gameTime / 60);
            const seconds = Math.floor(gameTime % 60);
            this.timePhaseLabel.string = `${phaseName} ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * 更新玩家信息
     */
    private updatePlayerInfo(): void {
        if (!this._player) return;

        const playerData = this._player.playerData;

        // 更新金币
        if (this.goldLabel) {
            this.goldLabel.string = `金币: ${playerData.gold}`;
        }

        // 更新等级
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${playerData.level}`;
        }

        // 更新经验
        if (this.expLabel) {
            const expPercent = Math.floor(this.getExpPercent() * 100);
            this.expLabel.string = `${expPercent}%`;
        }

        // 更新经验进度条
        if (this.expProgressBar) {
            this.expProgressBar.progress = this.getExpPercent();
        }

        // 更新玩家血条
        if (this.hpProgressBar) {
            this.hpProgressBar.progress = this._player.currentHp / this._player.maxHp;
        }
    }

    /**
     * 更新城堡信息
     */
    private updateCastleInfo(): void {
        if (!this._castle) return;

        const castleState = this._castle.getCastleState();

        // 更新城堡血量标签
        if (this.castleHpLabel) {
            this.castleHpLabel.string = `${castleState.hp}/${castleState.maxHp}`;
        }

        // 更新城堡血条
        if (this.castleHpProgressBar) {
            this.castleHpProgressBar.progress = castleState.hp / castleState.maxHp;
        }
    }

    /**
     * 更新波次信息
     */
    private updateWaveInfo(): void {
        // 更新击杀数
        if (this.killLabel && this._monsterManager) {
            const kills = this._monsterManager.getTotalKills();
            this.killLabel.string = `击杀: ${kills}`;
        }

        // 更新剩余怪物
        if (this.remainingMonstersLabel) {
            const remaining = this.getRemainingMonsters();
            this.remainingMonstersLabel.string = `剩余: ${remaining}`;
        }

        // 更新波次状态
        if (this.waveInfoLabel && this._waveSystem) {
            const isWaveActive = this._waveSystem.isWaveActive();
            this.waveInfoLabel.string = isWaveActive ? '⚠️ 怪物突袭中!' : '✓ 安全';
        }
    }

    /**
     * 获取经验百分比
     */
    private getExpPercent(): number {
        if (!this._player) return 0;

        const playerData = this._player.playerData;
        const level = playerData.level;

        // 简单计算: 每级需要 100 * level 经验
        const requiredExp = 100 * level;
        const currentLevelExp = playerData.exp % requiredExp;

        return currentLevelExp / requiredExp;
    }

    /**
     * 获取剩余怪物数
     */
    private getRemainingMonsters(): number {
        if (this._monsterManager) {
            return this._monsterManager.getActiveMonsterCount();
        }
        return 0;
    }

    // ==================== 公共方法 ====================

    /**
     * 显示伤害数字
     * @param position 世界坐标位置
     * @param damage 伤害值
     * @param isCrit 是否暴击
     */
    public showDamageNumber(position: Vec3, damage: number, isCrit: boolean = false): void {
        // 创建伤害数字节点
        const damageNode = new Node('DamageNumber');
        const label = damageNode.addComponent(Label);
        label.string = damage.toString();
        label.fontSize = isCrit ? 32 : 24;
        label.lineHeight = 40;
        label.color = isCrit ? new Color().fromHEX('#ff0000') : new Color().fromHEX('#ffffff');

        // 设置位置
        damageNode.setPosition(position.x, position.y + 50, 0);

        // 添加到 Canvas
        const canvas = this.node;
        if (canvas && canvas.parent) {
            canvas.parent.addChild(damageNode);

            // 向上飘动动画
            this.scheduleOnce(() => {
                const startY = damageNode.position.y;
                const duration = 1.0;
                let elapsed = 0;

                this.schedule((dt: number) => {
                    elapsed += dt;
                    const progress = elapsed / duration;

                    if (progress >= 1) {
                        damageNode.destroy();
                        return false;
                    }

                    // 向上移动并淡出
                    damageNode.setPosition(position.x, startY + 100 * progress, 0);
                    label.color = new Color(
                        label.color.r,
                        label.color.g,
                        label.color.b,
                        255 * (1 - progress)
                    );

                    return true;
                });
            }, 0);
        }
    }

    /**
     * 显示获取经验
     */
    public showExpGain(amount: number): void {
        console.log(`获得经验: ${amount}`);
        // 简化实现: 在控制台输出
        // 可以扩展为显示 "+123 EXP" 的文字动画
    }

    /**
     * 显示获取金币
     */
    public showGoldGain(amount: number): void {
        console.log(`获得金币: ${amount}`);
        // 简化实现: 在控制台输出
        // 可以扩展为显示 "+50 G" 的文字动画
    }

    /**
     * 显示升级提示
     */
    /**
     * 显示升级提示
     */
    public showLevelUp(): void {
        console.log('升级!');
        // 简化实现: 在控制台输出
        // 完整版本可以创建:
        // 1. "LEVEL UP!" 文字动画
        // 2. 属性增加提示
        // 3. 特效动画

        // 闪烁效果 - 临时改变 GoldInfo 颜色
        if (this.goldLabel) {
            const originalColor = this.goldLabel.color.clone();
            this.goldLabel.color = new Color().fromHEX('#FFD700'); // 金色
            this.goldLabel.string = '升级!';

            this.scheduleOnce(() => {
                this.goldLabel.color = originalColor;
                // 恢复显示 (会在 update 中重置)
            }, 1);
        }
    }

    /**
     * 刷新所有显示
     */
    public refresh(): void {
        this.updateAll();
    }
}
