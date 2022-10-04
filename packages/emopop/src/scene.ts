import { addEntity, addComponent, pipe } from "bitecs"
import { vec2 } from "gl-matrix"
import { Position, Velocity } from "./components"

import { TheWorld } from "./context"
import { TimeSystem } from "./systems"

const pipeline = pipe(TimeSystem)

const eid = addEntity(TheWorld)
addComponent(TheWorld, Position, eid)
addComponent(TheWorld, Velocity, eid)

vec2.set(Position.value[eid], 1, 1)
vec2.set(Velocity.value[eid], 0, 0)

export function MainScene() {
  loop()

  function loop() {
    pipeline(TheWorld)
    requestAnimationFrame(loop)
  }
}
