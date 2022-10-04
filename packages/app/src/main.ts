import "./style.css"
import { onStart, onFrame } from "./scene"
import { mainlogic } from "./context"
import { createDetectionResultService } from './server'




createDetectionResultService()

mainlogic({ onStart, onFrame })
