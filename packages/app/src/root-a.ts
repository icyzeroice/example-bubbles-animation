import paper from "paper"
import { Ball } from './paper-ball'

const balls: Ball[] = [];
const numBalls = 18;

export function onStart(canvas: HTMLCanvasElement) {
  paper.install(window)
  paper.setup(canvas)

  for (var i = 0; i < numBalls; i++) {
    const position = paper.Point.random().multiply(new paper.Point(500, 500));

    const vector = new paper.Point({
      angle: 360 * Math.random(),
      length: Math.random() * 10
    });

    const radius = Math.random() * 60 + 60;

    balls.push(new Ball(radius, position, vector));
  }


}

export function onFrame() {
  for (var i = 0; i < balls.length - 1; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      balls[i].react(balls[j]);
    }
  }
  for (var i = 0, l = balls.length; i < l; i++) {
    balls[i].iterate();
  }
}


