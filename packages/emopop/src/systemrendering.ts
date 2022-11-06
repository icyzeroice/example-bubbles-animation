import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs"
import { memoize } from "lodash"
import { CircleGeometry, Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, WebGLRenderer } from "three"

import { Circle, Emotion, EmotionEmitter, Lifetime, Position } from "./components"
import { EmopopWorld } from "./context"
import { setupMetaballEffects } from "./effects/metaball"
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

    const { composer, passes } = setupMetaballEffects({
        scene,
        camera,
        renderer,
        groupCount: 6
    })

    return {
        scene,
        camera,
        renderer,
        composer,
        passes
    }
}, (world) => world.name)

export function RenderLoopSystem(world: EmopopWorld) {
    rendering(world).renderer.render(rendering(world).scene, rendering(world).camera)
    rendering(world).composer.render()
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

const numberGenerator = memoize((
    min: number = 0,
    max: number = Number.MAX_SAFE_INTEGER - 10,
) => {
    let result = min

    return {
        next() {
            if (result > max) {
                result = min
            }

            return result++
        }
    }
}, (min, max) => `${min}, ${max}`)

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
        mesh.renderOrder = hasComponent(world, EmotionEmitter, eid)
            ? numberGenerator(1000000, 1100000).next()
            : numberGenerator(0, 999999).next()

        rendering(world).scene.add(mesh)
        shapePool(world).set(eid, mesh)
    }

    // update
    const ents = queryEmoji(world)

    // clear
    const passes = rendering(world).passes

    passes.forEach((pass) => {
        pass.selectedObjects = []
    })

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        const mesh = shapePool(world).get(eid)

        const label = Emotion.label[eid]
        const texture = getEmojiTexture(label)

        if (!mesh || !texture) {
            continue
        }

        mesh.material.uniforms.uTexture.value = texture
        // HACK: 有时候 EmotionEmittor 的也会被设置成 1 不知道为啥
        mesh.material.uniforms.uProgress.value = hasComponent(world, EmotionEmitter, eid) ? 0 : Lifetime.animation[eid]
        mesh.position.set(Position.value[eid][0], Position.value[eid][1], 0)

        const radius = Circle.radius[eid]
        mesh.scale.set(radius * 2.1, radius * 2.1, 1)

        // WARNING: the number should be matched
        passes[label].selectedObjects.push(mesh)
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



