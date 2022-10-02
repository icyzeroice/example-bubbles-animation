import "./style.css"
import { paper } from "./context"
import SvgContent from "emoji-set/src/assets/1f600.svg"

onStart()
render()

function render() {
  onFrame()
  requestAnimationFrame(render)
}

function onStart() {
  paper.project.importSVG(SvgContent, (path: paper.Group) => {
    path.children[1].children[0].children[0].visible = true
    path.children[1].children[0].children[1].visible = true
    path.children[1].children[0].children[2].visible = true
    path.children[1].children[0].children[3].visible = true
    path.children[1].children[0].children[4].visible = true
  })
}

function onFrame() {}
