/**
 * 修复场景和预制体中的脚本引用 - 将类名改为UUID
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');

// 已知的脚本UUID映射（完整UUID格式）
const SCRIPT_UUIDS = {
    // entities
    'Player': '6fed1264-499b-44de-9cff-08d246e7e5a5',
    'Monster': '', // 需要查找
    'Castle': '86d82ddf-0a1f-4066-b38b-c88e81b8b123',
    'Tower': '',
    'Item': '',
    // core
    'GameManager': '1c7168ee-ddea-4759-9c2a-a2a3862d4e8e',
    'GameSceneInitializer': 'f7c0209a-e254-4ed8-80cc-6b96f4b4dff7',
    // systems
    'AssetManager': '',
    'WaveSystem': '4be210eb-45a5-4615-897d-85cc33561be6',
    'TimeSystem': '3c0ca90b-ed0a-47db-8021-584243949069',
    'MonsterManager': '1cc456bc-7e16-442b-a16c-c5ac97a3e029',
    'TowerManager': '5da2cc35-fb7f-4d0f-bbf9-3060da2465a5',
    'SceneAutoConfig': '937425d3-eddb-4227-a18d-20c61f2f4d46',
    'HUDController': '6e4802f1-f669-49ac-a569-2ca51d4a52da',
    // ui
    'CameraController': 'a3b80651-43fe-4ebc-8fd8-b17e68b55afc',
};

// 查找所有 .ts.meta 文件获取UUID
function findAllScriptMetaFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'resources') {
            findAllScriptMetaFiles(fullPath, files);
        } else if (item.endsWith('.ts.meta')) {
            files.push(fullPath);
        }
    }
    return files;
}

// 读取所有脚本的UUID
function loadScriptUUIDs() {
    const metaFiles = findAllScriptMetaFiles(path.join(ASSETS_DIR, 'scripts'));
    const uuids = {};

    for (const file of metaFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const meta = JSON.parse(content);
            if (meta.uuid) {
                const scriptName = path.basename(file, '.ts.meta');
                uuids[scriptName] = meta.uuid;
                console.log(`找到脚本: ${scriptName} -> ${meta.uuid}`);
            }
        } catch (e) {
            console.warn(`读取失败: ${file}`, e.message);
        }
    }

    return uuids;
}

// 修复文件中的脚本引用
function fixScriptReferences(filePath, scriptUUIDs) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 查找所有 "__type__": "ClassName" 并替换为UUID
    for (const [className, uuid] of Object.entries(scriptUUIDs)) {
        // 匹配 "__type__": "ClassName" (不是cc.开头的)
        const pattern = new RegExp(`"__type__": "${className}"`, 'g');
        if (pattern.test(content)) {
            content = content.replace(pattern, `"__type__": "${uuid}"`);
            modified = true;
            console.log(`  修复: ${className} -> ${uuid}`);
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

// 主函数
function main() {
    console.log('========================================');
    console.log('修复脚本UUID引用');
    console.log('========================================\n');

    // 加载所有脚本UUID
    const scriptUUIDs = loadScriptUUIDs();
    console.log(`\n找到 ${Object.keys(scriptUUIDs).length} 个脚本\n`);

    // 修复场景文件
    const sceneFile = path.join(ASSETS_DIR, 'scenes/GameScene.scene');
    if (fs.existsSync(sceneFile)) {
        console.log('修复 GameScene.scene...');
        if (fixScriptReferences(sceneFile, scriptUUIDs)) {
            console.log('✓ GameScene.scene 已修复\n');
        } else {
            console.log('- GameScene.scene 无需修复\n');
        }
    }

    // 修复所有预制体
    const prefabsDir = path.join(ASSETS_DIR, 'resources/prefabs');
    if (fs.existsSync(prefabsDir)) {
        const prefabFiles = fs.readdirSync(prefabsDir)
            .filter(f => f.endsWith('.prefab'))
            .map(f => path.join(prefabsDir, f));

        console.log(`检查 ${prefabFiles.length} 个预制体...\n`);
        for (const file of prefabFiles) {
            const name = path.basename(file);
            if (fixScriptReferences(file, scriptUUIDs)) {
                console.log(`✓ ${name} 已修复`);
            }
        }
    }

    console.log('\n========================================');
    console.log('修复完成！');
    console.log('========================================');
    console.log('\n请在 Cocos Creator 中按 F5 刷新资源');
}

main();
