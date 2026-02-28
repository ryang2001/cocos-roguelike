# 继续下一关 - 视觉资源需求清单

**项目**: Cocos Roguelike 游戏
**风格**: 艾尔登法环2.5D风格
**文档版本**: 1.0
**更新日期**: 2026-02-24

---

## 🎨 美术风格定义

### 整体风格
- **主题**: 暗黑奇幻、末日史诗、中世纪废墟
- **参考**: Elden Ring / Dark Souls 系列
- **视角**: 2.5D俯视角度（约45度倾斜）
- **色调**: 低饱和度、高对比度、暗沉大气

### 视觉特征
| 特征 | 描述 |
|------|------|
| 色彩 | 暗沉的大地色系为主，配合金/蓝/紫等魔法光效 |
| 光影 | 强烈的体积光、神圣/邪恶氛围光、丁达尔效应 |
| 细节 | 破损盔甲、锈迹武器、神秘符文、风化痕迹 |
| 氛围 | 孤独、危险、神秘、史诗感 |

### 技术规格
- **角色尺寸**: 64x64 ~ 128x128 像素
- **怪物尺寸**: 48x48 ~ 256x256 像素
- **UI元素**: 32x32 ~ 512x512 像素
- **瓦片尺寸**: 32x32 像素
- **格式**: PNG (透明背景) / FBX (3D模型)

---

## 👤 一、角色资源 (Characters)

### 1.1 玩家角色

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `player_knight.png` | 精灵图 | 64x64 | Elden Ring style knight, top-down isometric view, dark medieval plate armor with golden rune engravings, worn and battle-damaged, holding sword and shield, dark fantasy atmosphere, muted colors, detailed texture, transparent background, game sprite asset |
| `player_mage.png` | 精灵图 | 64x64 | Elden Ring style sorcerer, hooded dark robe with arcane symbols, crystal staff glowing blue, mysterious face shadow, floating runes around body, top-down isometric view, dark fantasy, transparent background |
| `player_ranger.png` | 精灵图 | 64x64 | Elden Ring style archer, leather armor with fur trim, hood covering face, bow with glowing string, quiver on back, stealthy crouched pose, top-down view, dark fantasy, transparent background |
| `player_paladin.png` | 精灵图 | 64x64 | Elden Ring style paladin, holy golden armor, greatsword with divine light, halo effect, righteous stance, top-down view, light vs dark theme, transparent background |
| `player_rogue.png` | 精灵图 | 64x64 | Elden Ring style rogue, dark leather armor with daggers, masked face, shadow effects, agile pose, poison vials on belt, top-down view, assassin theme, transparent background |

### 1.2 角色动画帧需求

每种角色需要以下动画序列（每方向4-8帧）：

```
player_[class]_idle_0/1/2/3.png      # 待机
player_[class]_walk_n_0/1/2/3.png    # 向北走
player_[class]_walk_s_0/1/2/3.png    # 向南走
player_[class]_walk_e_0/1/2/3.png    # 向东走
player_[class]_walk_w_0/1/2/3.png    # 向西走
player_[class]_attack_0/1/2/3.png    # 攻击
player_[class]_hurt_0/1.png          # 受击
player_[class]_death_0/1/2/3.png     # 死亡
```

---

## 👹 二、怪物资源 (Monsters)

### 2.1 普通怪物

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `monster_slime.png` | 精灵图 | 48x48 | Elden Ring style poison slime monster, bubbling green gelatinous body, toxic bubbles floating, glowing green core, corrupted appearance, top-down view, dark fantasy, transparent background |
| `monster_goblin.png` | 精灵图 | 48x48 | Elden Ring style goblin, green skin, ragged dark clothing, crude iron weapon, evil yellow eyes, hunched posture, top-down view, dark fantasy, transparent background |
| `monster_skeleton.png` | 精灵图 | 48x48 | Elden Ring style skeleton warrior, yellowed bones, rusted sword and shield, hollow eye sockets with blue soul fire, ancient armor fragments, top-down view, dark fantasy, transparent background |
| `monster_wolf.png` | 精灵图 | 56x56 | Elden Ring style dire wolf, gray mangy fur, glowing red eyes, bared fangs, scars on body, aggressive hunting stance, top-down view, dark fantasy, transparent background |
| `monster_spider.png` | 精灵图 | 48x48 | Giant black spider, multiple red eyes, hairy legs, venom dripping from fangs, web patterns on back, top-down view, dark fantasy, transparent background |
| `monster_ghost.png` | 精灵图 | 48x48 | Elden Ring style wraith, translucent body, flowing dark robes, hollow eye sockets, ethereal blue glow, floating, no legs, top-down view, dark fantasy, transparent background |
| `monster_bat.png` | 精灵图 | 32x32 | Giant bat, leathery wings, red eyes, fangs visible, fur texture, flying pose, top-down view, dark fantasy, transparent background |

### 2.2 精英怪物

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `monster_elite_goblin.png` | 精灵图 | 64x64 | Elden Ring style goblin king, massive muscular build, crown made of bones, heavy spiked armor, giant cleaver weapon, commanding presence, red aura, top-down view, dark fantasy boss, transparent background |
| `monster_elite_skeleton.png` | 精灵图 | 64x64 | Elden Ring style skeleton lord, ornate ancient armor, large two-handed sword, blue soul fire blazing from eyes and joints, bone crown, dark aura, top-down view, dark fantasy, transparent background |
| `monster_elite_wolf.png` | 精灵图 | 64x64 | Elden Ring style alpha wolf king, silver-white fur, multiple scars, glowing blue eyes, moonlight aura around body, howling pose, top-down view, dark fantasy, transparent background |
| `monster_elite_demon.png` | 精灵图 | 64x64 | Lesser demon, red skin, horns, bat wings, flaming hands, chain weapons, evil grin, dark aura, top-down view, dark fantasy, transparent background |

