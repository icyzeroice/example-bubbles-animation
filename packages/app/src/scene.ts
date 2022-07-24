import { paper, Time } from "./context"
import { Ball } from "./ball"
import { ParticleSystem } from "./particle"

let objectPool: Ball[] = []
let isNeedClean = false
const factories: ParticleSystem[] = []
const gravity = new paper.Point(0, -2)

export function onStart() {
  factories.push(
    new ParticleSystem(
      new paper.Point(200, 700),
      new paper.Point(0, -1),
      gravity
    ),
    new ParticleSystem(
      new paper.Point(600, 700),
      new paper.Point(0, -1),
      gravity
    )
  )

  factories.forEach((factory) => {
    objectPool.push(factory.spawn())
  })

  setInterval(() => {
    if (!Time.deltaTime) {
      return
    }

    factories.forEach((factory) => {
      objectPool.push(factory.spawn())
    })
  }, 300)
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

    if (!objectPool[i].isAlive) {
      isNeedClean = true
    }
  }

  // merge
  // next generation
  if (isNeedClean) {
    objectPool = objectPool.filter((o) => {
      if (!o.isAlive) {
        o.destroy()
      }

      return o.isAlive
    })
    isNeedClean = false
  }

  // move
  for (var i = 0, l = objectPool.length; i < l; i++) {
    objectPool[i].iterate()
  }
}
