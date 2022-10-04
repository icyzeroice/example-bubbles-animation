import "./style.css"
import { onStart, onFrame } from "./scene"
import { mainlogic } from "./context"
import { createDetectionResultService } from './server'



const videoCanvas = document.querySelector<HTMLCanvasElement>('#video')!


const videoContext = videoCanvas.getContext('2d')!

createDetectionResultService((frame) => {
    videoContext.drawImage(frame.image, 0, 0)
})

mainlogic({ onStart, onFrame })