### 2.3 Boss怪物

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `boss_goblin_king.png` | 精灵图 | 128x128 | Elden Ring style goblin king boss, massive obese green body sitting on bone throne, wearing golden crown and stolen royal armor, holding giant explosive bomb, surrounded by smaller goblins, evil tyrant presence, dark cave background elements, top-down view, dark fantasy boss, highly detailed |
| `boss_skeleton_king.png` | 精灵图 | 128x128 | Elden Ring style skeleton king boss, enormous skeletal figure, wearing ancient corrupted royal armor with skull motifs, wielding massive rune-inscribed sword, necrotic green aura, floating bone fragments around body, soul fire blazing from eye sockets, dark throne room atmosphere, top-down view, epic dark fantasy |
| `boss_wolf_king.png` | 精灵图 | 128x128 | Elden Ring style fenrir wolf boss, gigantic wolf with moon-white fur, silver armor plates embedded in body, glowing blue eyes, frost breath visible, howling at moon, surrounded by spectral wolf spirits, winter forest atmosphere, top-down view, epic dark fantasy |
| `boss_demon_king.png` | 精灵图 | 256x256 | Elden Ring style demon lord boss, massive demon king with bat-like wings, skin cracked with flowing lava, crown of thorns, wielding giant flaming sword, surrounded by fire and smoke, throne of skulls, apocalyptic atmosphere, red and black color scheme, top-down view, epic scale dark fantasy |
| `boss_dragon.png` | 精灵图 | 256x256 | Elden Ring style ancient dragon boss, massive scaled body, wings spread wide, scales in dark purple and gold, breathing fire, ancient and wise but terrifying presence, ruins background, top-down view, epic dark fantasy, highly detailed texture |
| `boss_lich.png` | 精灵图 | 128x128 | Elden Ring style lich king, skeletal figure in ornate dark robes, floating crown, necromantic staff with soul gems, surrounded by floating spell books and spirits, dark magic aura, top-down view, dark fantasy archmage |

---

## ⚔️ 三、武器资源 (Weapons)

### 3.1 武器精灵图（地面掉落）

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `weapon_sword_drop.png` | 精灵图 | 32x32 | Iron sword on ground, blade with slight rust, leather wrapped hilt, Elden Ring style weapon, dark background, slight glow, isometric view |
| `weapon_spear_drop.png` | 精灵图 | 32x32 | Long spear on ground, wooden shaft, iron spearhead, blood stains, Elden Ring style, isometric view |
| `weapon_shield_drop.png` | 精灵图 | 32x32 | Wooden shield on ground, iron rim, scratches and dents, heraldry worn off, Elden Ring style, isometric view |
| `weapon_cannon_drop.png` | 精灵图 | 32x32 | Small hand cannon on ground, brass and iron, smoke stains, medieval steampunk, Elden Ring style, isometric view |
| `weapon_staff_drop.png` | 精灵图 | 32x32 | Wooden staff on ground, crystal embedded at top, glowing faintly, rune carvings, Elden Ring style, isometric view |

### 3.2 武器图标（UI用）

#### 剑类
| 文件名 | 稀有度 | AI生成提示词 |
|--------|--------|--------------|
| `icon_sword_common.png` | 普通 | Rusty iron sword icon, simple design, worn condition, gray metal, dark background, Elden Ring style UI |
| `icon_sword_uncommon.png` | 优秀 | Steel sword icon, sharper blade, green glow, slight rune markings, dark background |
| `icon_sword_rare.png` | 稀有 | Enchanted sword icon, blue magical aura, glowing runes, crystal embedded, dark background |
| `icon_sword_epic.png` | 史诗 | Ancient legendary sword icon, purple void energy, intricate design, eye motif, dark background |
| `icon_sword_legendary.png` | 传说 | Divine sword icon, golden holy light, angelic wings on hilt, blazing aura, dark background |
| `icon_sword_mythical.png` | 神话 | Godslayer sword icon, red and black energy, reality distortion effect, cosmic power, dark background |

#### 枪类
| 文件名 | 稀有度 | AI生成提示词 |
|--------|--------|--------------|
| `icon_spear_common.png` | 普通 | Wooden spear icon, simple iron tip, basic design, dark background |
| `icon_spear_rare.png` | 稀有 | Crystal spear icon, translucent blue shaft, magic energy, elegant design, dark background |
| `icon_spear_legendary.png` | 传说 | Dragon spear icon, golden shaft, dragon tooth tip, lightning aura, dark background |

#### 盾类
| 文件名 | 稀有度 | AI生成提示词 |
|--------|--------|--------------|
| `icon_shield_common.png` | 普通 | Wooden round shield icon, iron rim, simple design, dark background |
| `icon_shield_rare.png` | 稀有 | Knight shield icon, blue paint, silver trim, coat of arms, dark background |
| `icon_shield_legendary.png` | 传说 | Dragon scale shield icon, golden frame, ancient dragon emblem, holy protection aura, dark background |

