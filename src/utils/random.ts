export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function pickAndRemove<T>(array: T[]): { item: T; remaining: T[] } {
  const index = Math.floor(Math.random() * array.length)
  const item = array[index]
  const remaining = [...array.slice(0, index), ...array.slice(index + 1)]
  return { item, remaining }
}
