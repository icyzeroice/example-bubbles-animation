import { paper } from './context'
import { EmojiConfig, EmojiConfigSet, getEmotionName } from "emoji-set";


export async function loadSvgString(
    content: string,
): Promise<paper.Group> {
    return new Promise((resolve) => {
        paper.project.importSVG(content, (path: paper.Group) => {
            resolve(path)
        })
    })
}



interface EmojiConfigWithTexture extends EmojiConfig {
    path: paper.Path | paper.Group
}

let emojis: EmojiConfigWithTexture[] = []

export async function preloadEmojiTextures() {
    emojis = await Promise.all(EmojiConfigSet.map(async (config) => {
        const path = await loadSvgString(config.svg)

        return {
            ...config,
            path,
        }
    }))

    return emojis
}

export function getEmojiTexture(index: number): paper.Path | paper.Group | undefined {
    const name = getEmotionName(index)
    return emojis.find((emoji) => emoji.alias === name)?.path
}


export function createEmoji(label: number) {
    const path = getEmojiTexture(label)
    return path?.clone()
}