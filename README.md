# Тест шумоподавлення мікрофона

Vue 3 + TypeScript + Vite застосунок для порівняння методів шумоподавлення
мікрофона перед інтеграцією у WebRTC-телефонію. Працює локально в браузері, без бекенду.

## Режими

**Порівняння (A/B запис)** — паралельні потоки з одного мікрофона:

- **Raw** — `noiseSuppression/echoCancellation/autoGainControl: false`
- **Processed** — native DSP браузера (ті самі прапорці `true`)
- **Тільки NS / Тільки EC / Тільки AGC** — по одному нативному прапорцю окремо
- **RNNoise (WASM)** — realtime граф-вузол + нативні EC/AGC

**Live-налаштування** — зміна обробки під час розмови на сталому вихідному треку:

- native NS/EC/AGC через `track.applyConstraints()` (з readback `getSettings()`)
- WASM-процесор realtime: **RNNoise** (перекомутація аудіографа; взаємовиключно з нативним NS)

Плюс: live-візуалізація waveform + VU-метр, запис/завантаження, live-моніторинг.

## Запуск

```bash
npm install
npm run dev
```

Потрібен `localhost` або HTTPS — інакше браузер не дасть доступ до мікрофона.

## Бібліотеки

- RNNoise — `@sapphi-red/web-noise-suppressor` (MIT)

## Структура

- `src/lib/` — `audio.ts` (профілі/constraints)
- `src/composables/` — `useAudioDevices`, `useAudioStream`, `useVisualizer`, `useRecorder`,
  `useAudioContext`, `useRnnoise`
- `src/components/` — `DeviceSelector`, `CompareMode`, `LiveMode`, `StreamPanel`, `VuMeter`, `PlaybackPanel`
- `src/App.vue` — оболонка з перемикачем режимів

## На майбутнє (WebRTC/Twilio)

`useAudioStream` віддає сталий оброблений `MediaStreamTrack` (`stream.track`) з
`MediaStreamAudioDestinationNode` — його підставляють у `RTCPeerConnection.addTrack`/
`replaceTrack` замість сирого, без re-negotiation. Realtime-процесор (RNNoise)
перемикається `setProcessor()` без зміни вихідного треку.
