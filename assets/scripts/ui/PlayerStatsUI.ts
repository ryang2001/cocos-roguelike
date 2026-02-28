/**
 * 玩家属性面板UI - Cocos Creator版本
 * 负责显示玩家详细属性和生效的词条
 */

import { _decorator, Component, Node, Label, ScrollView, Button, Color } from 'cc';
import { ModifierSystem } from '../systems/ModifierSystem';
import { IModifier, ModifierType, Rarity, ElementType, WeaponAttackType } from '../types/Types';
import { Player } from '../entities/Player';

const { ccclass, property } = _decorator;

@ccclass('PlayerStatsUI')
export class PlayerStatsUI extends Component {
    // ==================== 编辑器属性 ====================

    @property({ type: Label, displayName: '玩家名称' })
    playerNameLabel: Label | null = null;

    @property({ type: Label, displayName: '玩家等级' })
    playerLevelLabel: Label | null = null;

    @property({ type: Label, displayName: '经验值' })
    playerExpLabel: Label | null = null;

    @property({ type: Label, displayName: '生命值' })
    playerHpLabel: Label | null = null;

    @property({ type: Label, displayName: '金币' })
    playerGoldLabel: Label | null = null;

    @property({ type: Node, displayName: '基础属性面板' })
    baseStatsPanel: Node | null = null;

    @property({ type: Node, displayName: '战斗属性面板' })
    combatStatsPanel: Node | null = null;

    @property({ type: Node, displayName: '元素属性面板' })
    elementStatsPanel: Node | null = null;

    @property({ type: ScrollView, displayName: '生效词条列表' })
    modifierListScrollView: ScrollView | null = null;

    @property({ type: Node, displayName: '关闭按钮' })
    closeButton: Node | null = null;

    // ==================== 私有属性 ====================

    // 玩家引用
    private _player: Player | null = null;

    // 词条系统引用
    private _modifierSystem: ModifierSystem | null = null;

    // 玩家ID
    private _playerId: string = 'player';

    // 是否显示中
    private _isVisible: boolean = false;

    // 属性标签缓存
    private _statLabels: Map<string, Label> = new Map();

    // ==================== 生命周期 ====================

    onLoad() {
        this._modifierSystem = ModifierSystem.instance;

        // 注册关闭按钮事件
        if (this.closeButton) {
            const button = this.closeButton.getComponent(Button);
            if (button) {
                button.node.on('click', this.hide, this);
            }
        }

        this.hide();
    }

    update(deltaTime: number): void {
        if (this._isVisible) {
            this.refreshStats();
        }
    }

    // ==================== UI控制 ====================

    /**
     * 显示面板
     */
    public show(): void {
        this._isVisible = true;
        this.node.active = true;
        this.refreshAll();
        console.log('玩家属性面板已打开');
    }

    /**
     * 隐藏面板
     */
    public hide(): void {
        this._isVisible = false;
        this.node.active = false;
    }

