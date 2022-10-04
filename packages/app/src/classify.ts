import { EmojiConfig, EmojiConfigSet, EmotionName } from 'emoji-set'
import { paper } from "./context"


interface ImageConfig extends EmojiConfig {
  color: paper.Color
}

const classification: ImageConfig[] = [
  new paper.Color(0.9, 0.1, 0.1, 1),
  new paper.Color(0.1, 0.9, 0.1, 1),
  new paper.Color(0.1, 0.9, 0.1, 1),
  new paper.Color(0.1, 0.1, 0.9, 1),
  new paper.Color(0.9, 0.9, 0.1, 1),
  new paper.Color(0.1, 0.9, 0.9, 1),
  new paper.Color(0.9, 0.1, 0.9, 1),
].map((color, index) => Object.assign({}, EmojiConfigSet[index], { color }))

export function getClassifiedColor(name?: EmotionName) {
  return classification.find((value) => value.alias === name)?.color ?? classification[Math.floor(Math.random() * classification.length)].color
}
