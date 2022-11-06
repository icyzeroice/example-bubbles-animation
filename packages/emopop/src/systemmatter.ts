import { addComponent, addEntity, defineQuery, enterQuery, exitQuery, removeComponent, removeEntity } from "bitecs"
import MatterAttractors from 'matter-attractors'
import { vec2 } from "gl-matrix"
import Matter, { Engine, Bodies, World, Vector, Events, Constraint } from 'matter-js'
import { isUndefined, memoize } from "lodash"
import { animate } from "popmotion"

import { Circle, Emotion, Lifetime, Position, RigidBody } from "./components"
import { EmopopWorld } from "./context"
import { Bimap } from "./bimap"


/* -------------------------------------------------------------------------- */
/*                               matterjs system                              */
/* -------------------------------------------------------------------------- */

const bodyPool = memoize((_: EmopopWorld) => new Bimap<number, Matter.Body>(), (world) => world.name)
const jointPool = memoize((_: EmopopWorld) => new Map<number, Matter.Constraint>(), (world) => world.name)
const meringBag = memoize((_: EmopopWorld) => new Set<number>(), (world) => world.name)

export const engine = memoize((world: EmopopWorld) => {
    Matter.use(MatterAttractors)

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

            if (meringBag(world).has(eidA) || meringBag(world).has(eidB)) {
                continue
            }

            // merge the same ones
            // 动画过程可以将物体设置为静止
            // 同时增加动画类型和动画 tween 倒计时 (duration, start properties, end propertis)
            // Body.setStatic(pair.bodyA, true)
            // Body.setStatic(pair.bodyB, true)

            const constraint = Constraint.create({
                bodyA: pair.bodyA,
                bodyB: pair.bodyB,
            })

            World.add(engine(world).world, constraint)

            jointPool(world).set(eidA, constraint)
            jointPool(world).set(eidB, constraint)

            meringBag(world).add(eidA)
            meringBag(world).add(eidB)

            if (RigidBody.mass[eidA] >= RigidBody.mass[eidB]) {
                createMergedEmotionEntity(world, eidA, eidB)
            } else {
                createMergedEmotionEntity(world, eidB, eidA)
            }
        }
    })

    return matterEngine
}, (world) => world.name)


const queryCircleBodies = defineQuery([RigidBody, Circle, Position])
const queryCircleBodiesCreated = enterQuery(queryCircleBodies)
const queryCircleBodiesRemoved = exitQuery(queryCircleBodies)

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

        const constraint = jointPool(world).get(eid)

        if (constraint) {
            World.remove(engine(world).world, constraint)
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
                mass: RigidBody.mass[eid],
                velocity: Vector.create(RigidBody.velocity[eid][0], RigidBody.velocity[eid][1]),
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
        vec2.set(RigidBody.velocity[eid], body.velocity.x, body.velocity.y)
    }

    return world
}

function createMergedEmotionEntity(world: EmopopWorld, bigger: number, smaller: number): number {
    const merged = addEntity(world)
    addComponent(world, Emotion, merged)
    addComponent(world, Circle, merged)
    addComponent(world, Position, merged)
    addComponent(world, Lifetime, merged)

    Emotion.label[merged] = Emotion.label[bigger]

    // const initLifetime = world.settings.lifetimeBase + world.settings.lifetimeUnit * nextMass
    const initLifetime = world.settings.lifetimeBase
    Lifetime.default[merged] = initLifetime
    Lifetime.remaining[merged] = initLifetime
    Lifetime.animation[merged] = 0

    const nextMass = RigidBody.mass[bigger] + RigidBody.mass[smaller]
    // RigidBody.mass[merged] = nextMass

    const prevRadius = Circle.radius[bigger]

    // HACK: prevent the mass being out of range
    const nextRadius = world.settings.radiusUnit * Math.sqrt(Math.min(nextMass, world.settings.maxMass))
    Circle.radius[merged] = prevRadius


    // init position
    vec2.copy(Position.value[merged], Position.value[bigger])

    // const offset = vec2.lerp(
    //     vec2.create(),
    //     [0, 0],
    //     vec2.subtract(vec2.create(), Position.value[smaller], Position.value[bigger]),
    //     Circle.radius[smaller] / (Circle.radius[bigger] + Circle.radius[smaller])
    // )

    const offset = [0, prevRadius - nextRadius]


    // removeEntity(world, bigger)
    removeComponent(world, Emotion, bigger)
    // removeEntity(world, smaller)
    // meringBag(world).delete(bigger)
    // meringBag(world).delete(smaller)

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
            vec2.add(
                Position.value[merged],
                Position.value[bigger],
                [latest.x, latest.y]
            )
            Circle.radius[merged] = latest.radius
        },
        onComplete() {
            // add to physical system
            addComponent(world, RigidBody, merged)
            RigidBody.mass[merged] = nextMass
            vec2.set(RigidBody.velocity[merged], 0, RigidBody.velocity[bigger][1])

            removeEntity(world, bigger)
            removeEntity(world, smaller)
            meringBag(world).delete(bigger)
            meringBag(world).delete(smaller)
        },
        duration: 200
    })

    return merged
}