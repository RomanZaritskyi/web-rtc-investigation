import { onBeforeUnmount, ref } from 'vue'
import { pickRecorderMimeType } from '../lib/audio'

export function useRecorder() {
  const recording = ref(false)
  const url = ref<string | null>(null)
  const error = ref<string | null>(null)

  const mimeType = pickRecorderMimeType()
  let recorder: MediaRecorder | null = null
  let chunks: Blob[] = []

  function reset() {
    if (url.value) {
      URL.revokeObjectURL(url.value)
      url.value = null
    }
  }

  function start(stream: MediaStream) {
    reset()
    chunks = []
    try {
      recorder = new MediaRecorder(stream, { mimeType })
    } catch (e) {
      error.value = (e as Error).message
      return
    }
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      url.value = URL.createObjectURL(blob)
    }
    recorder.start()
    recording.value = true
    error.value = null
  }

  function stop() {
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    recording.value = false
  }

  onBeforeUnmount(() => {
    stop()
    reset()
  })

  return { recording, url, error, start, stop }
}

export type Recorder = ReturnType<typeof useRecorder>
