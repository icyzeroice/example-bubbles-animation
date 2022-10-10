import { IWorld, createWorld } from "bitecs"
import { getEmotionIndex } from "emoji-set"
import { vec2 } from "gl-matrix"
import { memoize, once } from "lodash"
import { createDetectionResultService } from "./server"


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
  },

  screen: {
    width: number
    height: number
  },

  settings: {
    massUnit: number
    radiusUnit: number

    // pixel per second
    defaultVelocity: vec2
    gravity: vec2

    // milliseconds
    lifetimeBase: number
    // milliseconds
    lifetimeUnit: number
  }
}

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
    canvas: document.querySelector("canvas")!
  },
  screen: {
    width: 0,
    height: 0,
  },

  settings: {
    massUnit: 1,
    radiusUnit: 1,
    defaultVelocity: vec2.set(vec2.create(), 0, 2),
    gravity: vec2.set(vec2.create(), 0, 2),

    lifetimeBase: 2000,
    lifetimeUnit: 1000,
  }
})

export interface BackendEmotion {
  label: number
  position: vec2
  radius: number
}


const mocks: () => BackendEmotion[] = () => ([{
  label: 1,
  position: vec2.set(vec2.create(), 100, 200),
  radius: 50,
}, {
  label: 2,
  position: vec2.set(vec2.create(), 200, 200),
  radius: 30,
}])


export const backend = memoize(() => {
  const width = 640
  const height = 480

  TheWorld.dom.container.style.width = width / devicePixelRatio + 'px'
  TheWorld.dom.container.style.height = height / devicePixelRatio + 'px'

  TheWorld.screen.width = width
  TheWorld.screen.height = height
  TheWorld.settings.radiusUnit = Math.ceil(Math.min(width, height) * 0.02)
  TheWorld.settings.defaultVelocity[1] = Math.ceil(height / 4)
  TheWorld.settings.gravity[1] = Math.ceil(height / 4)

  const initialize = once((image: HTMLImageElement) => {
    const width = image.width
    const height = image.height

    TheWorld.dom.container.style.width = width / devicePixelRatio + 'px'
    TheWorld.dom.container.style.height = height / devicePixelRatio + 'px'

    TheWorld.screen.width = width
    TheWorld.screen.height = height
    TheWorld.settings.radiusUnit = Math.ceil(Math.min(width, height) * 0.02)
    TheWorld.settings.defaultVelocity[1] = Math.ceil(height / 4)
    TheWorld.settings.gravity[1] = Math.ceil(height / 4)
  })

  let image: HTMLImageElement | undefined
  let emotionLabels: BackendEmotion[] = []

  createDetectionResultService((frame) => {
    initialize(frame.image)

    image = frame.image

    emotionLabels = frame.emotions.map((emotion, index) => {
      const box = frame.boxes[index]
      const label = getEmotionIndex(emotion)
      const position = vec2.scale(vec2.create(), vec2.set(vec2.create(), box[0] + box[2], box[1] + box[3]), 0.5)
      const radius = Math.max(box[2] - box[0], box[3] - box[1]) / 2;

      // HACK:
      position[1] = height - position[1];

      return {
        label,
        position,
        radius,
      }
    })
  })

  return {
    get image() {
      return image
    },
    get emotions(): BackendEmotion[] {
      // return mocks()
      return emotionLabels
    },
    dispose() {

    }
  }
})

backend()