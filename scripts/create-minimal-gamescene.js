const fs = require('fs');

// Create a minimal GameScene based on BootScene structure
const gameScene = [
  {
    "__type__": "cc.SceneAsset",
    "_name": "GameScene",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_native": "",
    "scene": {
      "__id__": 1
    }
  },
  {
    "__type__": "cc.Scene",
    "_name": "GameScene",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": null,
    "_children": [
      {
        "__id__": 2
      },
      {
        "__id__": 5
      },
      {
        "__id__": 7
      }
    ],
    "_active": true,
    "_components": [],
    "_prefab": null,
    "_lpos": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "_lrot": {
      "__type__": "cc.Quat",
      "x": 0,
      "y": 0,
      "z": 0,
      "w": 1
    },
    "_lscale": {
      "__type__": "cc.Vec3",
      "x": 1,
      "y": 1,
      "z": 1
    },
    "_mobility": 0,
    "_layer": 1073741824,
    "_euler": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "autoReleaseAssets": false,
    "_globals": {
      "__id__": 10
    },
    "_id": "f6388bc2-a898-49bf-a5db-9bb37e5ba687"
  },
  {
    "__type__": "cc.Node",
    "_name": "Main Light",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": {
      "__id__": 1
    },
    "_children": [],
    "_active": true,
    "_components": [
      {
        "__id__": 3
      }
    ],
    "_prefab": null,
    "_lpos": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "_lrot": {
      "__type__": "cc.Quat",
      "x": 0,
      "y": 0,
      "z": 0,
      "w": 1
    },
    "_lscale": {
      "__type__": "cc.Vec3",
      "x": 1,
      "y": 1,
      "z": 1
    },
    "_mobility": 0,
    "_layer": 1073741824,
    "_euler": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "_id": "light-node-001"
  },
  {
    "__type__": "cc.DirectionalLight",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": {
      "__id__": 2
    },
    "_enabled": true,
    "__prefab": null,
    "_color": {
      "__type__": "cc.Color",
      "r": 255,
      "g": 255,
      "b": 255,
      "a": 255
    },
    "_staticSettings": {
      "__id__": 4
    },
    "_visibility": 1822425087,
    "_illuminanceHDR": 65000,
    "_illuminance": 65000,
    "_illuminanceLDR": 1.6927083333333335,
    "_id": "dirlight-001",
    "_csmLevel": 1,
    "_csmLayerLambda": 0.75,
    "_csmOptimizationMode": 2
  },
  {
    "__type__": "cc.StaticLightSettings",
    "_baked": false,
    "_editorOnly": false,
    "_castShadow": false
  },
  {
    "__type__": "cc.Node",
    "_name": "Main Camera",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": {
      "__id__": 1
    },
    "_children": [],
    "_active": true,
    "_components": [
      {
        "__id__": 6
      }
    ],
    "_prefab": null,
    "_lpos": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 100
    },
    "_lrot": {
      "__type__": "cc.Quat",
      "x": 0,
      "y": 0,
      "z": 0,
      "w": 1
    },
    "_lscale": {
      "__type__": "cc.Vec3",
      "x": 1,
      "y": 1,
      "z": 1
    },
    "_mobility": 0,
    "_layer": 1073741824,
    "_euler": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "_id": "camera-node-001"
  },
  {
    "__type__": "cc.Camera",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": {
      "__id__": 5
    },
    "_enabled": true,
    "__prefab": null,
    "_projection": 1,
    "_priority": 0,
    "_fov": 45,
    "_fovAxis": 0,
    "_orthoHeight": 640,
    "_near": 1,
    "_far": 2000,
    "_color": {
      "__type__": "cc.Color",
      "r": 51,
      "g": 51,
      "b": 51,
      "a": 255
    },
    "_depth": 1,
    "_stencil": 0,
    "_clearFlags": 14,
    "_rect": {
      "__type__": "cc.Rect",
      "x": 0,
      "y": 0,
      "width": 1,
      "height": 1
    },
    "_aperture": 19,
    "_shutter": 7,
    "_iso": 0,
    "_screenScale": 1,
    "_visibility": 1822425087,
    "_targetTexture": null,
    "_postProcess": null,
    "_usePostProcess": false,
    "_cameraType": -1,
    "_trackingType": 0,
    "_id": "camera-comp-001"
  },
  {
    "__type__": "cc.Node",
    "_name": "Canvas",
    "_objFlags": 0,
    "__editorExtras__": {},
    "_parent": {
      "__id__": 1
    },
    "_children": [],
    "_active": true,
    "_components": [
      {
        "__id__": 8
      },
      {
        "__id__": 9
      }
    ],
    "_prefab": null,
    "_lpos": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "_lrot": {
      "__type__": "cc.Quat",
      "x": 0,
      "y": 0,
      "z": 0,
      "w": 1
    },
    "_lscale": {
      "__type__": "cc.Vec3",
      "x": 1,
      "y": 1,
      "z": 1
    },
    "_mobility": 0,
    "_layer": 33554432,
    "_euler": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 0,
      "z": 0
    },
    "_id": "canvas-node-001"
  },
  {
    "__type__": "cc.UITransform",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": {
      "__id__": 7
    },
    "_enabled": true,
    "__prefab": null,
    "_contentSize": {
      "__type__": "cc.Size",
      "width": 960,
      "height": 640
    },
    "_anchorPoint": {
      "__type__": "cc.Vec2",
      "x": 0.5,
      "y": 0.5
    },
    "_id": "canvas-uitransform-001"
  },
  {
    "__type__": "cc.Canvas",
    "_name": "",
    "_objFlags": 0,
    "__editorExtras__": {},
    "node": {
      "__id__": 7
    },
    "_enabled": true,
    "__prefab": null,
    "_cameraComponent": null,
    "_alignCanvasWithScreen": true,
    "_id": "canvas-canvas-001"
  },
  {
    "__type__": "cc.SceneGlobals",
    "ambient": {
      "__id__": 11
    },
    "shadows": {
      "__id__": 12
    },
    "_skybox": {
      "__id__": 13
    },
    "fog": {
      "__id__": 14
    },
    "octree": {
      "__id__": 15
    },
    "skin": {
      "__id__": 16
    },
    "lightProbeInfo": {
      "__id__": 17
    },
    "postSettings": {
      "__id__": 18
    },
    "bakedWithStationaryMainLight": false,
    "bakedWithHighpLightmap": false
  },
  {
    "__type__": "cc.AmbientInfo",
    "_skyColorHDR": {
      "__type__": "cc.Vec4",
      "x": 0.2,
      "y": 0.5,
      "z": 0.8,
      "w": 0.520833125
    },
    "_skyColor": {
      "__type__": "cc.Vec4",
      "x": 0.2,
      "y": 0.5,
      "z": 0.8,
      "w": 0.520833125
    },
    "_skyIllumHDR": 20000,
    "_skyIllum": 20000,
    "_groundAlbedoHDR": {
      "__type__": "cc.Vec4",
      "x": 0.2,
      "y": 0.2,
      "z": 0.2,
      "w": 1
    },
    "_groundAlbedo": {
      "__type__": "cc.Vec4",
      "x": 0.2,
      "y": 0.2,
      "z": 0.2,
      "w": 1
    },
    "_skyColorLDR": {
      "__type__": "cc.Vec4",
      "x": 0.452588,
      "y": 0.607642,
      "z": 0.755699,
      "w": 0
    },
    "_skyIllumLDR": 0.8,
    "_groundAlbedoLDR": {
      "__type__": "cc.Vec4",
      "x": 0.618555,
      "y": 0.577848,
      "z": 0.544564,
      "w": 0
    }
  },
  {
    "__type__": "cc.ShadowsInfo",
    "_enabled": false,
    "_type": 0,
    "_normal": {
      "__type__": "cc.Vec3",
      "x": 0,
      "y": 1,
      "z": 0
    },
    "_distance": 0,
    "_planeBias": 1,
    "_shadowColor": {
      "__type__": "cc.Color",
      "r": 76,
      "g": 76,
      "b": 76,
      "a": 255
    },
    "_maxReceived": 4,
    "_size": {
      "__type__": "cc.Vec2",
      "x": 1024,
      "y": 1024
    }
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
    "_fogColor": {
      "__type__": "cc.Color",
      "r": 200,
      "g": 200,
      "b": 200,
      "a": 255
    },
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
    "__type__": "cc.OctreeInfo",
    "_enabled": false,
    "_minPos": {
      "__type__": "cc.Vec3",
      "x": -1024,
      "y": -1024,
      "z": -1024
    },
    "_maxPos": {
      "__type__": "cc.Vec3",
      "x": 1024,
      "y": 1024,
      "z": 1024
    },
    "_depth": 8
  },
  {
    "__type__": "cc.SkinInfo",
    "_enabled": true,
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

const outputPath = 'f:/project/继续下一关/js_version/cocos-roguelike/assets/scenes/GameScene.scene';
fs.writeFileSync(outputPath, JSON.stringify(gameScene, null, 2), 'utf8');
console.log('GameScene.scene created successfully!');
console.log('Total elements:', gameScene.length);
console.log('Scene ID:', gameScene[1]._id);
console.log('');
console.log('Structure:');
console.log('  [0] SceneAsset');
console.log('  [1] Scene (children: 2, 5, 7; globals: 10)');
console.log('  [2] Main Light (component: 3)');
console.log('  [3] DirectionalLight (staticSettings: 4)');
console.log('  [4] StaticLightSettings');
console.log('  [5] Main Camera (component: 6)');
console.log('  [6] Camera');
console.log('  [7] Canvas (components: 8, 9)');
console.log('  [8] UITransform');
console.log('  [9] Canvas');
console.log('  [10] SceneGlobals (ambient: 11, shadows: 12, skybox: 13, fog: 14, octree: 15, skin: 16, lightProbeInfo: 17, postSettings: 18)');
console.log('  [11-18] Global settings');
