import { EmotionName } from 'emoji-set'
import { vec2 } from 'gl-matrix'
import { memoize } from 'lodash'

interface DetectionResultFrame {
    image: string
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


export function createDetectionResultService(onmessage: (frame: DetectionResultDecodedFrame) => void) {
    if (process.env.NODE_ENV === 'development') {
        setInterval(() => {
            onmessage({
                image: { width: 1920, height: 1080 } as unknown as HTMLImageElement,
                boxes: [[1600, 900, 1700, 1000], [1650, 900, 1750, 1000]],
                emotions: ['Anger', 'Contempt'],
                timestamp: performance.now()
            })
        }, 1000)


        return
    }

    // const channel = new WebSocket(`ws://${window.location.host}/camera`)
    const channel = new WebSocket(`ws://127.0.0.1:8000/camera`)

    channel.onmessage = async function (evt) {
        const frame = JSON.parse(evt.data) as DetectionResultFrame

        const image = await decodeImage(frame.image)

        onmessage({
            image: image,
            boxes: frame.detection.boxes.slice(0, frame.detection.emotions.length),
            emotions: frame.detection.emotions,
            timestamp: frame.timestamp
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