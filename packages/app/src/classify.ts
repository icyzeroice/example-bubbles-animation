import { paper } from "./context"

const classification = [
  new paper.Color(0.9, 0.1, 0.1, 1),
  new paper.Color(0.1, 0.9, 0.1, 1),
  new paper.Color(0.1, 0.1, 0.9, 1),
  new paper.Color(0.9, 0.9, 0.1, 1),
  new paper.Color(0.1, 0.9, 0.9, 1),
  new paper.Color(0.9, 0.1, 0.9, 1),
]

export function getClassifiedColor() {
  return classification[Math.floor(Math.random() * classification.length)]
}
