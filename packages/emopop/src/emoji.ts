import { EmojiConfig, EmojiConfigSet, getEmotionName } from "emoji-set";
import { CircleGeometry, DoubleSide, Mesh, MeshBasicMaterial, Texture } from "three";
import { loadSvgString } from "./image";


interface EmojiConfigWithTexture extends EmojiConfig {
    texture: Texture
}

let emojis: EmojiConfigWithTexture[] = []

export async function preloadEmojiTextures() {
    emojis = await Promise.all(EmojiConfigSet.map(async (config) => {
        const texture = new Texture(await loadSvgString(config.svg, 500, 500))
        texture.needsUpdate = true

        return {
            ...config,
            texture,
        }
    }))

    return emojis
}

export function getEmojiTexture(index: number): Texture | undefined {
    const name = getEmotionName(index)
    return emojis.find((emoji) => emoji.alias === name)?.texture
}


export function createEmoji(label: number) {
    const texture = getEmojiTexture(label)

    if (!texture) {
        return
    }

    // TODO: the same geometry, can be optimized
    const geometry = new CircleGeometry(50, 32)

    const material = new MeshBasicMaterial({
        color: 0xffffff,
        side: DoubleSide,
        transparent: true,
        map: texture,
    })

    const mesh = new Mesh(geometry, material)
    return mesh
}