#### 炮类
| 文件名 | 稀有度 | AI生成提示词 |
|--------|--------|--------------|
| `icon_cannon_common.png` | 普通 | Hand cannon icon, rusty iron, crude design, dark background |
| `icon_cannon_rare.png` | 稀有 | Magitech cannon icon, glowing core, brass and crystal, steampunk fantasy, dark background |
| `icon_cannon_legendary.png` | 传说 | Dwarven cannon icon, gold and mithril, ancient runes, explosion effects, dark background |

#### 法杖类
| 文件名 | 稀有度 | AI生成提示词 |
|--------|--------|--------------|
| `icon_staff_common.png` | 普通 | Wooden staff icon, simple crystal, novice mage weapon, dark background |
| `icon_staff_rare.png` | 稀有 | Crystal staff icon, multiple floating gems, blue magical aura, dark background |
| `icon_staff_legendary.png` | 传说 | Archmage staff icon, cosmic energy, floating planets, pure magic essence, dark background |

---

## 🏰 四、防御塔/炮台资源 (Towers)

### 4.1 炮台精灵图

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `tower_basic.png` | 精灵图 | 64x64 | Medieval ballista tower, wooden structure with stone base, simple crossbow mechanism on top, top-down view, Elden Ring style, dark fantasy, weathered wood texture |
| `tower_arrow.png` | 精灵图 | 64x64 | Archer tower, stone tower with archer platforms, multiple bow ports, flag on top, top-down view, Elden Ring style |
| `tower_cannon.png` | 精灵图 | 64x64 | Cannon tower, heavy stone and iron, large cannon barrel pointing out, smoke stains, ammunition pile, top-down view, medieval steampunk |
| `tower_magic.png` | 精灵图 | 64x64 | Arcane tower, floating crystals around structure, glowing rune circle base, magical energy flowing, top-down view, Elden Ring style, mystical atmosphere |
| `tower_ice.png` | 精灵图 | 64x64 | Frost tower, ice crystals growing on structure, blue frozen base, snow particles, top-down view, cold atmosphere, Elden Ring style |
| `tower_fire.png` | 精灵图 | 64x64 | Inferno tower, lava cracks on dark iron, fire burning at top, smoke and embers, top-down view, volcanic theme, Elden Ring style |
| `tower_poison.png` | 精灵图 | 64x64 | Plague tower, green toxic mist, rusted metal, skull decorations, bubbling acid pools, top-down view, decay theme |
| `tower_lightning.png` | 精灵图 | 64x64 | Storm tower, copper rods attracting lightning, electrical energy arcing, thunder clouds above, top-down view, storm theme |

### 4.2 炮台底座/建造点

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `tower_base_empty.png` | 精灵图 | 64x64 | 空炮台底座，圆形石台，符文刻痕 |
| `tower_base_occupied.png` | 精灵图 | 64x64 | 已占用底座，发光效果 |
| `tower_range_indicator.png` | UI | 128x128 | 圆形攻击范围指示器，半透明 |

---

## 🗺️ 五、地形资源 (Terrain)

### 5.1 地面瓦片（Tileset）

所有瓦片尺寸：32x32 像素，可无缝拼接

| 文件名 | 类型 | AI生成提示词 |
|--------|------|--------------|
| `tile_grass_01/02/03.png` | 瓦片 | Dark fantasy grass texture, muted green and brown, scattered dead leaves, worn ground, seamless tile, Elden Ring style |
| `tile_dirt_01/02/03.png` | 瓦片 | Dark dirt path texture, brown soil, wagon tracks, small stones, seamless tile, worn appearance |
| `tile_stone_01/02.png` | 瓦片 | Ancient stone floor texture, gray flagstones, moss in cracks, worn by time, seamless tile, castle interior |
| `tile_snow_01/02.png` | 瓦片 | Snow covered ground texture, white with blue tint, footprints, ice crystals, seamless tile, cold atmosphere |
| `tile_lava_01/02.png` | 瓦片 | Volcanic rock texture, black stone with glowing orange lava cracks, heat distortion, seamless tile, dangerous area |
| `tile_swamp_01/02.png` | 瓦片 | Swamp ground texture, dark green murky water, mud, reeds, toxic bubbles, seamless tile, decay atmosphere |
| `tile_sand_01/02.png` | 瓦片 | Desert sand texture, warm beige, ripples from wind, scattered rocks, seamless tile, arid atmosphere |
| `tile_water_01/02/03.png` | 瓦片 | Water surface texture, dark blue, gentle ripples, reflections, animated feel, seamless tile |
| `tile_wood_floor.png` | 瓦片 | Wooden floor texture, dark oak planks, worn surface, nails visible, seamless tile, interior |
| `tile_carpet_red.png` | 瓦片 | Red carpet texture, ornate pattern, gold trim, royal appearance, seamless tile, castle interior |

### 5.2 地形边缘/过渡

| 文件名 | 类型 | 描述 |
|--------|------|------|
| `transition_grass_dirt.png` | 瓦片 | 草地到泥土过渡 |
| `transition_grass_stone.png` | 瓦片 | 草地到石地过渡 |
| `transition_dirt_stone.png` | 瓦片 | 泥土到石地过渡 |
| `transition_water_sand.png` | 瓦片 | 水到沙滩过渡 |
| `cliff_edge_n/s/e/w.png` | 瓦片 | 悬崖边缘（四方向） |

