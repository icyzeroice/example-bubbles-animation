
import { EmopopWorld } from "./context"
import { DebugControlsSystem, DebugExampleSystem, DebugMatterBoundary, DebugStatsSystem } from "./systemdebug"
import { CreateEmojiSystem, RemoveEmotionTerminatedSystem, UpdateEmotionEmitterSystem, UpdateEmotionLifetimeSystem } from "./systemlogic"
import { MatterPhysicalSystem } from "./systemmatter"
import { RenderBackgroundSystem, RenderEmojiSystem, RenderLoopSystem } from "./systemrendering"


export const systems: ((world: EmopopWorld) => EmopopWorld)[] = [
    // business logic
    UpdateEmotionEmitterSystem,
    CreateEmojiSystem,
    RemoveEmotionTerminatedSystem,

    // physical logic
    // PhysicsSystem,
    MatterPhysicalSystem,

    // rendering
    RenderLoopSystem,
    RenderEmojiSystem,
    RenderBackgroundSystem,

    // time setting
    TimeSystem,
    UpdateEmotionLifetimeSystem,
]

if (process.env.NODE_ENV === 'development') {
    const debugSystems: [(world: EmopopWorld) => EmopopWorld, boolean][] = [
        [DebugControlsSystem, true],
        [DebugStatsSystem, false],
        [DebugExampleSystem, true],
        [DebugMatterBoundary, false],
    ]

    systems.push(...debugSystems.filter(([_, enabled]) => enabled).map(([system]) => system))
}


/* -------------------------------------------------------------------------- */
/*                                 time system                                */
/* -------------------------------------------------------------------------- */
function TimeSystem(world: EmopopWorld) {
    const { time } = world

    const now = performance.now()
    const delta = now - time.absolute
    time.delta = delta
    time.deltaInSeconds = delta / 1000
    time.elapsed += delta
    time.absolute = now

    return world
}
