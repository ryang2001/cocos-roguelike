/**
 * 怪物管理器 - Cocos Creator版本
 * 负责怪物的生成、管理和对象池
 */

import { _decorator, Component, Node, Prefab, instantiate, Vec3 } from 'cc';
import { GameConfig } from '../config/GameConfig';
import { MonsterType, MonsterState, IMonster } from '../types/Types';
import { Monster } from '../entities/Monster';
import { CombatSystem, ICombatEntity } from './CombatSystem';

const { ccclass, property } = _decorator;

/**
 * 怪物生成配置
 */
interface IMonsterSpawnConfig {
    monsterType: MonsterType;
    count: number;
    eliteCount: number;
    spawnPoint: Vec3;
    spawnRadius: number;
}

/**
 * 活跃怪物信息
 */
interface IActiveMonster {
    node: Node;
    monster: Monster;
    data: IMonster;
}

@ccclass('MonsterManager')
export class MonsterManager extends Component {
    // ==================== 编辑器属性 ====================

    @property({ type: Prefab, displayName: '怪物预制体' })
    monsterPrefab: Prefab | null = null;

    @property({ displayName: '最大怪物数量' })
    maxMonsters: number = 100;

    @property({ displayName: '对象池初始大小' })
    initialPoolSize: number = 20;

    // ==================== 私有属性 ====================

    // 单例
    private static _instance: MonsterManager | null = null;
    public static get instance(): MonsterManager | null {
        return this._instance;
    }

    // 对象池
    private readonly _monsterPool: Node[] = [];

    // 活跃怪物列表
    private readonly _activeMonsters: Map<string, IActiveMonster> = new Map();

    // 统计数据
    private _totalSpawned: number = 0;
    private _totalKilled: number = 0;

    // ==================== 生命周期 ====================

