<script setup lang="ts">
defineProps<{
  devices: MediaDeviceInfo[]
  modelValue: string
  hasLabels: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="device-selector">
    <label for="device">Мікрофон</label>
    <select
      id="device"
      :value="modelValue"
      :disabled="disabled || devices.length === 0"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="devices.length === 0" value="">Пристроїв не знайдено</option>
      <option v-for="(d, i) in devices" :key="d.deviceId" :value="d.deviceId">
        {{ d.label || `Мікрофон ${i + 1}` }}
      </option>
    </select>
    <p v-if="!hasLabels && devices.length" class="hint">
      Назви пристроїв з'являться після надання доступу до мікрофона.
    </p>
  </div>
</template>

<style scoped>
.device-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label {
  font-weight: 600;
  font-size: 14px;
}
select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  font-size: 14px;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
