import "./style.css";
import { paper } from "./context";
import { Ball, view } from "./ball";

const path = new paper.Path({
  fillColor: {
    hue: Math.random() * 360,
    saturation: 1,
    brightness: 1,
  },
  blendMode: "lighter",
});

path.strokeColor = "black";

const radius = 100;
const numSegment = Math.floor(radius / 3 + 2);
const position = new paper.Point(200, 200);
path.add(position);

for (var i = 0; i < numSegment; i++) {
  const point = new paper.Point({
    angle: (360 / numSegment) * i,
    length: radius,
  });

  path.segments[i].point = position.add(point);

  path.add(point);
}

path.smooth();

const balls: Ball[] = [];
const numBalls = 18;

for (var i = 0; i < numBalls; i++) {
  const position = paper.Point.random().multiply(view.size);

  const vector = new paper.Point({
    angle: 360 * Math.random(),
    length: Math.random() * 10,
  });

  const radius = Math.random() * 60 + 60;

  balls.push(new Ball(radius, position, vector));
}

(function onFrame() {
  for (var i = 0; i < balls.length - 1; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      balls[i].react(balls[j]);
    }
  }
  for (var i = 0, l = balls.length; i < l; i++) {
    balls[i].iterate();
  }

  requestAnimationFrame(onFrame);
})();