### 5.3 环境装饰物

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `env_tree_dead_01/02.png` | 环境 | 64x96 | Dead twisted tree, gnarled black branches, no leaves, ominous presence, Elden Ring style, dark fantasy, top-down view |
| `env_tree_pine_01/02.png` | 环境 | 64x96 | Dark pine tree, thick trunk, dense dark green needles, snow on branches variant, Elden Ring style |
| `env_tree_oak_01/02.png` | 环境 | 64x96 | Ancient oak tree, massive trunk, sprawling branches, autumn leaves variant, Elden Ring style |
| `env_tree_swamp_01/02.png` | 环境 | 64x96 | Swamp cypress tree, knobby roots in water, moss covered, Spanish moss hanging, dark atmosphere |
| `env_rock_small_01/02/03.png` | 环境 | 32x32 | Small rock formation, gray stone, moss patches, various shapes, Elden Ring style |
| `env_rock_large_01/02.png` | 环境 | 64x64 | Large boulder, detailed texture, cracks, ancient runes carved, mossy, Elden Ring style |
| `env_rock_crystal_blue.png` | 环境 | 32x48 | Glowing blue crystal formation, magic ore, embedded in rock, ethereal glow, Elden Ring style |
| `env_rock_crystal_red.png` | 环境 | 32x48 | Glowing red crystal formation, fire essence, magma glow, Elden Ring style |
| `env_grave_01/02.png` | 环境 | 32x48 | Weathered stone grave, overgrown with grass, old and forgotten, dark fantasy |
| `env_grave_cross.png` | 环境 | 32x48 | Wooden cross grave marker, worn, overgrown, somber |
| `env_statue_knight.png` | 环境 | 48x96 | Stone statue of ancient knight, moss covered, sword raised, weathered, Elden Ring style |
| `env_pillar_broken.png` | 环境 | 32x64 | Broken stone pillar, ancient ruins, fallen pieces around base, Elden Ring style |
| `env_campfire.png` | 环境 | 32x32 | Campfire with burning logs, stone ring, sparks, warm glow, particle ready, Elden Ring style |
| `env_torch_wall.png` | 环境 | 16x32 | Wall mounted torch, flame, smoke, dungeon lighting |
| `env_chest_common.png` | 环境 | 32x32 | Wooden chest, iron bands, closed, worn texture, Elden Ring style |
| `env_chest_rare.png` | 环境 | 32x32 | Ornate golden chest, magical lock, glowing gems, mysterious aura, Elden Ring style |
| `env_chest_open.png` | 环境 | 32x32 | Open chest, empty inside, lid propped open, wood texture |
| `env_barrel.png` | 环境 | 24x32 | Wooden barrel, metal bands, worn, can be destroyed |
| `env_crate.png` | 环境 | 24x24 | Wooden crate, supply box, breakable |
| `env_bush_01/02.png` | 环境 | 32x32 | Dark green bush, various shapes, can hide in, Elden Ring style |
| `env_flower_dead.png` | 环境 | 16x16 | Withered flowers, dark atmosphere, sad beauty |
| `env_grass_tall.png` | 环境 | 16x32 | Tall grass blades, swaying animation ready, dark green |
| `env_web.png` | 环境 | 32x32 | Spider web, corner decoration, glistening, spooky |
| `env_chain.png` | 环境 | 16x32 | Hanging iron chain, dungeon decoration, rusty |
| `env_bones_pile.png` | 环境 | 32x32 | Pile of bones and skulls, remains of battle, dark fantasy |
| `env_blood_splatter.png` | 环境 | 32x32 | Blood stain on ground, dark red, splatter pattern, grim |

---

## 🏯 六、城堡资源 (Castle)

### 6.1 城堡主体

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `castle_main.png` | 建筑 | 256x256 | Elden Ring style medieval castle, massive stone fortress with multiple towers and defensive walls, drawbridge, banners flying, dark gray stone, fortress of light in dark world, top-down isometric view, highly detailed, dark fantasy architecture |
| `castle_tower_corner.png` | 建筑部件 | 64x128 | Castle corner tower, round structure, crenellations at top, arrow slits, stone texture, flags |
| `castle_tower_straight.png` | 建筑部件 | 48x128 | Castle wall tower, square structure, defensive platform, stone texture |
| `castle_wall_h.png` | 建筑部件 | 128x48 | Horizontal castle wall, crenellated top, stone blocks, moss in cracks |
| `castle_wall_v.png` | 建筑部件 | 48x128 | Vertical castle wall, same style |
| `castle_gate_closed.png` | 建筑部件 | 96x96 | Castle gate, iron portcullis down, reinforced wooden doors, guards visible |
| `castle_gate_open.png` | 建筑部件 | 96x96 | Castle gate open, portcullis raised, path visible |
| `castle_broken.png` | 建筑 | 256x256 | Destroyed castle, rubble and ruins, broken walls, smoke rising, fires burning, defeat atmosphere, game over scene |

### 6.2 城堡内部

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `castle_floor_throne.png` | 瓦片 | 32x32 | 王座厅地板，华丽石砖，金色装饰 |
| `castle_throne.png` | 环境 | 64x96 | 王座，金色，华丽雕刻，高背 |
| `castle_banner_01/02/03.png` | 环境 | 32x64 | 挂墙旗帜，不同纹章，飘动动画 |
| `castle_window.png` | 环境 | 32x48 | 彩色玻璃窗，宗教图案，透光效果 |
| `castle_chandelier.png` | 环境 | 48x48 | 吊灯，蜡烛，火焰微光 |

---

## 🎨 七、UI资源 (User Interface)

