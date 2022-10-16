import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs"
import { vec2 } from "gl-matrix"
import Matter, { Engine, Bodies, World, Vector, Events, Body, Constraint } from 'matter-js'
import { isUndefined, memoize } from "lodash"
import { animate } from "popmotion"

import { Circle, Emotion, Lifetime, Position, RigidBody, RigidBodyOnStatus } from "./components"
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
const jointPool = memoize((_: EmopopWorld) => new Map<number, Matter.Constraint>(), (world) => world.name)

export const engine = memoize((world: EmopopWorld) => {
    const matterEngine = Engine.create()
    matterEngine.gravity.x = world.settings.gravity[0]
    matterEngine.gravity.y = world.settings.gravity[1]

    const borderThickness = 10
    const ceiling = Bodies.rectangle(
        world.screen.width / 2,
        world.screen.height + borderThickness / 2,
        world.screen.width + borderThickness * 2,
        borderThickness,
        { isStatic: true }
    )

    const floor = Bodies.rectangle(
        world.screen.width / 2,
        - borderThickness / 2,
        world.screen.width + borderThickness / 2,
        borderThickness,
        { isStatic: true }
    )
    const left = Bodies.rectangle(
        - borderThickness / 2,
        world.screen.height / 2,
        borderThickness,
        world.screen.height,
        { isStatic: true }
    )
    const right = Bodies.rectangle(
        world.screen.width + borderThickness / 2,
        world.screen.height / 2,
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

            if (RigidBody.on[eidA] === RigidBodyOnStatus.OFF || RigidBody.on[eidB] === RigidBodyOnStatus.OFF) {
                continue
            }

            RigidBody.on[eidA] = RigidBodyOnStatus.OFF
            RigidBody.on[eidB] = RigidBodyOnStatus.OFF

            if (RigidBody.mass[eidA] >= RigidBody.mass[eidB]) {
                createMergedEmotionEntity(world, eidA, eidB, pair.bodyA, pair.bodyB)
            } else {
                createMergedEmotionEntity(world, eidB, eidA, pair.bodyB, pair.bodyA)
            }
        }
    })

    return matterEngine
}, (world) => world.name)

function createMergedEmotionEntity(world: EmopopWorld, bigger: number, smaller: number, biggerBody: Body, smallerBody: Body): number {
    const merged = createEmotionEntity(world)

    Emotion.label[merged] = Emotion.label[bigger]
    RigidBody.on[merged] = RigidBodyOnStatus.OFF

    const offset = vec2.lerp(
        vec2.create(),
        vec2.set(vec2.create(), 0, 0),
        vec2.subtract(vec2.create(), Position.value[smaller], Position.value[bigger]),
        Circle.radius[smaller] / (Circle.radius[bigger] + Circle.radius[smaller])
    )

    vec2.copy(Position.value[merged], Position.value[bigger])

    const nextMass = RigidBody.mass[bigger] + RigidBody.mass[smaller]
    RigidBody.mass[merged] = nextMass

    const prevRadius = Circle.radius[bigger]

    // HACK: prevent the mass being out of range
    const nextRadius = world.settings.radiusUnit * Math.sqrt(Math.min(nextMass, 100))
    Circle.radius[merged] = prevRadius

    // const initLifetime = world.settings.lifetimeBase + world.settings.lifetimeUnit * nextMass
    const initLifetime = world.settings.lifetimeBase

    Lifetime.default[merged] = initLifetime
    Lifetime.remaining[merged] = initLifetime


    // Body.setStatic(pair.bodyA, true)
    Body.setStatic(biggerBody, true)

    const constraint = Constraint.create({
        bodyA: biggerBody,
        bodyB: smallerBody,
        length: Circle.radius[bigger] + Circle.radius[smaller],
        stiffness: 0.2,
    })

    World.add(engine(world).world, constraint)
    jointPool(world).set(bigger, constraint)
    jointPool(world).set(smaller, constraint)

    let prev = {
        radius: 0,
        x: 0,
        y: 0
    }

    animate<{ radius: number, x: number, y: number }>({
        from: {
            radius: prevRadius,
            x: 0,
            y: 0,
        },
        to: {
            radius: nextRadius,
            x: offset[0],
            y: offset[1],
        },
        onUpdate(latest) {
            const body = bodyPool(world).getValue(merged)

            if (body) {
                body.position.x += (latest.x - prev.x)
                body.position.y += (latest.y - prev.y)
                body.circleRadius = latest.radius

                prev = latest
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

        if (jointPool(world).has(eid)) {
            World.remove(engine(world).world, jointPool(world).get(eid)!)
            jointPool(world).delete(eid)
        }
    }

    const entsCreated = queryCircleBodiesCreated(world)
    for (let index = 0; index < entsCreated.length; index++) {
        const eid = entsCreated[index];
        const body = Bodies.circle(
            Position.value[eid][0],
            Position.value[eid][1],
            Circle.radius[eid],
            {
                isStatic: false,
                mass: RigidBody.mass[eid],
                velocity: Vector.create(RigidBody.velocity[eid][0], RigidBody.velocity[eid][1]),
                collisionFilter: {
                    category: RigidBody.on[eid] === RigidBodyOnStatus.OFF ? 0b001 : 0b010
                }
            },
        )

        // body.mass = RigidBody.mass[eid]

        World.add(engine(world).world, body)

        bodyPool(world).setPair(eid, body)
    }

    // update physical properties
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