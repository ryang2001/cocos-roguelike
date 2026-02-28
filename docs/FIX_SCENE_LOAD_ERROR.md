# 🔧 场景加载错误解决方案

## 📋 错误信息

```
[PreviewInEditor] loadScene: Can not load the scene 'GameScene' because it was not in the build settings before playing.
```

## 🎯 问题原因

**原因:** GameScene场景没有添加到构建设置中,无法在预览时加载。

**解决:** 将所有场景添加到构建设置。

---

## 🔧 解决步骤

### 方法1: 通过菜单添加场景

#### 步骤1: 打开构建设置
1. 点击菜单"项目" → "项目设置"
2. 选择"构建发布"标签
3. 找到"参与构建场景"部分

#### 步骤2: 添加场景
1. 点击"添加场景"按钮
2. 选择以下场景:
   - `assets/scenes/BootScene.scene`
   - `assets/scenes/MainMenuScene.scene`
   - `assets/scenes/GameScene.scene`
   - `assets/scenes/GameOverScene.scene`

#### 步骤3: 设置启动场景
1. 将`BootScene`设置为第一个场景(索引0)
2. 或者将`MainMenuScene`设置为第一个场景

#### 步骤4: 保存设置
1. 点击"应用"按钮
2. 关闭项目设置窗口

---

### 方法2: 通过场景列表添加

#### 步骤1: 打开场景列表
1. 在"资源管理器"中找到`assets/scenes`目录
2. 查看所有场景文件

#### 步骤2: 添加到构建
1. 右键点击场景文件(如`GameScene.scene`)
2. 选择"在构建设置中包含"
3. 对所有场景重复此操作

---

### 方法3: 修改project.json(高级)

#### 步骤1: 找到project.json
位置: `cocos-roguelike/settings/project.json`

#### 步骤2: 添加场景配置
```json
{
  "engine": "cocos-creator-js",
  "packages": "packages",
  "version": "3.8.0",
  "id": "roguelike-tower-defense",
  "name": "继续下一关 - Roguelike塔防",
  "title": "继续下一关",
  "creator": {
    "version": "3.8.0"
  },
  "scenes": [
    {
      "url": "db://assets/scenes/BootScene.scene",
      "uuid": "场景UUID"
    },
    {
      "url": "db://assets/scenes/MainMenuScene.scene",
      "uuid": "场景UUID"
    },
    {
      "url": "db://assets/scenes/GameScene.scene",
      "uuid": "场景UUID"
    },
    {
      "url": "db://assets/scenes/GameOverScene.scene",
      "uuid": "场景UUID"
    }
  ]
}
```

---

## 🎬 创建缺失的场景

如果GameScene还不存在,需要先创建:

### 创建GameScene

#### 步骤1: 创建场景文件
1. 在"资源管理器"中右键点击`assets/scenes`
2. 选择"创建" → "Scene"
3. 命名为`GameScene`
4. 双击打开场景

#### 步骤2: 创建基础结构
1. 创建Canvas节点
2. 创建WorldRoot节点(空节点)
3. 创建Player节点
4. 创建HUD节点

#### 步骤3: 添加游戏元素
```
GameScene
├── Canvas (UI画布)
│   ├── HUD (游戏UI)
│   │   ├── HPBar (生命条)
│   │   ├── DayIndicator (天数指示)
│   │   └── MiniMap (小地图)
│   └── PauseButton (暂停按钮)
├── WorldRoot (世界根节点)
│   ├── Player (玩家)
│   ├── Monsters (怪物容器)
│   ├── Towers (炮台容器)
│   └── Castle (城堡)
└── GameManager (游戏管理器)
```

#### 步骤4: 挂载脚本
1. 选择Player节点
2. 添加Player脚本组件
3. 选择GameManager节点
4. 添加GameManager脚本组件

#### 步骤5: 保存场景
按`Ctrl + S`保存

---

## 🎮 创建GameOverScene

### 步骤1: 创建场景
1. 右键点击`assets/scenes`
2. 选择"创建" → "Scene"
3. 命名为`GameOverScene`
4. 双击打开

