import { pipe } from "bitecs"

import { TheWorld } from "./context"
import { systems } from "./systems"



const pipeline = pipe(...systems)

export function MainScene() {
  requestInterval(() => {
    pipeline(TheWorld)
  }, 10)
}


function requestInterval(callback: () => void, delay: number) {
  let start = performance.now()
  let stop = false

  const intervalFunc = function () {
    performance.now() - start < delay || (start += delay, callback());
    stop || requestAnimationFrame(intervalFunc)
  }

  requestAnimationFrame(intervalFunc);

  return {
    clear: function () { stop = true }
  }
}