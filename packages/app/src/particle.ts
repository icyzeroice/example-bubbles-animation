import { paper } from "./context"
import { Ball } from "./ball"

export class ParticleSystem {
  private readonly gizmo: paper.Path

  private readonly DIRECTION_RANGE: number = 60

  private readonly GIZMO_LENGTH = 100

  constructor(
    private position: paper.Point,
    private velocity: paper.Point,
    private acceleration: paper.Point
  ) {
    this.gizmo = new paper.Path()
    this.gizmo.strokeColor = new paper.Color(0, 0, 0, 1)
    this.gizmo.fillColor = new paper.Color(0, 0, 0, 1)
    this.gizmo.add(position)
    this.gizmo.add(position)
    this.drawGizmo(this.velocity)
  }

  drawGizmo(direction: paper.Point) {
    this.gizmo.segments[1].point = this.position.add(
      direction.normalize().multiply(this.GIZMO_LENGTH)
    )
  }

  spawn(): Ball {
    const radius = 10
    const velocity = this.velocity.rotate(
      (Math.random() - 0.5) * this.DIRECTION_RANGE,
      new paper.Point(0, 0)
    )

    this.drawGizmo(velocity)

    return new Ball(
      this.position.clone(),
      velocity,
      this.acceleration.clone(),
      radius
    )
  }
}
