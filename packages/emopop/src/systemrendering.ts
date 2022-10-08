import { defineQuery, enterQuery, exitQuery } from "bitecs"
import { memoize } from "lodash"
import { CircleGeometry, Color, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer } from "three"

import { Circle, Emotion, Position } from "./components"
import { EmopopWorld } from "./context"
import { createEmoji, getEmojiTexture } from "./emoji"




/* -------------------------------------------------------------------------- */
export const rendering = memoize((world: EmopopWorld) => {
    const { width, height } = world.screen

    // origin is left-top corner
    const camera = new OrthographicCamera(
        0, width, height, 0, 1, 1000
    )

    camera.position.set(0, 0, 10)

    camera.up.set(0, 0, 1)

    const scene = new Scene()
    scene.background = new Color(0x111111)

    const renderer = new WebGLRenderer({ antialias: true, canvas: world.dom.canvas })
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
const shapePool = memoize((_: EmopopWorld) =>
    new Map<number, Mesh<CircleGeometry, MeshBasicMaterial>>()
    , (world) => world.name)

const queryEmoji = defineQuery([Emotion, Circle, Position])
const queryEmojiCreated = enterQuery(queryEmoji)
const queryEmojiRemoved = exitQuery(queryEmoji)

export function RenderEmojiSystem(world: EmopopWorld) {
    const entsCreated = queryEmojiCreated(world)
    const ents = queryEmoji(world)
    const entsRemoved = queryEmojiRemoved(world)

    // create
    for (let index = 0; index < entsCreated.length; index++) {
        const eid = entsCreated[index];
        const mesh = createEmoji(Emotion.label[eid])

        if (!mesh) {
            continue
        }

        rendering(world).scene.add(mesh)
        shapePool(world).set(eid, mesh)
    }

    // remove
    for (let index = 0; index < entsRemoved.length; index++) {
        const eid = entsRemoved[index];
        const mesh = shapePool(world).get(eid)

        if (!mesh) {
            continue
        }

        rendering(world).scene.remove(mesh)

        mesh.geometry.dispose()
        mesh.material.dispose()

        shapePool(world).delete(eid)
    }

    // update
    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        const mesh = shapePool(world).get(eid)

        const label = Emotion.label[eid]
        const texture = getEmojiTexture(label)

        if (!mesh || !texture) {
            continue
        }

        mesh.material.map = texture
        mesh.position.set(Position.value[eid][0], Position.value[eid][1], 0)

        const radius = Circle.radius[eid]
        mesh.scale.set(radius, radius, 1)
    }

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