    onLoad() {
        if (MonsterManager._instance === null) {
            MonsterManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 初始化对象池
        this.initPool();
    }

    onDestroy() {
        if (MonsterManager._instance === this) {
            MonsterManager._instance = null;
        }

        // 清理所有怪物
        this.clearAllMonsters();
    }

    // ==================== 对象池管理 ====================

    /**
     * 初始化对象池
     */
    private initPool(): void {
        if (!this.monsterPrefab) {
            console.warn('MonsterManager: 未设置怪物预制体');
            return;
        }

        for (let i = 0; i < this.initialPoolSize; i++) {
            const monster = this.createMonsterNode();
            monster.active = false;
            this.node.addChild(monster);
            this._monsterPool.push(monster);
        }

        console.log(`MonsterManager: 对象池初始化完成, 大小: ${this._monsterPool.length}`);
    }

    /**
     * 创建怪物节点
     */
    private createMonsterNode(): Node {
        if (this.monsterPrefab) {
            return instantiate(this.monsterPrefab);
        }

        // 如果没有预制体，创建基础节点
        const node = new Node('Monster');
        node.addComponent(Monster);
        return node;
    }

    /**
     * 从对象池获取怪物
     */
    private getFromPool(): Node | null {
        if (this._monsterPool.length > 0) {
            return this._monsterPool.pop()!;
        }

        // 池为空，创建新的
        if (this.node.children.length < this.maxMonsters) {
            return this.createMonsterNode();
        }

        console.warn('MonsterManager: 已达到最大怪物数量');
        return null;
    }

    /**
     * 归还对象到池
     */
    private returnToPool(monsterNode: Node): void {
        monsterNode.active = false;
        monsterNode.setParent(this.node);
        this._monsterPool.push(monsterNode);
    }

    // ==================== 怪物生成 ====================

    /**
     * 生成怪物
     * @param config 生成配置
     */
    spawnMonsters(config: IMonsterSpawnConfig): void {
        // 检查活跃怪物数量
        if (this._activeMonsters.size >= this.maxMonsters) {
            console.warn('MonsterManager: 已达到最大怪物数量，跳过生成');
            return;
        }

        const { monsterType, count, eliteCount, spawnPoint, spawnRadius } = config;
        const normalCount = count - eliteCount;

        // 生成普通怪物
        for (let i = 0; i < normalCount; i++) {
            const pos = this.getRandomPosition(spawnPoint, spawnRadius);
            this.spawnMonster(monsterType, pos, false);
        }

        // 生成精英怪物
        for (let i = 0; i < eliteCount; i++) {
            const pos = this.getRandomPosition(spawnPoint, spawnRadius);
            this.spawnMonster(monsterType, pos, true);
        }
    }

    /**
     * 生成单个怪物
     */
    spawnMonster(
        type: MonsterType,
        position: Vec3,
        isElite: boolean = false
    ): Node | null {
        const monsterNode = this.getFromPool();
        if (!monsterNode) return null;

        // 设置位置
        monsterNode.setPosition(position);
        monsterNode.active = true;

        // 获取或添加 Monster 组件
        let monster = monsterNode.getComponent(Monster);
        if (!monster) {
            monster = monsterNode.addComponent(Monster);
        }

        // 设置怪物属性
        monster.setMonsterType(type);
        monster.setElite(isElite);

        // 添加到活跃列表
        const monsterData = monster.getMonsterData();
        this._activeMonsters.set(monsterNode.uuid, {
            node: monsterNode,
            monster,
            data: monsterData
        });

        this._totalSpawned++;

        console.log(`生成怪物: ${monsterData.name} at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);

        return monsterNode;
    }

    /**
     * 生成波次怪物
     * @param waveConfig 波次配置 (来自 GameConfig.WAVES)
     * @param spawnPoints 生成点列表
     */
    spawnWaveMonsters(
        waveConfig: { monsters: { [key: string]: number }; elites: number; boss: string | null },
        spawnPoints: Vec3[]
    ): void {
        const spawnRadius = 200;

        // 字符串到 MonsterType 的映射
        const monsterTypeMap: { [key: string]: MonsterType } = {
            'slime': MonsterType.SLIME,
            'goblin': MonsterType.GOBLIN,
            'skeleton': MonsterType.SKELETON,
            'wolf': MonsterType.WOLF
        };

        // 解析怪物配置
        for (const [monsterTypeKey, count] of Object.entries(waveConfig.monsters)) {
            const type = monsterTypeMap[monsterTypeKey] || MonsterType.SLIME;
            const totalElite = waveConfig.elites;

            // 计算每个生成点的怪物数量
            const perSpawn = Math.ceil(count / spawnPoints.length);
            const elitePerSpawn = Math.ceil(totalElite / spawnPoints.length);

            for (const spawnPoint of spawnPoints) {
                this.spawnMonsters({
                    monsterType: type,
                    count: perSpawn,
                    eliteCount: elitePerSpawn,
                    spawnPoint,
                    spawnRadius
                });
            }
        }

        // 生成 Boss
        if (waveConfig.boss && spawnPoints.length > 0) {
            this.spawnBoss(waveConfig.boss, spawnPoints[0]);
        }
    }

    /**
     * 生成 Boss
     */
    spawnBoss(bossType: string, position: Vec3): Node | null {
        // 检查是否是 Dragon Boss (使用 3D 模型)
        if (bossType === 'dragon_boss') {
            return this.spawnDragonBoss(position);
        }

        // 根据 bossType 映射到 MonsterType
        const bossMonsterTypes: { [key: string]: MonsterType } = {
            'goblin_king': MonsterType.GOBLIN,
            'skeleton_king': MonsterType.SKELETON,
            'wolf_king': MonsterType.WOLF,
            'demon_king': MonsterType.SKELETON // 使用骷髅作为魔王替代
        };

        const monsterType = bossMonsterTypes[bossType] || MonsterType.SKELETON;

        // Boss 是特殊精英怪
        const bossNode = this.spawnMonster(monsterType, position, true);

        if (bossNode) {
            const monster = bossNode.getComponent(Monster);
            if (monster) {
                // Boss 额外强化
                const data = monster.getMonsterData();
                data.hp *= 3; // Boss 血量翻3倍
                data.maxHp = data.hp;
                data.damage *= 2; // Boss 伤害翻2倍
            }

            console.log(`生成 Boss: ${bossType}`);
        }

        return bossNode;
    }

    /**
     * 生成 Dragon Boss (使用 3D 模型)
     */
    private spawnDragonBoss(position: Vec3): Node | null {
        // 使用 dragon.prefab 的 UUID
        const dragonPrefabUuid = '49099856-8dec-4bdc-b4ae-2f77d5dcffcd@e979f';

        // TODO: 实例化预制体
        // 需要使用 instantiate 预制体 API
        console.log(`生成最终 Boss: 龙王 (3D 模型)`);

        // 暂时使用普通怪物替代
        const bossNode = this.spawnMonster(MonsterType.SKELETON, position, true);
        if (bossNode) {
            const monster = bossNode.getComponent(Monster);
            if (monster) {
                const data = monster.getMonsterData();
                data.hp *= 5; // 龙王更强
                data.maxHp = data.hp;
                data.damage *= 3;
                data.name = '龙王 (Dragon Boss)';
            }
        }

        return bossNode;
    }

    // ==================== 怪物管理 ====================

    /**
     * 移除怪物
     */
    removeMonster(monsterNode: Node): void {
        const uuid = monsterNode.uuid;

        if (this._activeMonsters.has(uuid)) {
            this._activeMonsters.delete(uuid);
            this._totalKilled++;

            // 归还到对象池
            this.returnToPool(monsterNode);
        }
    }

    /**
     * 清除所有怪物
     */
    clearAllMonsters(): void {
        for (const [uuid, active] of this._activeMonsters) {
            active.node.destroy();
        }
        this._activeMonsters.clear();
    }

    /**
     * 获取范围内的怪物
     */
    getMonstersInRange(center: Vec3, range: number): ICombatEntity[] {
        const monsters: ICombatEntity[] = [];

        for (const active of this._activeMonsters.values()) {
            const distance = Vec3.distance(center, active.node.position);
            if (distance <= range) {
                monsters.push(active.monster);
            }
        }

        return monsters;
    }

    /**
     * 获取最近的怪物
     */
    getNearestMonster(position: Vec3, maxRange: number): ICombatEntity | null {
        let nearest: ICombatEntity | null = null;
        let nearestDistance = maxRange;

        for (const active of this._activeMonsters.values()) {
            const distance = Vec3.distance(position, active.node.position);
            if (distance < nearestDistance) {
                nearest = active.monster;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    /**
     * 获取血量最低的怪物
     */
    getLowestHPMonster(position: Vec3, range: number): ICombatEntity | null {
        let lowest: ICombatEntity | null = null;
        let lowestHP = Infinity;

        for (const active of this._activeMonsters.values()) {
            const distance = Vec3.distance(position, active.node.position);
            if (distance > range) continue;

            const hp = active.data.hp;
            if (hp < lowestHP) {
                lowest = active.monster;
                lowestHP = hp;
            }
        }

        return lowest;
    }

    // ==================== 工具方法 ====================

    /**
     * 获取随机位置
     */
    private getRandomPosition(center: Vec3, radius: number): Vec3 {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;

        return new Vec3(
            center.x + Math.cos(angle) * distance,
            center.y + Math.sin(angle) * distance,
            0
        );
    }

    /**
     * 获取活跃怪物数量
     */
    getActiveMonsterCount(): number {
        return this._activeMonsters.size;
    }

    /**
     * 获取按状态分组的怪物
     */
    getMonstersByState(state: MonsterState): ICombatEntity[] {
        const monsters: ICombatEntity[] = [];

        for (const active of this._activeMonsters.values()) {
            if (active.data.state === state) {
                monsters.push(active.monster);
            }
        }

        return monsters;
    }

    // ==================== 统计数据 ====================

    /**
     * 获取生成总数
     */
    getTotalSpawned(): number {
        return this._totalSpawned;
    }

    /**
     * 获取击杀总数
     */
    getTotalKilled(): number {
        return this._totalKilled;
    }

    /**
     * 重置统计数据
     */
    resetStats(): void {
        this._totalSpawned = 0;
        this._totalKilled = 0;
    }
}
