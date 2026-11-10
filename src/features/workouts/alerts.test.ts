type Nav = Record<string, unknown>
const nav = navigator as unknown as Nav
const g = globalThis as unknown as Record<string, unknown>

const setNav = (key: string, value: unknown) =>
  Object.defineProperty(navigator, key, { value, configurable: true })
const unsetNav = (key: string) => {
  delete nav[key]
}

const load = async () => {
  vi.resetModules()
  return import('./alerts')
}

const fakeAudio = () => {
  const osc = {
    type: '',
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = { gain: { value: 0 }, connect: vi.fn() }
  const ctx = {
    state: 'suspended',
    currentTime: 0,
    destination: {},
    resume: vi.fn(),
    createOscillator: vi.fn(() => osc),
    createGain: vi.fn(() => gain),
  }
  g.AudioContext = vi.fn(function () {
    return ctx
  })
  return { osc, ctx }
}

afterEach(() => {
  unsetNav('vibrate')
  unsetNav('wakeLock')
  delete g.AudioContext
})

describe('vibrate', () => {
  it('uses the vibration pattern when the device supports it', async () => {
    const vibrate = vi.fn()
    setNav('vibrate', vibrate)
    const { vibrate: run } = await load()
    run()
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200])
  })

  it('does nothing where vibration is missing', async () => {
    const { vibrate: run } = await load()
    expect(() => run()).not.toThrow()
  })
})

describe('beep', () => {
  it('plays one short tone', async () => {
    const { osc, ctx } = fakeAudio()
    const { prepareAudio, beep } = await load()
    prepareAudio()
    expect(ctx.resume).toHaveBeenCalled()
    beep()
    expect(osc.start).toHaveBeenCalledTimes(1)
    expect(osc.stop).toHaveBeenCalledTimes(1)
  })

  it('does nothing without audio support', async () => {
    const { prepareAudio, beep } = await load()
    expect(() => {
      prepareAudio()
      beep()
    }).not.toThrow()
  })
})

describe('alertCountdownEnd', () => {
  it('beeps and vibrates', async () => {
    const vibrate = vi.fn()
    setNav('vibrate', vibrate)
    const { osc } = fakeAudio()
    const { prepareAudio, alertCountdownEnd } = await load()
    prepareAudio()
    alertCountdownEnd()
    expect(osc.start).toHaveBeenCalled()
    expect(vibrate).toHaveBeenCalled()
  })

  it('still beeps when vibration throws', async () => {
    setNav('vibrate', () => {
      throw new Error('blocked')
    })
    const { osc } = fakeAudio()
    const { prepareAudio, alertCountdownEnd } = await load()
    prepareAudio()
    expect(() => alertCountdownEnd()).not.toThrow()
    expect(osc.start).toHaveBeenCalled()
  })
})

describe('keepScreenOn', () => {
  it('holds a screen wake lock and releases it', async () => {
    const release = vi.fn()
    const request = vi.fn().mockResolvedValue({ release })
    setNav('wakeLock', { request })
    const { keepScreenOn } = await load()
    const off = await keepScreenOn()
    expect(request).toHaveBeenCalledWith('screen')
    off()
    expect(release).toHaveBeenCalled()
  })

  it('returns a harmless release when wake lock is missing or refused', async () => {
    const { keepScreenOn } = await load()
    const none = await keepScreenOn()
    expect(() => none()).not.toThrow()
    setNav('wakeLock', { request: vi.fn().mockRejectedValue(new Error('no')) })
    const refused = await keepScreenOn()
    expect(() => refused()).not.toThrow()
  })
})
