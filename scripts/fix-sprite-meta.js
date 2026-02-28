/**
 * 修复所有纹理 .meta 文件，添加 spriteFrame 子元数据
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/resources/textures');

// 递归获取所有 .png.meta 文件
function getAllMetaFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            getAllMetaFiles(fullPath, files);
        } else if (item.endsWith('.png.meta')) {
            files.push(fullPath);
        }
    }

    return files;
}

// 修复单个 .meta 文件
function fixMetaFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const meta = JSON.parse(content);

    // 确保 type 是 sprite
    if (meta.userData) {
        meta.userData.type = 'sprite';
    }

    // 获取主 UUID
    const mainUuid = meta.uuid;
    if (!mainUuid) {
        console.warn(`警告: ${filePath} 没有 UUID`);
        return false;
    }

    // 获取文件名（不含扩展名）
    const baseName = path.basename(filePath, '.png.meta');

    // 确保 subMetas 存在
    if (!meta.subMetas) {
        meta.subMetas = {};
    }

    // 添加 texture 子元数据（如果不存在）
    if (!meta.subMetas['6c48a']) {
        meta.subMetas['6c48a'] = {
            importer: 'texture',
            uuid: `${mainUuid}@6c48a`,
            displayName: baseName,
            id: '6c48a',
            name: 'texture',
            userData: {
                wrapModeS: 'repeat',
                wrapModeT: 'repeat',
                minfilter: 'linear',
                magfilter: 'linear',
                mipfilter: 'none',
                anisotropy: 0,
                isUuid: true,
                imageUuidOrDatabaseUri: mainUuid,
                visible: false
            },
            ver: '1.0.22',
            imported: true,
            files: ['.json'],
            subMetas: {}
        };
    }

    // 添加 spriteFrame 子元数据（如果不存在）
    if (!meta.subMetas['f9941']) {
        meta.subMetas['f9941'] = {
            importer: 'sprite-frame',
            uuid: `${mainUuid}@f9941`,
            displayName: baseName,
            id: 'f9941',
            name: 'spriteFrame',
            userData: {
                trimType: 'auto',
                trimThreshold: 1,
                rotated: false,
                offsetX: 0,
                offsetY: 0,
                trimX: 0,
                trimY: 0,
                width: 512,
                height: 512,
                rawWidth: 512,
                rawHeight: 512,
                borderTop: 0,
                borderBottom: 0,
                borderLeft: 0,
                borderRight: 0,
                packable: true,
                pixelsToUnit: 100,
                pivotX: 0.5,
                pivotY: 0.5,
                meshType: 0,
                vertices: {
                    rawPosition: [],
                    indexes: [],
                    uv: [],
                    nuv: [],
                    minPos: [],
                    maxPos: []
                },
                isUuid: true,
                imageUuidOrDatabaseUri: `${mainUuid}@6c48a`,
                atlasUuid: ''
            },
            ver: '1.0.12',
            imported: true,
            files: ['.json'],
            subMetas: {}
        };
    }

    // 更新 redirect
    if (meta.userData) {
        meta.userData.redirect = `${mainUuid}@f9941`;
    }

    // 写回文件
    fs.writeFileSync(filePath, JSON.stringify(meta, null, 2), 'utf8');
    console.log(`✓ 已修复: ${path.relative(ASSETS_DIR, filePath)}`);
    return true;
}

// 主函数
function main() {
    console.log('========================================');
    console.log('修复纹理 .meta 文件');
    console.log('========================================\n');

    const metaFiles = getAllMetaFiles(ASSETS_DIR);
    console.log(`找到 ${metaFiles.length} 个 .meta 文件\n`);

    let fixed = 0;
    for (const file of metaFiles) {
        if (fixMetaFile(file)) {
            fixed++;
        }
    }

    console.log(`\n========================================`);
    console.log(`修复完成: ${fixed}/${metaFiles.length}`);
    console.log('========================================');
    console.log('\n下一步:');
    console.log('1. 在 Cocos Creator 中按 F5 刷新资源');
    console.log('2. 打开 Player.prefab');
    console.log('3. 检查 Sprite 组件的 Sprite Frame 是否已显示 player_knight');
}

main();
