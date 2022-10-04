import { paper } from "./context"
import { Ball } from "./ball"
import { EmotionName } from "emoji-set"
import { getClassifiedColor } from "./classify"

export class ParticleSystem {
  private readonly DIRECTION_RANGE: number = 60

  private readonly path: paper.Path

  // private readonly GIZMO_LENGTH = 100

  // private readonly gizmo: paper.Path

  constructor(
    private position: paper.Point,
    private velocity: paper.Point,
    private acceleration: paper.Point,
    private radius: number,
    private name: EmotionName
  ) {
    // this.gizmo = new paper.Path()
    // this.gizmo.strokeColor = new paper.Color(0, 0, 0, 1)
    // this.gizmo.fillColor = new paper.Color(0, 0, 0, 1)
    // this.gizmo.add(position)
    // this.gizmo.add(position)
    // this.drawGizmo(this.velocity)

    this.path = new paper.Path.Circle(this.position, this.radius)
    this.path.fillColor = getClassifiedColor(this.name)
  }

  // drawGizmo(direction: paper.Point) {
  //   this.gizmo.segments[1].point = this.position.add(
  //     direction.normalize().multiply(this.GIZMO_LENGTH)
  //   )
  // }

  spawn(): Ball {
    const scale = 10
    const defaultMass = 1
    const velocity = this.velocity.rotate(
      (Math.random() - 0.5) * this.DIRECTION_RANGE,
      new paper.Point(0, 0)
    )

    // this.drawGizmo(velocity)

    return new Ball(
      this.position.clone(),
      velocity,
      this.acceleration.clone(),
      scale,
      defaultMass,
      this.name
    )
  }

  dispose() {
    this.path.remove()
  }
}
