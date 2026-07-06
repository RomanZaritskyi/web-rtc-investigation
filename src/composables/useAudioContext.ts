let ctx: AudioContext | null = null

export function useAudioContext(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ sampleRate: 48000 })
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}
