import { addComponent, addEntity, defineQuery } from "bitecs"
import { vec2 } from "gl-matrix"
import { Emotion, Position, TagCreate, Velocity } from "./components"

import * as THREE from "three"
import { memoize } from "lodash"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "three/examples/jsm/libs/stats.module.js"
import content from "emoji-set/src/assets/1f600.svg?raw"

import { loadSvgString } from "./image"

import { EmopopWorld } from "./context"
import { DoubleSide, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from "three"




/* -------------------------------------------------------------------------- */
/*                                emoji emitter                               */
/* -------------------------------------------------------------------------- */
export function UpdateEmotionEmitterSystem(world: EmopopWorld) {
    const eid = addEntity(world)
    addComponent(world, Position, eid)
    addComponent(world, Velocity, eid)
    addComponent(world, TagCreate, eid)
    addComponent(world, Emotion, eid)

    vec2.set(Position.value[eid], 1, 1)
    vec2.set(Velocity.value[eid], 0, 0)

    return world
}

/* -------------------------------------------------------------------------- */
/*                               physics system                               */
/* -------------------------------------------------------------------------- */
const queryRigidBody = defineQuery([Position, Velocity])

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
    const { clientWidth: width, clientHeight: height } = world.dom.container

    // origin is left-top corner
    const camera = new THREE.OrthographicCamera(
        0, width, height, 0, 1, 1000
    )

    camera.position.set(0, 0, 10)

    camera.up.set(0, 0, 1)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111)

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: world.dom.canvas })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)

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
/*                         render background system                           */
/* -------------------------------------------------------------------------- */
const background = memoize((world: EmopopWorld) => {
    const geometry = new PlaneGeometry(world.screen.width, world.screen.height)
    const material = new MeshBasicMaterial({
        color: 'red'
    })

    const mesh = new Mesh(geometry, material)
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


const emojiExample = memoize(async (world: EmopopWorld) => {
    const texture = new THREE.Texture(await loadSvgString(content, 500, 500))
    texture.needsUpdate = true

    const geometry = new THREE.CircleGeometry(50, 32)
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: DoubleSide,
        transparent: true,
        map: texture,
    })

        ;
    [
        new Vector3(0, 0, 0),
        new Vector3(world.screen.width, world.screen.height, 0),
        new Vector3(world.screen.width, 0, 0),
        new Vector3(0, world.screen.height, 0)
    ].map((position) => {
        const mesh = new Mesh(geometry, material)
        mesh.position.copy(position)
        rendering(world).scene.add(mesh)
    })

}, (world) => world.name)

export function DebugExampleSystem(world: EmopopWorld) {
    emojiExample(world)
    return world
}


export const systems: ((world: EmopopWorld) => EmopopWorld)[] = [
    RenderLoopSystem,
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