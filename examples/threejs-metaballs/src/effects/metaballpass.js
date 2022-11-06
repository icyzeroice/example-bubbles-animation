import {
  Camera,
  Material,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  AdditiveBlending,
  Color,
  DoubleSide,
  Matrix4,
  NoBlending,
  RGBADepthPacking,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  NormalBlending,
} from "three"
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js"
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js"

import MetaballVertexShader from "../metaball.vert.glsl?raw"
import MetaballFragmentShader from "../metaball.frag.glsl?raw"

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
    this.overlayMaterial = this.getOverlayMaterial()

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

    // Make selected objects invisible
    // this.changeVisibilityOfSelectedObjects(false)

    // 1. Draw Non Selected objects
    // this.renderScene.overrideMaterial = this.materialCopy
    // this.fsQuad.material = this.materialCopy
    // renderer.setRenderTarget(this.renderTargetNonSelectedBuffer)
    // renderer.clear()
    // renderer.render(this.renderScene, this.renderCamera)
    // this.fsQuad.render(renderer)

    // Make selected objects visible
    // Make non selected objects invisible, and draw only the selected objects
    // this.changeVisibilityOfSelectedObjects(true)
    // this._visibilityCache.clear()
    this.changeVisibilityOfNonSelectedObjects(false)

    // this.renderScene.overrideMaterial = this.materialCopy
    // this.fsQuad.material = this.materialCopy
    renderer.setRenderTarget(this.renderTargetSelectedBuffer)
    // renderer.setRenderTarget(readBuffer)
    renderer.clear()
    renderer.render(this.renderScene, this.renderCamera)
    // this.fsQuad.render(renderer)

    // this.renderScene.overrideMaterial = null
    this.changeVisibilityOfNonSelectedObjects(true)
    this._visibilityCache.clear()

    // console.log(this.renderScene.children.map((child) => child.visible))

    // this.renderScene.overrideMaterial = this.metaballMaterial
    this.fsQuad.material = this.metaballMaterial
    this.metaballMaterial.uniforms["tDiffuse"].value =
      this.renderTargetSelectedBuffer.texture

    renderer.setRenderTarget(readBuffer)
    // renderer.setRenderTarget(this.renderTargetResultBuffer)

    if (this.needClear) {
      renderer.clear()
    }

    this.fsQuad.render(renderer)

    // renderer.render(this.renderScene, this.renderCamera)

    // Blend it additively over the input texture
    // this.renderScene.overrideMaterial = this.overlayMaterial

    // this.fsQuad.material = this.overlayMaterial
    // this.overlayMaterial.uniforms["baseTexture"].value =
    //   this.renderTargetMetaballBuffer.texture
    // this.overlayMaterial.uniforms["bloomTexture"].value =
    //   this.renderTargetNonSelectedBuffer.texture

    // renderer.setRenderTarget(readBuffer)
    // renderer.clear()
    // this.fsQuad.render(renderer)
  }

  render(renderer, writeBuffer, readBuffer) {
    renderer.getClearColor(this._oldClearColor)
    this.oldClearAlpha = renderer.getClearAlpha()
    const oldAutoClear = renderer.autoClear

    renderer.autoClear = false

    // renderer.setClearColor(0xffffff, 1)
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
      //   blending: AdditiveBlending,
      //   blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
  }

  getOverlayMaterial() {
    return new ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: null },
      },

      vertexShader: `varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

      fragmentShader: `
			uniform sampler2D baseTexture;
			uniform sampler2D bloomTexture;

			varying vec2 vUv;

			void main() {
				gl_FragColor = texture2D( baseTexture, vUv ) + texture2D( bloomTexture, vUv );
				// gl_FragColor = texture2D( baseTexture, vUv );
                // gl_FragColor = texture2D( bloomTexture, vUv );
				// gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
			}
                `,
      blending: AdditiveBlending,
      //   blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    })
  }
}

export { MetaballPass }
