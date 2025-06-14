// Fast seeded RNG adapted from the public-domain implementation
// by @byrc: https://github.com/bryc/code/blob/master/jshash/PRNGs.md
//
// Usage:
// const randFn = mulberry32('string seed')
// const randomNumber = randFn() // [0, 1] random float

type RandomNumberGenerator = () => number

export default function mulberry32 (seed?: string): RandomNumberGenerator {
  if (seed == null) {
    seed = Math.random().toString(36) // support no-seed usage
  }

  let a: number = xmur3(seed)()

  return function (): number {
    a |= 0
    a = a + 0x6D2B79F5 | 0
    let t: number = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function xmur3 (str: string): () => number {
  let h: number = 1779033703 ^ str.length

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = h << 13 | h >>> 19
  }

  return function (): number {
    h = Math.imul(h ^ h >>> 16, 2246822507)
    h = Math.imul(h ^ h >>> 13, 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}