### 7.1 面板和框架

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `ui_panel_bg.png` | UI | 512x512 | Elden Ring style UI panel background, dark stone texture border, weathered medieval frame, ornate corners with golden accents, dark center area for content, transparent outside, game interface element |
| `ui_panel_small.png` | UI | 256x128 | Small UI panel, same style, for tooltips |
| `ui_panel_large.png` | UI | 512x384 | Large UI panel, same style, for inventory |
| `ui_panel_transparent.png` | UI | 512x512 | Semi-transparent dark panel, glass effect, modern dark fantasy |
| `ui_bar_frame.png` | UI | 256x32 | Health/mana bar frame, stone border, hollow center |
| `ui_bar_fill_red.png` | UI | 1x32 | Red gradient bar fill, health |
| `ui_bar_fill_blue.png` | UI | 1x32 | Blue gradient bar fill, mana |
| `ui_bar_fill_green.png` | UI | 1x32 | Green gradient bar fill, stamina |
| `ui_bar_fill_yellow.png` | UI | 1x32 | Yellow gradient bar fill, energy |

### 7.2 按钮

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `ui_button_normal.png` | UI | 128x48 | Elden Ring style stone button, normal state, carved stone texture, rune border, dark gray, game UI element |
| `ui_button_hover.png` | UI | 128x48 | Same stone button, hover state, golden glow edges, slightly lighter |
| `ui_button_pressed.png` | UI | 128x48 | Same stone button, pressed state, darker, pushed in effect |
| `ui_button_disabled.png` | UI | 128x48 | Same stone button, disabled state, grayed out, cracked |
| `ui_button_icon_frame.png` | UI | 64x64 | Square button frame for skill icons, stone texture, rune border |

### 7.3 稀有度边框

| 文件名 | 类型 | 尺寸 | AI生成提示词 |
|--------|------|------|--------------|
| `ui_frame_common.png` | UI | 64x64 | Common item frame, simple iron border, gray color, basic design, dark center |
| `ui_frame_uncommon.png` | UI | 64x64 | Uncommon frame, green glowing border, leaf motif corners, nature theme |
| `ui_frame_rare.png` | UI | 64x64 | Rare frame, blue crystal border, ice/shard motif, magical glow |
| `ui_frame_epic.png` | UI | 64x64 | Epic frame, purple void border, arcane runes, mystical aura |
| `ui_frame_legendary.png` | UI | 64x64 | Legendary frame, gold divine border, dragon motif, holy light rays |
| `ui_frame_mythical.png` | UI | 64x64 | Mythical frame, red black border, reality distortion effect, cosmic theme, eldritch horror elements |

### 7.4 状态图标

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `icon_hp.png` | 图标 | 32x32 | 红心，生命值图标，艾尔登法环风格 |
| `icon_mp.png` | 图标 | 32x32 | 蓝水晶，魔法值图标 |
| `icon_stamina.png` | 图标 | 32x32 | 绿条，耐力图标 |
| `icon_gold.png` | 图标 | 32x32 | 金币，货币图标 |
| `icon_exp.png` | 图标 | 32x32 | 星形，经验值图标 |
| `icon_attack.png` | 图标 | 32x32 | 交叉剑，攻击力图标 |
| `icon_defense.png` | 图标 | 32x32 | 盾牌，防御力图标 |
| `icon_speed.png` | 图标 | 32x32 | 翅膀/靴子，速度图标 |
| `icon_crit.png` | 图标 | 32x32 | 爆发星，暴击图标 |
| `icon_range.png` | 图标 | 32x32 | 靶心，射程图标 |

### 7.5 元素图标

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `element_wood.png` | 图标 | 32x32 | 绿叶，木元素 |
| `element_water.png` | 图标 | 32x32 | 水滴，水元素 |
| `element_fire.png` | 图标 | 32x32 | 火焰，火元素 |
| `element_earth.png` | 图标 | 32x32 | 山脉，土元素 |
| `element_thunder.png` | 图标 | 32x32 | 闪电，雷元素 |
| `element_wind.png` | 图标 | 32x32 | 旋风，风元素 |
| `element_light.png` | 图标 | 32x32 | 太阳，光元素 |
| `element_dark.png` | 图标 | 32x32 | 月亮，暗元素 |

### 7.6 武器类型图标

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `type_slash.png` | 图标 | 32x32 | 剑图标，斩击类型 |
| `type_blunt.png` | 图标 | 32x32 | 锤图标，打击类型 |
| `type_pierce.png` | 图标 | 32x32 | 矛图标，戳击类型 |
| `type_magic.png` | 图标 | 32x32 | 法杖图标，魔法类型 |
| `type_ranged.png` | 图标 | 32x32 | 弓图标，射击类型 |
| `type_explosion.png` | 图标 | 32x32 | 炸弹图标，爆炸类型 |

### 7.7 其他UI元素

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `ui_minimap_frame.png` | UI | 128x128 | 迷你地图边框，圆形，石质纹理 |
| `ui_minimap_mask.png` | UI | 128x128 | 迷你地图遮罩，圆形透明 |
| `ui_scrollbar.png` | UI | 16x128 | 滚动条，石质滑块 |
| `ui_checkbox_on.png` | UI | 32x32 | 复选框选中状态 |
| `ui_checkbox_off.png` | UI | 32x32 | 复选框未选中状态 |
| `ui_arrow_up.png` | UI | 32x32 | 向上箭头按钮 |
| `ui_arrow_down.png` | UI | 32x32 | 向下箭头按钮 |
| `ui_close_x.png` | UI | 32x32 | 关闭按钮X图标 |
| `ui_plus.png` | UI | 32x32 | 加号图标 |
| `ui_minus.png` | UI | 32x32 | 减号图标 |
| `ui_exclamation.png` | UI | 32x32 | 感叹号标记 |
| `ui_question.png` | UI | 32x32 | 问号标记 |

