import { memoize } from "lodash"
import { Vector3 } from "three"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "three/examples/jsm/libs/stats.module.js"

import { EmopopWorld } from "./context"
import { createEmoji } from "./emoji"
import { engine } from "./systemmatter"
import { rendering } from "./systemrendering"


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

const logBounds = memoize((world: EmopopWorld) => {

    console.log(
        engine(world).world.bodies
            .filter((body) => body.label === "Rectangle Body")
            .map((body) => body.bounds)
    )

}, (world) => world.name)

export function DebugMatterBoundary(world: EmopopWorld) {
    logBounds(world)

    return world
}