    /**
     * 切换显示/隐藏
     */
    public toggle(): void {
        if (this._isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 是否显示中
     */
    public isShowing(): boolean {
        return this._isVisible;
    }

    // ==================== 刷新显示 ====================

    /**
     * 刷新所有显示
     */
    public refreshAll(): void {
        this.refreshBasicInfo();
        this.refreshBaseStats();
        this.refreshCombatStats();
        this.refreshElementStats();
        this.refreshModifierList();
    }

    /**
     * 刷新基础信息
     */
    public refreshBasicInfo(): void {
        if (!this._player) return;

        const playerData = this._player.playerData;

        if (this.playerNameLabel) {
            this.playerNameLabel.string = playerData.name;
        }

        if (this.playerLevelLabel) {
            this.playerLevelLabel.string = `等级: ${playerData.level}`;
        }

        if (this.playerExpLabel) {
            this.playerExpLabel.string = `经验: ${playerData.exp}`;
        }

        if (this.playerHpLabel) {
            this.playerHpLabel.string = `HP: ${playerData.hp}/${playerData.maxHp}`;
        }

        if (this.playerGoldLabel) {
            this.playerGoldLabel.string = `金币: ${playerData.gold}`;
        }
    }

    /**
     * 刷新基础属性
     */
    public refreshBaseStats(): void {
        if (!this._player || !this.baseStatsPanel) return;

        const playerData = this._player.playerData;
        const modifiers = this._modifierSystem?.getAllActiveModifiers(this._playerId) || [];

        // 计算词条加成
        const attackBonus = this.calculateModifierBonus(modifiers, ModifierType.ATTACK_PERCENT);
        const defenseBonus = this.calculateModifierBonus(modifiers, ModifierType.DEFENSE_PERCENT);
        const hpBonus = this.calculateModifierBonus(modifiers, ModifierType.HP_PERCENT);
        const speedBonus = this.calculateModifierBonus(modifiers, ModifierType.MOVE_SPEED_PERCENT);

        // 更新显示
        this.updateStatLabel('攻击力', playerData.attack || 10, attackBonus, '%');
        this.updateStatLabel('防御力', playerData.defense || 0, defenseBonus, '%');
        this.updateStatLabel('生命值', playerData.maxHp, hpBonus, '%');
        this.updateStatLabel('移动速度', playerData.speed, speedBonus, '%');
    }

    /**
     * 刷新战斗属性
     */
    public refreshCombatStats(): void {
        if (!this._player || !this.combatStatsPanel) return;

        const playerData = this._player.playerData;
        const modifiers = this._modifierSystem?.getAllActiveModifiers(this._playerId) || [];

        // 暴击相关
        const critRate = this.calculateModifierBonus(modifiers, ModifierType.CRIT_RATE);
        const critDamage = this.calculateModifierBonus(modifiers, ModifierType.CRIT_DAMAGE);

        // 攻击速度
        const attackSpeed = this.calculateModifierBonus(modifiers, ModifierType.ATTACK_SPEED);

        // 生命偷取
        const lifeSteal = this.calculateModifierBonus(modifiers, ModifierType.LIFE_STEAL);

        // 伤害反弹
        const damageReflect = this.calculateModifierBonus(modifiers, ModifierType.DAMAGE_REFLECT);

        // 更新显示
        this.updateStatLabel('暴击率', (playerData.critRate || 0.05) * 100, critRate * 100, '%');
        this.updateStatLabel('暴击伤害', (playerData.critDamage || 1.5) * 100, critDamage * 100, '%');
        this.updateStatLabel('攻击速度加成', attackSpeed * 100, 0, '%');
        this.updateStatLabel('生命偷取', lifeSteal * 100, 0, '%');
        this.updateStatLabel('伤害反弹', damageReflect * 100, 0, '%');
    }

    /**
     * 刷新元素属性
     */
    public refreshElementStats(): void {
        if (!this._player || !this.elementStatsPanel) return;

        const modifiers = this._modifierSystem?.getAllActiveModifiers(this._playerId) || [];

        // 元素攻击加成
        const elementTypes: { [key: string]: ModifierType } = {
            '火': ModifierType.ELEMENT_ATTACK_FIRE,
            '水': ModifierType.ELEMENT_ATTACK_WATER,
            '木': ModifierType.ELEMENT_ATTACK_WOOD,
            '土': ModifierType.ELEMENT_ATTACK_EARTH,
            '雷': ModifierType.ELEMENT_ATTACK_THUNDER,
            '风': ModifierType.ELEMENT_ATTACK_WIND,
            '光': ModifierType.ELEMENT_ATTACK_LIGHT,
            '暗': ModifierType.ELEMENT_ATTACK_DARK
        };

        for (const [name, type] of Object.entries(elementTypes)) {
            const bonus = this.calculateModifierBonus(modifiers, type);
            this.updateStatLabel(`${name}元素攻击`, bonus * 100, 0, '%');
        }

        // 武器类型伤害加成
        const weaponTypes: { [key: string]: ModifierType } = {
            '斩击': ModifierType.WEAPON_DAMAGE_SLASH,
            '打击': ModifierType.WEAPON_DAMAGE_BLUNT,
            '戳击': ModifierType.WEAPON_DAMAGE_PIERCE,
            '魔法': ModifierType.WEAPON_DAMAGE_MAGIC,
            '射击': ModifierType.WEAPON_DAMAGE_RANGED,
            '爆炸': ModifierType.WEAPON_DAMAGE_EXPLOSION
        };

        for (const [name, type] of Object.entries(weaponTypes)) {
            const bonus = this.calculateModifierBonus(modifiers, type);
            this.updateStatLabel(`${name}伤害`, bonus * 100, 0, '%');
        }
    }

    /**
     * 刷新生效词条列表
     */
    public refreshModifierList(): void {
        if (!this._modifierSystem || !this.modifierListScrollView) return;

        const content = this.modifierListScrollView.content;
        if (!content) return;

        // 清空列表
        content.removeAllChildren();

        // 获取所有生效词条
        const modifiers = this._modifierSystem.getAllActiveModifiers(this._playerId);

        // 按稀有度排序
        modifiers.sort((a, b) => b.rarity - a.rarity);

        // 创建词条显示
        for (const modifier of modifiers) {
            this.createModifierLabel(modifier, content);
        }
    }

    /**
     * 创建词条标签
     */
    private createModifierLabel(modifier: IModifier, parent: Node): void {
        const node = new Node('ModifierLabel');
        parent.addChild(node);

        const label = node.addComponent(Label);
        label.string = `[${this.getRarityName(modifier.rarity)}] ${modifier.name}: ${modifier.description}`;
        label.fontSize = 18;
        label.color = this.getRarityColor(modifier.rarity);
        label.overflow = Label.Overflow.CLAMP;
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    /**
     * 更新属性标签
     */
    private updateStatLabel(name: string, baseValue: number, bonusValue: number, suffix: string = ''): void {
        const key = name;
        let label = this._statLabels.get(key);

        if (!label) {
            // 创建新标签
            if (!this.baseStatsPanel && !this.combatStatsPanel && !this.elementStatsPanel) return;

            const panel = this.getPanelForStat(name);
            if (!panel) return;

            const node = new Node(`Stat_${name}`);
            panel.addChild(node);

            label = node.addComponent(Label);
            label.fontSize = 20;
            label.horizontalAlign = Label.HorizontalAlign.LEFT;

            this._statLabels.set(key, label);
        }

        // 构建显示文本
        let valueText = `${baseValue.toFixed(1)}${suffix}`;
        if (bonusValue !== 0) {
            const sign = bonusValue > 0 ? '+' : '';
            valueText += ` (${sign}${bonusValue.toFixed(1)}${suffix})`;
        }

        label.string = `${name}: ${valueText}`;
    }

    /**
     * 获取属性所属面板
     */
    private getPanelForStat(name: string): Node | null {
        const baseStats = ['攻击力', '防御力', '生命值', '移动速度'];
        const combatStats = ['暴击率', '暴击伤害', '攻击速度加成', '生命偷取', '伤害反弹'];

        if (baseStats.includes(name)) return this.baseStatsPanel;
        if (combatStats.includes(name)) return this.combatStatsPanel;
        return this.elementStatsPanel;
    }

    /**
     * 计算词条加成值
     */
    private calculateModifierBonus(modifiers: IModifier[], type: ModifierType): number {
        return modifiers
            .filter(m => m.type === type)
            .reduce((sum, m) => sum + m.value, 0);
    }

    /**
     * 刷新属性显示
     */
    public refreshStats(): void {
        this.refreshBasicInfo();
    }

    // ==================== 工具方法 ====================

    /**
     * 获取稀有度名称
     */
    private getRarityName(rarity: Rarity): string {
        const names: { [key in Rarity]: string } = {
            [Rarity.COMMON]: '普通',
            [Rarity.UNCOMMON]: '优秀',
            [Rarity.RARE]: '稀有',
            [Rarity.EPIC]: '史诗',
            [Rarity.LEGENDARY]: '传说',
            [Rarity.MYTHICAL]: '神话'
        };
        return names[rarity] || '未知';
    }

    /**
     * 获取稀有度颜色
     */
    private getRarityColor(rarity: Rarity): Color {
        const colors: { [key in Rarity]: Color } = {
            [Rarity.COMMON]: new Color().fromHEX('#9E9E9E'),
            [Rarity.UNCOMMON]: new Color().fromHEX('#4CAF50'),
            [Rarity.RARE]: new Color().fromHEX('#2196F3'),
            [Rarity.EPIC]: new Color().fromHEX('#9C27B0'),
            [Rarity.LEGENDARY]: new Color().fromHEX('#FF9800'),
            [Rarity.MYTHICAL]: new Color().fromHEX('#F44336')
        };
        return colors[rarity] || Color.WHITE;
    }

    /**
     * 设置玩家
     */
    public setPlayer(player: Player): void {
        this._player = player;
    }

    /**
     * 设置玩家ID
     */
    public setPlayerId(playerId: string): void {
        this._playerId = playerId;
    }
}
