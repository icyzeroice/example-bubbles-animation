import "./style.css"

import * as THREE from "three"
import { BufferGeometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Path, Shape, ShapeGeometry, Texture } from "three"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "three/examples/jsm/libs/stats.module.js"

import { content, loadSvg } from "./image"

void main()

async function main() {
  const container = document.querySelector("#app")!
  const canvas = document.querySelector("canvas")!

  const camera = new THREE.OrthographicCamera(
    -70,
    70,
    70,
    -70,
    1,
    1000
  )
  camera.position.z = 100
  camera.up.copy(new THREE.Vector3(0, 0, 1))
  // camera.lookAt()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  const texture = new Texture(await loadSvg(content, 100, 200))
  texture.needsUpdate = true

  const emojiMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    map: texture,
  })

  const RADIUS = 5

  const geometry = new THREE.CircleGeometry(RADIUS, 32)
  const mesh1 = new THREE.Mesh(geometry, emojiMaterial)
  const mesh2 = new THREE.Mesh(geometry, emojiMaterial)
  mesh2.position.x = RADIUS * Math.sqrt(2)

  // function createJointShape() {
  //   const jointTool = new Shape()
  //   jointTool.bezierCurveTo(1, 0, 1, 0, 1, 1)
  //   jointTool.lineTo(1, 0)

  //   const colorMaterial = new MeshBasicMaterial({
  //     color: 0xffff00,
  //   })
  //   const jointGeometry = new ShapeGeometry(jointTool)
  //   const joint = new Mesh(jointGeometry, colorMaterial)
  //   joint.scale.set(10, 10, 10)

  //   joint.rotateZ(-45)
  //   joint.position.y = 10
  //   return joint

  // }

  scene.add(
    mesh1,
    mesh2,
    // createJointShape(),
  )

  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(700, 700)

  const stats = Stats()
  container.appendChild(stats.dom)

  const control = new MapControls(camera, renderer.domElement)

    ; (function animate() {
      requestAnimationFrame(animate)
      render()
      stats.update()
    })()

  function render() {
    control.update()
    renderer.render(scene, camera)
  }
}
