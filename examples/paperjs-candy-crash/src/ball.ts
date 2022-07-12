import { paper } from "./context"

export const view = {
  size: new paper.Point(500, 500),
  width: 500,
  height: 500,
}

/**
 * - 位置
 * - 边界点相对位置的偏移
 * - 边界点的长度（用于表示碰撞时的凹陷）
 */
export class Ball {
  private maxVelocity: number
  private numSegment: number
  private boundOffset: number[]
  private boundOffsetBuff: number[]
  private points: paper.Point[]
  private gameObject: paper.Path

  constructor(
    private radius: number,
    private position: paper.Point,
    private velocity: paper.Point
  ) {
    this.maxVelocity = 15
    this.numSegment = Math.floor(this.radius / 3 + 2)

    this.gameObject = new paper.Path({
      fillColor: {
        hue: Math.random() * 360,
        saturation: 1,
        brightness: 1,
      },
      blendMode: "lighter",
    })

    this.points = []

    this.boundOffset = []
    this.boundOffsetBuff = []

    for (var i = 0; i < this.numSegment; i++) {
      this.gameObject.add(position)

      this.points.push(
        new paper.Point({
          angle: (360 / this.numSegment) * i,
          length: 1,
        })
      )

      this.boundOffset.push(this.radius)
      this.boundOffsetBuff.push(this.radius)
    }
  }

  iterate() {
    this.checkBorders()

    this.velocity.length = Math.min(this.maxVelocity, this.velocity.length)

    this.position.add(this.velocity)

    this.updateShape()
  }

  /**
   * 位置超出范围时从另一边保持速度出现
   */
  private checkBorders() {
    if (this.position.x < -this.radius) {
      this.position.x = view.width + this.radius
    }

    if (this.position.x > view.width + this.radius) {
      this.position.x = -this.radius
    }

    if (this.position.y < -this.radius) {
      this.position.y = view.height + this.radius
    }

    if (this.position.y > view.height + this.radius) {
      this.position.y = -this.radius
    }
  }

  /**
   * 根据当前图形位置，更新图形 Path 所有点
   */
  private updateShape() {
    for (let i = 0; i < this.numSegment; i++) {
      this.gameObject.segments[i].point = this.getSidePoint(i)
    }

    this.gameObject.smooth()

    for (let i = 0; i < this.numSegment; i++) {
      if (this.boundOffset[i] < this.radius / 4) {
        this.boundOffset[i] = this.radius / 4
      }

      let next = (i + 1) % this.numSegment
      var prev = i > 0 ? i - 1 : this.numSegment - 1
      var offset = this.boundOffset[i]
      offset += (this.radius - offset) / 15
      offset +=
        ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3
      this.boundOffsetBuff[i] = this.boundOffset[i] = offset
    }
  }

  react(b: Ball) {
    var dist = this.position.getDistance(b.position)

    if (dist < this.radius + b.radius && dist != 0) {
      var overlap = this.radius + b.radius - dist
      var direc = this.position.subtract(b.position).normalize(overlap * 0.015)

      this.velocity.add(direc)
      b.velocity.subtract(direc)

      this.calcBounds(b)
      b.calcBounds(this)

      this.updateBounds()
      b.updateBounds()
    }
  }

  private getBoundOffset(b: paper.Point) {
    var diff = this.position.subtract(b)
    var angle = (diff.angle + 180) % 360
    return this.boundOffset[Math.floor((angle / 360) * this.boundOffset.length)]
  }

  private calcBounds(b: Ball) {
    for (var i = 0; i < this.numSegment; i++) {
      var tp = this.getSidePoint(i)
      var bLen = b.getBoundOffset(tp)
      var td = tp.getDistance(b.position)
      if (td < bLen) {
        this.boundOffsetBuff[i] -= (bLen - td) / 2
      }
    }
  }

  private getSidePoint(index: number): paper.Point {
    return this.points[index]
      .multiply(this.boundOffset[index])
      .add(this.position)
  }

  private updateBounds() {
    for (var i = 0; i < this.numSegment; i++) {
      this.boundOffset[i] = this.boundOffsetBuff[i]
    }
  }
}