---

## ✨ 八、特效资源 (Effects)

### 8.1 粒子纹理

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `particle_fire_01/02/03.png` | 粒子 | 32x32 | 火焰粒子，橙红色渐变，柔和边缘 |
| `particle_ice.png` | 粒子 | 32x32 | 冰晶粒子，蓝白色，六角形 |
| `particle_lightning.png` | 粒子 | 32x32 | 电火花，黄色，锯齿形 |
| `particle_poison.png` | 粒子 | 32x32 | 毒气气泡，绿色，半透明 |
| `particle_heal.png` | 粒子 | 32x32 | 金色光点，治疗特效 |
| `particle_magic.png` | 粒子 | 32x32 | 魔法星光，蓝紫色，闪烁 |
| `particle_blood.png` | 粒子 | 16x16 | 血滴，深红色 |
| `particle_smoke.png` | 粒子 | 32x32 | 烟雾，灰色，柔和边缘 |
| `particle_sparkle.png` | 粒子 | 16x16 | 白色闪光，拾取特效 |
| `particle_dust.png` | 粒子 | 16x16 | 尘土颗粒，棕色 |
| `particle_snow.png` | 粒子 | 16x16 | 雪花，白色六角形 |
| `particle_rain.png` | 粒子 | 8x16 | 雨滴，蓝色细长 |
| `particle_leaf.png` | 粒子 | 16x16 | 落叶，黄绿色 |
| `particle_ember.png` | 粒子 | 8x8 | 余烬，橙红色，上升 |
| `particle_water_splash.png` | 粒子 | 32x32 | 水花飞溅，蓝色 |
| `particle_rock_debris.png` | 粒子 | 16x16 | 碎石，灰色 |
| `particle_star.png` | 粒子 | 16x16 | 星星，升级/成就特效 |

### 8.2 技能/攻击特效

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `effect_slash_01/02/03.png` | 特效 | 64x64 | 剑斩击效果，白色弧光，残影 |
| `effect_hit.png` | 特效 | 48x48 | 受击效果，星形爆发 |
| `effect_critical.png` | 特效 | 96x96 | 暴击特效，红色大字，震动效果 |
| `effect_block.png` | 特效 | 48x48 | 格挡效果，盾牌光芒 |
| `effect_counter.png` | 特效 | 64x64 | 反击特效，闪光 |
| `effect_magic_circle.png` | 特效 | 128x128 | 魔法阵，符文，旋转动画 |
| `effect_teleport_in.png` | 特效 | 96x96 | 传送入场，漩涡效果 |
| `effect_teleport_out.png` | 特效 | 96x96 | 传送离场，消散效果 |
| `effect_levelup.png` | 特效 | 128x128 | 升级特效，金色光柱，符文 |
| `effect_buff.png` | 特效 | 64x64 | 增益效果，向上箭头，绿光 |
| `effect_debuff.png` | 特效 | 64x64 | 减益效果，向下箭头，红光 |
| `effect_stun.png` | 特效 | 48x48 | 眩晕效果，星星在头上转 |
| `effect_poison.png` | 特效 | 48x48 | 中毒效果，绿色泡泡 |
| `effect_burn.png` | 特效 | 48x48 | 燃烧效果，火焰覆盖 |
| `effect_freeze.png` | 特效 | 48x48 | 冰冻效果，冰晶覆盖 |

### 8.3 地形环境特效

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `effect_snow_falling.png` | 特效 | 128x128 | 下雪效果，雪花飘落 |
| `effect_rain.png` | 特效 | 128x128 | 下雨效果，雨滴倾斜 |
| `effect_fog.png` | 特效 | 256x256 | 雾气效果，半透明白色 |
| `effect_ground_fog.png` | 特效 | 256x256 | 地面雾气，低处弥漫 |
| `effect_volcano_glow.png` | 特效 | 256x256 | 火山 glow，红色光晕 |
| `effect_swamp_gas.png` | 特效 | 128x128 | 沼泽毒气，绿色烟雾 |
| `effect_sand_dust.png` | 特效 | 128x128 | 沙尘效果，黄色颗粒 |
| `effect_safe_zone.png` | 特效 | 128x128 | 安全区光环，金色圆环 |

### 8.4 拾取/获得特效

| 文件名 | 类型 | 尺寸 | 描述 |
|--------|------|------|------|
| `effect_item_common.png` | 特效 | 64x64 | 普通物品获得，灰色光芒 |
| `effect_item_uncommon.png` | 特效 | 64x64 | 优秀物品获得，绿光 |
| `effect_item_rare.png` | 特效 | 64x64 | 稀有物品获得，蓝光 |
| `effect_item_epic.png` | 特效 | 64x64 | 史诗物品获得，紫光 |
| `effect_item_legendary.png` | 特效 | 96x96 | 传说物品获得，金光，震撼 |
| `effect_item_mythical.png` | 特效 | 128x128 | 神话物品获得，红光，天地异象 |
| `effect_modifier_acquire.png` | 特效 | 64x64 | 词条获得，符文旋转 |
| `effect_modifier_equip.png` | 特效 | 64x64 | 词条镶嵌，光芒注入 |

---

## 🔢 九、字体资源 (Fonts)

| 文件名 | 类型 | 用途 |
|--------|------|------|
| `font_main.ttf` | 字体 | 主界面、正文，推荐：思源黑体、Noto Sans |
| `font_title.ttf` | 字体 | 标题、大文字，推荐：思源宋体、衬线体 |
| `font_number.ttf` | 字体 | 数字显示，推荐：等宽数字字体、DIN |
| `font_runes.ttf` | 字体 | 符文、魔法文字装饰，原创设计 |

