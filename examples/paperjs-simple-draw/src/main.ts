import "./style.css";

import paper from "paper";

// paper.install(window);
// Keep global references to both tools, so the HTML
// links below can access them.
var tool1: paper.Tool, tool2: paper.Tool;

paper.setup(document.querySelector<HTMLCanvasElement>("#canvas")!);

// Create two drawing tools.
// tool1 will draw straight lines,
// tool2 will draw clouds.

// Both share the mouseDown event:
var path: paper.Path;

function onMouseDown(event) {
  path = new paper.Path();
  path.strokeColor = "black";
  path.add(event.point);
}

tool1 = new paper.Tool();
tool1.onMouseDown = onMouseDown;

tool1.onMouseDrag = function (event) {
  path.add(event.point);
};

tool2 = new paper.Tool();
tool2.minDistance = 20;
tool2.onMouseDown = onMouseDown;

tool2.onMouseDrag = function (event) {
  // Use the arcTo command to draw cloudy lines
  path.arcTo(event.point);
};
