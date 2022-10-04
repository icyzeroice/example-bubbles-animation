import paper from "paper"

export { paper }

// 不知道为什么，每个文件引入自己的 paper，似乎是不同的实例？
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!

paper.setup(canvas)


let isWorldPaused = true

canvas.onclick = function () {
  isWorldPaused = !isWorldPaused
}

interface WorldBehavior {
  onStart: () => void
  onFrame: () => void
}

interface WorldTime {
  // milliseconds
  deltaTime: number

  // milliseconds
  absTime: number

  // milliseconds
  lastAbsTime: number
}

const WorldStartTime = performance.now()

export const Time: WorldTime = {
  deltaTime: 0,
  absTime: WorldStartTime,
  lastAbsTime: WorldStartTime,
}

export function mainlogic(behavior: WorldBehavior) {
  behavior.onStart()

  onLoop()

  function onLoop() {
    Time.absTime = performance.now()
    Time.deltaTime = isWorldPaused ? 0 : Time.absTime - Time.lastAbsTime

    behavior.onFrame()

    Time.lastAbsTime = Time.absTime

    requestAnimationFrame(onLoop)
  }
}
