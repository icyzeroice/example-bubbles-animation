export const content =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 288.79 288.79"><defs><style>.cls-1,.cls-2{stroke:#eaeff3;stroke-dashoffset:958.3px;stroke-width:5.32px;stroke-dasharray:958.3;}.cls-1{fill:url(#未命名的渐变_37);}.cls-2{fill:#7f4f21;}.cls-3{fill:#fff;}</style><radialGradient id="未命名的渐变_37" cx="202.96" cy="146.01" r="141.76" gradientTransform="matrix(0.79, 0.61, -0.61, 0.79, 72.3, -94.99)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffdc00"/><stop offset="0.53" stop-color="#feda02"/><stop offset="0.72" stop-color="#fcd409"/><stop offset="0.85" stop-color="#f9c814"/><stop offset="0.96" stop-color="#f4b825"/><stop offset="1" stop-color="#f2b02d"/></radialGradient></defs><g id="图层_2" data-name="图层 2"><g id="图层_1-2" data-name="图层 1"><circle class="cls-1" cx="144.39" cy="144.39" r="141.73" transform="translate(-59.81 144.39) rotate(-45)"/><path class="cls-2" d="M144.39,168c-28.52,0-47.45-3.33-70.86-7.88-5.35-1-15.75,0-15.75,15.75,0,31.5,36.18,70.87,86.61,70.87S231,207.39,231,175.89c0-15.75-10.4-16.79-15.75-15.75C191.85,164.69,172.92,168,144.39,168Z"/><path class="cls-3" d="M73.53,175.89s23.62,7.87,70.86,7.87,70.87-7.87,70.87-7.87-15.75,31.5-70.87,31.5S73.53,175.89,73.53,175.89Z"/><path class="cls-2" d="M97.15,81.4c10.87,0,19.69,12.34,19.69,27.56S108,136.52,97.15,136.52,77.47,124.18,77.47,109,86.28,81.4,97.15,81.4Z"/><ellipse class="cls-2" cx="191.64" cy="108.96" rx="19.69" ry="27.56"/></g></g></svg>'

export async function loadSvg(
  content: string,
  width: number,
  height: number
): Promise<HTMLImageElement> {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  const img = document.createElement("img")
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(content)
  img.title = "example"

  document.querySelector("#app")?.append(canvas)
  document.querySelector("#app")?.append(img)

  return new Promise((resolve, reject) => {
    img.onload = function () {
      ctx.drawImage(img, 0, 0)
      resolve(img)
    }
    img.onerror = function (err) {
      console.log(err)
      reject(err)
    }
  })
}
