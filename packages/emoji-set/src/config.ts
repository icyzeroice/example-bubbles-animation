import emoji_1f600 from 'emoji-set/src/assets/1f600.svg?raw'
import emoji_1f610 from 'emoji-set/src/assets/1f610.svg?raw'
import emoji_1f621 from 'emoji-set/src/assets/1f621.svg?raw'
import emoji_1f628 from 'emoji-set/src/assets/1f628.svg?raw'
import emoji_1f641 from 'emoji-set/src/assets/1f641.svg?raw'
import emoji_1f642 from 'emoji-set/src/assets/1f642.svg?raw'

export interface EmojiConfig {
  name: string
  unicode: string
  filename: string
  svg: string
  alias: EmotionName
}

/**
 * @see https://unicode.org/emoji/charts/full-emoji-list.html
 */
export const EmojiConfigSet: EmojiConfig[] = [
  {
    name: "grinning face",
    unicode: "😀",
    filename: "1f600.svg",
    svg: emoji_1f600,
    alias: 'Happiness'
  },
  {
    name: "slightly frowning face",
    unicode: "🙁",
    filename: "1f641.svg",
    svg: emoji_1f641,
    alias: 'Sadness'
  },
  {
    name: "enraged face",
    unicode: "😡",
    filename: "1f621.svg",
    svg: emoji_1f621,
    alias: 'Anger'
  },
  {
    name: "slightly smiling face",
    unicode: "🙂",
    filename: "1f642.svg",
    svg: emoji_1f642,
    alias: 'Disgust',
  },
  {
    name: "neutral face",
    unicode: "😐",
    filename: "1f610.svg",
    svg: emoji_1f610,
    alias: 'Neutral'
  },
  {
    name: "fearful face",
    unicode: "😨",
    filename: "1f628.svg",
    svg: emoji_1f628,
    alias: 'Fear'
  },
]

enum EmotionEnum {
  Anger = 0,
  Contempt,
  Disgust,
  Fear,
  Happiness,
  Neutral,
  Sadness,
  Surprise
}

export type EmotionName = keyof typeof EmotionEnum

// WARNING: the index may be changed when typescript has breaking changes
export function getEmotionIndex(name: string): number | undefined {
  return EmotionEnum[name as EmotionName]
}

export function getEmotionName(index: number): string | undefined {
  return EmotionEnum[index]
}