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
    /**
     * 上升气泡合并时的最大质量，即炸裂的质量
     */
    maxMass: number

    /**
     * 上升气泡的单位质量，即新生气泡的质量
     */
    massUnit: number


    /**
     * 上升的气泡的半径缩放比例
     * 当前无效设置
     */
    radiusUnit: number

    /**
     * 单位：像素每秒
     */
    defaultVelocity: vec2

    /**
     * 重力加速度，矢量
     * 单位像素每秒
     */
    gravity: vec2


    /**
     * 物体间引力系数
     */
    attractorFactor: number,


    /**
     * emoji 产生气泡的时间间隔
     * 单位毫秒
     */
    spwanInterval: number

    /**
     * emoji 气泡多长时间没有合成就炸裂的时间间隔
     */
    lifetimeBase: number

    /**
     * @deprecated
     * 当前无效设置
     */
    lifetimeUnit: number
  },

  features: {
    detectionStyle: {
      /**
       * 是否在人脸上显示 emoji 表情
       */
      visible: boolean

      /**
       * 人脸上 emoji 表情的偏移倍数。
       * @example
       * y: 1   - 表示 emoji 表情在人脸上按人脸的长度的一倍长度进行偏移
       * y: 0.5 - 表示 emoji 表情在人脸上按人脸的长度的 0.5 倍长度进行偏移（相当于偏移半个人脸长度）
       */
      offset: {
        y: number
      }

      /**
       * 调整覆盖在人脸上的 emoji 的表情大小
       */
      scale: number
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

  settings: {
    maxMass: 50,
    massUnit: 1,
    radiusUnit: 1,
    defaultVelocity: vec2.set(vec2.create(), 0, 0),
    gravity: vec2.set(vec2.create(), 0, 0.35),
    attractorFactor: 1e-7 / 25,

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
      scale: 1
    }
  }
})



