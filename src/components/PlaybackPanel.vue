<script setup lang="ts">
defineProps<{
  title: string
  url: string | null
  fileName: string
}>()
</script>

<template>
  <div class="playback">
    <h4>{{ title }}</h4>
    <template v-if="url">
      <audio :src="url" controls />
      <a class="dl" :href="url" :download="fileName">Завантажити .webm</a>
    </template>
    <p v-else class="empty">Ще немає запису</p>
  </div>
</template>

<style scoped>
.playback {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
h4 {
  margin: 0;
  font-size: 14px;
}
audio {
  width: 100%;
}
.dl {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
}
.dl:hover {
  text-decoration: underline;
}
.empty {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
</style>
