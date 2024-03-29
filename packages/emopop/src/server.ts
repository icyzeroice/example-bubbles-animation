import { EmotionName } from 'emoji-set'
import { vec2 } from 'gl-matrix'
import { memoize } from 'lodash'
import { whenDebug } from './env'
import { mockBoxes, mockEmotions } from './server.fixture'

interface DetectionResultFrame {
    image: string

    detection: {
        boxes: [number, number, number, number][]
        emotions: EmotionName[]
    }
}

interface DetectionResultDecodedFrame {
    image: HTMLImageElement
    boxes: [number, number, number, number][]
    emotions: EmotionName[]
}


const imageUtil = document.querySelector<HTMLImageElement>("#background")!


async function decodeImage(content: string): Promise<HTMLImageElement> {

    imageUtil.src = "data:image/jpeg;base64," + content


    return new Promise<HTMLImageElement>((resolve, reject) => {

        imageUtil.onload = function () {
            resolve(imageUtil)
        }

        imageUtil.onerror = function (err) {
            reject(err)
        }

    })
}


const fpsRecorder = memoize(() => {
    let last = performance.now()
    let total = 0
    let fps = 0

    return {
        tick() {
            const current = performance.now()
            total += (current - last)
            fps += 1
            last = current
        },

        print() {
            if (total > 1000) {
                console.log('fps', fps)
                total = 0
                fps = 0
            }
        }
    }
})

const urlNeedRevoke = new Set<string>()

async function readImage(content?: Uint8Array): Promise<HTMLImageElement> {
    if (!content) {
        return imageUtil
    }

    whenDebug(() => {
        fpsRecorder().tick()
        fpsRecorder().print()
    })

    if (imageUtil.src) {
        urlNeedRevoke.add(imageUtil.src)
    }

    const url = URL.createObjectURL(new Blob([content], { type: 'image/jpeg' }))
    imageUtil.src = url

    return new Promise<HTMLImageElement>((resolve, reject) => {

        imageUtil.onload = function () {
            urlNeedRevoke.forEach((value) => {
                URL.revokeObjectURL(value)
            })
            urlNeedRevoke.clear()

            resolve(imageUtil)
        }

        imageUtil.onerror = function (err) {
            reject(err)
        }

    })
}


// const dataNeedPrint: any[] = []

// setTimeout(() => {
//     console.log(JSON.stringify(dataNeedPrint))
// }, 5000)


export function createDetectionResultService(onmessage: (frame: DetectionResultDecodedFrame) => void) {
    // if (process.env.NODE_ENV === 'development') {
    //     setInterval(() => {
    //         onmessage({
    //             image: { width: 1920, height: 1080 } as unknown as HTMLImageElement,
    //             boxes: [
    //                 [100, 900, 200, 1000],
    //             ],
    //             emotions: [
    //                 'Anger',
    //             ],
    //         })
    //     }, 1000)
    //     return
    // }

    // if (process.env.NODE_ENV === 'development') {
    //     setInterval(() => {
    //         onmessage({
    //             image: { width: 1920, height: 1080 } as unknown as HTMLImageElement,
    //             boxes: mockBoxes,
    //             emotions: mockEmotions as EmotionName[],
    //         })
    //     }, 1000)
    //     return
    // }

    let lastFrame: DetectionResultFrame = {
        image: '',
        detection: {
            boxes: [],
            emotions: [],
        },
    }

    // const channel = new WebSocket(`ws://${window.location.host}/camera`)
    const channel = new WebSocket(`ws://127.0.0.1:8000/camera`)

    channel.binaryType = 'arraybuffer'

    channel.onmessage = async function (evt) {
        if (typeof evt.data === 'string') {
            const frame = JSON.parse(evt.data) as DetectionResultFrame

            // dataNeedPrint.push(frame)

            // 后端可能会传不同的长度，所以这里做安全处理
            const faceCount = Math.min(frame.detection.boxes.length, frame.detection.emotions.length)

            lastFrame.detection = {
                boxes: frame.detection.boxes.slice(0, faceCount),
                emotions: frame.detection.emotions.slice(0, faceCount),
            }
        }

        onmessage({
            image: await readImage(typeof evt.data !== 'string' ? evt.data : undefined),
            boxes: lastFrame.detection.boxes,
            emotions: lastFrame.detection.emotions,
        })
    }

    channel.onopen = function () {
        channel.send("ready");
    };


    return
}

export interface BackendEmotion {
    label: number
    position: vec2
    radius: number
}

// const mocks: () => BackendEmotion[] = () => ([{
//     label: 1,
//     position: vec2.set(vec2.create(), 100, 200),
//     radius: 50,
// }, {
//     label: 2,
//     position: vec2.set(vec2.create(), 200, 200),
//     radius: 30,
// }])


export const backend = memoize(() => {
    let image: HTMLImageElement
    let labels: BackendEmotion[] = []

    return {
        get image() {
            return image
        },
        get emotions(): BackendEmotion[] {
            // return mocks()
            return labels
        },

        set image(value: HTMLImageElement) {
            image = value
        },

        set emotions(value: BackendEmotion[]) {
            labels = value
        },

        dispose() {

        }
    }
})