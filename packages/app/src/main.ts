import "./style.css"
import { onStart, onFrame } from "./scene"
import { mainlogic } from "./context"

mainlogic({ onStart, onFrame })
