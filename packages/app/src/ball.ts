import { getClassifiedColor } from "./colors"
import { paper } from "./context"

export const view = {
  size: new paper.Point(paper.view.viewSize.width, paper.view.viewSize.height),
  width: paper.view.viewSize.width,
  height: paper.view.viewSize.height,
}

/**
 * - 位置
 * - 边界点相对位置的偏移
 * - 边界点的长度（用于表示碰撞时的凹陷）
 */
export class Ball {
  private readonly maxVelocity: number
  private readonly numSegment: number
  private readonly gameObject: paper.Path

  private boundOffset: number[]
  private boundOffsetBuff: number[]
  private points: paper.Point[]

  // simulate the resistance
  private velocityLoss = 0.005

  constructor(
    private position: paper.Point,
    private velocity: paper.Point,
    private acceleration: paper.Point,
    private readonly radius: number
  ) {
    this.maxVelocity = 15
    // this.numSegment = Math.floor(this.radius / 3 + 2)
    this.numSegment = 30

    this.gameObject = new paper.Path({
      fillColor: getClassifiedColor(),
      blendMode: "lighter",
    })

    this.points = []

    this.boundOffset = []
    this.boundOffsetBuff = []

    for (let i = 0; i < this.numSegment; i++) {
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
    this.updatePosition()
    this.updateShape()
  }

  /**
   * TODO: need to change the updating strategy to using the delta time
   */
  updatePosition() {
    const nextVelocity = this.velocity.add(this.acceleration.multiply(0.01))
    const normal = nextVelocity.normalize()
    const scale = nextVelocity.multiply(normal).subtract(this.velocityLoss)

    this.velocity = scale.multiply(normal)

    if (this.velocity.length > this.maxVelocity) {
      this.velocity.length = this.maxVelocity
    }

    if (this.velocity.length < 0) {
      this.velocity.length = 0
    }

    this.position = this.position.add(this.velocity)
  }

  /**
   * 位置超出范围时从另一边保持速度出现
   */
  private checkBorders() {
    // reach to the left boundary
    if (this.position.x < -this.radius) {
      this.position.x = view.width + this.radius
    }

    // reach to the right boundary
    if (this.position.x > view.width + this.radius) {
      this.position.x = -this.radius
    }

    // reach to the top boundary
    if (this.position.y < this.radius) {
      this.position.y = this.radius

      // 碰撞让速度损失一半
      this.velocity.y = -this.velocity.y / 2
    }

    // reach to the bottom boundary
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

      const next = (i + 1) % this.numSegment
      const prev = i > 0 ? i - 1 : this.numSegment - 1
      let offset = this.boundOffset[i]
      offset += (this.radius - offset) / 15
      offset +=
        ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3
      this.boundOffsetBuff[i] = this.boundOffset[i] = offset
    }
  }

  react(b: Ball) {
    const dist = this.position.getDistance(b.position)

    if (dist < this.radius + b.radius && dist != 0) {
      const overlap = this.radius + b.radius - dist
      const direc = this.position
        .subtract(b.position)
        .normalize(overlap * 0.015)

      this.velocity = this.velocity.add(direc)
      b.velocity = b.velocity.subtract(direc)

      this.calcBounds(b)
      b.calcBounds(this)

      this.updateBounds()
      b.updateBounds()
    }
  }

  private getBoundOffset(b: paper.Point) {
    const diff = this.position.subtract(b)
    const angle = (diff.angle + 180) % 360
    return this.boundOffset[Math.floor((angle / 360) * this.boundOffset.length)]
  }

  private calcBounds(b: Ball) {
    for (let i = 0; i < this.numSegment; i++) {
      const tp = this.getSidePoint(i)
      const bLen = b.getBoundOffset(tp)
      const td = tp.getDistance(b.position)
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
    for (let i = 0; i < this.numSegment; i++) {
      this.boundOffset[i] = this.boundOffsetBuff[i]
    }
  }

  destroy() {
    this.gameObject.remove()
  }
}
