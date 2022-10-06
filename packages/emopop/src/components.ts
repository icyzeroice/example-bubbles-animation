import { Types, defineComponent } from "bitecs"

/**
 * @see https://github.com/NateTheGreatt/bitECS/issues/64#issuecomment-1013755855
 */
export const Emotion = defineComponent({
    label: Types.i8
})

export const EmotionEmitter = defineComponent()

export const Circle = defineComponent({
    radius: Types.f32
})

export const Position = defineComponent({
    value: [Types.f32, 2],
})

export const RigidBody = defineComponent({
    mass: Types.i8,
    velocity: [Types.f32, 2],
    acceleration: [Types.f32, 2],

    // 0 - off
    // 1 - on
    on: Types.i8
})

export const TagCreate = defineComponent()
export const TagRemove = defineComponent()

