/**
 * 场景自动配置脚本
 * 在游戏启动时自动配置所有组件引用，无需手动设置
 */

import { _decorator, Component, Node } from 'cc';
import { WaveSystem } from '../systems/WaveSystem';
import { MonsterManager } from '../systems/MonsterManager';
import { HUDController } from '../ui/HUDController';
import { Player } from '../entities/Player';
import { Castle } from '../entities/Castle';

const { ccclass, property } = _decorator;

@ccclass('SceneAutoConfig')
export class SceneAutoConfig extends Component {
    onLoad() {
        this.scheduleOnce(() => {
            this.configureWaveSystem();
            this.configureMonsterManager();
            this.configureHUDController();
            this.configureSpawnPoints();
            console.log('SceneAutoConfig: 自动配置完成');
        }, 0);
    }

    /**
     * 配置 WaveSystem 的引用
     */
    private configureWaveSystem(): void {
        const waveSystemNode = this.node.scene.getChildByName('WaveSystem');
        if (!waveSystemNode) {
            console.warn('SceneAutoConfig: WaveSystem节点未找到');
            return;
        }

        const waveSystem = waveSystemNode.getComponent(WaveSystem);
        if (!waveSystem) return;

        // 设置 monsterManagerNode
        const monsterManagerNode = this.node.scene.getChildByName('MonsterManager');
        if (monsterManagerNode) {
            (waveSystem as any).monsterManagerNode = monsterManagerNode;
            console.log('SceneAutoConfig: WaveSystem.monsterManagerNode 已设置');
        }

        // 设置 monsterSpawnPointsNode
        const worldContainer = this.node.scene.getChildByName('WorldContainer');
        if (worldContainer) {
            const spawnPointsNode = worldContainer.getChildByName('MonsterSpawnPoints');
            if (spawnPointsNode) {
                (waveSystem as any).monsterSpawnPointsNode = spawnPointsNode;
                console.log('SceneAutoConfig: WaveSystem.monsterSpawnPointsNode 已设置');
            }
        }
    }

    /**
     * 配置 MonsterManager (预留)
     */
    private configureMonsterManager(): void {
        // MonsterManager 目前需要编辑器配置的属性较少
        // 如果有需要可以在这里添加
    }

    /**
     * 配置 HUDController 的引用
     */
    private configureHUDController(): void {
        const hudNode = this.node.scene.getChildByName('HUDController');
        if (!hudNode) {
            console.warn('SceneAutoConfig: HUDController节点未找到');
            return;
        }

        const hud = hudNode.getComponent(HUDController);
        if (!hud) return;

        // HUDController 会在 findReferences() 中自动查找引用
        // 这里不需要额外配置
        console.log('SceneAutoConfig: HUDController 使用自动查找');
    }

    /**
     * 配置 SpawnPoints 位置
     */
    private configureSpawnPoints(): void {
        const worldContainer = this.node.scene.getChildByName('WorldContainer');
        if (!worldContainer) return;

        const spawnPointsNode = worldContainer.getChildByName('MonsterSpawnPoints');
        if (!spawnPointsNode) return;

        const positions = [
            { x: 500, y: 500, name: 'SpawnPoint_1' },
            { x: 2500, y: 500, name: 'SpawnPoint_2' },
            { x: 500, y: 2500, name: 'SpawnPoint_3' },
            { x: 2500, y: 2500, name: 'SpawnPoint_4' }
        ];

        for (const pos of positions) {
            let spawnPoint = spawnPointsNode.getChildByName(pos.name);
            if (spawnPoint) {
                spawnPoint.setPosition(pos.x, pos.y, 0);
            }
        }

        console.log('SceneAutoConfig: SpawnPoints 位置已设置');
    }
}
