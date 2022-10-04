import { once } from "lodash"
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

  const initialize = once((image: HTMLImageElement) => {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!
    canvas.style.width = image.width + 'px'
    canvas.style.height = image.height + 'px'

    background.position.set(image.width / 2, image.height / 2)
    paper.view.viewSize.width = image.width
    paper.view.viewSize.height = image.height
  })

  setInterval(() => {
    if (!Time.deltaTime) {
      return
    }

    factories.forEach((factory) => {
      objectPool.push(factory.spawn())
    })
  }, 500)

  createDetectionResultService((frame) => {
    initialize(frame.image)

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
