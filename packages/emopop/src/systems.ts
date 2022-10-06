import { addComponent, addEntity, defineQuery, removeEntity } from "bitecs"
import { vec2 } from "gl-matrix"
import { Circle, Emotion, EmotionEmitter, Position, RigidBody } from "./components"

import * as THREE from "three"
import { memoize, clamp } from "lodash"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "three/examples/jsm/libs/stats.module.js"

import { backend, EmopopWorld } from "./context"
import { CircleGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from "three"
import { createEmoji, getEmojiTexture } from "./emoji"


export const systems: ((world: EmopopWorld) => EmopopWorld)[] = [
    // business logic
    UpdateEmotionEmitterSystem,
    CreateEmojiSystem,
    UpdateEmotionLifetimeSystem,

    // physical logic
    PhysicsSystem,

    // rendering
    RenderLoopSystem,
    RenderEmojiSystem,
    RenderBackgroundSystem,

    // time setting
    TimeSystem
]

if (process.env.NODE_ENV === 'development') {
    systems.push(
        DebugControlsSystem,
        DebugStatsSystem,
        DebugExampleSystem,
    )
}

/* -------------------------------------------------------------------------- */
/*                                emoji emitter                               */
/* -------------------------------------------------------------------------- */

function createEmotionEmitterEntity(world: EmopopWorld): number {
    const eid = addEntity(world)

    addComponent(world, EmotionEmitter, eid)
    addComponent(world, Emotion, eid)
    addComponent(world, Circle, eid)
    addComponent(world, Position, eid)

    return eid
}

const queryEmotionEmitter = defineQuery([EmotionEmitter, Emotion, Position])

function UpdateEmotionEmitterSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    // clean all
    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        removeEntity(world, eid)
    }

    // re-created all
    for (let index = 0; index < backend().emotions.length; index++) {
        const emotion = backend().emotions[index]
        const eid = createEmotionEmitterEntity(world)

        Emotion.label[eid] = emotion.label
        Circle.radius[eid] = emotion.radius
        vec2.copy(Position.value[eid], emotion.position)
    }

    return world
}

/* -------------------------------------------------------------------------- */
/*                                create emoji                                */
/* -------------------------------------------------------------------------- */
function createEmotionEntity(world: EmopopWorld) {
    const eid = addEntity(world)

    addComponent(world, Emotion, eid)
    addComponent(world, Circle, eid)
    addComponent(world, Position, eid)
    addComponent(world, RigidBody, eid)

    return eid
}

const velocityOrigin = vec2.set(vec2.create(), 0, 0)
const velocityRange = 60 /** degree */ / 180 * Math.PI /** radian */

function initializeEmotionEntityFromEmotionEmitter(world: EmopopWorld, emitterId: number, emotionId: number) {
    Emotion.label[emotionId] = Emotion.label[emitterId]

    Circle.radius[emotionId] = world.settings.radiusUnit

    vec2.copy(Position.value[emotionId], Position.value[emitterId])

    RigidBody.mass[emotionId] = world.settings.massUnit
    vec2.copy(RigidBody.acceleration[emotionId], world.settings.gravity)

    RigidBody.on[emotionId] = 1

    const randomVelocity = vec2.rotate(
        vec2.create(),
        world.settings.defaultVelocity,
        velocityOrigin,
        (Math.random() - 0.5) * velocityRange
    )

    vec2.copy(RigidBody.velocity[emotionId], randomVelocity)
}

let emitDuration = 0

function CreateEmojiSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    emitDuration += world.time.delta

    if (emitDuration < 2000) {
        return world
    }

    // reset acc duration
    emitDuration = 0

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        const childId = createEmotionEntity(world)
        initializeEmotionEntityFromEmotionEmitter(world, eid, childId)
    }

    return world
}


/* -------------------------------------------------------------------------- */
/*                               emoji lifetime                               */
/* -------------------------------------------------------------------------- */
function UpdateEmotionLifetimeSystem(world: EmopopWorld) {
    return world
}


/* -------------------------------------------------------------------------- */
/*                               physics system                               */
/* -------------------------------------------------------------------------- */
function getBorderLossyVelocityComponent(v: number): number {
    const nextV = v / 2

    if (nextV < 1) {
        return 0
    }

    return nextV
}

function getNormalLossyVelocity(v: vec2, unit: number): vec2 {
    const nextVelocityLength = clamp(vec2.length(v) - Math.ceil(unit * 0.005), 0, unit * 2)
    const nextVelocity = vec2.normalize(vec2.create(), v)
    vec2.scale(nextVelocity, nextVelocity, nextVelocityLength)
    return nextVelocity
}

