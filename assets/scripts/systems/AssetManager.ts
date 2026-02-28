/**
 * 资源管理器 - 统一管理AI生成资源的加载
 * 单例模式
 */

import { _decorator, Component, Node, Sprite, SpriteFrame, resources, UITransform, Size, Prefab, instantiate } from 'cc';
import { GameConfig } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('AssetManager')
export class AssetManager extends Component {
    // 单例实例
    private static _instance: AssetManager | null = null;

    // 资源缓存
    private _spriteFrameCache: Map<string, SpriteFrame> = new Map();
    private _prefabCache: Map<string, Prefab> = new Map();

    // 加载中的资源队列
    private _loadingPromises: Map<string, Promise<any>> = new Map();

    // ==================== 生命周期 ====================

    onLoad() {
        if (AssetManager._instance) {
            console.warn('AssetManager: 已存在实例，销毁重复实例');
            this.node.destroy();
            return;
        }

        AssetManager._instance = this;
        console.log('AssetManager: 初始化完成');
    }

    onDestroy() {
        if (AssetManager._instance === this) {
            AssetManager._instance = null;
        }

        // 清理缓存
        this._spriteFrameCache.clear();
        this._prefabCache.clear();
        this._loadingPromises.clear();
    }

    // ==================== 单例访问 ====================

    static get instance(): AssetManager | null {
        return AssetManager._instance;
    }

    // ==================== 精灵图加载 ====================

    /**
     * 加载精灵图
     * @param path 资源路径（相对于resources）
     * @param useCache 是否使用缓存
     */
    async loadSpriteFrame(path: string, useCache: boolean = true): Promise<SpriteFrame | null> {
        // 检查缓存
        if (useCache && this._spriteFrameCache.has(path)) {
            return this._spriteFrameCache.get(path)!;
        }

        // 检查是否正在加载
        if (this._loadingPromises.has(path)) {
            return this._loadingPromises.get(path) as Promise<SpriteFrame>;
        }

        // 创建加载Promise
        const loadPromise = new Promise<SpriteFrame | null>((resolve) => {
            resources.load(path, SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.warn(`AssetManager: 加载精灵图失败 ${path}`, err.message);
                    resolve(null);
                    return;
                }

                if (spriteFrame && useCache) {
                    this._spriteFrameCache.set(path, spriteFrame);
                }

                resolve(spriteFrame);
            });
        });

        this._loadingPromises.set(path, loadPromise);

        const result = await loadPromise;
        this._loadingPromises.delete(path);

        return result;
    }

    /**
     * 批量加载精灵图
     */
    async loadSpriteFrames(paths: string[]): Promise<Map<string, SpriteFrame | null>> {
        const results = new Map<string, SpriteFrame | null>();
        const promises = paths.map(async (path) => {
            const spriteFrame = await this.loadSpriteFrame(path);
            results.set(path, spriteFrame);
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * 预加载所有怪物精灵图
     */
    async preloadMonsterSprites(): Promise<void> {
        const paths = [
            ...Object.values(GameConfig.MONSTER_TEXTURE_MAP),
            ...Object.values(GameConfig.ELITE_TEXTURE_MAP),
        ];

        console.log(`AssetManager: 开始预加载 ${paths.length} 个怪物精灵图`);
        await this.loadSpriteFrames(paths);
        console.log('AssetManager: 怪物精灵图预加载完成');
    }

    /**
     * 预加载所有角色精灵图
     */
    async preloadCharacterSprites(): Promise<void> {
        const paths = Object.values(GameConfig.TEXTURE_PATHS.CHARACTERS);

        console.log(`AssetManager: 开始预加载 ${paths.length} 个角色精灵图`);
        await this.loadSpriteFrames(paths);
        console.log('AssetManager: 角色精灵图预加载完成');
    }

    /**
     * 预加载所有武器图标
     */
    async preloadWeaponIcons(): Promise<void> {
        const paths = Object.values(GameConfig.TEXTURE_PATHS.WEAPONS);

        console.log(`AssetManager: 开始预加载 ${paths.length} 个武器图标`);
        await this.loadSpriteFrames(paths);
        console.log('AssetManager: 武器图标预加载完成');
    }

    /**
     * 预加载所有UI资源
     */
    async preloadUIAssets(): Promise<void> {
        const paths = Object.values(GameConfig.TEXTURE_PATHS.UI);

        console.log(`AssetManager: 开始预加载 ${paths.length} 个UI资源`);
        await this.loadSpriteFrames(paths);
        console.log('AssetManager: UI资源预加载完成');
    }

    // ==================== 精灵图设置 ====================

    /**
     * 为Sprite组件设置精灵图
     * @param sprite Sprite组件
     * @param path 资源路径
     */
    async setSpriteFrame(sprite: Sprite | null, path: string): Promise<boolean> {
        if (!sprite) {
            console.warn('AssetManager: Sprite组件为空');
            return false;
        }

        const spriteFrame = await this.loadSpriteFrame(path);
        if (spriteFrame) {
            sprite.spriteFrame = spriteFrame;
            return true;
        }

        return false;
    }

    // ==================== 缓存管理 ====================

    /**
     * 获取缓存的精灵图
     */
    getCachedSpriteFrame(path: string): SpriteFrame | undefined {
        return this._spriteFrameCache.get(path);
    }

    /**
     * 清除指定缓存
     */
    clearCache(path?: string): void {
        if (path) {
            this._spriteFrameCache.delete(path);
            this._prefabCache.delete(path);
        } else {
            this._spriteFrameCache.clear();
            this._prefabCache.clear();
        }
    }

    /**
     * 获取缓存统计
     */
    getCacheStats(): { spriteFrames: number; prefabs: number } {
        return {
            spriteFrames: this._spriteFrameCache.size,
            prefabs: this._prefabCache.size,
        };
    }

    // ==================== 便捷方法 ====================

    /**
     * 获取怪物精灵图路径
     */
    getMonsterTexturePath(monsterType: string, isElite: boolean = false): string | null {
        if (isElite) {
            return GameConfig.ELITE_TEXTURE_MAP[monsterType] || null;
        }
        return GameConfig.MONSTER_TEXTURE_MAP[monsterType] || null;
    }

    /**
     * 获取玩家精灵图路径
     */
    getPlayerTexturePath(playerClass: string): string | null {
        const paths: { [key: string]: string } = {
            'knight': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_KNIGHT,
            'mage': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_MAGE,
            'paladin': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_PALADIN,
            'ranger': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_RANGER,
            'rogue': GameConfig.TEXTURE_PATHS.CHARACTERS.PLAYER_ROGUE,
        };
        return paths[playerClass] || null;
    }

    /**
     * 获取武器图标路径（根据稀有度）
     */
    getWeaponIconPath(rarity: string): string | null {
        const paths: { [key: string]: string } = {
            'common': GameConfig.TEXTURE_PATHS.WEAPONS.SWORD_COMMON,
            'rare': GameConfig.TEXTURE_PATHS.WEAPONS.SWORD_RARE,
            'legendary': GameConfig.TEXTURE_PATHS.WEAPONS.SWORD_LEGENDARY,
            'mythical': GameConfig.TEXTURE_PATHS.WEAPONS.SWORD_MYTHICAL,
        };
        return paths[rarity] || paths['common'];
    }
}
