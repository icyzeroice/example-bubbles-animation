const SourceData = require('./data.json')


const bbox =
    [
        641,
        730,
        685,
        785
    ]

function inRange(n, a, b) {
    return Math.min(a, b) <= n && n <= Math.max(a, b)
}

function intersect(x1, y1, x2, y2) {
    return (inRange(bbox[0], x1, x2) && inRange(bbox[1], y1, y2))
        || (inRange(bbox[2], x1, x2) && inRange(bbox[1], y1, y2))
        || (inRange(bbox[0], x1, x2) && inRange(bbox[3], y1, y2))
        || (inRange(bbox[2], x1, x2) && inRange(bbox[3], y1, y2))
}

function emojiSequence() {
    return SourceData
        .map((frame, frameIndex) => [frameIndex, frame.detection.boxes.findIndex((box) => intersect(box[0], box[1], box[2], box[3]))])
        .filter(([_, boxIndex]) => boxIndex !== -1)
        .map(([frameIndex, boxIndex]) => SourceData[frameIndex].detection.emotions[boxIndex])
}

console.log(emojiSequence())