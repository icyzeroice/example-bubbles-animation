interface EmojiConfig {
  name: string
  unicode: string
  filename: string
  svg?: string
}

/**
 * @see https://unicode.org/emoji/charts/full-emoji-list.html
 */
export const EmojiConfigSet: EmojiConfig[] = [
  {
    name: "grinning face",
    unicode: "😀",
    filename: "1f600.svg",
  },
  {
    name: "slightly frowning face",
    unicode: "🙁",
    filename: "1f641.svg",
  },
  {
    name: "enraged face",
    unicode: "😡",
    filename: "1f621.svg",
  },
  {
    name: "slightly smiling face",
    unicode: "🙂",
    filename: "1f642.svg",
  },
  {
    name: "neutral face",
    unicode: "😐",
    filename: "1f610.svg",
  },
  {
    name: "fearful face",
    unicode: "😨",
    filename: "1f628.svg",
  },
]
