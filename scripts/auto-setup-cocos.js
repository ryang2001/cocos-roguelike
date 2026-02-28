/**
 * Cocos Creator 场景自动设置脚本
 * 自动修改.prefab和.scene文件，添加Sprite组件和绑定资源
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');

// 生成UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 读取JSON文件
function readJSON(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error(`读取失败: ${filePath}`, e.message);
        return null;
    }
}

// 写入JSON文件
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ 已更新: ${path.basename(filePath)}`);
        return true;
    } catch (e) {
        console.error(`写入失败: ${filePath}`, e.message);
        return false;
    }
}

// ==================== 修改Player Prefab ====================
function setupPlayerPrefab() {
    const prefabPath = path.join(ASSETS_DIR, 'resources/prefabs/Player.prefab');
    const prefab = readJSON(prefabPath);
    if (!prefab) return false;

    console.log('\n正在设置 Player.prefab...');

    // 查找根节点 (通常是第2个对象)
    const rootNode = prefab.find(obj => obj.__type__ === 'cc.Node' && obj._name === 'Player');
    if (!rootNode) {
        console.error('未找到Player根节点');
        return false;
    }

    // 检查是否已有Sprite组件
    const existingSprite = prefab.find(obj =>
        obj.__type__ === 'cc.Sprite' &&
        obj.node &&
        obj.node.__id__ === prefab.indexOf(rootNode)
    );

    if (existingSprite) {
        console.log('  Sprite组件已存在，跳过');
        return true;
    }

    // 创建新的Sprite组件
    const nodeIndex = prefab.indexOf(rootNode);
    const spriteUUID = generateUUID();
    const compInfoUUID = generateUUID();

    const newSprite = {
        __type__: "cc.Sprite",
        _name: "",
        _objFlags: 0,
        __editorExtras__: {},
        node: { __id__: nodeIndex },
        _enabled: true,
        __prefab: { __id__: prefab.length + 1 },
        _customMaterial: null,
        _srcBlendFactor: 2,
        _dstBlendFactor: 4,
        _color: { __type__: "cc.Color", r: 255, g: 255, b: 255, a: 255 },
        _spriteFrame: {
            __uuid__: "a3d2f8b1-c4e5-6f7g-8h9i-0j1k2l3m4n5o", // 临时UUID，实际需要匹配meta文件
            __expectedType__: "cc.SpriteFrame"
        },
        _type: 0,
        _fillType: 0,
        _sizeMode: 1, // RAW模式
        _fillCenter: { __type__: "cc.Vec2", x: 0, y: 0 },
        _fillStart: 0,
        _fillRange: 0,
        _isTrimmedMode: true,
        _useGrayscale: false,
        _atlas: null,
        _id: ""
    };

    const newCompInfo = {
        __type__: "cc.CompPrefabInfo",
        fileId: compInfoUUID
    };

    // 添加到prefab
    prefab.push(newSprite);
    prefab.push(newCompInfo);

    // 更新节点的_components数组
    if (!rootNode._components) rootNode._components = [];
    rootNode._components.push({ __id__: prefab.length - 2 });

    return writeJSON(prefabPath, prefab);
}

// ==================== 修改Monster Prefab ====================
function setupMonsterPrefab() {
    const prefabPath = path.join(ASSETS_DIR, 'resources/prefabs/Monster.prefab');
    const prefab = readJSON(prefabPath);
    if (!prefab) return false;

    console.log('\n正在设置 Monster.prefab...');

    const rootNode = prefab.find(obj => obj.__type__ === 'cc.Node' && obj._name === 'Monster');
    if (!rootNode) {
        console.error('未找到Monster根节点');
        return false;
    }

    const existingSprite = prefab.find(obj =>
        obj.__type__ === 'cc.Sprite' &&
        obj.node &&
        obj.node.__id__ === prefab.indexOf(rootNode)
    );

    if (existingSprite) {
        console.log('  Sprite组件已存在，跳过');
        return true;
    }

    const nodeIndex = prefab.indexOf(rootNode);
    const compInfoUUID = generateUUID();

    const newSprite = {
        __type__: "cc.Sprite",
        _name: "",
        _objFlags: 0,
        __editorExtras__: {},
        node: { __id__: nodeIndex },
        _enabled: true,
        __prefab: { __id__: prefab.length + 1 },
        _customMaterial: null,
        _srcBlendFactor: 2,
        _dstBlendFactor: 4,
        _color: { __type__: "cc.Color", r: 255, g: 255, b: 255, a: 255 },
        _spriteFrame: null, // 怪物由代码动态加载
        _type: 0,
        _fillType: 0,
        _sizeMode: 1,
        _fillCenter: { __type__: "cc.Vec2", x: 0, y: 0 },
        _fillStart: 0,
        _fillRange: 0,
        _isTrimmedMode: true,
        _useGrayscale: false,
        _atlas: null,
        _id: ""
    };

    const newCompInfo = {
        __type__: "cc.CompPrefabInfo",
        fileId: compInfoUUID
    };

    prefab.push(newSprite);
    prefab.push(newCompInfo);

    if (!rootNode._components) rootNode._components = [];
    rootNode._components.push({ __id__: prefab.length - 2 });

    return writeJSON(prefabPath, prefab);
}

// ==================== 修改GameScene.scene ====================
function setupGameScene() {
    const scenePath = path.join(ASSETS_DIR, 'scenes/GameScene.scene');
    const scene = readJSON(scenePath);
    if (!scene) return false;

    console.log('\n正在设置 GameScene.scene...');

    // 查找或创建Canvas
    let canvas = scene.find(obj => obj.__type__ === 'cc.Node' && obj._name === 'Canvas');

    if (!canvas) {
        console.log('  创建Canvas节点...');
        const canvasUUID = generateUUID();
        const canvasCompUUID = generateUUID();
        const widgetUUID = generateUUID();

        canvas = {
            __type__: "cc.Node",
            _name: "Canvas",
            _objFlags: 0,
            __editorExtras__: {},
            _parent: { __id__: 1 }, // Scene
            _children: [],
            _active: true,
            _components: [
                { __id__: scene.length + 1 },
                { __id__: scene.length + 2 }
            ],
            _prefab: null,
            _lpos: { __type__: "cc.Vec3", x: 360, y: 640, z: 0 },
            _lrot: { __type__: "cc.Quat", x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: "cc.Vec3", x: 1, y: 1, z: 1 },
            _mobility: 0,
            _layer: 33554432,
            _euler: { __type__: "cc.Vec3", x: 0, y: 0, z: 0 },
            _id: canvasUUID
        };

        const canvasComp = {
            __type__: "cc.Canvas",
            _name: "",
            _objFlags: 0,
            __editorExtras__: {},
            node: { __id__: scene.length },
            _enabled: true,
            __prefab: null,
            _cameraComponent: null,
            _alignCanvasWithScreen: true,
            _fitWidth: true,
            _fitHeight: true,
            _designResolution: { __type__: "cc.Size", width: 720, height: 1280 }
        };

        const widget = {
            __type__: "cc.Widget",
            _name: "",
            _objFlags: 0,
            __editorExtras__: {},
            node: { __id__: scene.length },
            _enabled: true,
            __prefab: null,
            _alignMode: 2,
            _target: null,
            _left: 0,
            _right: 0,
            _top: 0,
            _bottom: 0,
            _horizontalCenter: 0,
            _verticalCenter: 0,
            _isAbsLeft: true,
            _isAbsRight: true,
            _isAbsTop: true,
            _isAbsBottom: true,
            _isAbsHorizontalCenter: true,
            _isAbsVerticalCenter: true,
            _originalWidth: 0,
            _originalHeight: 0,
            _alignFlags: 45
        };

        scene.push(canvas);
        scene.push(canvasComp);
        scene.push(widget);

        // 更新Scene的_children
        const sceneRoot = scene.find(obj => obj.__type__ === 'cc.Scene');
        if (sceneRoot && sceneRoot._children) {
            sceneRoot._children.push({ __id__: scene.length - 3 });
        }
    } else {
        console.log('  Canvas已存在');
    }

    // 检查是否已有GameSceneInitializer
    const hasInitializer = scene.find(obj =>
        obj.__type__ === 'GameSceneInitializer' &&
        obj.node &&
        obj.node.__id__ === scene.indexOf(canvas)
    );

    if (!hasInitializer) {
        console.log('  添加GameSceneInitializer组件...');
        const canvasIndex = scene.indexOf(canvas);

        const initializer = {
            __type__: "GameSceneInitializer",
            _name: "",
            _objFlags: 0,
            __editorExtras__: {},
            node: { __id__: canvasIndex },
            _enabled: true,
            __prefab: null,
            playerPrefab: null,
            monsterPrefab: null,
            towerPrefab: null,
            castlePrefab: null
        };

        scene.push(initializer);
        canvas._components.push({ __id__: scene.length - 1 });
    } else {
        console.log('  GameSceneInitializer已存在');
    }

    return writeJSON(scenePath, scene);
}

// ==================== 设置资源为SpriteFrame类型 ====================
function setupTextureTypes() {
    console.log('\n正在设置资源类型为SpriteFrame...');

    const texturesDir = path.join(ASSETS_DIR, 'resources/textures');

    function processDir(dir) {
        const items = fs.readdirSync(dir);
        let count = 0;

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                count += processDir(fullPath);
            } else if (item.endsWith('.png.meta')) {
                const meta = readJSON(fullPath);
                if (meta && meta.type !== 'sprite') {
                    meta.type = 'sprite';
                    writeJSON(fullPath, meta);
                    count++;
                }
            }
        }

        return count;
    }

    const updated = processDir(texturesDir);
    console.log(`  更新了 ${updated} 个.meta文件`);
    return true;
}

// ==================== 主函数 ====================
function main() {
    console.log('========================================');
    console.log('Cocos Creator 自动设置工具');
    console.log('========================================');

    // 检查目录存在
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error('错误: 找不到assets目录');
        process.exit(1);
    }

    // 执行设置
    setupTextureTypes();
    setupPlayerPrefab();
    setupMonsterPrefab();
    setupGameScene();

    console.log('\n========================================');
    console.log('自动设置完成!');
    console.log('========================================');
    console.log('\n注意:');
    console.log('1. 请在Cocos Creator中刷新资源(F5)');
    console.log('2. 检查GameSceneInitializer的Prefab绑定');
    console.log('3. 手动设置Player.prefab的默认Sprite Frame');
}

main();
