
import { EmopopSystem, EmopopWorld } from "./context"
import { DebugControlsSystem, DebugExampleSystem, DebugMatterBoundary, DebugStatsSystem } from "./systemdebug"
import { CreateEmojiSystem, RemoveEmotionTerminatedSystem, UpdateEmotionEmitterSystem, UpdateEmotionLifetimeSystem } from "./systemlogic"
import { MatterPhysicalSystem } from "./systemmatter"
import { RenderBackgroundSystem, RenderEmojiSystem, RenderLoopSystem } from "./systemrendering"


export const systems = usedSystemFilter([
    // business logic
    [UpdateEmotionEmitterSystem, true],
    [CreateEmojiSystem, true],
    [RemoveEmotionTerminatedSystem, true],

    // physical logic
    // PhysicsSystem,
    [MatterPhysicalSystem, true],

    // rendering
    [RenderLoopSystem, true],
    [RenderEmojiSystem, true],
    [RenderBackgroundSystem, false],

    // time setting
    [TimeSystem, true],
    [UpdateEmotionLifetimeSystem, true],
])

if (process.env.NODE_ENV === 'development') {
    systems.push(...usedSystemFilter([
        [DebugControlsSystem, true],
        [DebugStatsSystem, false],
        [DebugExampleSystem, true],
        [DebugMatterBoundary, false],
    ]))
}


function usedSystemFilter(switchers: [EmopopSystem, boolean][]): EmopopSystem[] {
    return switchers.filter(([_, enabled]) => enabled).map(([system]) => system)
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

