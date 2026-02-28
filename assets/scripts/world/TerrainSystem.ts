/**
 * 地形系统 - Cocos Creator版本
 * 负责管理游戏世界中的特殊地形区域及其效果
 *
 * 地形类型:
 * - SNOW_MOUNTAIN: 雪山 - 减速30%
 * - VOLCANO: 火山 - 每秒5点伤害
 * - CASTLE: 城堡 - 玩家基地，安全区
 * - FOREST: 森林 - 怪物仇恨范围-50%
 * - DESERT: 沙漠 - 视野范围-50%
 * - SWAMP: 沼泽 - 每秒3点毒伤害
 */

import { _decorator, Component, Vec3, Rect, Color, Graphics, Node } from 'cc';
import { ElementType } from '../types/Types';
import { Player } from '../entities/Player';
import { Monster } from '../entities/Monster';
import { CombatSystem, ICombatEntity } from '../systems/CombatSystem';
import { CameraController } from '../systems/CameraController';

const { ccclass, property } = _decorator;

/**
 * 地形类型枚举
 */
export enum TerrainType {
    NONE = 'none',
    SNOW_MOUNTAIN = 'snow_mountain',  // 雪山
    VOLCANO = 'volcano',              // 火山
    CASTLE = 'castle',                // 城堡
    FOREST = 'forest',                // 森林
    DESERT = 'desert',                // 沙漠
    SWAMP = 'swamp'                   // 沼泽
}

/**
 * 地形效果类型
 */
export enum TerrainEffectType {
    SLOW = 'slow',                    // 减速
    DAMAGE = 'damage',                // 持续伤害
    POISON = 'poison',                // 中毒
    VISIBILITY = 'visibility',        // 视野变化
    STEALTH = 'stealth',              // 隐蔽
    SAFE = 'safe'                     // 安全区
}

/**
 * 地形效果配置
 */
export interface ITerrainEffect {
    type: TerrainEffectType;
    value: number;                    // 效果数值
    interval?: number;                // 触发间隔(秒)
    duration?: number;                // 持续时间(秒)
    element?: ElementType;            // 关联元素
}

/**
 * 地形区域配置
 */
export interface ITerrainZone {
    id: string;
    type: TerrainType;
    name: string;
    bounds: Rect;                     // 区域边界
    effects: ITerrainEffect[];        // 效果列表
    color: Color;                     // 显示颜色
    description: string;
}

/**
 * 地形中的实体信息
 */
interface IEntityInTerrain {
    entity: ICombatEntity;
    terrainId: string;
    effectTimers: Map<TerrainEffectType, number>;  // 效果计时器
}

@ccclass('TerrainSystem')
export class TerrainSystem extends Component {
    // 单例
    private static _instance: TerrainSystem | null = null;
    public static get instance(): TerrainSystem | null {
        return this._instance;
    }

    // ==================== 编辑器属性 ====================

    @property({ displayName: '是否显示地形边界' })
    showDebugBorders: boolean = false;

    @property({ displayName: '调试线条宽度' })
    debugLineWidth: number = 2;

    // ==================== 私有属性 ====================

    // 地形区域列表
    private _terrainZones: Map<string, ITerrainZone> = new Map();

    // 地形中的实体
    private _entitiesInTerrain: Map<string, IEntityInTerrain> = new Map();

    // 世界大小
    private _worldWidth: number = 3000;
    private _worldHeight: number = 3000;

    // 调试图形组件
    private _debugGraphics: Graphics | null = null;

    // ==================== 生命周期 ====================

