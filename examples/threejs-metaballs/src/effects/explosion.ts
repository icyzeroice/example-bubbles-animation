import { ShaderMaterial, Texture } from "three";

import ExplosionVertexShader from './explosion.vert.glsl?raw'
import ExplosionFragmentShader from './explosion.frag.glsl?raw'


export function createExplotionMaterial({
    texture
}: {
    texture: Texture
}) {
    // const material = new MeshBasicMaterial({
    //     color: 0xffffff,
    //     side: DoubleSide,
    //     transparent: true,
    //     map: texture,
    // })

    const material = new ShaderMaterial({
        uniforms: {
            uTexture: {
                value: texture
            },

            uProgress: {
                value: 0.0,
            }
        },
        vertexShader: ExplosionVertexShader,
        fragmentShader: ExplosionFragmentShader,
        fog: true
    })

    material.transparent = true

    return material
}