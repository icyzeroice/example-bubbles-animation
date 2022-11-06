import emoji_1f600 from 'emoji-set/src/assets/1f600.svg?raw'
import emoji_1f610 from 'emoji-set/src/assets/1f610.svg?raw'
import emoji_1f621 from 'emoji-set/src/assets/1f621.svg?raw'
import emoji_1f628 from 'emoji-set/src/assets/1f628.svg?raw'
import emoji_1f641 from 'emoji-set/src/assets/1f641.svg?raw'
import emoji_1f642 from 'emoji-set/src/assets/1f642.svg?raw'

import asset_1 from 'emoji-set/src/assets/1.svg?raw'
import asset_2 from 'emoji-set/src/assets/2.svg?raw'
import asset_3 from 'emoji-set/src/assets/3.svg?raw'
import asset_4 from 'emoji-set/src/assets/4.svg?raw'
import asset_5 from 'emoji-set/src/assets/5.svg?raw'
import asset_6 from 'emoji-set/src/assets/6.svg?raw'


export interface EmojiConfig {
  name: string
  unicode: string
  filename: string
  svg: string

  /**
   * @deprecated use aliases instread
   */
  alias: EmotionName

  aliases: EmotionName[]
}

/**
 * @see https://unicode.org/emoji/charts/full-emoji-list.html
 * @deprecated
 */
export const DeprecatedEmojiConfigSet: EmojiConfig[] = [
  {
    name: "grinning face",
    unicode: "😀",
    filename: "1f600.svg",
    svg: emoji_1f600,
    alias: 'Happiness',
    aliases: ['Happiness']
  },
  {
    name: "slightly frowning face",
    unicode: "🙁",
    filename: "1f641.svg",
    svg: emoji_1f641,
    alias: 'Sadness',
    aliases: ['Sadness']
  },
  {
    name: "enraged face",
    unicode: "😡",
    filename: "1f621.svg",
    svg: emoji_1f621,
    alias: 'Anger',
    aliases: ['Anger', 'Contempt', 'Disgust']
  },
  {
    name: "slightly smiling face",
    unicode: "🙂",
    filename: "1f642.svg",
    svg: emoji_1f642,
    alias: 'Surprise',
    aliases: ['Surprise']
  },
  {
    name: "neutral face",
    unicode: "😐",
    filename: "1f610.svg",
    svg: emoji_1f610,
    alias: 'Neutral',
    aliases: ['Neutral']
  },
  {
    name: "fearful face",
    unicode: "😨",
    filename: "1f628.svg",
    svg: emoji_1f628,
    alias: 'Fear',
    aliases: ['Fear']
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

export const EmojiConfigSet: EmojiConfig[] = [
  {
    name: "grinning face",
    unicode: "😀",
    filename: "1f600.svg",
    svg: asset_3,
    alias: 'Happiness',
    aliases: ['Happiness']
  },
  {
    name: "slightly frowning face",
    unicode: "🙁",
    filename: "1f641.svg",
    svg: asset_5,
    alias: 'Sadness',
    aliases: ['Sadness']
  },
  {
    name: "enraged face",
    unicode: "😡",
    filename: "1f621.svg",
    svg: asset_4,
    alias: 'Anger',
    aliases: ['Anger', 'Contempt', 'Disgust']
  },
  {
    name: "slightly smiling face",
    unicode: "🙂",
    filename: "1f642.svg",
    svg: asset_6,
    alias: 'Surprise',
    aliases: ['Surprise']
  },
  {
    name: "neutral face",
    unicode: "😐",
    filename: "1f610.svg",
    svg: asset_2,
    alias: 'Neutral',
    aliases: ['Neutral']
  },
  {
    name: "fearful face",
    unicode: "😨",
    filename: "1f628.svg",
    svg: asset_1,
    alias: 'Fear',
    aliases: ['Fear']
  },
]

export type EmotionName = keyof typeof EmotionEnum

/**
 * WARNING: the index may be changed when typescript has breaking changes
 * @param name 
 * @returns [0, 5]
 */
export function getEmotionIndex(name: EmotionName): number {
  // return EmotionEnum[name as EmotionName]
  return EmojiConfigSet.findIndex((config) => config.aliases.includes(name))
}

export function getEmotionName(index: number): EmotionName {
  // return EmotionEnum[index] as EmotionName
  return EmojiConfigSet[index].alias
}