    onLoad() {
        if (TerrainSystem._instance === null) {
            TerrainSystem._instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 创建调试图形组件
        this.initDebugGraphics();

        console.log('TerrainSystem: 地形系统初始化完成');
    }

    onDestroy() {
        if (TerrainSystem._instance === this) {
            TerrainSystem._instance = null;
        }
        this._terrainZones.clear();
        this._entitiesInTerrain.clear();
    }

    update(deltaTime: number): void {
        // 更新所有地形效果
        this.updateTerrainEffects(deltaTime);

        // 更新调试显示
        if (this.showDebugBorders) {
            this.drawDebugBorders();
        }
    }

    // ==================== 初始化 ====================

    private initDebugGraphics(): void {
        const debugNode = new Node('TerrainDebugGraphics');
        this.node.addChild(debugNode);

        this._debugGraphics = debugNode.addComponent(Graphics);
        if (this._debugGraphics) {
            this._debugGraphics.lineWidth = this.debugLineWidth;
        }
    }

    /**
     * 初始化地形系统
     * @param worldWidth 世界宽度
     * @param worldHeight 世界高度
     */
    initTerrain(worldWidth: number, worldHeight: number): void {
        this._worldWidth = worldWidth;
        this._worldHeight = worldHeight;

        // 生成默认地形布局
        this.generateDefaultTerrain();

        console.log(`TerrainSystem: 地形初始化完成，世界大小 ${worldWidth}x${worldHeight}`);
    }

    /**
     * 生成默认地形布局
     * 根据设计文档生成6种地形
     */
    private generateDefaultTerrain(): void {
        const centerX = this._worldWidth / 2;
        const centerY = this._worldHeight / 2;

        // 1. 城堡 - 中心区域 (安全区)
        this.addTerrainZone({
            id: 'terrain_castle',
            type: TerrainType.CASTLE,
            name: '城堡',
            bounds: new Rect(centerX - 200, centerY - 200, 400, 400),
            effects: [
                { type: TerrainEffectType.SAFE, value: 1 }
            ],
            color: new Color().fromHEX('#FFD700'),
            description: '玩家基地，安全区域'
        });

        // 2. 雪山 - 左上角
        this.addTerrainZone({
            id: 'terrain_snow',
            type: TerrainType.SNOW_MOUNTAIN,
            name: '雪山',
            bounds: new Rect(0, this._worldHeight - 800, 800, 800),
            effects: [
                { type: TerrainEffectType.SLOW, value: 0.30, duration: -1 }  // 永久减速30%
            ],
            color: new Color().fromHEX('#E0F7FA'),
            description: '寒冷区域，移动速度降低30%'
        });

        // 3. 火山 - 右上角
        this.addTerrainZone({
            id: 'terrain_volcano',
            type: TerrainType.VOLCANO,
            name: '火山',
            bounds: new Rect(this._worldWidth - 800, this._worldHeight - 800, 800, 800),
            effects: [
                { type: TerrainEffectType.DAMAGE, value: 5, interval: 1, element: ElementType.FIRE },  // 每秒5点火伤
                { type: TerrainEffectType.SLOW, value: 0.10 }  // 额外减速10%
            ],
            color: new Color().fromHEX('#FF5722'),
            description: '灼热区域，每秒受到5点火焰伤害'
        });

        // 4. 沙漠 - 左下角
        this.addTerrainZone({
            id: 'terrain_desert',
            type: TerrainType.DESERT,
            name: '沙漠',
            bounds: new Rect(0, 0, 800, 800),
            effects: [
                { type: TerrainEffectType.VISIBILITY, value: -0.50, duration: -1 },  // 视野-50%
                { type: TerrainEffectType.SLOW, value: 0.15 }  // 沙漠行走减速15%
            ],
            color: new Color().fromHEX('#F4A460'),
            description: '沙漠区域，视野范围降低50%'
        });

        // 5. 沼泽 - 右下角
        this.addTerrainZone({
            id: 'terrain_swamp',
            type: TerrainType.SWAMP,
            name: '沼泽',
            bounds: new Rect(this._worldWidth - 800, 0, 800, 800),
            effects: [
                { type: TerrainEffectType.POISON, value: 3, interval: 1, element: ElementType.WOOD },  // 每秒3点毒伤
                { type: TerrainEffectType.SLOW, value: 0.40 }  // 沼泽严重减速40%
            ],
            color: new Color().fromHEX('#556B2F'),
            description: '毒沼泽，每秒受到3点毒素伤害'
        });

        // 6. 森林 - 中心周围环形区域
        this.addTerrainZone({
            id: 'terrain_forest_north',
            type: TerrainType.FOREST,
            name: '森林(北)',
            bounds: new Rect(centerX - 400, centerY + 200, 800, 300),
            effects: [
                { type: TerrainEffectType.STEALTH, value: -0.50 }  // 怪物仇恨范围-50%
            ],
            color: new Color().fromHEX('#228B22'),
            description: '茂密森林，降低怪物发现范围'
        });

        this.addTerrainZone({
            id: 'terrain_forest_south',
            type: TerrainType.FOREST,
            name: '森林(南)',
            bounds: new Rect(centerX - 400, centerY - 500, 800, 300),
            effects: [
                { type: TerrainEffectType.STEALTH, value: -0.50 }
            ],
            color: new Color().fromHEX('#228B22'),
            description: '茂密森林，降低怪物发现范围'
        });

        this.addTerrainZone({
            id: 'terrain_forest_east',
            type: TerrainType.FOREST,
            name: '森林(东)',
            bounds: new Rect(centerX + 200, centerY - 200, 300, 400),
            effects: [
                { type: TerrainEffectType.STEALTH, value: -0.50 }
            ],
            color: new Color().fromHEX('#228B22'),
            description: '茂密森林，降低怪物发现范围'
        });

        this.addTerrainZone({
            id: 'terrain_forest_west',
            type: TerrainType.FOREST,
            name: '森林(西)',
            bounds: new Rect(centerX - 500, centerY - 200, 300, 400),
            effects: [
                { type: TerrainEffectType.STEALTH, value: -0.50 }
            ],
            color: new Color().fromHEX('#228B22'),
            description: '茂密森林，降低怪物发现范围'
        });
    }

    // ==================== 地形区域管理 ====================

    /**
     * 添加地形区域
     */
    addTerrainZone(zone: ITerrainZone): void {
        this._terrainZones.set(zone.id, zone);
        console.log(`TerrainSystem: 添加地形区域 ${zone.name} (${zone.type})`);
    }

    /**
     * 移除地形区域
     */
    removeTerrainZone(zoneId: string): boolean {
        return this._terrainZones.delete(zoneId);
    }

    /**
     * 获取地形区域
     */
    getTerrainZone(zoneId: string): ITerrainZone | undefined {
        return this._terrainZones.get(zoneId);
    }

    /**
     * 获取所有地形区域
     */
    getAllTerrainZones(): ITerrainZone[] {
        return Array.from(this._terrainZones.values());
    }

    /**
     * 根据位置获取地形
     */
    getTerrainAtPosition(position: Vec3): ITerrainZone | null {
        for (const zone of this._terrainZones.values()) {
            if (zone.bounds.contains(position.x, position.y)) {
                return zone;
            }
        }
        return null;
    }

    /**
     * 检查位置是否在特定地形中
     */
    isInTerrainType(position: Vec3, terrainType: TerrainType): boolean {
        const terrain = this.getTerrainAtPosition(position);
        return terrain !== null && terrain.type === terrainType;
    }

    // ==================== 实体管理 ====================

    /**
     * 注册实体到地形系统
     */
    registerEntity(entity: ICombatEntity): void {
        const entityId = entity.node.uuid;
        const position = entity.node.position;
        const terrain = this.getTerrainAtPosition(position);

        if (terrain) {
            this._entitiesInTerrain.set(entityId, {
                entity,
                terrainId: terrain.id,
                effectTimers: new Map()
            });

            // 应用进入地形效果
            this.applyEnterTerrainEffects(entity, terrain);
        }
    }

    /**
     * 注销实体
     */
    unregisterEntity(entity: ICombatEntity): void {
        const entityId = entity.node.uuid;
        const entityData = this._entitiesInTerrain.get(entityId);

        if (entityData) {
            const terrain = this._terrainZones.get(entityData.terrainId);
            if (terrain) {
                // 应用离开地形效果
                this.applyLeaveTerrainEffects(entity, terrain);
            }
        }

        this._entitiesInTerrain.delete(entityId);
    }

    /**
     * 更新实体地形状态
     */
    updateEntityTerrain(entity: ICombatEntity): void {
        const entityId = entity.node.uuid;
        const position = entity.node.position;
        const currentTerrain = this.getTerrainAtPosition(position);
        const entityData = this._entitiesInTerrain.get(entityId);

        if (currentTerrain) {
            // 实体在地形中
            if (!entityData) {
                // 首次进入地形
                this._entitiesInTerrain.set(entityId, {
                    entity,
                    terrainId: currentTerrain.id,
                    effectTimers: new Map()
                });
                this.applyEnterTerrainEffects(entity, currentTerrain);
            } else if (entityData.terrainId !== currentTerrain.id) {
                // 切换到新地形
                const oldTerrain = this._terrainZones.get(entityData.terrainId);
                if (oldTerrain) {
                    this.applyLeaveTerrainEffects(entity, oldTerrain);
                }
                entityData.terrainId = currentTerrain.id;
                entityData.effectTimers.clear();
                this.applyEnterTerrainEffects(entity, currentTerrain);
            }
        } else {
            // 实体离开所有地形
            if (entityData) {
                const oldTerrain = this._terrainZones.get(entityData.terrainId);
                if (oldTerrain) {
                    this.applyLeaveTerrainEffects(entity, oldTerrain);
                }
                this._entitiesInTerrain.delete(entityId);
            }
        }
    }

    // ==================== 效果应用 ====================

    /**
     * 应用进入地形效果
     */
    private applyEnterTerrainEffects(entity: ICombatEntity, terrain: ITerrainZone): void {
        const data = entity.getCharacterData();
        console.log(`${data.name} 进入 ${terrain.name}`);

        // 通知UI显示当前地形
        // TODO: 发送事件给HUDController

        for (const effect of terrain.effects) {
            switch (effect.type) {
                case TerrainEffectType.SLOW:
                    this.applySlowEffect(entity, effect.value);
                    break;
                case TerrainEffectType.VISIBILITY:
                    this.applyVisibilityEffect(entity, effect.value);
                    break;
                case TerrainEffectType.STEALTH:
                    this.applyStealthEffect(entity, effect.value);
                    break;
                case TerrainEffectType.SAFE:
                    this.applySafeEffect(entity);
                    break;
            }
        }
    }

    /**
     * 应用离开地形效果
     */
    private applyLeaveTerrainEffects(entity: ICombatEntity, terrain: ITerrainZone): void {
        const data = entity.getCharacterData();
        console.log(`${data.name} 离开 ${terrain.name}`);

        // 移除所有持续效果
        for (const effect of terrain.effects) {
            switch (effect.type) {
                case TerrainEffectType.SLOW:
                    this.removeSlowEffect(entity);
                    break;
                case TerrainEffectType.VISIBILITY:
                    this.removeVisibilityEffect(entity);
                    break;
                case TerrainEffectType.STEALTH:
                    this.removeStealthEffect(entity);
                    break;
                case TerrainEffectType.SAFE:
                    this.removeSafeEffect(entity);
                    break;
            }
        }
    }

    /**
     * 更新地形效果
     */
    private updateTerrainEffects(deltaTime: number): void {
        for (const [entityId, entityData] of this._entitiesInTerrain) {
            const terrain = this._terrainZones.get(entityData.terrainId);
            if (!terrain) continue;

            for (const effect of terrain.effects) {
                if (effect.interval && effect.interval > 0) {
                    // 需要定时触发的效果
                    let timer = entityData.effectTimers.get(effect.type) || 0;
                    timer += deltaTime;

                    if (timer >= effect.interval) {
                        this.triggerEffect(entityData.entity, effect);
                        timer = 0;
                    }

                    entityData.effectTimers.set(effect.type, timer);
                }
            }
        }
    }

    /**
     * 触发效果
     */
    private triggerEffect(entity: ICombatEntity, effect: ITerrainEffect): void {
        switch (effect.type) {
            case TerrainEffectType.DAMAGE:
                this.applyDamageEffect(entity, effect.value);
                break;
            case TerrainEffectType.POISON:
                this.applyPoisonEffect(entity, effect.value);
                break;
        }
    }

    // ==================== 具体效果实现 ====================

    /**
     * 应用减速效果
     */
    private applySlowEffect(entity: ICombatEntity, slowPercent: number): void {
        const player = entity.node.getComponent('Player') as any;
        if (player && player.applySpeedModifier) {
            player.applySpeedModifier(-slowPercent);
        }

        const monster = entity.node.getComponent('Monster') as any;
        if (monster && monster.applySpeedModifier) {
            monster.applySpeedModifier(-slowPercent);
        }
    }

    /**
     * 移除减速效果
     */
    private removeSlowEffect(entity: ICombatEntity): void {
        // 速度恢复在Player/Monster组件中处理
    }

    /**
     * 应用视野效果
     */
    private applyVisibilityEffect(entity: ICombatEntity, visibilityChange: number): void {
        // 通过CameraController调整视野
        const cameraController = CameraController.instance;
        if (cameraController && cameraController.applyVisibilityModifier) {
            cameraController.applyVisibilityModifier(visibilityChange);
        }
    }

    /**
     * 移除视野效果
     */
    private removeVisibilityEffect(entity: ICombatEntity): void {
        const cameraController = CameraController.instance;
        if (cameraController && cameraController.resetVisibility) {
            cameraController.resetVisibility();
        }
    }

    /**
     * 应用隐蔽效果 (怪物仇恨范围)
     */
    private applyStealthEffect(entity: ICombatEntity, rangeReduction: number): void {
        // 效果在Monster的检测逻辑中检查
    }

    /**
     * 移除隐蔽效果
     */
    private removeStealthEffect(entity: ICombatEntity): void {
        // 效果在Monster的检测逻辑中检查
    }

    /**
     * 应用安全区效果
     */
    private applySafeEffect(entity: ICombatEntity): void {
        const player = entity.node.getComponent('Player') as any;
        if (player) {
            player.setInvulnerable(true);
        }
    }

    /**
     * 移除安全区效果
     */
    private removeSafeEffect(entity: ICombatEntity): void {
        const player = entity.node.getComponent('Player') as any;
        if (player) {
            player.setInvulnerable(false);
        }
    }

    /**
     * 应用伤害效果
     */
    private applyDamageEffect(entity: ICombatEntity, damage: number): void {
        entity.takeDamage(damage);
    }

    /**
     * 应用中毒效果
     */
    private applyPoisonEffect(entity: ICombatEntity, damage: number): void {
        entity.takeDamage(damage);
        // TODO: 添加中毒视觉特效
    }

    // ==================== 调试显示 ====================

    /**
     * 绘制调试边界
     */
    private drawDebugBorders(): void {
        if (!this._debugGraphics) return;

        this._debugGraphics.clear();

        for (const zone of this._terrainZones.values()) {
            this._debugGraphics.strokeColor = zone.color;
            this._debugGraphics.rect(
                zone.bounds.x,
                zone.bounds.y,
                zone.bounds.width,
                zone.bounds.height
            );
            this._debugGraphics.stroke();
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 获取地形效果描述
     */
    getTerrainEffectDescription(effect: ITerrainEffect): string {
        switch (effect.type) {
            case TerrainEffectType.SLOW:
                return `移动速度降低 ${(effect.value * 100).toFixed(0)}%`;
            case TerrainEffectType.DAMAGE:
                return `每秒受到 ${effect.value} 点伤害`;
            case TerrainEffectType.POISON:
                return `每秒受到 ${effect.value} 点毒素伤害`;
            case TerrainEffectType.VISIBILITY:
                return `视野范围降低 ${(Math.abs(effect.value) * 100).toFixed(0)}%`;
            case TerrainEffectType.STEALTH:
                return `怪物发现范围降低 ${(Math.abs(effect.value) * 100).toFixed(0)}%`;
            case TerrainEffectType.SAFE:
                return '安全区域 - 无敌状态';
            default:
                return '';
        }
    }

    /**
     * 获取当前位置的地形描述
     */
    getCurrentTerrainDescription(position: Vec3): string {
        const terrain = this.getTerrainAtPosition(position);
        if (!terrain) return '';

        let desc = `当前位置: ${terrain.name}\n`;
        for (const effect of terrain.effects) {
            desc += `- ${this.getTerrainEffectDescription(effect)}\n`;
        }
        return desc;
    }

    /**
     * 检查实体是否安全
     */
    isEntitySafe(entity: ICombatEntity): boolean {
        const position = entity.node.position;
        const terrain = this.getTerrainAtPosition(position);

        if (!terrain) return false;

        return terrain.effects.some(effect => effect.type === TerrainEffectType.SAFE);
    }
}
