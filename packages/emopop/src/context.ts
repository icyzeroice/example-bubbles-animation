import { IWorld, createWorld, System } from "bitecs"
import { vec2 } from "gl-matrix"


export interface EmopopWorld extends IWorld {
  name: string

  time: {
    delta: number
    deltaInSeconds: number

    elapsed: number

    absolute: number
  },

  dom: {
    container: HTMLDivElement
    canvas: HTMLCanvasElement
    background: HTMLImageElement
  },

  screen: {
    width: number
    height: number
    scale: number
  },

  settings: {
    maxMass: number
    massUnit: number
    radiusUnit: number

    // pixel per second
    defaultVelocity: vec2
    gravity: vec2


    // milliseconds
    spwanInterval: number
    lifetimeBase: number
    lifetimeUnit: number
  },

  features: {
    detectionStyle: {
      visible: boolean
      offset: {
        y: number
      }
      scale: {
        x: number
        y: number
      }
    }
  }
}

export type EmopopSystem = System<[], EmopopWorld>

export const TheWorld = createWorld<EmopopWorld>({
  name: 'main',
  time: {
    delta: 0,
    deltaInSeconds: 0,
    elapsed: 0,
    absolute: performance.now(),
  },
  dom: {
    container: document.querySelector<HTMLDivElement>('#app')!,
    canvas: document.querySelector("canvas")!,
    background: document.querySelector("#background")!
  },
  screen: {
    width: 0,
    height: 0,
    scale: 1,
  },

  // 在这里设置没用，要到初始化逻辑中设置
  settings: {
    maxMass: 50,
    massUnit: 1,
    radiusUnit: 1,
    defaultVelocity: vec2.set(vec2.create(), 0, 0),
    gravity: vec2.set(vec2.create(), 0, 0.35),

    spwanInterval: 1500,
    lifetimeBase: 4000,
    lifetimeUnit: 1000,
  },

  features: {
    detectionStyle: {
      visible: true,
      offset: {
        y: 1,
      },
      scale: {
        x: 1,
        y: 1,
      }
    }
  }
})



