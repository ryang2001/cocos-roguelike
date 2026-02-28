/**
 * 经验和等级系统 - Cocos Creator版本
 * 管理玩家升级和经验值计算
 */

import { IPlayer } from '../types/Types';

/**
 * 等级奖励配置
 */
interface ILevelReward {
    level: number;
    hpBonus: number;
    damageBonus: number;
    defenseBonus: number;
    critRateBonus: number;
    moveSpeedBonus: number;
}

/**
 * 经验系统类
 */
export class ExperienceSystem {
    /**
     * 获取升级所需经验
     * @param level 等级
     * @returns 升级所需经验
     */
    static getExpForLevel(level: number): number {
        // 线性增长: 每级需要 100 * level 经验
        // 第1级 -> 100经验
        // 第2级 -> 200经验
        // 第3级 -> 300经验
        return 100 * level;
    }

    /**
     * 获取当前等级已获得的经验
     * @param totalExp 总经验
     * @param currentLevel 当前等级
     * @returns 当前等级经验
     */
    static getCurrentLevelExp(totalExp: number, currentLevel: number): number {
        // 计算之前所有等级的总经验
        let previousTotalExp = 0;
        for (let i = 1; i < currentLevel; i++) {
            previousTotalExp += this.getExpForLevel(i);
        }

        return Math.max(0, totalExp - previousTotalExp);
    }

    /**
     * 检查是否可以升级
     * @param currentExp 当前经验
     * @param currentLevel 当前等级
     * @returns 是否可以升级
     */
    static canLevelUp(currentExp: number, currentLevel: number): boolean {
        const requiredExp = this.getExpForLevel(currentLevel);
        return currentExp >= requiredExp;
    }

    /**
     * 计算升级后的等级
     * @param totalExp 总经验
     * @param startLevel 起始等级
     * @returns 升级后的等级
     */
    static calculateLevel(totalExp: number, startLevel: number = 1): number {
        let level = startLevel;
        let exp = totalExp;

        while (this.canLevelUp(exp, level)) {
            const requiredExp = this.getExpForLevel(level);
            exp -= requiredExp;
            level++;

            // 设置最高等级限制
            if (level > 99) break;
        }

        return level;
    }

    /**
     * 执行升级
     * @param player 玩家数据
     * @returns 升级奖励
     */
    static onLevelUp(player: IPlayer): ILevelReward {
        player.level++;

        // 计算升级奖励
        const reward = this.getLevelReward(player.level);

        // 应用奖励
        player.maxHp += reward.hpBonus;
        player.hp = player.maxHp; // 升级后补满血

        // 更新其他属性 (通过装备或其他方式)
        // 这里简化处理，直接修改基础值
        if (player.defense !== undefined) {
            player.defense += reward.defenseBonus;
        }

        if (player.critRate !== undefined) {
            player.critRate = Math.min(1.0, player.critRate + reward.critRateBonus);
        }

        if (player.speed !== undefined) {
            player.speed += reward.moveSpeedBonus;
        }

        console.log(`升级! 等级: ${player.level}`);
        console.log(`奖励: HP +${reward.hpBonus}, 防御 +${reward.defenseBonus}`);

        return reward;
    }

    /**
     * 获取等级奖励
     * @param level 等级
     * @returns 奖励配置
     */
    static getLevelReward(level: number): ILevelReward {
        return {
            level,
            hpBonus: 10,           // 每级 +10 HP
            damageBonus: 2,        // 每级 +2 伤害
            defenseBonus: 1,       // 每级 +1 防御
            critRateBonus: 0.005,  // 每级 +0.5% 暴击率
            moveSpeedBonus: 2      // 每级 +2 移动速度
        };
    }

    /**
     * 计算怪物给予的经验值
     * @param monsterLevel 怪物等级
     * @param playerLevel 玩家等级
     * @param baseExp 基础经验
     * @returns 实际经验
     */
    static calculateMonsterExp(monsterLevel: number, playerLevel: number, baseExp: number): number {
        // 等级差惩罚
        const levelDiff = monsterLevel - playerLevel;

        if (levelDiff > 5) {
            // 怪物等级太高，获得额外经验
            return Math.floor(baseExp * 1.5);
        } else if (levelDiff < -5) {
            // 怪物等级太低，减少经验
            return Math.floor(baseExp * 0.5);
        } else if (levelDiff < -10) {
            // 怪物等级过低，无经验
            return 0;
        }

        return baseExp;
    }

    /**
     * 获取经验百分比 (用于UI显示)
     * @param currentExp 当前经验
     * @param currentLevel 当前等级
     * @returns 经验百分比 (0-1)
     */
    static getExpPercent(currentExp: number, currentLevel: number): number {
        const requiredExp = this.getExpForLevel(currentLevel);
        const currentLevelExp = this.getCurrentLevelExp(currentExp, currentLevel);

        return Math.min(1, currentLevelExp / requiredExp);
    }

    /**
     * 格式化经验文本
     * @param currentExp 当前经验
     * @param currentLevel 当前等级
     * @returns 格式化的文本
     */
    static formatExpText(currentExp: number, currentLevel: number): string {
        const requiredExp = this.getExpForLevel(currentLevel);
        const currentLevelExp = this.getCurrentLevelExp(currentExp, currentLevel);

        return `${currentLevelExp}/${requiredExp}`;
    }

    /**
     * 获取最高等级
     */
    static getMaxLevel(): number {
        return 99;
    }

    /**
     * 是否达到最高等级
     * @param level 等级
     * @returns 是否达到最高等级
     */
    static isMaxLevel(level: number): boolean {
        return level >= this.getMaxLevel();
    }

    /**
     * 计算等级对应的总经验
     * @param level 等级
     * @returns 总经验
     */
    static getTotalExpForLevel(level: number): number {
        let totalExp = 0;
        for (let i = 1; i < level; i++) {
            totalExp += this.getExpForLevel(i);
        }
        return totalExp;
    }

    /**
     * 添加经验并处理升级
     * @param player 玩家数据
     * @param expToAdd 添加的经验
     * @returns 升级次数
     */
    static addExp(player: IPlayer, expToAdd: number): number {
        let levelsGained = 0;

        player.exp += expToAdd;

        // 检查多次升级
        while (this.canLevelUp(player.exp, player.level) && !this.isMaxLevel(player.level)) {
            const requiredExp = this.getExpForLevel(player.level);
            player.exp -= requiredExp; // 扣除升级所需经验
            this.onLevelUp(player);
            levelsGained++;
        }

        if (levelsGained > 0) {
            console.log(`连升${levelsGained}级! 当前等级: ${player.level}`);
        }

        return levelsGained;
    }
}
