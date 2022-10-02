import { clamp } from "lodash"
import { getClassifiedColor } from "./classify"
import { paper, Time } from "./context"

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
  private readonly MAX_VELOCITY_SCALE = 15

  private readonly SEGMENT_COUNT = 30

  // simulate the resistance
  private readonly VELOCITY_LOSS_NORMAL = 0.005
  private readonly VELOCITY_LOSS_COLLISION = 0.985

  private readonly LIFETIME_BASE = 3000 // ms

  private readonly gameObject: paper.Path

  private boundOffset: number[]
  private boundOffsetBuff: number[]
  private points: paper.Point[]

  private remainingLifetime = 5000 // ms

  private _isAlive = true

  get isAlive() {
    return this._isAlive
  }

  private get radius() {
    return Math.sqrt(this.mass) * this.scale
  }

  constructor(
    private position: paper.Point,
    private velocity: paper.Point,
    private acceleration: paper.Point,
    private scale: number,
    private mass: number
  ) {
    this.gameObject = new paper.Path({
      fillColor: getClassifiedColor(),
      blendMode: "lighter",
    })

    this.points = []
    this.boundOffset = []
    this.boundOffsetBuff = []

    for (let i = 0; i < this.SEGMENT_COUNT; i++) {
      this.gameObject.add(position)

      this.points.push(
        new paper.Point({
          angle: (360 / this.SEGMENT_COUNT) * i,
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
    this.updateLifetime()
  }

  /**
   * TODO: need to change the updating strategy to using the delta time
   */
  updatePosition() {
    const nextVelocity = this.velocity.add(this.acceleration.multiply(0.01))

    this.velocity = nextVelocity.normalize()
    this.velocity.length = clamp(
      Math.abs(nextVelocity.length) - this.VELOCITY_LOSS_NORMAL,
      0,
      this.MAX_VELOCITY_SCALE
    )

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
    for (let i = 0; i < this.SEGMENT_COUNT; i++) {
      this.gameObject.segments[i].point = this.getSidePoint(i)
    }

    this.gameObject.smooth()

    for (let i = 0; i < this.SEGMENT_COUNT; i++) {
      if (this.boundOffset[i] < this.radius / 4) {
        this.boundOffset[i] = this.radius / 4
      }

      const next = (i + 1) % this.SEGMENT_COUNT
      const prev = i > 0 ? i - 1 : this.SEGMENT_COUNT - 1
      let offset = this.boundOffset[i]
      offset += (this.radius - offset) / 15
      offset +=
        ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3
      this.boundOffsetBuff[i] = this.boundOffset[i] = offset
    }
  }

  private updateLifetime() {
    this.remainingLifetime -= Time.deltaTime

    if (!this._isAlive) {
      this.gameObject.opacity = this.remainingLifetime
    }

    if (this.remainingLifetime <= 0) {
      this._isAlive = false
    }
  }

  react(other: Ball) {
    if (!this._isAlive || !other._isAlive) {
      return
    }

    const dist = this.position.getDistance(other.position)

    if (dist >= this.radius + other.radius || dist === 0) {
      return
    }

    // 合成
    if (this.gameObject.fillColor?.equals(other.gameObject.fillColor!)) {
      this.merge(other)
      return
    }

    // 反弹
    const overlap = this.radius + other.radius - dist
    const direc = this.position
      .subtract(other.position)
      .normalize(overlap * (1 - this.VELOCITY_LOSS_COLLISION))

    this.velocity = this.velocity.add(direc.divide(this.mass * this.mass))
    other.velocity = other.velocity.subtract(
      direc.divide(other.mass * other.mass)
    )

    this.calcBounds(other)
    other.calcBounds(this)

    this.updateBounds()
    other.updateBounds()
  }

  private merge(other: Ball) {
    if (this.mass >= other.mass) {
      Ball.mergeTwoBalls(this, other)
    } else {
      Ball.mergeTwoBalls(other, this)
    }
  }

  private getBoundOffset(b: paper.Point) {
    const diff = this.position.subtract(b)
    const angle = (diff.angle + 180) % 360
    return this.boundOffset[Math.floor((angle / 360) * this.boundOffset.length)]
  }

  private calcBounds(b: Ball) {
    for (let i = 0; i < this.SEGMENT_COUNT; i++) {
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
    for (let i = 0; i < this.SEGMENT_COUNT; i++) {
      this.boundOffset[i] = this.boundOffsetBuff[i]
    }
  }

  explosion() {}

  destroy() {
    this.gameObject.remove()
  }

  static mergeTwoBalls(biggerOne: Ball, smallerOne: Ball) {
    // const nextPosition = biggerOne.position.add(smallerOne.position).divide(2)
    // biggerOne.position = nextPosition
    // smallerOne.position = nextPosition.clone()

    // biggerOne.velocity.x = 0
    // biggerOne.velocity.y = 0
    // smallerOne.velocity.x = 0
    // smallerOne.velocity.y = 0

    // grow
    biggerOne.mass += smallerOne.mass

    biggerOne.remainingLifetime =
      biggerOne.LIFETIME_BASE + biggerOne.mass * 1000
    smallerOne._isAlive = false
    smallerOne.remainingLifetime = 1

    biggerOne.boundOffset = Array.from(
      new Array(biggerOne.SEGMENT_COUNT),
      () => biggerOne.radius
    )

    biggerOne.boundOffsetBuff = Array.from(
      new Array(biggerOne.SEGMENT_COUNT),
      () => biggerOne.radius
    )
  }
}
