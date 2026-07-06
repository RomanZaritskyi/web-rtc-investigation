import { onScopeDispose, ref, shallowRef } from 'vue'
import {
  buildAudioConstraints,
  describeMediaError,
  type ProcessingProfile,
  type WasmProcessor,
} from '../lib/audio'
import { useAudioContext } from './useAudioContext'
import { createRnnoiseNode } from './useRnnoise'

export interface LiveProcessing {
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean
}

interface ProcessorHandle {
  node: AudioWorkletNode
  dispose: () => void
}

async function createProcessor(ctx: AudioContext, _kind: WasmProcessor): Promise<ProcessorHandle> {
  const node = await createRnnoiseNode(ctx)
  return {
    node,
    dispose: () => {
      try {
        node.disconnect()
      } catch {
        /* already disconnected */
      }
      ;(node as { destroy?: () => void }).destroy?.()
    },
  }
}

export function useAudioStream(profile: ProcessingProfile) {
  const stream = shallowRef<MediaStream | null>(null)
  const track = shallowRef<MediaStreamTrack | null>(null)
  const analyser = shallowRef<AnalyserNode | null>(null)
  const settings = shallowRef<MediaTrackSettings | null>(null)
  const active = ref(false)
  const monitoring = ref(false)
  const processorKind = ref<WasmProcessor | null>(null)
  const error = ref<string | null>(null)

  let captureStream: MediaStream | null = null
  let captureTrack: MediaStreamTrack | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let processor: ProcessorHandle | null = null
  let tap: GainNode | null = null
  let monitorGain: GainNode | null = null
  let destination: MediaStreamAudioDestinationNode | null = null

  async function open(deviceId: string) {
    close()
    try {
      captureStream = await navigator.mediaDevices.getUserMedia(
        buildAudioConstraints(deviceId, profile),
      )
      captureTrack = captureStream.getAudioTracks()[0] ?? null

      const ctx = useAudioContext()
      source = ctx.createMediaStreamSource(captureStream)

      // Стабільна точка розгалуження: усе нижче під'єднано один раз,
      // а перемикання RNNoise лише перекомутовує те, що живить tap.
      tap = ctx.createGain()

      const an = ctx.createAnalyser()
      an.fftSize = 2048
      an.smoothingTimeConstant = 0.8
      tap.connect(an)

      monitorGain = ctx.createGain()
      monitorGain.gain.value = monitoring.value ? 1 : 0
      tap.connect(monitorGain)
      monitorGain.connect(ctx.destination)

      // Вихід для запису/WebRTC — сталий трек, не залежить від обробки.
      destination = ctx.createMediaStreamDestination()
      tap.connect(destination)

      stream.value = destination.stream
      track.value = destination.stream.getAudioTracks()[0] ?? null
      settings.value = captureTrack?.getSettings() ?? null
      analyser.value = an

      await setProcessor(profile.processor ?? null)

      active.value = true
      error.value = null
    } catch (e) {
      error.value = describeMediaError(e)
      active.value = false
      close()
      throw e
    }
  }

  async function setProcessor(kind: WasmProcessor | null) {
    if (!source || !tap) return
    if (kind === processorKind.value && processor) return

    source.disconnect()
    processor?.dispose()
    processor = null

    if (kind) {
      processor = await createProcessor(useAudioContext(), kind)
      source.connect(processor.node)
      processor.node.connect(tap)
    } else {
      source.connect(tap)
    }
    processorKind.value = kind
  }

  function setMonitoring(on: boolean) {
    monitoring.value = on
    if (monitorGain) monitorGain.gain.value = on ? 1 : 0
  }

  async function applyProcessing(p: LiveProcessing) {
    if (!captureTrack) return
    await captureTrack.applyConstraints({
      noiseSuppression: p.noiseSuppression,
      echoCancellation: p.echoCancellation,
      autoGainControl: p.autoGainControl,
    })
    settings.value = captureTrack.getSettings()
  }

  function close() {
    source?.disconnect()
    processor?.dispose()
    tap?.disconnect()
    monitorGain?.disconnect()
    destination?.disconnect()
    analyser.value?.disconnect()
    captureStream?.getTracks().forEach((t) => t.stop())

    source = null
    processor = null
    tap = null
    monitorGain = null
    destination = null
    captureStream = null
    captureTrack = null
    stream.value = null
    track.value = null
    analyser.value = null
    settings.value = null
    active.value = false
    processorKind.value = null
  }

  onScopeDispose(close)

  return {
    profile,
    stream,
    track,
    analyser,
    settings,
    active,
    monitoring,
    processorKind,
    error,
    open,
    setProcessor,
    applyProcessing,
    setMonitoring,
    close,
  }
}

export type AudioStream = ReturnType<typeof useAudioStream>
