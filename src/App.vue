<script setup lang="ts">
import { ref } from 'vue'
import { useAudioDevices } from './composables/useAudioDevices'
import DeviceSelector from './components/DeviceSelector.vue'
import CompareMode from './components/CompareMode.vue'
import LiveMode from './components/LiveMode.vue'

const { devices, selectedDeviceId, hasLabels, error: deviceError, refresh } = useAudioDevices()

type Mode = 'compare' | 'live'
const mode = ref<Mode>('compare')

const TABS: { id: Mode; label: string }[] = [
  { id: 'compare', label: 'Порівняння (A/B запис)' },
  { id: 'live', label: 'Live-налаштування' },
]

function onStarted() {
  void refresh()
}
</script>

<template>
  <main class="app">
    <header class="top">
      <h1>Тест шумоподавлення мікрофона</h1>
      <p class="sub">
        Native NS/EC/AGC та RNNoise (WASM) для майбутньої WebRTC-телефонії.
      </p>
    </header>

    <DeviceSelector
      v-model="selectedDeviceId"
      :devices="devices"
      :has-labels="hasLabels"
    />

    <nav class="tabs">
      <button
        v-for="t in TABS"
        :key="t.id"
        class="tab"
        :class="{ active: mode === t.id }"
        @click="mode = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <p v-if="deviceError" class="banner error">{{ deviceError }}</p>

    <CompareMode
      v-if="mode === 'compare'"
      :device-id="selectedDeviceId"
      @started="onStarted"
    />
    <LiveMode v-else :device-id="selectedDeviceId" @started="onStarted" />
  </main>
</template>

<style scoped>
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.top h1 {
  margin: 0 0 4px;
  font-size: 22px;
}
.sub {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}
.tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border);
}
.tab {
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--muted);
  padding: 8px 12px;
}
.tab.active {
  color: inherit;
  border-bottom-color: #3b82f6;
}
</style>
