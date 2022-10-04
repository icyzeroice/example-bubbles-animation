import { EmotionName } from 'emoji-set'

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


const imageUtil = document.createElement('img')

// @debug
// document.querySelector('#app')!.append(imageUtil)

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
    // const channel = new WebSocket(`ws://${window.location.host}/camera`)
    const channel = new WebSocket(`ws://127.0.0.1:8000/camera`)

    channel.onmessage = async function (evt) {
        const frame = JSON.parse(evt.data) as DetectionResultFrame

        const image = await decodeImage(frame.image)

        onmessage({
            image: image,
            boxes: frame.detection.boxes,
            emotions: frame.detection.emotions
        })
    }

    channel.onopen = function () {
        channel.send("ready");
    };


    return
}