import "./style.css"
import { MainScene } from "./scene"
import { preloadEmojiTextures } from "./emoji"
import { backend, createDetectionResultService } from "./server"
import { once } from "lodash"
import { TheWorld } from "./context"
import { getEmotionIndex } from "emoji-set"
import { vec2 } from "gl-matrix"


const onStart = once((image: HTMLImageElement) => {
    const width = image.width
    const height = image.height

    const targetAspect = document.body.clientWidth / document.body.clientHeight
    const soruceAspect = width / height

    const scale = targetAspect > soruceAspect
        ? document.body.clientHeight / height
        : document.body.clientWidth / width

    TheWorld.screen.scale = scale
    TheWorld.screen.width = width
    TheWorld.screen.height = height
    TheWorld.settings.radiusUnit = Math.ceil(Math.min(width, height) * 0.02)
    TheWorld.settings.defaultVelocity[1] = Math.ceil(height / 4)
    TheWorld.settings.gravity[1] = Math.ceil(height / 4)

    MainScene()

    return {
        width, height
    }
})

preloadEmojiTextures().then(() => {

    createDetectionResultService(
        /** when data source update */
        (frame) => {
            // HACK: 在 onStart 之前更新 image 是为了保证 image 非空方便写代码
            backend().image = frame.image

            const { width, height } = onStart(frame.image)

            backend().emotions = frame.emotions.map((emotion, index) => {
                const box = frame.boxes[index]

                const label = getEmotionIndex(emotion)
                const radius = Math.max(box[2] - box[0], box[3] - box[1]) / 2
                const position = transformImageCoordToWorldCoord(vec2.scale(vec2.create(), vec2.set(vec2.create(), box[0] + box[2], box[1] + box[3]), 0.5), width, height)

                return {
                    label,
                    position,
                    radius,
                }
            })

        }
    )

})

function transformImageCoordToWorldCoord(coord: vec2, _: number, height: number): vec2 {
    return vec2.add(coord, vec2.set(coord, coord[0], -coord[1]), vec2.set(vec2.create(), 0, height))
}

