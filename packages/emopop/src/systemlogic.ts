import { addComponent, addEntity, defineQuery, removeComponent, removeEntity } from "bitecs"
import { vec2 } from "gl-matrix"
import { animate } from "popmotion"

import { Circle, Emotion, EmotionEmitter, Lifetime, Position, RigidBody, RigidBodyOnStatus } from "./components"
import { backend, EmopopWorld } from "./context"




/* -------------------------------------------------------------------------- */
/*                                emoji emitter                               */
/* -------------------------------------------------------------------------- */

function createEmotionEmitterEntity(world: EmopopWorld): number {
    const eid = addEntity(world)

    addComponent(world, EmotionEmitter, eid)
    addComponent(world, Emotion, eid)
    // addComponent(world, Circle, eid)
    addComponent(world, Position, eid)

    return eid
}

const queryEmotionEmitter = defineQuery([EmotionEmitter, Emotion, Position])

export function UpdateEmotionEmitterSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    // clean all
    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        removeEntity(world, eid)
    }

    // re-created all
    for (let index = 0; index < backend().emotions.length; index++) {
        const emotion = backend().emotions[index]
        const eid = createEmotionEmitterEntity(world)

        Emotion.label[eid] = emotion.label
        // Circle.radius[eid] = emotion.radius
        vec2.copy(Position.value[eid], emotion.position)
    }

    return world
}

/* -------------------------------------------------------------------------- */
/*                                create emoji                                */
/* -------------------------------------------------------------------------- */
export function createEmotionEntity(world: EmopopWorld) {
    const eid = addEntity(world)

    addComponent(world, Emotion, eid)
    addComponent(world, Circle, eid)
    addComponent(world, Position, eid)
    addComponent(world, RigidBody, eid)
    addComponent(world, Lifetime, eid)

    return eid
}

const velocityOrigin = vec2.set(vec2.create(), 0, 0)
const velocityRange = 60 /** degree */ / 180 * Math.PI /** radian */

function initializeEmotionEntityFromEmotionEmitter(world: EmopopWorld, emitterId: number, emotionId: number) {
    Emotion.label[emotionId] = Emotion.label[emitterId]

    Circle.radius[emotionId] = world.settings.radiusUnit

    vec2.copy(Position.value[emotionId], Position.value[emitterId])

    RigidBody.mass[emotionId] = world.settings.massUnit
    vec2.copy(RigidBody.acceleration[emotionId], world.settings.gravity)

    RigidBody.on[emotionId] = RigidBodyOnStatus.ON

    const randomVelocity = vec2.rotate(
        vec2.create(),
        world.settings.defaultVelocity,
        velocityOrigin,
        (Math.random() - 0.5) * velocityRange
    )

    vec2.copy(RigidBody.velocity[emotionId], randomVelocity)

    const initLifetime = world.settings.lifetimeBase + world.settings.lifetimeUnit * world.settings.massUnit
    Lifetime.default[emotionId] = initLifetime
    Lifetime.remaining[emotionId] = initLifetime
}

let emitDuration = 0

export function CreateEmojiSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    emitDuration += world.time.delta

    if (emitDuration < 2000) {
        return world
    }

    // reset acc duration
    emitDuration = 0

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];
        const childId = createEmotionEntity(world)
        initializeEmotionEntityFromEmotionEmitter(world, eid, childId)
    }

    return world
}


/* -------------------------------------------------------------------------- */
/*                               emoji lifetime                               */
/* -------------------------------------------------------------------------- */
const queryLifetime = defineQuery([Lifetime])

export function UpdateEmotionLifetimeSystem(world: EmopopWorld) {
    const ents = queryLifetime(world)
    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];

        Lifetime.remaining[eid] -= world.time.delta
    }

    return world
}

const queryEmotionLifetime = defineQuery([Emotion, Circle, Position, RigidBody, Lifetime])
export function RemoveEmotionTerminatedSystem(world: EmopopWorld) {
    const ents = queryEmotionLifetime(world)

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];

        if (Lifetime.remaining[eid] <= 0) {
            // 移除 lifetime 表示后续不再参与各类计算，仅仅渲染最后的结束动画
            removeComponent(world, Lifetime, eid)
            removeComponent(world, RigidBody, eid)

            animate({
                from: Circle.radius[eid],
                to: 1,
                onUpdate(latest) {
                    Circle.radius[eid] = latest
                },
                onComplete() {
                    removeEntity(world, eid)
                }
            })
        }
    }

    return world
}