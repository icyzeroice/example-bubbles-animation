import {
  ShaderMaterial,
  AdditiveBlending,
  Color,
  UniformsUtils,
  Vector2,
  WebGLRenderTarget,
  NormalBlending,
} from "three"
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js"
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js"

import MetaballVertexShader from "./metaball.vert.glsl?raw"
import MetaballFragmentShader from "./metaball.frag.glsl?raw"

class MetaballPass extends Pass {
  constructor(resolution, scene, camera, selectedObjects, needClear) {
    super()

    this.needClear = needClear
    this.renderScene = scene
    this.renderCamera = camera
    this.selectedObjects = selectedObjects !== undefined ? selectedObjects : []

    this._visibilityCache = new Map()

    this.resolution =
      resolution !== undefined
        ? new Vector2(resolution.x, resolution.y)
        : new Vector2(256, 256)

    this.renderTargetSelectedBuffer = new WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y
    )
    this.renderTargetSelectedBuffer.texture.name = "Metaball.selected"
    this.renderTargetSelectedBuffer.texture.generateMipmaps = false

    this.renderTargetSourceBuffer = new WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y
    )
    this.renderTargetSourceBuffer.texture.name = "Metaball.source"
    this.renderTargetSourceBuffer.texture.generateMipmaps = false

    this.renderTargetResultBuffer = new WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y
    )
    this.renderTargetResultBuffer.texture.name = "Metaball.result"
    this.renderTargetResultBuffer.texture.generateMipmaps = false

    this.metaballMaterial = this.getMetaballMaskMaterial()

    // copy material
    if (CopyShader === undefined) {
      console.error("THREE.OutlinePass relies on CopyShader")
    }

    const copyShader = CopyShader

    const copyUniforms = UniformsUtils.clone(copyShader.uniforms)
    copyUniforms["opacity"].value = 1.0

    this.materialCopy = new ShaderMaterial({
      uniforms: copyUniforms,
      vertexShader: copyShader.vertexShader,
      fragmentShader: copyShader.fragmentShader,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })

    this.enabled = true
    this.needsSwap = false

    this._oldClearColor = new Color()
    this.oldClearAlpha = 1

    this.fsQuad = new FullScreenQuad(null)
  }

  dispose() {
    this.renderTargetSelectedBuffer.dispose()
    this.renderTargetSourceBuffer.dispose()
    this.renderTargetResultBuffer.dispose()
  }

  setSize(width, height) {
    this.renderTargetSelectedBuffer.setSize(width, height)
    this.renderTargetSourceBuffer.setSize(width, height)
    this.renderTargetResultBuffer.setSize(width, height)
  }

  changeVisibilityOfSelectedObjects(bVisible) {
    const cache = this._visibilityCache

    function gatherSelectedMeshesCallBack(object) {
      if (object.isMesh) {
        if (bVisible === true) {
          object.visible = cache.get(object)
        } else {
          cache.set(object, object.visible)
          object.visible = bVisible
        }
      }
    }

    for (let i = 0; i < this.selectedObjects.length; i++) {
      const selectedObject = this.selectedObjects[i]
      selectedObject.traverse(gatherSelectedMeshesCallBack)
    }
  }

  changeVisibilityOfNonSelectedObjects(bVisible) {
    const cache = this._visibilityCache
    const selectedMeshes = []

    function gatherSelectedMeshesCallBack(object) {
      if (object.isMesh) selectedMeshes.push(object)
    }

    for (let i = 0; i < this.selectedObjects.length; i++) {
      const selectedObject = this.selectedObjects[i]
      selectedObject.traverse(gatherSelectedMeshesCallBack)
    }

    function VisibilityChangeCallBack(object) {
      if (object.isMesh || object.isSprite) {
        // only meshes and sprites are supported by OutlinePass

        let bFound = false

        for (let i = 0; i < selectedMeshes.length; i++) {
          const selectedObjectId = selectedMeshes[i].id

          if (selectedObjectId === object.id) {
            bFound = true
            break
          }
        }

        if (bFound === false) {
          const visibility = object.visible

          if (bVisible === false || cache.get(object) === true) {
            object.visible = bVisible
          }

          cache.set(object, visibility)
        }
      } else if (object.isPoints || object.isLine) {
        // the visibilty of points and lines is always set to false in order to
        // not affect the outline computation

        if (bVisible === true) {
          object.visible = cache.get(object) // restore
        } else {
          cache.set(object, object.visible)
          object.visible = bVisible
        }
      }
    }

    this.renderScene.traverse(VisibilityChangeCallBack)
  }

  renderSelectedObjects(renderer, writeBuffer, readBuffer, currentBackground) {
    if (this.selectedObjects.length <= 0) {
      return
    }

    this.changeVisibilityOfNonSelectedObjects(false)

    renderer.setRenderTarget(this.renderTargetSelectedBuffer)
    renderer.clear()
    renderer.render(this.renderScene, this.renderCamera)

    this.changeVisibilityOfNonSelectedObjects(true)
    this._visibilityCache.clear()

    this.fsQuad.material = this.metaballMaterial
    this.metaballMaterial.uniforms["tDiffuse"].value =
      this.renderTargetSelectedBuffer.texture

    renderer.setRenderTarget(readBuffer)

    if (this.needClear) {
      renderer.clear()
    }

    this.fsQuad.render(renderer)
  }

  render(renderer, writeBuffer, readBuffer) {
    renderer.getClearColor(this._oldClearColor)
    this.oldClearAlpha = renderer.getClearAlpha()
    const oldAutoClear = renderer.autoClear

    renderer.autoClear = false

    renderer.setClearColor(0x000000, 0)

    const currentBackground = this.renderScene.background
    this.renderScene.background = null

    this.renderSelectedObjects(
      renderer,
      writeBuffer,
      readBuffer,
      currentBackground
    )

    this.renderScene.background = currentBackground
    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha)
    renderer.autoClear = oldAutoClear

    if (this.renderToScreen) {
      this.fsQuad.material = this.materialCopy
      this.materialCopy.uniforms["tDiffuse"].value = readBuffer.texture
      renderer.setRenderTarget(null)
      this.fsQuad.render(renderer)
    }
  }

  getMetaballMaskMaterial() {
    return new ShaderMaterial({
      uniforms: {
        tDiffuse: {
          value: null,
        },
      },
      vertexShader: MetaballVertexShader,
      fragmentShader: MetaballFragmentShader,

      blending: NormalBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
  }
}

export { MetaballPass }
