import { addComponent, addEntity, defineQuery, removeEntity } from "bitecs"
import { vec2 } from "gl-matrix"
import { Circle, Emotion, EmotionEmitter, Position, RigidBody, Velocity } from "./components"

import * as THREE from "three"
import { memoize } from "lodash"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "three/examples/jsm/libs/stats.module.js"

import { backend, EmopopWorld } from "./context"
import { CircleGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from "three"
import { createEmoji, getEmojiTexture } from "./emoji"




/* -------------------------------------------------------------------------- */
/*                                emoji emitter                               */
/* -------------------------------------------------------------------------- */
const queryEmotionEmitter = defineQuery([Emotion, EmotionEmitter])

export function UpdateEmotionEmitterSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    // clean all
    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        removeEntity(world, eid)
    }

    // re-created all
    for (let index = 0; index < backend().emotions.length; index++) {
        const emotion = backend().emotions[index]
        const eid = addEntity(world)

        addComponent(world, EmotionEmitter, eid)
        addComponent(world, Emotion, eid)
        addComponent(world, Circle, eid)
        addComponent(world, Position, eid)

        Emotion.label[eid] = emotion.label
        Circle.radius[eid] = emotion.radius
        vec2.copy(Position.value[eid], emotion.position)
    }

    return world
}

/* -------------------------------------------------------------------------- */
/*                               physics system                               */
/* -------------------------------------------------------------------------- */
const queryRigidBody = defineQuery([RigidBody, Position, Velocity])

const GRAVITY = vec2.set(vec2.create(), 0, 2)

export function PhysicsSystem(world: EmopopWorld) {
    const ents = queryRigidBody(world)

    for (let i = 0; i < ents.length; i++) {
        const eid = ents[i]

        // update position
        vec2.add(
            Position.value[eid],
            Position.value[eid],
            vec2.multiply(vec2.create(), Velocity.value[eid], GRAVITY)
        )
    }

    return world
}


/* -------------------------------------------------------------------------- */
/*                              render loop system                            */
/* -------------------------------------------------------------------------- */
const rendering = memoize((world: EmopopWorld) => {
    const { width, height } = world.screen

    // origin is left-top corner
    const camera = new THREE.OrthographicCamera(
        0, width, height, 0, 1, 1000
    )

    camera.position.set(0, 0, 10)

    camera.up.set(0, 0, 1)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111)

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: world.dom.canvas })
    renderer.setPixelRatio(devicePixelRatio)
    renderer.setSize(width / devicePixelRatio, height / devicePixelRatio)

    return {
        scene,
        camera,
        renderer,
    }
}, (world) => world.name)

export function RenderLoopSystem(world: EmopopWorld) {
    rendering(world).renderer.render(rendering(world).scene, rendering(world).camera)
    return world
}


/* -------------------------------------------------------------------------- */
/*                             render emoji system                            */
/* -------------------------------------------------------------------------- */
class EmojiObjectPool {
    private emojis = new Map<number, Mesh<CircleGeometry, MeshBasicMaterial>>()

    private unreached = new Set<number>()

    constructor(private context: ReturnType<typeof rendering>) {

    }

    before() {
        // TODO: maybe performance issues
        this.unreached = new Set(this.emojis.keys())
    }

    has(eid: number) {
        return this.emojis.has(eid)
    }

    create(eid: number, label: number) {
        const mesh = createEmoji(label)

        if (!mesh) {
            return
        }

        this.context.scene.add(mesh)
        this.emojis.set(eid, mesh)
        this.unreached.delete(eid)

        return mesh
    }

    update(eid: number, label: number) {
        const mesh = this.emojis.get(eid)

        if (!mesh) {
            return
        }

        const texture = getEmojiTexture(label)

        if (!texture) {
            return
        }

        mesh.material.map = texture
        this.unreached.delete(eid)

        return mesh
    }

    remove(eid: number) {
        const mesh = this.emojis.get(eid)

        if (!mesh) {
            return
        }

        this.context.scene.remove(mesh)

        mesh.geometry.dispose()
        mesh.material.dispose()

        this.emojis.delete(eid)
    }