---

## 🎵 十、音频资源 (Audio)

### 10.1 背景音乐 (BGM)

| 文件名 | 时长 | 风格描述 |
|--------|------|----------|
| `bgm_main_theme.mp3` | 3:00 | 主菜单音乐，史诗管弦乐，艾尔登法环风格，低沉弦乐开场，渐入高潮 |
| `bgm_exploration_day.mp3` | 5:00 | 白天探索音乐，神秘但相对平静，钢琴和弦乐，探索感 |
| `bgm_exploration_night.mp3` | 5:00 | 夜晚探索音乐，紧张感，弦乐颤音，不安氛围 |
| `bgm_combat_normal.mp3` | 4:00 | 普通战斗音乐，快节奏，鼓点和铜管，紧迫感 |
| `bgm_combat_elite.mp3` | 4:00 | 精英战斗音乐，更重低音，更强威胁感 |
| `bgm_boss_battle.mp3` | 6:00 | Boss战音乐，史诗感，合唱，管风琴，危机感升级 |
| `bgm_final_boss.mp3` | 8:00 | 最终Boss音乐，多层次，多个阶段变化，终极史诗 |
| `bgm_victory.mp3` | 1:00 | 胜利音乐，宏大收尾，解脱感 |
| `bgm_defeat.mp3` | 1:00 | 失败音乐，悲凉，低沉 |
| `bgm_shop.mp3` | 2:00 | 商店音乐，轻松神秘，异世界感 |

### 10.2 音效 (SFX)

#### 战斗音效
| 文件名 | 描述 |
|--------|------|
| `sfx_attack_sword.mp3` | 剑攻击，金属破空声 |
| `sfx_attack_spear.mp3` | 长枪刺击，尖锐破空 |
| `sfx_attack_blunt.mp3` | 钝器打击，沉重撞击 |
| `sfx_attack_magic.mp3` | 魔法施放，能量聚集释放 |
| `sfx_attack_cannon.mp3` | 火炮发射，爆炸声 |
| `sfx_hit_normal.mp3` | 普通受击，肉体打击 |
| `sfx_hit_armor.mp3` | 击中盔甲，金属碰撞 |
| `sfx_hit_crit.mp3` | 暴击，特殊强调音效 |
| `sfx_block.mp3` | 格挡成功，盾牌碰撞 |
| `sfx_dodge.mp3` | 闪避，风声 |
| `sfx_death_player.mp3` | 玩家死亡，悲壮 |
| `sfx_death_monster.mp3` | 怪物死亡，哀嚎 |
| `sfx_death_boss.mp3` | Boss死亡，巨大轰鸣 |

#### UI音效
| 文件名 | 描述 |
|--------|------|
| `sfx_ui_click.mp3` | 按钮点击，石头质感 |
| `sfx_ui_hover.mp3` | 悬停，轻微提示 |
| `sfx_ui_open.mp3` | 界面打开，展开音效 |
| `sfx_ui_close.mp3` | 界面关闭，收起音效 |
| `sfx_ui_error.mp3` | 错误提示，警示音 |
| `sfx_ui_equip.mp3` | 装备穿戴，金属声 |
| `sfx_ui_unequip.mp3` | 卸下装备 |
| `sfx_ui_pickup.mp3` | 拾取物品，轻盈 |
| `sfx_ui_drop.mp3` | 丢弃物品 |

#### 环境音效
| 文件名 | 描述 |
|--------|------|
| `sfx_footstep_grass.mp3` | 草地脚步声 |
| `sfx_footstep_stone.mp3` | 石头脚步声 |
| `sfx_footstep_water.mp3` | 水中脚步声 |
| `sfx_ambient_wind.mp3` | 风声环境音 |
| `sfx_ambient_fire.mp3` | 火焰环境音 |
| `sfx_ambient_water.mp3` | 水声环境音 |
| `sfx_ambient_cave.mp3` | 洞穴回响 |
| `sfx_weather_rain.mp3` | 雨声 |
| `sfx_weather_thunder.mp3` | 雷声 |

#### 特效音效
| 文件名 | 描述 |
|--------|------|
| `sfx_levelup.mp3` | 升级，升华感 |
| `sfx_teleport.mp3` | 传送，空间扭曲 |
| `sfx_chest_open.mp3` | 开箱，古老机关 |
| `sfx_item_rare.mp3` | 获得稀有物品，特殊提示 |
| `sfx_tower_build.mp3` | 建造炮台，建筑声 |
| `sfx_tower_attack.mp3` | 炮台攻击 |
| `sfx_castle_damaged.mp3` | 城堡受损，警报感 |
| `sfx_wave_start.mp3` | 波次开始，号角声 |
| `sfx_wave_end.mp3` | 波次结束，胜利感 |

---

## 📁 十一、资源目录结构建议

