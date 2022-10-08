import { addComponent, defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs"
import { vec2 } from "gl-matrix"
import Matter, { Engine, Bodies, World, Vector, Events, Body } from 'matter-js'
import { isUndefined, memoize } from "lodash"
import { animate } from "popmotion"

import { AnimationTicker, Circle, Emotion, Position, RigidBody, RigidBodyOnStatus } from "./components"
import { EmopopWorld } from "./context"
import { createEmotionEntity } from "./systemlogic"
import { Bimap } from "./bimap"


/* -------------------------------------------------------------------------- */
/*                               matterjs system                              */
/* -------------------------------------------------------------------------- */

const queryCircleBodies = defineQuery([RigidBody, Circle, Position])
const queryCircleBodiesCreated = enterQuery(queryCircleBodies)
const queryCircleBodiesRemoved = exitQuery(queryCircleBodies)
const bodyPool = memoize((_: EmopopWorld) => new Bimap<number, Matter.Body>(), (world) => world.name)

export const engine = memoize((world: EmopopWorld) => {
    const matterEngine = Engine.create()
    const borderThickness = 10
    const ceiling = Bodies.rectangle(
        0,
        world.screen.height + borderThickness / 2,
        world.screen.width,
        borderThickness,
        { isStatic: true }
    )

    const floor = Bodies.rectangle(
        0,
        - borderThickness / 2,
        world.screen.width,
        borderThickness,
        { isStatic: true }
    )
    const left = Bodies.rectangle(
        - borderThickness / 2,
        world.screen.height,
        borderThickness,
        world.screen.height,
        { isStatic: true }
    )
    const right = Bodies.rectangle(
        world.screen.width + borderThickness / 2,
        world.screen.height,
        borderThickness,
        world.screen.height,
        { isStatic: true }
    )

    // boundary
    World.add(matterEngine.world, [ceiling, floor, left, right])

    Events.on(matterEngine, 'collisionStart', function (event) {
        for (let index = 0; index < event.pairs.length; index++) {
            const pair = event.pairs[index];

            const eidA = bodyPool(world).getKey(pair.bodyA)
            const eidB = bodyPool(world).getKey(pair.bodyB)

            if (isUndefined(eidA) || isUndefined(eidB)) {
                continue
            }

            if (Emotion.label[eidA] !== Emotion.label[eidB]) {
                continue
            }

            // merge the same ones
            // 动画过程可以将物体设置为静止
            // 同时增加动画类型和动画 tween 倒计时 (duration, start properties, end propertis)
            Body.setStatic(pair.bodyA, true)
            Body.setStatic(pair.bodyB, true)

            RigidBody.on[eidA] = RigidBodyOnStatus.OFF
            RigidBody.on[eidB] = RigidBodyOnStatus.OFF

            addComponent(world, AnimationTicker, eidA)
            AnimationTicker.total[eidA] = 1000
            AnimationTicker.progress[eidA] = 0

            addComponent(world, AnimationTicker, eidB)
            AnimationTicker.total[eidB] = 1000
            AnimationTicker.progress[eidB] = 0

            if (RigidBody.mass[eidA] >= RigidBody.mass[eidB]) {
                createMergedEmotionEntity(world, eidA, eidB)
            } else {
                createMergedEmotionEntity(world, eidB, eidA)
            }
        }
    })

    return matterEngine
}, (world) => world.name)

function createMergedEmotionEntity(world: EmopopWorld, bigger: number, smaller: number): number {
    const merged = createEmotionEntity(world)

    Emotion.label[merged] = Emotion.label[bigger]
    RigidBody.on[merged] = RigidBodyOnStatus.OFF

    const prevPosition = Position.value[bigger]
    const nextPosition = vec2.lerp(vec2.create(), Position.value[bigger], Position.value[smaller], 0.5)

    vec2.copy(Position.value[merged], prevPosition)

    const nextMass = RigidBody.mass[bigger] + RigidBody.mass[smaller]
    RigidBody.mass[merged] = nextMass

    const prevRadius = Circle.radius[bigger]
    const nextRadius = world.settings.radiusUnit * Math.sqrt(nextMass)
    Circle.radius[merged] = prevRadius

    animate<{ radius: number, x: number, y: number }>({
        from: {
            radius: prevRadius,
            x: prevPosition[0],
            y: prevPosition[1],
        },
        to: {
            radius: nextRadius,
            x: nextPosition[0],
            y: nextPosition[1],
        },
        onUpdate(latest) {
            const body = bodyPool(world).getValue(merged)

            if (body) {
                body.position.x = latest.x
                body.position.y = latest.y
                body.circleRadius = latest.radius
            }

            Circle.radius[merged] = latest.radius
        },
        onComplete() {
            removeEntity(world, bigger)
            removeEntity(world, smaller)

            const body = bodyPool(world).getValue(merged)

            if (body) {
                World.remove(engine(world).world, body)
                const newBody = Bodies.circle(
                    Position.value[merged][0],
                    Position.value[merged][1],
                    Circle.radius[merged],
                    {
                        velocity: Vector.create(RigidBody.velocity[merged][0], RigidBody.velocity[merged][1]),
                    },
                )

                World.add(engine(world).world, newBody)
                bodyPool(world).setPair(merged, newBody)
            }

            RigidBody.on[merged] = RigidBodyOnStatus.ON
        },
    })

    return merged
}


export function MatterPhysicalSystem(world: EmopopWorld) {
    const entsRemoved = queryCircleBodiesRemoved(world)
    for (let index = 0; index < entsRemoved.length; index++) {
        const eid = entsRemoved[index];
        const body = bodyPool(world).getValue(eid)

        if (!body) {
            continue
        }

        World.remove(engine(world).world, body)

        bodyPool(world).deleteKey(eid)
    }

    const entsCreated = queryCircleBodiesCreated(world)
    for (let index = 0; index < entsCreated.length; index++) {
        const eid = entsCreated[index];
        const body = Bodies.circle(
            Position.value[eid][0],
            Position.value[eid][1],
            Circle.radius[eid],
            {
                isStatic: !RigidBody.on[eid],
                mass: RigidBody.mass[eid],
                velocity: Vector.create(RigidBody.velocity[eid][0], RigidBody.velocity[eid][1]),
            },
        )

        // body.mass = RigidBody.mass[eid]

        World.add(engine(world).world, body)

        bodyPool(world).setPair(eid, body)
    }

    Engine.update(engine(world), world.time.delta)

    const ents = queryCircleBodies(world)

    for (let index = 0; index < ents.length; index++) {
        const eid = ents[index];

        const body = bodyPool(world).getValue(eid)

        if (!body) {
            continue
        }

        vec2.set(Position.value[eid], body.position.x, body.position.y)
    }

    return world
}