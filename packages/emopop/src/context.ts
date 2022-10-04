import { IWorld, createWorld } from "bitecs"

export interface EmopopWorld extends IWorld {
  time: {
    delta: number
    elapsed: number
    absolute: number
  }
}

export const TheWorld = createWorld<EmopopWorld>()

TheWorld.time = { delta: 0, elapsed: 0, absolute: performance.now() }
