import { EmopopWorld } from "../context"

export const TimeSystem = (world: EmopopWorld) => {
  const { time } = world
  const now = performance.now()
  const delta = now - time.absolute
  time.delta = delta
  time.elapsed += delta
  time.absolute = now
  return world
}
