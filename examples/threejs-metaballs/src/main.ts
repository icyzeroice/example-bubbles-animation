import "./style.css"

import { CircleGeometry, Color, Mesh, OrthographicCamera, Scene, Texture, Vector3, WebGLRenderer } from "three"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import { EmojiConfigSet } from 'emoji-set'

import Stats from "three/examples/jsm/libs/stats.module.js"

import { loadSvg } from "./image"
import { setupMetaballEffects } from "./metaball"
import { createExplotionMaterial } from "./effects/explosion"

void main()

async function main() {
  const container = document.querySelector("#app")!
  const canvas = document.querySelector("canvas")!

  const cameraEdge = 15

  const camera = new OrthographicCamera(
    -cameraEdge,
    cameraEdge,
    cameraEdge,
    -cameraEdge,
    1,
    1000
  )
  camera.position.z = 10
  camera.up.copy(new Vector3(0, 0, 1))
  // camera.lookAt()

  const scene = new Scene()
  scene.background = new Color(0xf0f0f0)
  // scene.background = null

  const texture = new Texture(await loadSvg(EmojiConfigSet[0].svg, 100, 200))
  texture.needsUpdate = true

  const emojiMaterial = createExplotionMaterial({
    texture
  })

  const RADIUS = 5

  const geometry = new CircleGeometry(RADIUS, 32)
  const mesh1 = new Mesh(geometry, emojiMaterial)
  mesh1.renderOrder = 3
  mesh1.scale.set(2, 2, 1)
  const mesh2 = new Mesh(geometry, emojiMaterial)
  mesh2.renderOrder = 2
  // mesh2.position.x = RADIUS * Math.sqrt(2)
  mesh2.position.x = RADIUS * 1.8


  const mesh3 = new Mesh(geometry, emojiMaterial)
  mesh3.position.set(5, 5, 1)
  mesh3.renderOrder = 4

  scene.add(
    mesh1,
    mesh2,
    mesh3,
    // createJointShape(),
  )

  const renderer = new WebGLRenderer({ antialias: true, canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(700, 700)
  renderer.setClearColor(0x000000, 0)

  const composer = setupMetaballEffects({
    scene, renderer, camera,
  })

  const stats = Stats()
  container.appendChild(stats.dom)

  let move = -0.01

  setInterval(() => {
    move = -move
  }, 4000)

  const control = new MapControls(camera, renderer.domElement)

    ; (function animate() {
      requestAnimationFrame(animate)
      mesh2.position.x += move
      render()
      stats.update()
    })()

  function render() {
    control.update()
    // composer.render()
    // renderer.render(scene, camera)
    composer.render()
  }
}
