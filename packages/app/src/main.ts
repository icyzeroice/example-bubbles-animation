import "./style.css"
import { onStart, onFrame } from "./scene"

onStart()
onLoop()

function onLoop() {
  onFrame()
  requestAnimationFrame(onLoop)
}
