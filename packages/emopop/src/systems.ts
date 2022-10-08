
import { EmopopWorld } from "./context"
import { DebugControlsSystem, DebugExampleSystem } from "./systemdebug"
import { CreateEmojiSystem, UpdateEmotionEmitterSystem, UpdateEmotionLifetimeSystem } from "./systemlogic"
import { MatterPhysicalSystem } from "./systemmatter"
import { RenderBackgroundSystem, RenderEmojiSystem, RenderLoopSystem } from "./systemrendering"


export const systems: ((world: EmopopWorld) => EmopopWorld)[] = [
    // business logic
    UpdateEmotionEmitterSystem,
    CreateEmojiSystem,
    UpdateEmotionLifetimeSystem,

    // physical logic
    // PhysicsSystem,
    MatterPhysicalSystem,

    // rendering
    RenderLoopSystem,
    RenderEmojiSystem,
    RenderBackgroundSystem,

    // time setting
    TimeSystem
]

if (process.env.NODE_ENV === 'development') {
    systems.push(
        DebugControlsSystem,
        // DebugStatsSystem,
        DebugExampleSystem,
        // DebugMatterBoundary,
    )
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
