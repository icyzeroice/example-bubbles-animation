import "./style.css"

import Matter, {
  Body,
  Engine,
  Render,
  Runner,
  Common,
  Mouse,
  World,
  Bodies,
} from "matter-js"
import MatterAttractors from "matter-attractors"

// install plugin
Matter.use(MatterAttractors)

var Example = Example || {}

// create engine
var engine = Engine.create(),
  world = engine.world

// create renderer
var render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 1024,
    height: 1024,
  },
})

Render.run(render)

// create runner
var runner = Runner.create()
Runner.run(runner, engine)

// add bodies
world.bodies = []
engine.gravity.scale = 0

engine.timing.timeScale = 1.5

for (var i = 0; i < 15; i += 1) {
  var radius = Common.random(6, 10)

  var body = Bodies.circle(
    Common.random(10, render.options.width),
    Common.random(10, render.options.height),
    radius,
    {
      mass: Common.random(10, 15),
      frictionAir: 0,
      plugin: {
        attractors: [MatterAttractors.Attractors.gravity],
      },
    }
  )

  var speed = 1

  Body.setVelocity(body, {
    x: Common.random(-speed, speed),
    y: Common.random(-speed, speed),
  })

  World.add(world, body)
}

// keep the mouse in sync with rendering
render.mouse = mouse
