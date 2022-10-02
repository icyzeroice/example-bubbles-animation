import { paper, Time } from "./context"
import { Ball } from "./ball"
import { ParticleSystem } from "./particle"
import { GRAVITY } from "./settings"

let objectPool: Ball[] = []
let isNeedClean = false
const factories: ParticleSystem[] = []

export function onStart() {
  factories.push(
    new ParticleSystem(
      new paper.Point(200, 700),
      new paper.Point(0, -1),
      GRAVITY
    ),

    // new ParticleSystem(
    //   new paper.Point(400, 700),
    //   new paper.Point(0, -1),
    //   gravity
    // ),

    new ParticleSystem(
      new paper.Point(600, 700),
      new paper.Point(0, -1),
      GRAVITY
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
  }, 500)
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
