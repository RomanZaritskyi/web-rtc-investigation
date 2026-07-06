import { loadRnnoise, RnnoiseWorkletNode } from '@sapphi-red/web-noise-suppressor'
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url'
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url'
import rnnoiseWasmSimdPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url'

let wasmBinary: ArrayBuffer | null = null
let modulePromise: Promise<void> | null = null

export async function createRnnoiseNode(ctx: AudioContext): Promise<RnnoiseWorkletNode> {
  if (!wasmBinary) {
    wasmBinary = await loadRnnoise({ url: rnnoiseWasmPath, simdUrl: rnnoiseWasmSimdPath })
  }
  if (!modulePromise) {
    modulePromise = ctx.audioWorklet.addModule(rnnoiseWorkletPath)
  }
  await modulePromise
  return new RnnoiseWorkletNode(ctx, { wasmBinary, maxChannels: 1 })
}
