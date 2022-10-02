import "./style.css"

import * as THREE from "three"
import { DoubleSide, Texture, TextureLoader } from "three"
import { MapControls } from "three/examples/jsm/controls/OrbitControls"
import Stats from "three/examples/jsm/libs/stats.module.js"

import { content, loadSvg } from "./image"

void main()

async function main() {
  const container = document.querySelector("#app")!
  const canvas = document.querySelector("canvas")!

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    10000
  )
  camera.position.z = 100
  camera.up.copy(new THREE.Vector3(0, 0, 1))
  // camera.lookAt()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)

  // const geometry = new THREE.CircleGeometry(5, 32)
  const texture = new Texture(await loadSvg(content, 100, 200))
  texture.needsUpdate = true

  const geometry = new THREE.PlaneGeometry(100, 120)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    // side: DoubleSide,
    map: texture,
    // map: new Texture(await loadSvg(content, 100, 200)),
  })

  // console.log(await loadSvg(content, 100, 100))

  // new TextureLoader().load(content, (texture) => {
  //   material.map = texture;
  //   material.needsUpdate = true;
  // });

  scene.add(new THREE.Mesh(geometry, material))

  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(700, 700)

  const stats = Stats()
  container.appendChild(stats.dom)

  const control = new MapControls(camera, renderer.domElement)

  ;(function animate() {
    requestAnimationFrame(animate)
    render()
    stats.update()
  })()

  function render() {
    control.update()
    renderer.render(scene, camera)
  }
}
