import paper from 'paper'

export const view = {
  size: new paper.Point(500, 500),
  width: 500,
  height: 500,
}

export class Ball {
  private maxVec: number
  private numSegment: number
  private boundOffset: number[]
  boundOffsetBuff: number[];
  sidePoints: paper.Point[];
  path: paper.Path;

  constructor(
    private radius: number,
    private point: paper.Point,
    private vector: paper.Point,
  ) {
    this.maxVec = 15;
    this.numSegment = Math.floor(this.radius / 3 + 2);
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];
    this.path = new paper.Path({
      fillColor: {
        hue: Math.random() * 360,
        saturation: 1,
        brightness: 1
      },
      blendMode: 'lighter'
    });

    for (var i = 0; i < this.numSegment; i++) {
      this.boundOffset.push(this.radius);
      this.boundOffsetBuff.push(this.radius);
      this.path.add(new paper.Point(0, 0));
      this.sidePoints.push(new paper.Point({
        angle: 360 / this.numSegment * i,
        length: 1
      }));
    }
  }

  iterate() {
    this.checkBorders();
    if (this.vector.length > this.maxVec)
      this.vector.length = this.maxVec;
    this.point.add(this.vector);
    this.updateShape();
  }

  checkBorders() {
    if (this.point.x < -this.radius)
      this.point.x = view.width + this.radius;
    if (this.point.x > view.width + this.radius)
      this.point.x = -this.radius;
    if (this.point.y < -this.radius)
      this.point.y = view.height + this.radius;
    if (this.point.y > view.height + this.radius)
      this.point.y = -this.radius;
  }

  updateShape() {
    var segments = this.path.segments;
    for (var i = 0; i < this.numSegment; i++)
      segments[i].point = this.getSidePoint(i);

    this.path.smooth();
    for (var i = 0; i < this.numSegment; i++) {
      if (this.boundOffset[i] < this.radius / 4)
        this.boundOffset[i] = this.radius / 4;
      var next = (i + 1) % this.numSegment;
      var prev = (i > 0) ? i - 1 : this.numSegment - 1;
      var offset = this.boundOffset[i];
      offset += (this.radius - offset) / 15;
      offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
      this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
    }
  }

  react(b: Ball) {
    var dist = this.point.getDistance(b.point);
    if (dist < this.radius + b.radius && dist != 0) {
      var overlap = this.radius + b.radius - dist;
      var direc = this.point.subtract(b.point).normalize(overlap * 0.015);
      this.vector.add(direc);
      b.vector.subtract(direc);
      this.calcBounds(b);
      b.calcBounds(this);
      this.updateBounds();
      b.updateBounds();
    }
  }

  getBoundOffset(b: paper.Point) {
    var diff = this.point.subtract(b);
    var angle = (diff.angle + 180) % 360;
    return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
  }

  calcBounds(b: Ball) {
    for (var i = 0; i < this.numSegment; i++) {
      var tp = this.getSidePoint(i);
      var bLen = b.getBoundOffset(tp);
      var td = tp.getDistance(b.point);
      if (td < bLen) {
        this.boundOffsetBuff[i] -= (bLen - td) / 2;
      }
    }
  }

  getSidePoint(index: number): paper.Point {
    return this.point.add(this.sidePoints[index]).multiply(this.boundOffset[index]);
  }

  updateBounds() {
    for (var i = 0; i < this.numSegment; i++)
      this.boundOffset[i] = this.boundOffsetBuff[i];
  }
}
