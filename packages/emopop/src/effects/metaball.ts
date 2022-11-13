import {
    Camera,
    Scene,
    ShaderMaterialParameters,
    Vector2,
    WebGLRenderer,
} from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

import { MetaballPass } from './metaballpass'
import MetaballVertexShader from './metaball.vert.glsl?raw'
import MetaballFragmentShader from './metaball.frag.glsl?raw'


interface EffectContext {
    scene: Scene
    renderer: WebGLRenderer
    camera: Camera

    resolution: Vector2

    /**
     * 按照表情素材数量给
     */
    groupCount: number
}

export function setupMetaballEffects({
    scene,
    renderer,
    camera,
    resolution,
    groupCount,
}: EffectContext) {
    const composer = new EffectComposer(renderer)

    // const passRender = new RenderPass(scene, camera)
    // composer.addPass(passRender)

    // const passMetaball = new ShaderPass(createMetaballShaders())
    // passMetaball.renderToScreen = true
    // composer.addPass(passMetaball)

    const passes = Array.from(new Array(groupCount), (_, index) => {
        const passSelectedMetaball = new MetaballPass(
            resolution,
            scene,
            camera,
            scene.children,
            index === 0,
        )

        composer.addPass(passSelectedMetaball)

        return passSelectedMetaball
    })


    return { composer, passes }
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

