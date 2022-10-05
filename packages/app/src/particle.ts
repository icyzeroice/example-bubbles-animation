import { paper } from "./context"
import { Ball } from "./ball"
import { EmotionName } from "emoji-set"
import { getClassifiedColor } from "./classify"

export class ParticleSystem {
  private readonly DIRECTION_RANGE: number = 60

  private readonly path: paper.Path

  // private readonly GIZMO_LENGTH = 100

  // private readonly gizmo: paper.Path

  private readonly box: paper.Path

  private readonly position: paper.Point

  private readonly text: paper.PointText

  constructor(
    boundary: [number, number, number, number],
    private velocity: paper.Point,
    private acceleration: paper.Point,
    private name: EmotionName
  ) {
    this.box = new paper.Path({
      strokeColor: 'green',
    })

    this.box.add(new paper.Point(boundary[0], boundary[1]))
    this.box.add(new paper.Point(boundary[2], boundary[1]))
    this.box.add(new paper.Point(boundary[2], boundary[3]))
    this.box.add(new paper.Point(boundary[0], boundary[3]))
    this.box.add(new paper.Point(boundary[0], boundary[1]))


    this.position = new paper.Point(boundary[0] + boundary[2], boundary[1] + boundary[3]).divide(2)
    const radius = Math.max(boundary[2] - boundary[0], boundary[3] - boundary[1]) / 2


    this.text = new paper.PointText({
      point: new paper.Point(boundary[2], boundary[3]),
      content: this.name,
      fillColor: getClassifiedColor(this.name),
      fontFamily: 'Courier New',
      fontWeight: 'bold',
      fontSize: 25
    })


    // this.gizmo = new paper.Path()
    // this.gizmo.strokeColor = new paper.Color(0, 0, 0, 1)
    // this.gizmo.fillColor = new paper.Color(0, 0, 0, 1)
    // this.gizmo.add(position)
    // this.gizmo.add(position)
    // this.drawGizmo(this.velocity)

    this.path = new paper.Path.Circle(this.position, radius)
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
    this.box.remove()
    this.path.remove()
    this.text.remove()
  }
}
