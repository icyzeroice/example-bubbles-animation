import { defineQuery } from "bitecs"
import { vec2 } from "gl-matrix"
import { Position, Velocity } from "../components"

import { EmopopWorld } from "../context"

const movementQuery = defineQuery([Position, Velocity])

const GRAVITY = vec2.set(vec2.create(), 0, 2)

export const PhysicsSystem = (world: EmopopWorld) => {
  const ents = movementQuery(world)

  for (let i = 0; i < ents.length; i++) {
    const eid = ents[i]

    vec2.add(
      Position.value[eid],
      Position.value[eid],
      vec2.multiply(vec2.create(), Velocity.value[eid], GRAVITY)
    )
  }

  return world
}
