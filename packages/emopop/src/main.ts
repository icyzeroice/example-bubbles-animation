import "./style.css"
import { MainScene } from "./scene"
import { preloadEmojiTextures } from "./emoji"

preloadEmojiTextures().then(() => {
    MainScene()
})
