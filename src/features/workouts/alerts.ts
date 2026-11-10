// Device alerts for a countdown that ends. Every call is feature-detected and
// swallows its own errors: a missing speaker or vibration motor must never
// break a workout.

type AudioWindow = typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

let ctx: AudioContext | undefined

/** Call from a tap (the Start button): browsers only allow sound after one. */
export function prepareAudio(): void {
  try {
    const Ctor =
      (globalThis as AudioWindow).AudioContext ??
      (globalThis as AudioWindow).webkitAudioContext
    if (!Ctor) return
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // No audio: the other alerts still work.
  }
}

export function beep(): void {
  try {
    prepareAudio()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.2
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Ignore: see above.
  }
}

export function vibrate(): void {
  try {
    navigator.vibrate?.([200, 100, 200])
  } catch {
    // Ignore: see above.
  }
}

export function alertCountdownEnd(): void {
  beep()
  vibrate()
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> }
}

/** Keeps the screen on; resolves to a function that lets it sleep again. */
export async function keepScreenOn(): Promise<() => void> {
  try {
    const lock = await (navigator as WakeLockNavigator).wakeLock?.request(
      'screen',
    )
    return () => {
      void Promise.resolve(lock?.release()).catch(() => {})
    }
  } catch {
    return () => {}
  }
}
