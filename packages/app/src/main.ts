import "./style.css"

import { onStart, onFrame } from "./scene"
import { mainlogic } from "./context"
import { preloadEmojiTextures } from "./emoji"


preloadEmojiTextures().then(() => {
    mainlogic({ onStart, onFrame })
})

