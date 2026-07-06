<script setup lang="ts">
import { ref } from 'vue'
import { useVisualizer } from '../composables/useVisualizer'
import type { AudioStream } from '../composables/useAudioStream'
import VuMeter from './VuMeter.vue'

const props = defineProps<{
  stream: AudioStream
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const { level, peak } = useVisualizer(canvas, props.stream.analyser)

const flags = props.stream.profile
</script>

<template>
  <section class="panel">
    <header>
      <h3>{{ flags.label }}</h3>
      <div class="flags">
        <slot name="badges">
          <span v-if="flags.processor" class="flag wasm">{{ flags.processor.toUpperCase() }} · WASM</span>
          <template v-else>
            <span :class="['flag', flags.noiseSuppression ? 'on' : 'off']">NS</span>
            <span :class="['flag', flags.echoCancellation ? 'on' : 'off']">EC</span>
            <span :class="['flag', flags.autoGainControl ? 'on' : 'off']">AGC</span>
          </template>
        </slot>
      </div>
      <label class="monitor">
        <input
          type="checkbox"
          :checked="stream.monitoring.value"
          :disabled="!stream.active.value"
          @change="stream.setMonitoring(($event.target as HTMLInputElement).checked)"
        />
        Live
      </label>
    </header>

    <canvas ref="canvas" class="wave" />
    <VuMeter :level="level" :peak="peak" />

    <p v-if="stream.error.value" class="err">{{ stream.error.value }}</p>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
header {
  display: flex;
  align-items: center;
  gap: 12px;
}
h3 {
  margin: 0;
  font-size: 15px;
  flex: 1;
}
.flags {
  display: flex;
  gap: 4px;
}
.flag {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.flag.on {
  background: #14532d;
  color: #86efac;
}
.flag.off {
  background: var(--surface-2);
  color: var(--muted);
}
.flag.wasm {
  background: #1e3a5f;
  color: #93c5fd;
}
.monitor {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}
.wave {
  width: 100%;
  height: 96px;
  border-radius: 8px;
  background: var(--surface-2);
  display: block;
}
.err {
  margin: 0;
  color: #e5484d;
  font-size: 13px;
}
</style>