```
assets/
├── textures/
│   ├── characters/
│   │   ├── player/
│   │   │   ├── knight/
│   │   │   ├── mage/
│   │   │   ├── ranger/
│   │   │   └── paladin/
│   │   └── monsters/
│   │       ├── normal/
│   │       ├── elite/
│   │       └── boss/
│   ├── weapons/
│   │   ├── icons/           # UI图标
│   │   └── drops/           # 地面掉落
│   ├── towers/
│   ├── terrain/
│   │   ├── tiles/           # 基础瓦片
│   │   ├── transitions/     # 过渡瓦片
│   │   └── environment/     # 装饰物
│   ├── castle/
│   ├── ui/
│   │   ├── panels/
│   │   ├── buttons/
│   │   ├── frames/
│   │   ├── icons/
│   │   │   ├── elements/
│   │   │   ├── weapon_types/
│   │   │   └── stats/
│   │   └── bars/
│   └── effects/
│       ├── particles/
│       ├── skills/
│       └── environment/
├── audio/
│   ├── bgm/
│   └── sfx/
│       ├── combat/
│       ├── ui/
│       ├── environment/
│       └── skills/
├── prefabs/
│   ├── monsters/
│   ├── towers/
│   ├── effects/
│   └── items/
└── fonts/
```

---

## 🛠️ 十二、AI生成工具指南

### 12.1 Midjourney 提示词模板

#### 角色精灵图
```
Elden Ring style [角色职业], top-down isometric view,
[外观描述], dark fantasy atmosphere, muted colors,
detailed texture, transparent background, game sprite asset,
64x64 pixel art --ar 1:1 --v 6 --style raw
```

#### 怪物精灵图
```
Elden Ring style [怪物类型], [大小描述],
[特征描述], top-down view, dark fantasy,
transparent background, game monster sprite,
[尺寸] pixels --ar 1:1 --v 6 --style raw
```

#### 环境物体
```
Elden Ring style [物体类型], [状态描述],
[材质描述], top-down isometric view,
dark fantasy environment, game asset,
[尺寸] --ar 1:1 --v 6
```

#### UI元素
```
Elden Ring style UI element, [类型描述],
stone texture, dark medieval, [功能描述],
game interface design, [尺寸] --ar [比例] --v 6
```

### 12.2 Stable Diffusion 推荐设置

#### 模型推荐
- **主模型**: DreamShaper 8 / Realistic Vision 6.0
- **风格Lora**:
  - Elden Ring Style (权重: 0.6-0.8)
  - Dark Fantasy (权重: 0.5-0.7)
  - Game Asset (权重: 0.4-0.6)

#### 生成参数
```
正提示词: elden ring style, dark fantasy, top-down view,
         [具体描述], game asset, transparent background,
         detailed texture, muted colors

负提示词: bright colors, cartoon, anime, modern,
         photorealistic, 3d render, complex background

采样器: DPM++ 2M Karras
步数: 25-30
CFG: 7-8
分辨率: 512x512 (放大2x)
```

### 12.3 3D模型转2D精灵（Blender）

如需3D模型渲染为2D精灵：

1. **建模**: 低多边形风格（500-2000面）
2. **材质**: PBR材质，金属度0.4-0.8，粗糙度0.3-0.7
3. **灯光**: 三灯布光 + 轮廓光
4. **相机**: 正交投影，45度俯视角度
5. **渲染**: 透明背景，PNG输出
6. **后期**: 在Photoshop/Aseprite中调整像素化效果

---

## ✅ 十三、资源制作检查清单

### 制作优先级

#### P0 - 核心必需（游戏可玩）
- [ ] 玩家角色精灵（1种）
- [ ] 基础怪物精灵（史莱姆、哥布林）
- [ ] 基础地形瓦片（草地、石地）
- [ ] 基础UI（面板、按钮、血条）
- [ ] 基础特效（攻击、受击）
- [ ] 基础音效（攻击、受击、UI）

#### P1 - 重要（完整体验）
- [ ] 所有怪物精灵
- [ ] 所有武器图标
- [ ] 所有炮台精灵
- [ ] 完整地形集
- [ ] Boss资源
- [ ] 完整UI系统
- [ ] BGM音乐

#### P2 - 增强（品质提升）
- [ ] 角色动画帧
- [ ] 环境装饰物
- [ ] 稀有度特效
- [ ] 地形环境特效
- [ ] 完整音效库
- [ ] 字体资源

#### P3 -  polish（完美体验）
- [ ] 额外角色皮肤
- [ ] 动态环境元素
- [ ] 高级特效
- [ ] 多语言支持

---

## 📊 十四、资源统计汇总

| 类别 | 数量估算 | 优先级 |
|------|----------|--------|
| 角色精灵 | 5个职业 x 8动画 = 40+ | P0 |
| 怪物精灵 | 15种 x 4方向 = 60+ | P0-P1 |
| 武器资源 | 5类型 x 6稀有度 = 30+ | P1 |
| 炮台资源 | 8种炮台 | P1 |
| 地形瓦片 | 50+ 瓦片 | P0-P1 |
| 环境装饰 | 30+ 物体 | P1-P2 |
| UI元素 | 100+ 图片 | P0-P1 |
| 特效纹理 | 50+ 粒子 | P1 |
| 背景音乐 | 10首 | P1 |
| 音效 | 50+ | P0-P1 |

**总计**: 约400+ 视觉资源 + 60+ 音频资源

---

## 📞 十五、参考资源

### 艾尔登法环美术参考
- 官方网站: https://en.bandainamcoent.eu/elden-ring
- ArtStation标签: #eldenring #fromsoftware
- 风格特征: 破损盔甲、巨大武器、神秘符文、末日氛围

### Cocos Creator资源商店
- 2D精灵包
- UI主题包
- 特效资源包

### 免费资源网站
- **OpenGameArt**: https://opengameart.org
- **itch.io**: https://itch.io/game-assets
- **CraftPix**: https://craftpix.net
- **Kenney.nl**: https://kenney.nl/assets

---

*文档结束*
