export async function loadSvgString(
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
