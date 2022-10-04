import { Types, defineComponent } from "bitecs"

/**
 * @see https://github.com/NateTheGreatt/bitECS/issues/64#issuecomment-1013755855
 */
export const Position = defineComponent({
  value: [Types.f32, 2],
})

export const Velocity = defineComponent({
  value: [Types.f32, 2],
})
