import { pipe } from "bitecs"

import { TheWorld } from "./context"
import { systems } from "./systems"



const pipeline = pipe(...systems)

export function MainScene() {
  loop()

  function loop() {
    pipeline(TheWorld)
    requestAnimationFrame(loop)
  }
}
