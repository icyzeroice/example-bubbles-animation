import "./style.css"
import { paper } from "./context"
import { Ball, view } from "./ball"

const balls: Ball[] = []
const numBalls = 18

for (var i = 0; i < numBalls; i++) {
  const position = paper.Point.random().multiply(view.size)

  const velocity = new paper.Point({
    angle: 360 * Math.random(),
    length: Math.random() * 10,
  })

  const radius = Math.random() * 30 + 30

  balls.push(new Ball(radius, position, velocity))
}

;(function onFrame() {
  for (var i = 0; i < balls.length - 1; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      balls[i].react(balls[j])
    }
  }

  for (var i = 0, l = balls.length; i < l; i++) {
    balls[i].iterate()
  }

  requestAnimationFrame(onFrame)
})()
