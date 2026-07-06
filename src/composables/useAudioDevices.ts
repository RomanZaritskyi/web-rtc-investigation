import { onBeforeUnmount, onMounted, ref } from 'vue'
import { describeMediaError } from '../lib/audio'

export function useAudioDevices() {
  const devices = ref<MediaDeviceInfo[]>([])
  const selectedDeviceId = ref('')
  const hasLabels = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const inputs = all.filter((d) => d.kind === 'audioinput')
      devices.value = inputs
      hasLabels.value = inputs.some((d) => d.label !== '')
      if (!selectedDeviceId.value && inputs.length) {
        selectedDeviceId.value = inputs[0].deviceId
      }
      if (!inputs.length) {
        error.value = 'Мікрофони не знайдено.'
      } else {
        error.value = null
      }
    } catch (e) {
      error.value = describeMediaError(e)
    }
  }

  function onDeviceChange() {
    void refresh()
  }

  onMounted(() => {
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange)
    void refresh()
  })

  onBeforeUnmount(() => {
    navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange)
  })

  return { devices, selectedDeviceId, hasLabels, error, refresh }
}
