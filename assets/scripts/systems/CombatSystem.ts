/**
 * 战斗系统
 * 管理所有战斗实体和战斗流程
 */

import { _decorator, Component, Node, Vec3 } from 'cc';
import { ICharacter, IWeapon, IMonster, IPlayer, IAttackEvent, IDamageResult, MonsterState } from '../types/Types';
import { DamageSystem } from './DamageSystem';

const { ccclass } = _decorator;

/**
 * 战斗实体接口
 * 扩展自 Node，添加战斗相关方法
 */
export interface ICombatEntity {
    node: Node;
    getCharacterData(): ICharacter;
    takeDamage(damage: number): void;
    heal(amount: number): void;
    onDeath(): void;
}

/**
 * 攻击监听器接口
 */
export interface IAttackListener {
    onAttack(event: IAttackEvent): void;
    onKill(killer: ICharacter, victim: ICharacter): void;
}

@ccclass('CombatSystem')
export class CombatSystem extends Component {
    // 单例
    private static _instance: CombatSystem | null = null;
    public static get instance(): CombatSystem | null {
        return this._instance;
    }

    // 所有战斗实体
    private readonly _combatEntities: Map<string, ICombatEntity> = new Map();

    // 攻击监听器
    private readonly _attackListeners: IAttackListener[] = [];

    // 统计数据
    private _totalDamageDealt: number = 0;
    private _totalKills: number = 0;

    onLoad() {
        if (CombatSystem._instance === null) {
            CombatSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }
    }

    onDestroy() {
        if (CombatSystem._instance === this) {
            CombatSystem._instance = null;
        }
        this._combatEntities.clear();
        this._attackListeners.length = 0;
    }

    // ==================== 实体管理 ====================

    /**
     * 注册战斗实体
     */
    registerCombatEntity(entity: ICombatEntity): void {
        const id = entity.node.uuid;
        this._combatEntities.set(id, entity);
    }

    /**
     * 注销战斗实体
     */
    unregisterCombatEntity(entity: ICombatEntity): void {
        const id = entity.node.uuid;
        this._combatEntities.delete(id);
    }

    /**
     * 获取战斗实体
     */
    getCombatEntity(uuid: string): ICombatEntity | undefined {
        return this._combatEntities.get(uuid);
    }

    /**
     * 获取所有战斗实体
     */
    getAllCombatEntities(): ICombatEntity[] {
        return Array.from(this._combatEntities.values());
    }

    // ==================== 范围查询 ====================

    /**
     * 查找范围内的敌人
     * @param center 中心位置
     * @param range 范围
     * @param isEnemy 判断是否为敌人的函数
     * @returns 按距离排序的敌人列表
     */
    findEnemiesInRange(
        center: Vec3,
        range: number,
        isEnemy: (entity: ICombatEntity) => boolean
    ): ICombatEntity[] {
        const enemies: ICombatEntity[] = [];

        for (const entity of this._combatEntities.values()) {
            if (!isEnemy(entity)) continue;

            const distance = Vec3.distance(center, entity.node.position);
            if (distance <= range) {
                enemies.push(entity);
            }
        }

        // 按距离排序
        enemies.sort((a, b) => {
            const distA = Vec3.distance(center, a.node.position);
            const distB = Vec3.distance(center, b.node.position);
            return distA - distB;
        });

        return enemies;
    }

