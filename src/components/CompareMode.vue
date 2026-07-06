<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAudioStream } from "../composables/useAudioStream";
import { useRecorder } from "../composables/useRecorder";
import {
  RAW_PROFILE,
  PROCESSED_PROFILE,
  RNNOISE_PROFILE,
  NS_ONLY_PROFILE,
  EC_ONLY_PROFILE,
  AGC_ONLY_PROFILE,
} from "../lib/audio";
import StreamPanel from "./StreamPanel.vue";
import PlaybackPanel from "./PlaybackPanel.vue";

const props = defineProps<{ deviceId: string }>();
const emit = defineEmits<{ started: [] }>();

const raw = useAudioStream(RAW_PROFILE);
const processed = useAudioStream(PROCESSED_PROFILE);
const nsOnly = useAudioStream(NS_ONLY_PROFILE);
const ecOnly = useAudioStream(EC_ONLY_PROFILE);
const agcOnly = useAudioStream(AGC_ONLY_PROFILE);
const rnnoise = useAudioStream(RNNOISE_PROFILE);

const rawRecorder = useRecorder();
const processedRecorder = useRecorder();
const nsOnlyRecorder = useRecorder();
const ecOnlyRecorder = useRecorder();
const agcOnlyRecorder = useRecorder();
const rnnoiseRecorder = useRecorder();

const starting = ref(false);
const startError = ref<string | null>(null);

const active = computed(() => raw.active.value && processed.active.value);
const recording = computed(
  () =>
    rawRecorder.recording.value ||
    processedRecorder.recording.value ||
    nsOnlyRecorder.recording.value ||
    ecOnlyRecorder.recording.value ||
    agcOnlyRecorder.recording.value ||
    rnnoiseRecorder.recording.value,
);
const monitoringAny = computed(
  () =>
    raw.monitoring.value ||
    processed.monitoring.value ||
    nsOnly.monitoring.value ||
    ecOnly.monitoring.value ||
    agcOnly.monitoring.value ||
    rnnoise.monitoring.value,
);

async function start() {
  starting.value = true;
  startError.value = null;
  try {
    await raw.open(props.deviceId);
    await processed.open(props.deviceId);
    await nsOnly.open(props.deviceId).catch(() => {});
    await ecOnly.open(props.deviceId).catch(() => {});
    await agcOnly.open(props.deviceId).catch(() => {});
    await rnnoise.open(props.deviceId).catch(() => {});
    emit("started");
  } catch (e) {
    startError.value = (e as Error).message;
  } finally {
    starting.value = false;
  }
}

function stopAll() {
  stopRecording();
  raw.close();
  processed.close();
  nsOnly.close();
  ecOnly.close();
  agcOnly.close();
  rnnoise.close();
}

function startRecording() {
  if (!active.value) return;
  if (raw.stream.value) rawRecorder.start(raw.stream.value);
  if (processed.stream.value) processedRecorder.start(processed.stream.value);
  if (nsOnly.stream.value) nsOnlyRecorder.start(nsOnly.stream.value);
  if (ecOnly.stream.value) ecOnlyRecorder.start(ecOnly.stream.value);
  if (agcOnly.stream.value) agcOnlyRecorder.start(agcOnly.stream.value);
  if (rnnoise.stream.value) rnnoiseRecorder.start(rnnoise.stream.value);
}

function stopRecording() {
  rawRecorder.stop();
  processedRecorder.stop();
  nsOnlyRecorder.stop();
  ecOnlyRecorder.stop();
  agcOnlyRecorder.stop();
  rnnoiseRecorder.stop();
}

watch(
  () => props.deviceId,
  () => {
    if (active.value) void start();
  },
);
</script>

<template>
  <div class="mode">
    <p class="hint">
      Паралельні потоки з одного мікрофона для прямого A/B-порівняння в записі:
      raw, повна нативна обробка, окремо кожне нативне налаштування (NS / EC /
      AGC) та RNNoise.
    </p>

    <div class="buttons">
      <button
        v-if="!active"
        class="btn-primary"
        :disabled="starting"
        @click="start"
      >
        {{ starting ? "Запуск…" : "Увімкнути мікрофон" }}
      </button>
      <button v-else @click="stopAll">Зупинити</button>

      <button
        v-if="active && !recording"
        class="btn-rec"
        @click="startRecording"
      >
        ● Почати запис
      </button>
      <button v-if="recording" class="btn-rec on" @click="stopRecording">
        ■ Зупинити запис
      </button>
    </div>

    <p v-if="startError" class="banner error">{{ startError }}</p>
    <p v-if="monitoringAny" class="banner warn">
      ⚠ Live-моніторинг увімкнено. Використовуйте навушники, інакше виникне
      акустичний зворотний зв'язок (echo/feedback).
    </p>
    <p v-if="recording" class="banner error">● Запис триває…</p>

    <section v-if="active" class="streams">
      <StreamPanel :stream="raw" />
      <StreamPanel :stream="processed" />
      <StreamPanel :stream="nsOnly" />
      <StreamPanel :stream="ecOnly" />
      <StreamPanel :stream="agcOnly" />
      <StreamPanel :stream="rnnoise" />
    </section>
    <p v-else class="placeholder">
      Увімкніть мікрофон, щоб побачити паралельні потоки.
    </p>

    <section class="playback-grid">
      <PlaybackPanel
        title="Raw (без обробки)"
        :url="rawRecorder.url.value"
        file-name="raw.webm"
      />
      <PlaybackPanel
        title="Processed (native DSP)"
        :url="processedRecorder.url.value"
        file-name="processed.webm"
      />
      <PlaybackPanel
        title="Тільки NS (шумоподавлення)"
        :url="nsOnlyRecorder.url.value"
        file-name="ns-only.webm"
      />
      <PlaybackPanel
        title="Тільки EC (ехо)"
        :url="ecOnlyRecorder.url.value"
        file-name="ec-only.webm"
      />
      <PlaybackPanel
        title="Тільки AGC (гучність)"
        :url="agcOnlyRecorder.url.value"
        file-name="agc-only.webm"
      />
      <PlaybackPanel
        title="RNNoise (WASM) + нативні EC/AGC"
        :url="rnnoiseRecorder.url.value"
        file-name="rnnoise.webm"
      />
    </section>
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
.buttons {
  display: flex;
  gap: 10px;
}
.streams {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.placeholder {
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  padding: 32px 0;
}
.playback-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
