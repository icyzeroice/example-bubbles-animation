import { EmotionName } from 'emoji-set'
import { vec2 } from 'gl-matrix'
import { memoize } from 'lodash'

interface DetectionResultFrame {
    image: string

    /**
     * true - use the last frame data
     */
    skip_detection: boolean
    detection: {
        boxes: [number, number, number, number][]
        emotions: EmotionName[]
    }
    timestamp: number
}

interface DetectionResultDecodedFrame {
    image: HTMLImageElement
    boxes: [number, number, number, number][]
    emotions: EmotionName[]
    timestamp: number
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

async function readImage(content?: Uint8Array): Promise<HTMLImageElement> {
    if (!content) {
        return imageUtil
    }

    imageUtil.src = URL.createObjectURL(new Blob([content], { type: 'image/jpeg' }))

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


export function createDetectionResultService(onmessage: (frame: DetectionResultDecodedFrame) => void) {
    // if (process.env.NODE_ENV === 'development') {
    //     setInterval(() => {
    //         onmessage({
    //             image: { width: 1920, height: 1080 } as unknown as HTMLImageElement,
    //             boxes: [
    //                 [100, 900, 200, 1000],
    //                 [300, 900, 400, 1000],
    //                 [0, 1400, 600, 1000],
    //                 [700, 900, 800, 1000],
    //                 [1000, 900, 1100, 1000],
    //                 [1300, 800, 1500, 1000],
    //                 [1600, 900, 1700, 1000],
    //                 [1650, 900, 1750, 1000],
    //             ],
    //             emotions: [
    //                 'Anger',
    //                 'Contempt',
    //                 'Disgust',
    //                 'Fear',
    //                 'Happiness',
    //                 'Neutral',
    //                 'Sadness',
    //                 'Surprise',
    //             ],
    //             timestamp: performance.now()
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
        skip_detection: false,
        timestamp: performance.now(),
    }

    // const channel = new WebSocket(`ws://${window.location.host}/camera`)
    const channel = new WebSocket(`ws://127.0.0.1:8000/camera`)

    channel.onmessage = async function (evt) {
        fpsRecorder().tick()
        fpsRecorder().print()

        if (typeof evt.data === 'string') {
            const frame = JSON.parse(evt.data) as DetectionResultFrame

            // 后端可能会传不同的长度，所以这里做安全处理
            const faceCount = Math.min(frame.detection.boxes.length, frame.detection.emotions.length)

            lastFrame.detection = {
                boxes: frame.detection.boxes.slice(0, faceCount),
                emotions: frame.detection.emotions.slice(0, faceCount),
            }

            lastFrame.timestamp = frame.timestamp
        }

        onmessage({
            image: await readImage(evt.data !== 'string' ? evt.data : undefined),
            boxes: lastFrame.detection.boxes,
            emotions: lastFrame.detection.emotions,
            timestamp: lastFrame.timestamp
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