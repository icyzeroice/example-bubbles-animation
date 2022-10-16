import { Types, defineComponent } from "bitecs"

/**
 * @see https://github.com/NateTheGreatt/bitECS/issues/64#issuecomment-1013755855
 */
export const Emotion = defineComponent({
    label: Types.i8,
})

export const EmotionEmitter = defineComponent()

export const Lifetime = defineComponent({
    // milliseconds
    default: Types.f32,

    // milliseconds
    remaining: Types.f32,

    protected: Types.f32,
})

export const Circle = defineComponent({
    radius: Types.f32
})

export const Position = defineComponent({
    value: [Types.f32, 2],
})

export const RigidBody = defineComponent({
    mass: Types.ui32,
    velocity: [Types.f32, 2],
    acceleration: [Types.f32, 2],

    // 0 - off
    // 1 - on
    /** @deprecated */
    on: Types.i8
})

// export const AnimationTicker = defineComponent({
//     total: Types.f32,
//     progress: Types.f32,
// })

export enum RigidBodyOnStatus {
    OFF = 0,
    ON = 1,
}

export const TagCreate = defineComponent()
export const TagRemove = defineComponent()

