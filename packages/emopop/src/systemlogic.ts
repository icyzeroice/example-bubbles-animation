import { addComponent, addEntity, defineQuery, removeComponent, removeEntity } from "bitecs"
import { vec2 } from "gl-matrix"
import { differenceBy, intersectionBy } from "lodash"
import { animate } from "popmotion"

import { Circle, Emotion, EmotionEmitter, Lifetime, Position, RigidBody } from "./components"
import { EmopopWorld } from "./context"
import { backend } from './server'


/* -------------------------------------------------------------------------- */
/*                                emoji emitter                               */
/* -------------------------------------------------------------------------- */
const queryEmotionEmitter = defineQuery([EmotionEmitter, Emotion, Position])

export function UpdateEmotionEmitterSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    const prevs = ents.map((eid, index) => ({ label: Emotion.label[eid], index, eid }))
    const nexts = backend().emotions.map((emo, index) => ({ label: emo.label, index }))

    const needUpdate = intersectionBy(prevs, nexts, (item) => {
        return item.index
    })

    const needRemove = differenceBy(prevs, nexts, (item) => {
        return item.index
    })

    const needCreate = differenceBy(nexts, prevs, (item) => {
        return item.index
    })

    // remove
    for (let index = 0; index < needRemove.length; index++) {
        removeEntity(world, needRemove[index].eid)
    }

    // create
    for (let index = 0; index < needCreate.length; index++) {
        const emotion = backend().emotions[needCreate[index].index]
        const eid = createEmotionEmitterEntity(world)

        Emotion.label[eid] = emotion.label


        if (world.features.detectionStyle.visible) {
            Circle.radius[eid] = emotion.radius
        }

        vec2.copy(Position.value[eid], emotion.position)
    }

    // update
    for (let index = 0; index < needUpdate.length; index++) {
        const emotion = backend().emotions[needUpdate[index].index]
        const eid = needUpdate[index].eid

        Emotion.label[eid] = emotion.label


        if (world.features.detectionStyle.visible) {
            Circle.radius[eid] = emotion.radius
        }

        vec2.copy(Position.value[eid], emotion.position)
    }



    return world
}

function createEmotionEmitterEntity(world: EmopopWorld): number {
    const eid = addEntity(world)

    addComponent(world, EmotionEmitter, eid)
    addComponent(world, Emotion, eid)

    if (world.features.detectionStyle.visible) {
        addComponent(world, Circle, eid)
    }

    addComponent(world, Position, eid)

    return eid
}



/* -------------------------------------------------------------------------- */
/*                                create emoji                                */
/* -------------------------------------------------------------------------- */
const velocityOrigin = vec2.set(vec2.create(), 0, 0)
const velocityRange = 60 /** degree */ / 180 * Math.PI /** radian */

let emitDelay = 5000
let emitDuration = 0

export function CreateEmojiSystem(world: EmopopWorld) {
    const ents = queryEmotionEmitter(world)

    if (emitDelay > 0) {
        emitDelay -= world.time.delta
        return world
    }

    emitDuration += world.time.delta

    if (emitDuration < world.settings.spwanInterval) {
        return world
    }

    // reset acc duration
    emitDuration = 0

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];

        const childId = addEntity(world)
        addComponent(world, Emotion, childId)
        addComponent(world, Circle, childId)
        addComponent(world, Position, childId)
        addComponent(world, RigidBody, childId)
        addComponent(world, Lifetime, childId)


        copyEmotionFromEmitter(world, eid, childId)
    }

    return world
}

function copyEmotionFromEmitter(world: EmopopWorld, emitterId: number, emotionId: number) {
    Emotion.label[emotionId] = Emotion.label[emitterId]

    Circle.radius[emotionId] = world.settings.radiusUnit

    vec2.copy(Position.value[emotionId], Position.value[emitterId])

    RigidBody.mass[emotionId] = world.settings.massUnit
    vec2.copy(RigidBody.acceleration[emotionId], world.settings.gravity)

    vec2.copy(RigidBody.velocity[emotionId], vec2.rotate(
        vec2.create(),
        world.settings.defaultVelocity,
        velocityOrigin,
        (Math.random() - 0.5) * velocityRange
    ))

    // const initLifetime = world.settings.lifetimeBase + world.settings.lifetimeUnit * world.settings.massUnit
    const initLifetime = world.settings.lifetimeBase

    Lifetime.default[emotionId] = initLifetime
    Lifetime.remaining[emotionId] = initLifetime
    Lifetime.animation[emotionId] = 0
}


/* -------------------------------------------------------------------------- */
/*                               emoji lifetime                               */
/* -------------------------------------------------------------------------- */
const queryLifetime = defineQuery([Lifetime])

export function UpdateEmotionLifetimeAfterSystem(world: EmopopWorld) {
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
                from: 0,
                to: 1,
                onUpdate(latest) {
                    Lifetime.animation[eid] = latest
                },
                onComplete() {
                    removeEntity(world, eid)
                }
            })
        }

        // 过大的话就消失
        if (RigidBody.mass[eid] > world.settings.maxMass) {
            Lifetime.remaining[eid] = 10
        }
    }

    return world
}