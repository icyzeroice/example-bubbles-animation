
import { EmopopSystem, EmopopWorld } from "./context"
import { whenDebug } from "./env"
import { DebugControlsSystem, DebugExampleSystem, DebugMatterBoundary, DebugStatsSystem } from "./systemdebug"
import { CreateEmojiSystem, RemoveEmotionTerminatedSystem, UpdateEmotionEmitterSystem, UpdateEmotionLifetimeAfterSystem } from "./systemlogic"
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
    [UpdateEmotionLifetimeAfterSystem, true],
])

whenDebug(() => {
    systems.push(...usedSystemFilter([
        [DebugControlsSystem, false],
        [DebugStatsSystem, false],
        [DebugExampleSystem, false],
        [DebugMatterBoundary, false],
    ]))
})

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

