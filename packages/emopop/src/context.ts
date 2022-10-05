import { IWorld, createWorld } from "bitecs"
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


export const backend = memoize(() => {
  const width = 1920 / devicePixelRatio
  const height = 1080 / devicePixelRatio

  TheWorld.dom.container.style.width = width + 'px'
  TheWorld.dom.container.style.height = height + 'px'

  TheWorld.screen.width = width
  TheWorld.screen.height = height


  setInterval(() => {

  })

  return {
    dispose() {

    }
  }
})

backend()
