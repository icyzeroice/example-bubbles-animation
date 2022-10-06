import { IWorld, createWorld } from "bitecs"
import { vec2 } from "gl-matrix"
import { memoize } from "lodash"


export interface EmopopWorld extends IWorld {
  name: string

  time: {
    delta: number
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
  }
}

export const TheWorld = createWorld<EmopopWorld>({
  name: 'main',
  time: { delta: 0, elapsed: 0, absolute: performance.now() },
  dom: {
    container: document.querySelector<HTMLDivElement>('#app')!,
    canvas: document.querySelector("canvas")!
  },
  screen: {
    width: 0,
    height: 0,
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
  const width = 1920
  const height = 1080

  TheWorld.dom.container.style.width = width / devicePixelRatio + 'px'
  TheWorld.dom.container.style.height = height / devicePixelRatio + 'px'

  TheWorld.screen.width = width
  TheWorld.screen.height = height


  setInterval(() => {

  })

  return {
    get image() {
      return
    },
    get emotions(): BackendEmotion[] {
      return mocks()
    },
    dispose() {

    }
  }
})

backend()
