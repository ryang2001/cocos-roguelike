# Cocos Creator 场景设置指南

## 问题原因

在Cocos Creator中点击运行后看不到内容，通常是因为：

1. **场景中没有Canvas节点** - 2D游戏必须在Canvas下渲染
2. **Prefab没有被实例化** - 需要脚本动态创建或手动放置到场景中
3. **Sprite组件没有设置** - 节点上需要有Sprite组件来显示图片
4. **资源类型不正确** - 图片需要被设置为SpriteFrame类型

---

## 解决步骤

### 步骤1：在Cocos Creator编辑器中设置资源类型

1. **打开Cocos Creator编辑器**

2. **设置图片为SpriteFrame类型**：
   - 在资源管理器中找到 `assets/resources/textures/`
   - 选中所有PNG图片（可以按住Ctrl多选）
   - 在属性检查器中，将 **Type** 改为 **"sprite-frame"**
   - 点击 **Apply** 应用

3. **验证图片设置**：
   - 展开任意图片，应该会看到子项为 **"spriteFrame"**

---

### 步骤2：修改Prefab添加Sprite组件

#### Player.prefab 设置：

1. 双击打开 `assets/resources/prefabs/Player.prefab`

2. 在层级管理器选中根节点 "Player"

3. 在属性检查器中点击 **"添加组件"**

4. 选择 **"2D对象" → "Sprite"**

5. 在Sprite组件中：
   - **Sprite Frame**: 拖入 `textures/characters/player/player_knight` 作为默认精灵图
   - **Size Mode**: 选择 **"RAW"** (保持原图大小) 或 **"CUSTOM"** (自定义大小)
   - **Color**: 保持白色 (255, 255, 255, 255)

6. **保存Prefab** (Ctrl+S)

#### Monster.prefab 设置：

1. 双击打开 `assets/resources/prefabs/Monster.prefab`

2. 选中根节点 "Monster"

3. 添加 **Sprite** 组件

4. 在Sprite组件中：
   - **Sprite Frame**: 可以暂时不设置（代码会动态加载）
   - **Size Mode**: RAW

5. **保存Prefab**

---

### 步骤3：设置GameScene场景

#### 3.1 创建Canvas节点（如果不存在）

1. 打开 `assets/scenes/GameScene.scene`

2. 在层级管理器中右键 → **"创建" → "2D对象" → "Canvas"**

3. 选中Canvas节点，在属性检查器中设置：
   - **Canvas组件**:
     - **Design Resolution**: Width=720, Height=1280
     - **Fit Width**: 勾选
     - **Fit Height**: 勾选

#### 3.2 在Canvas下添加游戏场景初始化器

1. 选中Canvas节点

2. 在属性检查器中点击 **"添加组件" → "自定义脚本" → "GameSceneInitializer"**

3. 绑定Prefab引用：
   - **Player Prefab**: 拖入 `assets/resources/prefabs/Player.prefab`
   - **Monster Prefab**: 拖入 `assets/resources/prefabs/Monster.prefab`
   - **Tower Prefab**: 拖入 `assets/resources/prefabs/Tower.prefab`
   - **Castle Prefab**: （如果没有可以暂时不设置）

#### 3.3 添加AssetManager到场景

1. 在Canvas下创建空节点：右键Canvas → **"创建空节点"**，命名为 "Managers"

2. 选中Managers节点

3. 添加组件 **"AssetManager"**

---

### 步骤4：设置主相机

1. 在层级管理器中找到或创建摄像机节点

2. 选中摄像机节点，设置：
   - **Projection**: ORTHO (正交投影，2D游戏必须)
   - **Ortho Height**: 360 (根据设计分辨率调整)
   - **Visibility**: 选择 "UI_2D" 层

3. 确保摄像机位于Canvas节点下或与Canvas同级

---

### 步骤5：验证Player Prefab的组件

打开Player.prefab，确保有以下组件：
- ✅ **UITransform** - 控制尺寸和锚点
- ✅ **Sprite** - 显示精灵图
- ✅ **BoxCollider** - 碰撞检测
- ✅ **Player** - 玩家控制脚本

---

### 步骤6：运行测试

1. 点击编辑器顶部的 **"预览"** 按钮（或按Ctrl+P）

2. 预期应该看到：
   - 玩家角色（骑士）出现在屏幕中央
   - 几个测试怪物分布在周围
   - 炮台在城堡周围

3. 如果看不到，检查控制台（Console）的错误信息

---

## 常见问题排查

### Q1: 控制台报错 "Cannot read property 'xxx' of null"

**原因**: Prefab引用未设置

**解决**: 确保GameSceneInitializer脚本中的Prefab槽位都正确绑定了

---

### Q2: 控制台报错 "Failed to load sprite frame"

**原因**: 资源路径错误或资源类型未设置为SpriteFrame

**解决**:
1. 检查图片的Type是否为sprite-frame
2. 检查GameConfig.ts中的路径是否正确

---

### Q3: 能看到节点但图片不显示

**原因**: Sprite组件的Sprite Frame为空

**解决**:
1. 检查Prefab是否有Sprite组件
2. 检查代码是否正确加载了resources

---

### Q4: 场景一片黑，什么都看不到

**原因**:
1. 没有Canvas节点
2. 摄像机设置不正确

**解决**:
1. 确保场景中有Canvas
2. 摄像机Projection设置为ORTHO
3. 确保节点在正确的Layer（UI_2D）

---

### Q5: 怪物显示为白色方块

**原因**: Sprite组件存在但图片未加载成功

**解决**:
1. 检查Monster Prefab是否有Sprite组件
2. 检查控制台是否有资源加载错误
3. 检查AI图片是否正确移动到resources目录

---

## 快速验证清单

运行前请确认：

- [ ] 所有AI图片已移动到 `assets/resources/textures/` 各目录
- [ ] 所有图片的Type设置为sprite-frame
- [ ] Player.prefab 有Sprite组件
- [ ] Monster.prefab 有Sprite组件
- [ ] GameScene有Canvas节点
- [ ] GameScene有GameSceneInitializer组件并绑定Prefab
- [ ] GameScene有AssetManager组件
- [ ] 主相机Projection为ORTHO
- [ ] 节点Layer设置为UI_2D

---

## 代码加载路径参考

根据GameConfig.ts中的配置，资源加载路径格式如下：

```typescript
// 角色
'textures/characters/player/player_knight'
'textures/characters/player/player_mage'

// 怪物
'textures/monsters/normal/monster_slime'
'textures/monsters/elite/monster_elite_goblin'
'textures/monsters/bosses/dragon_idle'

// 武器
'textures/weapons/icons/icon_sword_common'

// UI
'textures/ui/panels/ui_panel_bg'
```

**注意**: 路径不需要加 `resources/` 前缀，也不需要文件扩展名。

---

完成以上设置后，点击运行应该能看到AI生成的精美资源在游戏中显示！