    after() {
        // remove unreached object
        this.unreached.forEach((eid) => {
            const emoji = this.emojis.get(eid)

            if (emoji) {
                this.context.scene.remove(emoji)
                emoji.geometry.dispose()
                emoji.material.dispose()

                this.emojis.delete(eid)
            }
        })
    }
}

const pool = memoize((world) => new EmojiObjectPool(rendering(world)), (world) => world.name)

const queryEmoji = defineQuery([Emotion, Circle, Position])

export function RenderEmojiSystem(world: EmopopWorld) {
    const ents = queryEmoji(world)

    pool(world).before()

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];

        const mesh = pool(world).has(eid) ? pool(world).update(eid, Emotion.label[eid]) : pool(world).create(eid, Emotion.label[eid])
        mesh?.position.set(Position.value[eid][0], Position.value[eid][1], 0)

        const radius = Circle.radius[eid]
        mesh?.scale.set(radius, radius, 1)
    }

    pool(world).after()

    return world
}


/* -------------------------------------------------------------------------- */
/*                         render background system                           */
/* -------------------------------------------------------------------------- */
const background = memoize((world: EmopopWorld) => {
    const geometry = new PlaneGeometry(world.screen.width, world.screen.height)
    const material = new MeshBasicMaterial({
        color: 0xeeeeee
    })

    const mesh = new Mesh(geometry, material)

    // use z = -1 to make sure the background is under the emoji images
    mesh.position.set(world.screen.width / 2, world.screen.height / 2, -1)

    rendering(world).scene.add(mesh)

    return {
        dispose() {
            rendering(world).scene.remove(mesh)
            geometry.dispose()
            material.dispose()
        }
    }
}, (world) => world.name)


export function RenderBackgroundSystem(world: EmopopWorld) {
    background(world)
    return world
}


/* -------------------------------------------------------------------------- */
/*                             create emoji system                            */
/* -------------------------------------------------------------------------- */
export function UpdateEmitterSystem(world: EmopopWorld) {

    return world
}


/* -------------------------------------------------------------------------- */
/*                                 time system                                */
/* -------------------------------------------------------------------------- */
export function TimeSystem(world: EmopopWorld) {
    const { time } = world

    const now = performance.now()
    const delta = now - time.absolute
    time.delta = delta
    time.elapsed += delta
    time.absolute = now

    return world
}



/* -------------------------------------------------------------------------- */
/*                                debug system                                */
/* -------------------------------------------------------------------------- */
const controls = memoize((world: EmopopWorld) => {
    return new MapControls(rendering(world).camera, world.dom.canvas)
}, (world) => world.name)

export function DebugControlsSystem(world: EmopopWorld) {
    controls(world).update()
    return world
}


const stats = memoize((world: EmopopWorld) => {
    const instance = Stats()
    world.dom.container.append(instance.dom)

    // for debug in console
    // @ts-ignore
    window.__THREE_INFO__ = rendering(world)

    return instance
}, (world) => world.name)

export function DebugStatsSystem(world: EmopopWorld) {
    stats(world).update()
    return world
}


const emojiExample = memoize((world: EmopopWorld) => {
    [
        new Vector3(0, 0, 0),
        new Vector3(world.screen.width, world.screen.height, 0),
        new Vector3(world.screen.width, 0, 0),
        new Vector3(0, world.screen.height, 0)
    ].forEach((position) => {
        const mesh = createEmoji(0)
        mesh?.position.copy(position)
        mesh?.scale.set(30, 30, 1)
        mesh && rendering(world).scene.add(mesh)
    })

}, (world) => world.name)

export function DebugExampleSystem(world: EmopopWorld) {
    emojiExample(world)
    return world
}


export const systems: ((world: EmopopWorld) => EmopopWorld)[] = [
    UpdateEmotionEmitterSystem,
    RenderLoopSystem,
    RenderEmojiSystem,
    RenderBackgroundSystem,
    TimeSystem
]

if (process.env.NODE_ENV === 'development') {
    systems.push(
        DebugControlsSystem,
        DebugStatsSystem,
        DebugExampleSystem,
    )
}