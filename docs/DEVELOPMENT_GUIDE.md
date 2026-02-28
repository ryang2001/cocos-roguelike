# 🎮 Cocos Creator 开发对接指南

## 📋 目录

1. [环境准备](#环境准备)
2. [项目导入](#项目导入)
3. [场景创建](#场景创建)
4. [预制体创建](#预制体创建)
5. [脚本挂载](#脚本挂载)
6. [资源导入](#资源导入)
7. [抖音小游戏发布](#抖音小游戏发布)

---

## 🔧 环境准备

### 1. 下载Cocos Creator

**下载地址:**
- 官网: https://www.cocos.com/creator-download
- 版本: Cocos Creator 3.8.0 或更高版本

**安装步骤:**
1. 下载对应系统的安装包
2. 运行安装程序
3. 选择安装路径
4. 完成安装

### 2. 注册Cocos账号

1. 访问 https://account.cocos.com/
2. 点击"注册"
3. 填写邮箱和密码
4. 验证邮箱

### 3. 启动Cocos Creator

1. 打开Cocos Creator
2. 登录Cocos账号
3. 选择"使用Cocos Creator"

---

## 📂 项目导入

### 1. 打开项目

**方法1: 从欢迎页打开**
1. 启动Cocos Creator
2. 点击"打开其他项目"
3. 选择路径: `f:\project\继续下一关\js_version\cocos-roguelike`
4. 点击"选择文件夹"

**方法2: 从菜单打开**
1. 启动Cocos Creator
2. 点击菜单"文件" → "打开项目"
3. 选择`cocos-roguelike`目录
4. 点击"选择文件夹"

### 2. 等待项目加载

- 首次打开需要编译TypeScript
- 等待进度条完成
- 项目加载完成后会显示编辑器界面

### 3. 检查项目结构

在"资源管理器"中查看:
```
assets/
├── scripts/
│   ├── core/
│   │   └── GameManager.ts ✅
│   ├── entities/
│   │   └── Player.ts ✅
│   └── config/
│       └── GameConfig.ts ✅
├── resources/
├── scenes/
└── materials/
```

---

## 🎬 场景创建

### 1. 创建启动场景 (BootScene)

**步骤:**
1. 在"资源管理器"中右键点击`assets/scenes`
2. 选择"创建" → "Scene"
3. 命名为`BootScene`
4. 双击打开场景

**场景设置:**
1. 创建Canvas节点
   - 右键点击"层级管理器"空白处
   - 选择"创建" → "UI组件" → "Canvas"
   
2. 创建背景
   - 右键点击Canvas
   - 选择"创建" → "2D对象" → "Sprite"
   - 命名为"Background"
   - 设置颜色为深蓝色 (#1a1a2e)

3. 创建标题文本
   - 右键点击Canvas
   - 选择"创建" → "2D对象" → "Label"
   - 命名为"Title"
   - 设置文本为"继续下一关"
   - 设置字体大小为48

4. 创建加载进度条
   - 右键点击Canvas
   - 选择"创建" → "UI组件" → "ProgressBar"
   - 命名为"LoadingBar"

5. 保存场景
   - 按`Ctrl + S`保存

### 2. 创建主菜单场景 (MainMenuScene)

**步骤:**
1. 在`assets/scenes`中创建新场景
2. 命名为`MainMenuScene`
3. 双击打开

**场景内容:**
1. Canvas - UI画布
2. Background - 背景图片
3. Title - 游戏标题
4. StartButton - 开始游戏按钮
5. LoadButton - 继续游戏按钮
6. SettingsButton - 设置按钮

**创建按钮:**
1. 右键点击Canvas
2. 选择"创建" → "UI组件" → "Button"
3. 命名为"StartButton"
4. 设置位置和大小
5. 修改按钮文本为"开始游戏"

### 3. 创建游戏场景 (GameScene)

**步骤:**
1. 在`assets/scenes`中创建新场景
2. 命名为`GameScene`
3. 双击打开

**场景内容:**
1. Canvas - UI画布
2. WorldRoot - 世界根节点
   - Player - 玩家节点
   - Monsters - 怪物容器
   - Towers - 炮台容器
   - Castle - 城堡节点
3. HUD - 游戏UI
   - HPBar - 生命条
   - DayIndicator - 天数指示
   - MiniMap - 小地图
   - Inventory - 背包UI

**创建玩家节点:**
1. 右键点击WorldRoot
2. 选择"创建" → "创建空节点"
3. 命名为"Player"
4. 添加Sprite组件
5. 设置位置为地图中心

### 4. 创建游戏结束场景 (GameOverScene)

**步骤:**
1. 在`assets/scenes`中创建新场景
2. 命名为`GameOverScene`
3. 双击打开

**场景内容:**
1. Canvas - UI画布
2. Background - 半透明背景
3. ResultPanel - 结果面板
   - Title - 胜利/失败标题
   - Stats - 游戏统计
   - RetryButton - 重试按钮
   - MenuButton - 返回菜单按钮

---

## 🎨 预制体创建

### 1. 创建玩家预制体

**步骤:**
1. 在"资源管理器"中右键点击`assets/resources/prefabs`
2. 选择"创建" → "Prefab"
3. 命名为`Player`

**编辑预制体:**
1. 双击打开Player预制体
2. 添加Sprite组件
   - 设置图片(如果有)
   - 设置大小为64x64
   
3. 添加Player脚本
   - 在"属性检查器"中点击"添加组件"
   - 搜索"Player"
   - 选择`Player`脚本
   
4. 添加碰撞体
   - 点击"添加组件"
   - 选择"Collider2D" → "BoxCollider2D"
   - 设置大小

5. 保存预制体
   - 按`Ctrl + S`保存

### 2. 创建怪物预制体

**步骤:**
1. 创建预制体`Monster`
2. 添加Sprite组件
3. 添加Monster脚本(需要创建)
4. 添加碰撞体
5. 保存

### 3. 创建炮台预制体

**步骤:**
1. 创建预制体`Tower`
2. 添加Sprite组件
3. 添加Tower脚本(需要创建)
4. 添加碰撞体
5. 保存

### 4. 创建道具预制体

**步骤:**
1. 创建预制体`Item`
2. 添加Sprite组件
3. 添加Item脚本(需要创建)
4. 添加碰撞体
5. 保存

---

## 📜 脚本挂载

### 1. 挂载GameManager

**方法1: 在场景中挂载**
1. 打开`BootScene`
2. 创建空节点,命名为"GameManager"
3. 在"属性检查器"中点击"添加组件"
4. 搜索"GameManager"
5. 选择`GameManager`脚本
6. 保存场景

**方法2: 代码动态添加**
```typescript
// 在场景加载时
const gameManagerNode = new Node('GameManager');
gameManagerNode.addComponent(GameManager);
director.getScene().addChild(gameManagerNode);
```

### 2. 挂载Player脚本

**方法1: 在预制体中挂载**
1. 打开`Player`预制体
2. 在"属性检查器"中点击"添加组件"
3. 搜索"Player"
4. 选择`Player`脚本
5. 保存预制体

**方法2: 动态实例化**
```typescript
// 在GameScene中
import { resources, Prefab, instantiate } from 'cc';

resources.load('prefabs/Player', Prefab, (err, prefab) => {
    if (err) {
        console.error('加载玩家预制体失败', err);
        return;
    }
    
    const playerNode = instantiate(prefab);
    this.node.addChild(playerNode);
});
```

### 3. 脚本属性配置

**在属性检查器中配置:**
1. 选择挂载了脚本的节点
2. 在"属性检查器"中找到脚本组件
3. 修改属性值
   - `moveSpeed`: 150
   - `currentHp`: 100
   - 等等

**使用@property装饰器:**
```typescript
@ccclass('Player')
export class Player extends Component {
    @property({
        type: CCInteger,
        tooltip: '移动速度'
    })
    moveSpeed: number = 150;

    @property({
        type: CCFloat,
        tooltip: '当前生命值'
    })
    currentHp: number = 100;
}
```

---

## 🖼️ 资源导入

### 1. 导入图片资源

**步骤:**
1. 打开文件管理器
2. 复制`f:\project\继续下一关\js_version\images`目录中的图片
3. 粘贴到`cocos-roguelike\assets\resources\textures`目录
4. 回到Cocos Creator
5. 等待资源自动导入

**资源分类:**
```
textures/
├── characters/     # 角色图片
├── monsters/       # 怪物图片
├── weapons/        # 武器图片
├── terrain/        # 地形图片
└── ui/             # UI图片
```

**设置图片属性:**
1. 选择图片
2. 在"属性检查器"中设置
   - Type: Sprite Frame (精灵帧)
   - Packable: true (可打包)
3. 点击"应用"

### 2. 导入音频资源

**步骤:**
1. 复制`f:\project\继续下一关\js_version\audio`目录中的音频
2. 粘贴到`cocos-roguelike\assets\resources\audio`目录
3. 等待资源自动导入

**音频分类:**
```
audio/
├── bgm/    # 背景音乐
└── sfx/    # 音效
```

**设置音频属性:**
1. 选择音频文件
2. 在"属性检查器"中设置
   - Load Mode: Web Audio (Web音频)
   - Duration: 自动检测
3. 点击"应用"

### 3. 加载资源

**动态加载图片:**
```typescript
import { resources, SpriteFrame, Sprite } from 'cc';

// 加载单个图片
resources.load('textures/characters/player', SpriteFrame, (err, spriteFrame) => {
    if (err) {
        console.error('加载图片失败', err);
        return;
    }
    
    const sprite = this.node.getComponent(Sprite);
    sprite.spriteFrame = spriteFrame;
});
```

**动态加载音频:**
```typescript
import { resources, AudioClip, AudioSource } from 'cc';

// 加载音频
resources.load('audio/bgm/main_theme', AudioClip, (err, audioClip) => {
    if (err) {
        console.error('加载音频失败', err);
        return;
    }
    
    const audioSource = this.node.getComponent(AudioSource);
    audioSource.clip = audioClip;
    audioSource.play();
});
```

---

## 📱 抖音小游戏发布

### 1. 构建设置

**步骤:**
1. 点击菜单"项目" → "构建发布"
2. 选择平台: "字节跳动小游戏"
3. 填写配置:
   - **应用名称**: 继续下一关
   - **应用ID**: 填写抖音AppID(或选择测试号)
   - **应用版本**: 1.0.0
   - **支持平台**: 抖音
   - **设备方向**: 竖屏 (Portrait)
   - **使用调试模式**: true

4. 点击"构建"

### 2. 构建项目

**构建过程:**
1. 点击"构建"按钮
2. 等待构建完成
3. 查看构建日志
4. 构建成功后会生成`build/bytedance-mini-game`目录

### 3. 在抖音开发者工具中打开

**步骤:**
1. 打开抖音开发者工具
2. 选择"小游戏"项目类型
3. 导入项目
4. 选择路径: `cocos-roguelike\build\bytedance-mini-game`
5. 填写AppID或选择"测试号"
6. 点击"编译"运行

### 4. 真机调试

**步骤:**
1. 在抖音开发者工具中点击"预览"
2. 用抖音APP扫描二维码
3. 在真机上测试游戏
4. 查看真机日志

---

## 🎯 开发流程

### 1. 日常开发流程

```
1. 打开Cocos Creator
2. 打开项目
3. 编辑场景/预制体
4. 编写/修改脚本
5. 测试游戏
   - 点击"播放"按钮
   - 在浏览器中预览
6. 调试代码
   - 使用浏览器开发者工具
   - 查看控制台日志
7. 保存修改
8. 构建发布
```

### 2. 添加新功能流程

```
1. 设计功能
2. 创建脚本文件
3. 编写代码
4. 创建预制体
5. 挂载脚本
6. 配置属性
7. 测试功能
8. 优化调整
```

### 3. 调试技巧

**使用console.log:**
```typescript
console.log('玩家位置:', this.node.getPosition());
console.log('当前生命值:', this.currentHp);
```

**使用调试器:**
1. 点击"播放"按钮运行游戏
2. 打开浏览器开发者工具 (F12)
3. 在Sources面板中找到TypeScript文件
4. 设置断点
5. 刷新页面,触发断点
6. 单步调试

**查看节点树:**
1. 运行游戏
2. 在浏览器开发者工具中
3. 使用Cocos Creator的调试工具
4. 查看节点层级和属性

---

## 📚 常用API

### 节点操作

```typescript
// 获取节点
const node = this.node;

// 获取子节点
const child = this.node.getChildByName('ChildName');

// 查找节点
const target = find('Path/To/Node');

// 创建节点
const newNode = new Node('NewNode');

// 添加子节点
this.node.addChild(newNode);

// 删除节点
this.node.removeFromParent();
this.node.destroy();

// 设置位置
this.node.setPosition(new Vec3(100, 200, 0));

// 获取位置
const pos = this.node.getPosition();

// 设置缩放
this.node.setScale(new Vec3(2, 2, 1));

// 设置旋转
this.node.setRotationFromEuler(new Vec3(0, 0, 45));
```

### 组件操作

```typescript
// 获取组件
const sprite = this.node.getComponent(Sprite);
const player = this.node.getComponent(Player);

// 添加组件
const sprite = this.node.addComponent(Sprite);

// 获取子节点组件
const player = this.node.getChildByName('Player').getComponent(Player);

// 查找组件
const players = this.node.getComponentsInChildren(Player);
```

### 场景管理

```typescript
import { director } from 'cc';

// 加载场景
director.loadScene('GameScene');

// 预加载场景
director.preloadScene('GameScene', (err) => {
    if (err) {
        console.error('预加载场景失败', err);
        return;
    }
    console.log('场景预加载完成');
});

// 获取当前场景
const scene = director.getScene();

// 添加常驻节点
director.addPersistRootNode(this.node);

// 移除常驻节点
director.removePersistRootNode(this.node);
```

### 输入事件

```typescript
import { input, Input, EventTouch, EventKeyboard, KeyCode } from 'cc';

// 触摸事件
input.on(Input.EventType.TOUCH_START, (event: EventTouch) => {
    const pos = event.getUILocation();
    console.log('触摸位置:', pos);
}, this);

input.on(Input.EventType.TOUCH_MOVE, (event: EventTouch) => {
    const pos = event.getUILocation();
    console.log('触摸移动:', pos);
}, this);

input.on(Input.EventType.TOUCH_END, (event: EventTouch) => {
    console.log('触摸结束');
}, this);

// 键盘事件
input.on(Input.EventType.KEY_DOWN, (event: EventKeyboard) => {
    if (event.keyCode === KeyCode.SPACE) {
        console.log('空格键按下');
    }
}, this);
```

### 计时器

```typescript
// 延迟执行
this.scheduleOnce(() => {
    console.log('1秒后执行');
}, 1);

// 重复执行
this.schedule(() => {
    console.log('每2秒执行一次');
}, 2);

// 带延迟的重复执行
this.schedule(() => {
    console.log('延迟1秒后,每2秒执行一次');
}, 2, 10, 1); // 间隔2秒,重复10次,延迟1秒

// 取消计时器
this.unschedule(callback);
this.unscheduleAllCallbacks();
```

---

## 🎓 学习资源

### 官方文档
- Cocos Creator官方文档: https://docs.cocos.com/creator/manual/zh/
- API文档: https://docs.cocos.com/creator/api/zh/
- 抖音小游戏发布: https://docs.cocos.com/creator/manual/zh/publish/publish-bytedance-mini-game.html

### 教程视频
- Cocos Creator官方教程: https://www.bilibili.com/video/BV1sE411T7tV
- 抖音小游戏开发教程: https://www.bilibili.com/video/BV1hK4y1b7Wp

### 社区论坛
- Cocos中文社区: https://forum.cocos.org/
- Cocos官方问答: https://answer.cocos.com/

---

## 💡 开发建议

### 1. 使用组件化开发
- 每个功能独立成组件
- 组件之间通过事件通信
- 避免紧耦合

### 2. 使用预制体
- 复用游戏对象
- 统一管理资源
- 方便修改和维护

### 3. 使用资源管理器
- 统一管理资源
- 使用resources.load动态加载
- 及时释放不用的资源

### 4. 使用对象池
- 频繁创建销毁的对象使用对象池
- 提高性能,减少GC

### 5. 优化性能
- 减少DrawCall
- 使用图集
- 合理使用碰撞检测
- 避免每帧创建对象

---

**开发对接指南完成!** 🎯

按照这个指南,你就可以开始在Cocos Creator中开发游戏了!
