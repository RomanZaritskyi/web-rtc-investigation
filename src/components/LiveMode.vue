<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAudioStream, type LiveProcessing } from '../composables/useAudioStream'
import { useRecorder } from '../composables/useRecorder'
import { LIVE_PROFILE } from '../lib/audio'
import StreamPanel from './StreamPanel.vue'
import PlaybackPanel from './PlaybackPanel.vue'

const props = defineProps<{ deviceId: string }>()
const emit = defineEmits<{ started: [] }>()

const stream = useAudioStream(LIVE_PROFILE)
const recorder = useRecorder()

const starting = ref(false)
const startError = ref<string | null>(null)
const applyError = ref<string | null>(null)
const procBusy = ref(false)

const rnnoiseOn = computed(() => stream.processorKind.value === 'rnnoise')

const desired = reactive<LiveProcessing>({
  noiseSuppression: LIVE_PROFILE.noiseSuppression,
  echoCancellation: LIVE_PROFILE.echoCancellation,
  autoGainControl: LIVE_PROFILE.autoGainControl,
})

const FLAGS: { key: keyof LiveProcessing; label: string }[] = [
  { key: 'noiseSuppression', label: 'NS' },
  { key: 'echoCancellation', label: 'EC' },
  { key: 'autoGainControl', label: 'AGC' },
]

const applied = computed(() => stream.settings.value as Record<string, unknown> | null)

function actual(key: keyof LiveProcessing): boolean | null {
  const s = applied.value
  if (!s || !(key in s)) return null
  return Boolean(s[key])
}

async function start() {
  starting.value = true
  startError.value = null
  try {
    await stream.open(props.deviceId)
    await stream.applyProcessing(desired)
    emit('started')
  } catch (e) {
    startError.value = (e as Error).message
  } finally {
    starting.value = false
  }
}

async function toggle(key: keyof LiveProcessing) {
  desired[key] = !desired[key]
  if (!stream.active.value) return
  applyError.value = null
  try {
    // NS та RNNoise взаємовиключні: увімкнення нативного NS прибирає RNNoise.
    if (key === 'noiseSuppression' && desired.noiseSuppression && rnnoiseOn.value) {
      await stream.setProcessor(null)
    }
    await stream.applyProcessing(desired)
  } catch (e) {
    applyError.value = (e as Error).message
  }
}

async function toggleRnnoise() {
  if (!stream.active.value || procBusy.value) return
  procBusy.value = true
  applyError.value = null
  try {
    if (rnnoiseOn.value) {
      await stream.setProcessor(null)
    } else {
      // RNNoise замінює нативний NS: гасимо його, EC/AGC лишаються.
      if (desired.noiseSuppression) {
        desired.noiseSuppression = false
        await stream.applyProcessing(desired)
      }
      await stream.setProcessor('rnnoise')
    }
  } catch (e) {
    applyError.value = (e as Error).message
  } finally {
    procBusy.value = false
  }
}

function stop() {
  recorder.stop()
  stream.close()
}

function toggleRecording() {
  if (recorder.recording.value) recorder.stop()
  else if (stream.stream.value) recorder.start(stream.stream.value)
}

watch(
  () => props.deviceId,
  () => {
    if (stream.active.value) void start()
  },
)
</script>

<template>
  <div class="mode">
    <p class="hint">
      Один потік, сталий вихідний трек. Native NS/EC/AGC застосовуються до треку
      мікрофона через <code>track.applyConstraints()</code>; WASM-процесор (RNNoise)
      вмикається перекомутацією аудіографа — усе наживо, без повторного захоплення
      мікрофона й без зміни вихідного треку (як під час WebRTC-дзвінка).
    </p>

    <div class="buttons">
      <button v-if="!stream.active.value" class="btn-primary" :disabled="starting" @click="start">
        {{ starting ? 'Запуск…' : 'Увімкнути мікрофон' }}
      </button>
      <button v-else @click="stop">Зупинити</button>

      <button
        v-if="stream.active.value"
        class="btn-rec"
        :class="{ on: recorder.recording.value }"
        @click="toggleRecording"
      >
        {{ recorder.recording.value ? '■ Зупинити запис' : '● Почати запис' }}
      </button>
    </div>

    <p v-if="startError" class="banner error">{{ startError }}</p>
    <p v-if="applyError" class="banner error">{{ applyError }}</p>
    <p v-if="stream.monitoring.value" class="banner warn">
      ⚠ Live-моніторинг увімкнено. Використовуйте навушники, інакше виникне echo/feedback.
    </p>

    <template v-if="stream.active.value">
      <StreamPanel :stream="stream">
        <template #badges>
          <button
            v-for="f in FLAGS"
            :key="f.key"
            class="toggle"
            :class="{ on: desired[f.key] }"
            @click="toggle(f.key)"
          >
            {{ f.label }}: {{ desired[f.key] ? 'ON' : 'OFF' }}
          </button>
          <span class="sep" />
          <button
            class="toggle wasm"
            :class="{ on: rnnoiseOn }"
            :disabled="procBusy"
            @click="toggleRnnoise"
          >
            RNNoise: {{ rnnoiseOn ? 'ON' : 'OFF' }}{{ procBusy ? ' …' : '' }}
          </button>
        </template>
      </StreamPanel>

      <div class="applied">
        <span class="applied-title">Фактично (getSettings):</span>
        <span
          v-for="f in FLAGS"
          :key="f.key"
          class="chip"
          :class="{
            mismatch: actual(f.key) !== null && actual(f.key) !== desired[f.key],
            unknown: actual(f.key) === null,
          }"
        >
          {{ f.label }}:
          {{ actual(f.key) === null ? 'n/a' : actual(f.key) ? 'ON' : 'OFF' }}
        </span>
      </div>
      <p class="note">
        Якщо «фактично» не збігається із запитаним — браузер/ОС проігнорували constraint
        (відомий кейс у Chromium для NS/EC на деяких платформах).
      </p>
    </template>
    <p v-else class="placeholder">Увімкніть мікрофон, щоб перемикати обробку наживо.</p>

    <PlaybackPanel title="Запис live-потоку" :url="recorder.url.value" file-name="live.webm" />
  </div>
</template>

<style scoped>
.mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.hint {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
code {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  background: var(--surface-2);
  padding: 1px 5px;
  border-radius: 4px;
}
.buttons {
  display: flex;
  gap: 10px;
}
.toggle {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 5px;
  background: var(--surface-2);
  color: var(--muted);
  border: 1px solid transparent;
}
.toggle.on {
  background: #14532d;
  color: #86efac;
}
.toggle.wasm.on {
  background: #1e3a5f;
  color: #93c5fd;
}
.sep {
  width: 1px;
  align-self: stretch;
  background: var(--border);
  margin: 0 2px;
}
.applied {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}
.applied-title {
  color: var(--muted);
}
.chip {
  padding: 2px 8px;
  border-radius: 5px;
  background: var(--surface-2);
  font-weight: 600;
}
.chip.mismatch {
  background: #4a1d1f;
  color: #ff9ba0;
}
.chip.unknown {
  color: var(--muted);
}
.note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
.placeholder {
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  padding: 32px 0;
}
</style>
