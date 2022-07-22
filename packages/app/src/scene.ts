import { paper, Time } from "./context"
import { Ball } from "./ball"
import { ParticleSystem } from "./particle"

const factories: ParticleSystem[] = []
const balls: Ball[] = []
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
    balls.push(factory.spawn())
  })

  setInterval(() => {
    if (!Time.deltaTime) {
      return
    }

    factories.forEach((factory) => {
      balls.push(factory.spawn())
    })
  }, 300)
}

export function onFrame() {
  // stop
  if (!Time.deltaTime) {
    return
  }

  // react
  for (var i = 0; i < balls.length - 1; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      balls[i].react(balls[j])
    }
  }

  // merge

  // move
  for (var i = 0, l = balls.length; i < l; i++) {
    balls[i].iterate()
  }
}