### 步骤2: 创建UI
```
GameOverScene
├── Canvas
│   ├── Background (半透明背景)
│   ├── ResultPanel (结果面板)
│   │   ├── Title (胜利/失败)
│   │   ├── Stats (统计数据)
│   │   ├── RetryButton (重试按钮)
│   │   └── MenuButton (返回菜单)
```

### 步骤3: 创建GameOverController脚本

```typescript
import { _decorator, Component, Node, Label, Button, director } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameOverController')
export class GameOverController extends Component {
    
    @property(Label)
    titleLabel: Label = null;

    @property(Node)
    retryButton: Node = null;

    @property(Node)
    menuButton: Node = null;

    private _isVictory: boolean = false;

    onLoad() {
        // 获取游戏结果
        // TODO: 从GameManager获取结果
        this._isVictory = false;
        
        this.initUI();
        this.registerEvents();
    }

    private initUI(): void {
        if (this.titleLabel) {
            this.titleLabel.string = this._isVictory ? '胜利!' : '游戏结束';
        }
    }

    private registerEvents(): void {
        if (this.retryButton) {
            this.retryButton.on(Button.EventType.CLICK, this.onRetryClick, this);
        }
        
        if (this.menuButton) {
            this.menuButton.on(Button.EventType.CLICK, this.onMenuClick, this);
        }
    }

    private onRetryClick(): void {
        console.log('重试游戏');
        director.loadScene('GameScene');
    }

    private onMenuClick(): void {
        console.log('返回主菜单');
        director.loadScene('MainMenuScene');
    }

    onDestroy() {
        if (this.retryButton) {
            this.retryButton.off(Button.EventType.CLICK, this.onRetryClick, this);
        }
        
        if (this.menuButton) {
            this.menuButton.off(Button.EventType.CLICK, this.onMenuClick, this);
        }
    }
}
```

---

## ✅ 验证场景配置

### 检查场景是否在构建中

#### 方法1: 查看构建设置
1. 打开"项目" → "项目设置"
2. 选择"构建发布"
3. 查看"参与构建场景"列表
4. 确保所有场景都在列表中

#### 方法2: 运行预览
1. 点击"播放"按钮
2. 查看控制台
3. 如果没有错误,说明配置正确

---

## 🔄 完整流程

### 1. 创建所有场景
- [x] BootScene
- [x] MainMenuScene
- [ ] GameScene (需要创建)
- [ ] GameOverScene (需要创建)

### 2. 添加到构建设置
- [ ] 打开项目设置
- [ ] 添加所有场景
- [ ] 设置启动场景

### 3. 测试场景切换
- [ ] 运行BootScene
- [ ] 自动进入MainMenuScene
- [ ] 点击按钮进入GameScene
- [ ] 游戏结束进入GameOverScene

---

## 🐛 常见问题

### Q1: 找不到"项目设置"菜单?
**A:** 
- 检查Cocos Creator版本
- 菜单可能在"文件"或"编辑"下
- 或者使用快捷键`Ctrl + Shift + B`

### Q2: 场景UUID在哪里?
**A:** 
- 选择场景文件
- 在"属性检查器"中查看UUID
- 或者在场景文件的meta文件中查看

### Q3: 添加场景后还是报错?
**A:** 
- 重启Cocos Creator
- 清理项目: 菜单"开发者" → "清理项目"
- 重新添加场景

### Q4: 预览时场景列表为空?
**A:** 
- 检查场景文件是否在正确位置
- 检查场景文件扩展名是否为`.scene`
- 刷新编辑器

---

## 📝 快速检查清单

```
✅ BootScene.scene 存在
✅ MainMenuScene.scene 存在
✅ GameScene.scene 存在
✅ GameOverScene.scene 存在
✅ 所有场景已添加到构建设置
✅ BootScene设置为启动场景(索引0)
✅ 场景名称拼写正确
✅ 场景文件没有损坏
```

---

## 🚀 下一步

### 1. 创建GameScene
- 添加游戏元素
- 挂载游戏脚本
- 配置游戏参数

### 2. 创建GameOverScene
- 显示游戏结果
- 添加重试和返回按钮

### 3. 测试完整流程
- 启动 → 主菜单 → 游戏 → 结束

---

**按照这个指南操作,场景加载错误应该可以解决!** 🎯
