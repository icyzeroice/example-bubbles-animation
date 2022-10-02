import paper from "paper"

// 不知道为什么，每个文件引入自己的 paper，似乎是不同的实例？
const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!

paper.setup(canvas)

export { paper }
