<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  level: number
  peak: number
}>()

const pct = computed(() => Math.min(100, Math.round(props.level * 140)))
const peakPct = computed(() => Math.min(100, Math.round(props.peak * 100)))
const clipping = computed(() => props.peak > 0.98)
</script>

<template>
  <div class="vu">
    <div class="vu-track">
      <div class="vu-fill" :class="{ clip: clipping }" :style="{ width: pct + '%' }" />
      <div class="vu-peak" :style="{ left: peakPct + '%' }" />
    </div>
    <span class="vu-label" :class="{ clip: clipping }">
      {{ clipping ? 'CLIP' : pct + '%' }}
    </span>
  </div>
</template>

<style scoped>
.vu {
  display: flex;
  align-items: center;
  gap: 10px;
}
.vu-track {
  position: relative;
  flex: 1;
  height: 12px;
  border-radius: 6px;
  background: var(--surface-2);
  overflow: hidden;
}
.vu-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #eab308 75%, #e5484d);
  transition: width 60ms linear;
}
.vu-fill.clip {
  background: #e5484d;
}
.vu-peak {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: #fff;
  opacity: 0.7;
}
.vu-label {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  width: 40px;
  text-align: right;
  color: var(--muted);
}
.vu-label.clip {
  color: #e5484d;
  font-weight: 700;
}
</style>
