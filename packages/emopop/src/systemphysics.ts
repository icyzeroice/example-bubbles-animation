import { defineQuery } from "bitecs"
import { vec2 } from "gl-matrix"
import { clamp } from "lodash"
import { Circle, Emotion, Position, RigidBody } from "./components"
import { EmopopWorld } from "./context"



/* -------------------------------------------------------------------------- */
/*                               physics system                               */
/* -------------------------------------------------------------------------- */


const queryCircleRigidBody = defineQuery([RigidBody, Circle, Position])

export function PhysicsSystem(world: EmopopWorld) {
    const ents = queryCircleRigidBody(world)

    for (let i = 0; i < ents.length; i++) {
        const eid = ents[i]

        // check borders
        const radius = Circle.radius[eid]
        const { width, height } = world.screen
        const x = Position.value[eid][0]
        const y = Position.value[eid][1]

        // reach to the left boundary
        if (x < radius) {
            Position.value[eid][0] = radius
            RigidBody.velocity[eid][0] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][0])
        }

        // reach to the right boundary
        if (x > width - radius) {
            Position.value[eid][0] = width - radius
            RigidBody.velocity[eid][0] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][0])
        }

        // reach to the top boundary
        if (y < radius) {
            Position.value[eid][1] = radius
            RigidBody.velocity[eid][1] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][1])
        }

        // reach to the bottom boundary
        if (y > height - radius) {
            Position.value[eid][1] = height - radius
            RigidBody.velocity[eid][1] = -getBorderLossyVelocityComponent(RigidBody.velocity[eid][1])
        }



        // update velocity
        vec2.add(
            RigidBody.velocity[eid],
            RigidBody.velocity[eid],
            vec2.scale(vec2.create(), RigidBody.acceleration[eid], world.time.deltaInSeconds)
        )

        vec2.copy(RigidBody.velocity[eid], getNormalLossyVelocity(RigidBody.velocity[eid], world.settings.defaultVelocity[1]))

        // update position
        vec2.add(
            Position.value[eid],
            Position.value[eid],
            vec2.scale(vec2.create(), RigidBody.velocity[eid], world.time.deltaInSeconds)
        )

        // collision

        if (i === ents.length - 1) {
            continue
        }

        for (var otherIndex = i + 1; otherIndex < ents.length; otherIndex += 1) {
            const otherId = ents[otherIndex]
            if (!collision(eid, otherId)) {
                continue
            }


            if (Emotion.label[eid] === Emotion.label[otherId]) {
                // merge emotion
                continue
            }

            // bounce
            bounce(eid, otherId)
        }
    }

    return world
}

/**
 * 我来定一条碰撞规则：
 * 双方速度减半，各自损失的速度为 v1_loss, v2_loss
 * 
 * motivation = v1_loss * m1 + v2_loss * m2 
 * v1_addon = motivation / 2 / m1
 * v2_addon = motivation / 2 / m2
 * 
 * 方向为各自中心的连线上相反
 */
function bounce(one: number, other: number, unit?: number) {
    const direction = vec2.subtract(vec2.create(), Position.value[one], Position.value[other])
    vec2.normalize(direction, direction)

    const oneVel = RigidBody.velocity[one]
    const otherVel = RigidBody.velocity[other]
    vec2.scale(oneVel, oneVel, 0.5)
    vec2.scale(otherVel, otherVel, 0.5)

    const oneVelScale = vec2.length(oneVel)
    const otherVelScale = vec2.length(otherVel)

    const motivation = oneVelScale * RigidBody.mass[one] + otherVelScale * RigidBody.mass[other]
    const nextOneVelScale = motivation / 2 / RigidBody.mass[one]
    const nextOtherVelScale = motivation / 2 / RigidBody.mass[other]

    const distance = vec2.distance(Position.value[one], Position.value[other])
    const overlap = Circle.radius[one] + Circle.radius[other] - distance
    const recoil = vec2.scale(vec2.create(), direction, overlap)

    if (RigidBody.mass[one] > RigidBody.mass[other]) {
        vec2.subtract(Position.value[other], Position.value[other], recoil)
    } else {
        vec2.add(Position.value[one], Position.value[one], recoil)
    }

    console.log(nextOneVelScale, nextOtherVelScale, unit)

}


function collision(one: number, other: number) {
    const distance = vec2.distance(Position.value[one], Position.value[other])

    if (distance >= Circle.radius[one] + Circle.radius[other]) {
        return false
    }

    return true
}

function getBorderLossyVelocityComponent(v: number): number {
    const nextV = v / 2

    if (nextV < 1) {
        return 0
    }

    return nextV
}

function getNormalLossyVelocity(v: vec2, unit: number): vec2 {
    const nextVelocityLength = clamp(vec2.length(v) - Math.ceil(unit * 0.005), 0, unit * 2)
    const nextVelocity = vec2.normalize(vec2.create(), v)
    vec2.scale(nextVelocity, nextVelocity, nextVelocityLength)
    return nextVelocity
}


