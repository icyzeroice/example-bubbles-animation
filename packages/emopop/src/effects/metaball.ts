import {
    Camera,
    Scene,
    ShaderMaterialParameters,
    WebGLRenderer,
} from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import MetaballVertexShader from './metaball.vert.glsl?raw'
import MetaballFragmentShader from './metaball.frag.glsl?raw'


interface EffectContext {
    scene: Scene
    renderer: WebGLRenderer
    camera: Camera
}

export function setupMetaballEffects({
    scene,
    renderer,
    camera
}: EffectContext): EffectComposer {
    const composer = new EffectComposer(renderer)

    const passRender = new RenderPass(scene, camera)
    composer.addPass(passRender)

    const selected = scene.children.slice()
    selected.pop()

    const passMetaball = new ShaderPass(createMetaballShaders())
    passMetaball.renderToScreen = true
    composer.addPass(passMetaball)

    // const passSelectedMetaball = new MetaballPass(new Vector2(700, 700), scene, camera, selected)
    // passSelectedMetaball.renderToScreen = true
    // composer.addPass(passSelectedMetaball)

    // const passTestSelectedObjects = new OutlinePass(
    //     new Vector2(700, 700),
    //     scene,
    //     camera,
    //     selected,
    // )
    // passTestSelectedObjects.edgeGlow = 10
    // passTestSelectedObjects.edgeStrength = 10
    // composer.addPass(passTestSelectedObjects)

    return composer
}

function createMetaballShaders(): ShaderMaterialParameters {
    return {
        uniforms: {
            tDiffuse: {
                value: null
            }
        },
        vertexShader: MetaballVertexShader,
        fragmentShader: MetaballFragmentShader,
    }
}

