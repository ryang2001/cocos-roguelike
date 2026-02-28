/**
 * Cocos Creator Mock
 * 用于测试时模拟Cocos Creator的API
 */

// Vec3 Mock
export class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static distance(a: Vec3, b: Vec3): number {
        return Math.sqrt(
            Math.pow(a.x - b.x, 2) +
            Math.pow(a.y - b.y, 2) +
            Math.pow(a.z - b.z, 2)
        );
    }

    static subtract(out: Vec3, a: Vec3, b: Vec3): Vec3 {
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        out.z = a.z - b.z;
        return out;
    }

    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }
}

// Color Mock
export class Color {
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number = 255, g: number = 255, b: number = 255, a: number = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static WHITE = new Color(255, 255, 255);
    static BLACK = new Color(0, 0, 0);
    static RED = new Color(255, 0, 0);
    static GREEN = new Color(0, 255, 0);
    static BLUE = new Color(0, 0, 255);
}

// Node Mock
export class Node {
    name: string = '';
    position: Vec3 = new Vec3();
    children: Node[] = [];
    components: Map<string, any> = new Map();
    active: boolean = true;

    addComponent<T>(type: string): T {
        const instance = { node: this } as T;
        this.components.set(type, instance);
        return instance;
    }

    getComponent<T>(type: string): T | null {
        return this.components.get(type) || null;
    }

    setPosition(x: number, y: number, z?: number): void {
        this.position.x = x;
        this.position.y = y;
        if (z !== undefined) this.position.z = z;
    }
}

// Component Mock
export class Component {
    node: Node = new Node();
    enabled: boolean = true;

    onLoad?(): void;
    onEnable?(): void;
    onDisable?(): void;
    onDestroy?(): void;
    update?(deltaTime: number): void;
}

// _decorator Mock
export const _decorator = {
    ccclass: (name: string) => (target: any) => target,
    property: (options?: any) => (target: any, propertyKey: string) => {},
    menu: (path: string) => (target: any) => target,
    executeInEditMode: () => (target: any) => target,
};

// Director Mock
export const director = {
    getScene: () => ({
        getComponentInChildren: () => null,
    }),
    loadScene: (name: string, callback?: () => void) => {
        if (callback) callback();
    },
    addPersistRootNode: (node: Node) => {},
};

// Resources Mock
export const resources = {
    load: (path: string, type: any, callback: (err: any, asset: any) => void) => {
        callback(null, null);
    },
};

// Layers Mock
export const Layers = {
    Enum: {
        UI_2D: 1 << 0,
    },
};

// Camera Mock
export class Camera {
    static ProjectionType = {
        ORTHO: 0,
        PERSPECTIVE: 1,
    };
    projection: number = Camera.ProjectionType.ORTHO;
    orthoHeight: number = 320;
    near: number = 0.1;
    far: number = 5000;
    visibility: number = 1;
    priority: number = 0;
    node: Node = new Node();
}

// Canvas Mock
export class Canvas {
    node: Node = new Node();
}

// Sprite Mock
export class Sprite {
    spriteFrame: any = null;
    color: Color = Color.WHITE;
}

// Label Mock
export class Label {
    string: string = '';
    fontSize: number = 20;
    color: Color = Color.WHITE;
    enableOutline: boolean = false;
    outlineColor: Color = Color.BLACK;
    outlineWidth: number = 1;
}

// UITransform Mock
export class UITransform {
    width: number = 100;
    height: number = 100;
    anchorPoint = { x: 0.5, y: 0.5 };

    setContentSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
}

// SpriteFrame Mock
export class SpriteFrame {}

// Prefab Mock
export class Prefab {}

// AudioClip Mock
export class AudioClip {}

// AudioSource Mock
export class AudioSource {
    clip: AudioClip | null = null;
    volume: number = 1;
    loop: boolean = false;
    playing: boolean = false;

    play(): void {
        this.playing = true;
    }
    stop(): void {
        this.playing = false;
    }
    pause(): void {
        this.playing = false;
    }
}

// Tween Mock
export function tween(target: any) {
    return {
        to: (duration: number, props: any, options?: any) => tween(target),
        by: (duration: number, props: any) => tween(target),
        delay: (duration: number) => tween(target),
        call: (callback: () => void) => tween(target),
        parallel: (...tweens: any[]) => tween(target),
        start: () => {},
    };
}

// Game Globals
declare global {
    var tt: any;
}

// Export default
export default {
    Vec3,
    Color,
    Node,
    Component,
    director,
    resources,
    Layers,
    Camera,
    Canvas,
    Sprite,
    Label,
    UITransform,
    SpriteFrame,
    Prefab,
    AudioClip,
    AudioSource,
    tween,
    _decorator,
};
