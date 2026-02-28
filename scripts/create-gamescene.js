const fs = require('fs');
const path = require('path');

const scenePath = path.join(__dirname, '../assets/scenes/GameScene.scene');

// 简化的 GameScene JSON
const gameSceneData = [
  {
    "__type__": "cc.SceneAsset",
    "_name": "GameScene",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_native": "",
    "scene": { "__id__": 1 }
  },
  {
    "__type__": "cc.Scene",
    "_name": "GameScene",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": null,
    "_children": [
      { "__id__": 2 },
      { "__id__": 4 }
    ],
    "_active": true,
    "_components": [],
    "_prefab": null,
    "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
    "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
    "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
    "_mobility": 0,
    "_layer": 1073741824,
    "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
    "autoReleaseAssets": false,
    "_globals": { "__id__": 6 },
    "_id": "f6388bc2-a898-49bf-a5db-9bb37e5ba687"
  },
  {
    "__type__": "cc.Node",
    "_name": "Main Light",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": { "__id__": 1 },
    "_children": [],
    "_active": true,
    "_components": [{ "__id__": 3 }],
    "_prefab": null,
    "_lpos": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
    "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
    "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
    "_mobility": 0,
    "_layer": 1073741824,
    "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
    "_id": "light-node-001"
  },
  {
    "__type__": "cc.DirectionalLight",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": { "__id__": 2 },
    "_enabled": true,
    "__prefab": null,
    "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
    "_staticSettings": { "__id__": 10 },
    "_visibility": 1822425087,
    "_illuminanceHDR": 65000,
    "_illuminance": 65000,
    "_illuminanceLDR": 1.69271,
    "_id": "dirlight-001"
  },
  {
    "__type__": "cc.Node",
    "_name": "Canvas",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": { "__id__": 1 },
    "_children": [],
    "_active": true,
    "_components": [
      { "__id__": 5 },
      { "__id__": 6 }
    ],
    "_prefab": null,
    "_lpos": { "__type__": "cc.Vec3", "x": 480, "y": 320, "z": 0 },
    "_lrot": { "__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1 },
    "_lscale": { "__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1 },
    "_mobility": 0,
    "_layer": 33554432,
    "_euler": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
    "_id": "canvas-node-001"
  },
  {
    "__type__": "cc.UITransform",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": { "__id__": 4 },
    "_enabled": true,
    "__prefab": null,
    "_contentSize": { "__type__": "cc.Size", "width": 960, "height": 640 },
    "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
    "_id": "canvas-uitransform-001"
  },
  {
    "__type__": "cc.Canvas",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": { "__id__": 4 },
    "_enabled": true,
    "__prefab": null,
    "_cameraComponent": null,
    "_alignCanvasWithScreen": true,
    "_id": "canvas-canvas-001"
  },
  {
    "__type__": "cc.SceneGlobals",
    "ambient": { "__id__": 7 },
    "shadows": { "__id__": 8 },
    "_skybox": { "__id__": 9 },
    "fog": { "__id__": 10 },
    "octree": { "__id__": 11 },
    "skin": { "__id__": 12 },
    "lightProbeInfo": { "__id__": 13 },
    "postSettings": { "__id__": 14 },
    "bakedWithStationaryMainLight": false,
    "bakedWithHighpLightmap": false
  },
  {
    "__type__": "cc.AmbientInfo",
    "_skyColorHDR": { "__type__": "cc.Vec4", "x": 0.2, "y": 0.5, "z": 0.8, "w": 0.520833125 },
    "_skyColor": { "__type__": "cc.Vec4", "x": 0.2, "y": 0.5, "z": 0.8, "w": 0.520833125 },
    "_skyIllumHDR": 20000,
    "_skyIllum": 20000,
    "_groundAlbedoHDR": { "__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1 },
    "_groundAlbedo": { "__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1 },
    "_skyColorLDR": { "__type__": "cc.Vec4", "x": 0.452588, "y": 0.607642, "z": 0.755699, "w": 0 },
    "_skyIllumLDR": 0.8,
    "_groundAlbedoLDR": { "__type__": "cc.Vec4", "x": 0.618555, "y": 0.577848, "z": 0.544564, "w": 0 }
  },
  {
    "__type__": "cc.ShadowsInfo",
    "_enabled": false,
    "_type": 0,
    "_normal": { "__type__": "cc.Vec3", "x": 0, "y": 1, "z": 0 },
    "_distance": 0,
    "_planeBias": 1,
    "_shadowColor": { "__type__": "cc.Color", "r": 76, "g": 76, "b": 76, "a": 255 },
    "_maxReceived": 4,
    "_size": { "__type__": "cc.Vec2", "x": 512, "y": 512 }
  },
  {
    "__type__": "cc.SkyboxInfo",
    "_envLightingType": 0,
    "_envmapHDR": null,
    "_envmap": null,
    "_envmapLDR": null,
    "_diffuseMapHDR": null,
    "_diffuseMapLDR": null,
    "_enabled": false,
    "_useHDR": true,
    "_editableMaterial": null,
    "_reflectionHDR": null,
    "_reflectionLDR": null,
    "_rotationAngle": 0
  },
  {
    "__type__": "cc.FogInfo",
    "_type": 0,
    "_fogColor": { "__type__": "cc.Color", "r": 200, "g": 200, "b": 200, "a": 255 },
    "_enabled": false,
    "_fogDensity": 0.3,
    "_fogStart": 0.5,
    "_fogEnd": 300,
    "_fogAtten": 5,
    "_fogTop": 1.5,
    "_fogRange": 1.2,
    "_accurate": false
  },
  {
    "__type__": "cc.StaticLightSettings",
    "_baked": false,
    "_editorOnly": false,
    "_castShadow": false
  },
  {
    "__type__": "cc.OctreeInfo",
    "_enabled": false,
    "_minPos": { "__type__": "cc.Vec3", "x": -1024, "y": -1024, "z": -1024 },
    "_maxPos": { "__type__": "cc.Vec3", "x": 1024, "y": 1024, "z": 1024 },
    "_depth": 8
  },
  {
    "__type__": "cc.SkinInfo",
    "_enabled": false,
    "_blurRadius": 0.01,
    "_sssIntensity": 3
  },
  {
    "__type__": "cc.LightProbeInfo",
    "_giScale": 1,
    "_giSamples": 1024,
    "_bounces": 2,
    "_reduceRinging": 0,
    "_showProbe": true,
    "_showWireframe": true,
    "_showConvex": false,
    "_data": null,
    "_lightProbeSphereVolume": 1
  },
  {
    "__type__": "cc.PostSettingsInfo",
    "_toneMappingType": 0
  }
];

fs.writeFileSync(scenePath, JSON.stringify(gameSceneData, null, 2), 'utf8');
console.log('GameScene.scene 已创建！');
console.log('请在 Cocos Creator 中按 F5 刷新资源');
