import { defineQuery, enterQuery, exitQuery } from "bitecs"
import { memoize } from "lodash"
import { CircleGeometry, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, WebGLRenderer } from "three"

import { Circle, Emotion, Lifetime, Position } from "./components"
import { EmopopWorld } from "./context"
import { createEmoji, getEmojiTexture } from "./emoji"
import { backend } from './server'


/* -------------------------------------------------------------------------- */
export const rendering = memoize((world: EmopopWorld) => {
    const { width, height, scale } = world.screen

    // origin is left-top corner
    const camera = new OrthographicCamera(
        0, width, height, 0, 1, 1000
    )

    camera.position.set(0, 0, 10)

    camera.up.set(0, 0, 1)

    const scene = new Scene()

    const renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas: world.dom.canvas,
    })
    renderer.setPixelRatio(devicePixelRatio)
    const viewportWidth = width / devicePixelRatio * scale
    const viewportHeight = height / devicePixelRatio * scale
    renderer.setSize(viewportWidth, viewportHeight)
    renderer.setClearColor(0x000000, 0)

    world.dom.background.style.width = viewportWidth + 'px'
    world.dom.background.style.height = viewportHeight + 'px'

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
    new Map<number, Mesh<CircleGeometry, ShaderMaterial>>()
    , (world) => world.name)

const queryEmoji = defineQuery([Emotion, Circle, Position])
const queryEmojiCreated = enterQuery(queryEmoji)
const queryEmojiRemoved = exitQuery(queryEmoji)

const numberGenerator = memoize((_: EmopopWorld) => {
    const MAX_RESULT = Number.MAX_SAFE_INTEGER - 10
    let result = 0

    return {
        next() {
            if (result > MAX_RESULT) {
                result = 0
            }

            return result++
        }
    }
}, (world) => world.name)

export function RenderEmojiSystem(world: EmopopWorld) {
    // remove
    const entsRemoved = queryEmojiRemoved(world)
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

    // create
    const entsCreated = queryEmojiCreated(world)
    for (let index = 0; index < entsCreated.length; index++) {
        const eid = entsCreated[index];
        const mesh = createEmoji(Emotion.label[eid])

        if (!mesh) {
            continue
        }

        // HACK: renderOrder should be managed
        mesh.renderOrder = numberGenerator(world).next()

        rendering(world).scene.add(mesh)
        shapePool(world).set(eid, mesh)
    }

    // update
    const ents = queryEmoji(world)
    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        const mesh = shapePool(world).get(eid)

        const label = Emotion.label[eid]
        const texture = getEmojiTexture(label)

        if (!mesh || !texture) {
            continue
        }

        mesh.material.uniforms.uTexture.value = texture
        mesh.material.uniforms.uProgress.value = Lifetime.animation[eid]
        mesh.position.set(Position.value[eid][0], Position.value[eid][1], 0)

        const radius = Circle.radius[eid]
        mesh.scale.set(radius, radius, 1)
    }

    return world
}


/* -------------------------------------------------------------------------- */
/*                         render background system                           */
/* -------------------------------------------------------------------------- */
/**
 * @deprecated
 */
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
        update(image: HTMLImageElement) {
            material.map = new Texture(image)
            material.map.needsUpdate = true
        },
        dispose() {
            rendering(world).scene.remove(mesh)
            geometry.dispose()
            material.dispose()
        }
    }
}, (world) => world.name)


/**
 * @deprecated
 * 用 Texture 高频更新图片，链路长，性能差（往往 CPU 占用 100% 也不够）
 */
export function RenderBackgroundSystem(world: EmopopWorld) {
    background(world).update(backend().image)
    return world
}



