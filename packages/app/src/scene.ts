import { paper, Time } from "./context"
import { Ball } from "./ball"
import { ParticleSystem } from "./particle"
import { GRAVITY } from "./settings"
import { createDetectionResultService } from "./server"

let objectPool: Ball[] = []
let isNeedClean = false
let factories: ParticleSystem[] = []

export function onStart() {
  const background = new paper.Raster()
  background.position.set(320, 240)

  setInterval(() => {
    if (!Time.deltaTime) {
      return
    }

    factories.forEach((factory) => {
      objectPool.push(factory.spawn())
    })
  }, 500)

  createDetectionResultService((frame) => {
    background.image = frame.image

    factories.map((factory) => factory.dispose())

    factories = frame.boxes.map((boundary, index) => {

      return new ParticleSystem(
        boundary,
        new paper.Point(0, -1),
        GRAVITY,
        frame.emotions[index]
      )
    })
  })
}

export function onFrame() {
  // stop
  if (!Time.deltaTime) {
    return
  }

  // react
  for (var i = 0; i < objectPool.length - 1; i++) {
    for (var j = i + 1; j < objectPool.length; j++) {
      objectPool[i].react(objectPool[j])
    }

    if (!objectPool[i].isAlive && objectPool[i]["remainingLifetime"] <= 0) {
      isNeedClean = true
    }
  }

  // merge
  // next generation
  if (isNeedClean) {
    objectPool = objectPool.filter((obj) => {
      const needDestroy = !obj.isAlive && obj["remainingLifetime"] <= 0

      if (needDestroy) {
        obj.destroy()
      }

      return !needDestroy
    })

    isNeedClean = false
  }

  // move
  for (var i = 0, l = objectPool.length; i < l; i++) {
    objectPool[i].iterate()
  }
}