function collision(one: number, other: number) {
    const distance = vec2.distance(Position.value[one], Position.value[other])

    if (distance >= Circle.radius[one] + Circle.radius[other]) {
        return false
    }

    return true
}

/**
 * 我来定一条碰撞规则：
 * 双方速度减半，各自损失的速度为 v1_loss, v2_loss
 * 
 * motivation = v1_loss * m1 + v2_loss * m2 
 * v1_addon = motivation / 2 / m1
 * v2_addon = motivation / 2 / m2
 * 
 * 方向为各自中心的连线上相反
 */
function bounce(one: number, other: number, unit: number) {
    const direction = vec2.subtract(vec2.create(), Position.value[one], Position.value[other])
    vec2.normalize(direction, direction)

    const oneVel = RigidBody.velocity[one]
    const otherVel = RigidBody.velocity[other]
    vec2.scale(oneVel, oneVel, 0.5)
    vec2.scale(otherVel, otherVel, 0.5)

    const oneVelScale = vec2.length(oneVel)
    const otherVelScale = vec2.length(otherVel)

    const motivation = oneVelScale * RigidBody.mass[one] + otherVelScale * RigidBody.mass[other]
    const nextOneVelScale = motivation / 2 / RigidBody.mass[one]
    const nextOtherVelScale = motivation / 2 / RigidBody.mass[other]


}

const queryCircleRigidBody = defineQuery([RigidBody, Circle, Position])

function PhysicsSystem(world: EmopopWorld) {
    const ents = queryCircleRigidBody(world)

    for (let i = 0; i < ents.length; i++) {
        const eid = ents[i]

        // check borders
        const radius = Circle.radius[eid]
        const { width, height } = world.screen
        const x = Position.value[eid][0]
        const y = Position.value[eid][1]

        // reach to the left boundary
        if (x < radius) {
            Position.value[eid][0] = radius
            RigidBody.velocity[eid][0] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][0])
        }

        // reach to the right boundary
        if (x > width - radius) {
            Position.value[eid][0] = width - radius
            RigidBody.velocity[eid][0] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][0])
        }

        // reach to the top boundary
        if (y < radius) {
            Position.value[eid][1] = radius
            RigidBody.velocity[eid][1] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][1])
        }

        // reach to the bottom boundary
        if (y > height - radius) {
            Position.value[eid][1] = height - radius
            RigidBody.velocity[eid][1] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][1])
        }



        // update velocity
        vec2.add(
            RigidBody.velocity[eid],
            RigidBody.velocity[eid],
            vec2.scale(vec2.create(), RigidBody.acceleration[eid], world.time.deltaInSeconds)
        )

        vec2.copy(RigidBody.velocity[eid], getNormalLossyVelocity(RigidBody.velocity[eid], world.settings.defaultVelocity[1]))

        // update position
        vec2.add(
            Position.value[eid],
            Position.value[eid],
            vec2.scale(vec2.create(), RigidBody.velocity[eid], world.time.deltaInSeconds)
        )

        // collision

        if (i === ents.length - 1) {
            continue
        }

        for (var otherIndex = i + 1; otherIndex < ents.length; otherIndex += 1) {
            const otherId = ents[otherIndex]
            if (!collision(eid, otherId)) {
                continue
            }


            if (Emotion.label[eid] === Emotion.label[otherId]) {
                // merge emotion
                continue
            }

            // bounce
        }
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

function RenderLoopSystem(world: EmopopWorld) {
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

function RenderEmojiSystem(world: EmopopWorld) {
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


function RenderBackgroundSystem(world: EmopopWorld) {
    background(world)
    return world
}


/* -------------------------------------------------------------------------- */
/*                                 time system                                */
/* -------------------------------------------------------------------------- */
function TimeSystem(world: EmopopWorld) {
    const { time } = world

    const now = performance.now()
    const delta = now - time.absolute
    time.delta = delta
    time.deltaInSeconds = delta / 1000
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

function DebugControlsSystem(world: EmopopWorld) {
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

function DebugStatsSystem(world: EmopopWorld) {
    stats(world).update()
    return world
}


const emojiExample = memoize((world: EmopopWorld) => {
    [
        new Vector3(0, 0, 0),
        new Vector3(world.screen.width, 0, 0),
        new Vector3(0, world.screen.height, 0)
    ].forEach((position) => {
        const mesh = createEmoji(0)
        mesh?.position.copy(position)
        mesh?.scale.set(30, 30, 1)
        mesh && rendering(world).scene.add(mesh)
    })

}, (world) => world.name)

function DebugExampleSystem(world: EmopopWorld) {
    emojiExample(world)
    return world
}
