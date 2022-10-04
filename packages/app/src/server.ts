enum EmotionEnum {
    Anger,
    Contempt,
    Disgust,
    Fear,
    Happiness,
    Neutral,
    Sadness,
    Surprise
}

type EmotionName = keyof typeof EmotionEnum

interface DetectionResultFrame {
    image: string
    detection: {
        boxes: [number, number, number, number][]
        emotions: EmotionName[]
    }
}


const imageUtil = document.createElement('img')

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


export function createDetectionResultService() {
    const channel = new WebSocket(`ws://${window.location.host}/camera`)

    channel.onmessage = function (evt) {
        const frame = JSON.parse(evt.data) as DetectionResultFrame
        console.log(frame.image, frame.detection)
    }

    channel.onopen = function () {
        console.log("websocket channel opened")
        channel.send("ready");
    };


    return
}