    /**
     * 查找最近的敌人
     */
    findNearestEnemy(
        center: Vec3,
        maxRange: number,
        isEnemy: (entity: ICombatEntity) => boolean
    ): ICombatEntity | null {
        let nearest: ICombatEntity | null = null;
        let nearestDistance = maxRange;

        for (const entity of this._combatEntities.values()) {
            if (!isEnemy(entity)) continue;

            const distance = Vec3.distance(center, entity.node.position);
            if (distance < nearestDistance) {
                nearest = entity;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    /**
     * 查找血量最低的敌人
     */
    findLowestHPEEnemy(
        center: Vec3,
        range: number,
        isEnemy: (entity: ICombatEntity) => boolean
    ): ICombatEntity | null {
        let lowest: ICombatEntity | null = null;
        let lowestHP = Infinity;

        for (const entity of this._combatEntities.values()) {
            if (!isEnemy(entity)) continue;

            const distance = Vec3.distance(center, entity.node.position);
            if (distance > range) continue;

            const character = entity.getCharacterData();
            if (character.hp < lowestHP) {
                lowest = entity;
                lowestHP = character.hp;
            }
        }

        return lowest;
    }

    // ==================== 攻击处理 ====================

    /**
     * 执行攻击
     * @param attacker 攻击者
     * @param weapon 武器 (null 表示无武器)
     * @param target 目标
     * @param resistances 目标的抗性
     * @param critRate 暴击率
     * @param critDamage 暴击倍率
     * @returns 伤害结果
     */
    performAttack(
        attacker: ICombatEntity,
        weapon: IWeapon | null,
        target: ICombatEntity,
        resistances: any = {},
        critRate: number = 0.05,
        critDamage: number = 1.5
    ): IDamageResult {
        const attackerData = attacker.getCharacterData();
        const targetData = target.getCharacterData();

        // 计算伤害
        const result = DamageSystem.calculateDamage(
            attackerData,
            weapon,
            targetData,
            resistances,
            critRate,
            critDamage
        );

        // 应用伤害
        target.takeDamage(result.damage);

        // 更新统计
        this._totalDamageDealt += result.damage;

        // 触发攻击事件
        const attackEvent: IAttackEvent = {
            attacker: attackerData,
            target: targetData,
            weapon,
            damageResult: result
        };
        this.notifyAttackListeners(attackEvent);

        // 检查死亡
        if (result.isLethal) {
            this.onKill(attacker, target);
        }

        return result;
    }

    /**
     * AOE 攻击
     * @param attacker 攻击者
     * @param center 中心位置
     * @param range 范围
     * @param baseDamage 基础伤害
     * @param isEnemy 判断是否为敌人的函数
     * @returns 所有目标的伤害结果
     */
    performAOEAttack(
        attacker: ICombatEntity,
        center: Vec3,
        range: number,
        baseDamage: number,
        isEnemy: (entity: ICombatEntity) => boolean
    ): IDamageResult[] {
        const results: IDamageResult[] = [];
        const enemies = this.findEnemiesInRange(center, range, isEnemy);

        for (const enemy of enemies) {
            const distance = Vec3.distance(center, enemy.node.position);
            const damage = DamageSystem.calculateAOEDamage(baseDamage, distance, range);

            const result: IDamageResult = {
                damage,
                isCrit: false,
                element: null,
                targetHp: Math.max(0, enemy.getCharacterData().hp - damage),
                isLethal: enemy.getCharacterData().hp - damage <= 0
            };

            enemy.takeDamage(damage);
            results.push(result);

            if (result.isLethal) {
                this.onKill(attacker, enemy);
            }
        }

        return results;
    }

    // ==================== 死亡处理 ====================

    /**
     * 击杀回调
     */
    private onKill(killer: ICombatEntity, victim: ICombatEntity): void {
        const killerData = killer.getCharacterData();
        const victimData = victim.getCharacterData();

        this._totalKills++;

        // 通知监听器
        for (const listener of this._attackListeners) {
            listener.onKill(killerData, victimData);
        }

        // 调用受害者死亡处理
        victim.onDeath();
    }

    // ==================== 监听器管理 ====================

    /**
     * 添加攻击监听器
     */
    addAttackListener(listener: IAttackListener): void {
        this._attackListeners.push(listener);
    }

    /**
     * 移除攻击监听器
     */
    removeAttackListener(listener: IAttackListener): void {
        const index = this._attackListeners.indexOf(listener);
        if (index !== -1) {
            this._attackListeners.splice(index, 1);
        }
    }

    /**
     * 通知所有攻击监听器
     */
    private notifyAttackListeners(event: IAttackEvent): void {
        for (const listener of this._attackListeners) {
            listener.onAttack(event);
        }
    }

    // ==================== 统计数据 ====================

    /**
     * 获取总伤害
     */
    getTotalDamageDealt(): number {
        return this._totalDamageDealt;
    }

    /**
     * 获取总击杀数
     */
    getTotalKills(): number {
        return this._totalKills;
    }

    /**
     * 重置统计数据
     */
    resetStats(): void {
        this._totalDamageDealt = 0;
        this._totalKills = 0;
    }

    // ==================== 工具方法 ====================

    /**
     * 判断两个实体是否敌对
     * @param entity1 实体1
     * @param entity2 实体2
     * @returns 是否敌对
     */
    static isEnemy(entity1: ICombatEntity, entity2: ICombatEntity): boolean {
        // 简单判断: 一个是玩家，一个是怪物
        const data1 = entity1.getCharacterData();
        const data2 = entity2.getCharacterData();

        const isPlayer1 = 'level' in data1 && 'exp' in data1;
        const isPlayer2 = 'level' in data2 && 'exp' in data2;

        const isMonster1 = 'monsterType' in data1;
        const isMonster2 = 'monsterType' in data2;

        // 玩家 vs 怪物
        if (isPlayer1 && isMonster2) return true;
        if (isPlayer2 && isMonster1) return true;

        // 怪物 vs 怪物 (不攻击同类)
        if (isMonster1 && isMonster2) return false;

        return false;
    }
}
