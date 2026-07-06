export type WasmProcessor = "rnnoise";

export interface ProcessingProfile {
  id: string;
  label: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  processor?: WasmProcessor;
}

export const RAW_PROFILE: ProcessingProfile = {
  id: "raw",
  label: "Сирий (без обробки)",
  noiseSuppression: false,
  echoCancellation: false,
  autoGainControl: false,
};

export const PROCESSED_PROFILE: ProcessingProfile = {
  id: "processed",
  label: "Оброблений (Нативний DSP)",
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const LIVE_PROFILE: ProcessingProfile = {
  id: "live",
  label: "Live-потік",
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const NS_ONLY_PROFILE: ProcessingProfile = {
  id: "ns-only",
  label: "Тільки NS (шумоподавлення)",
  noiseSuppression: true,
  echoCancellation: false,
  autoGainControl: false,
};

export const EC_ONLY_PROFILE: ProcessingProfile = {
  id: "ec-only",
  label: "Тільки EC (ехо)",
  noiseSuppression: false,
  echoCancellation: true,
  autoGainControl: false,
};

export const AGC_ONLY_PROFILE: ProcessingProfile = {
  id: "agc-only",
  label: "Тільки AGC (гучність)",
  noiseSuppression: false,
  echoCancellation: false,
  autoGainControl: true,
};

export const RNNOISE_PROFILE: ProcessingProfile = {
  id: "rnnoise",
  label: "RNNoise (WASM) + нативні EC/AGC",
  noiseSuppression: false,
  echoCancellation: true,
  autoGainControl: true,
  processor: "rnnoise",
};

export function buildAudioConstraints(
  deviceId: string,
  profile: ProcessingProfile,
): MediaStreamConstraints {
  return {
    audio: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      noiseSuppression: profile.noiseSuppression,
      echoCancellation: profile.echoCancellation,
      autoGainControl: profile.autoGainControl,
    },
    video: false,
  };
}

export function describeMediaError(e: unknown): string {
  const err = e as DOMException;
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Доступ до мікрофона заборонено. Дозвольте доступ у налаштуваннях браузера.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "Мікрофон не знайдено. Підключіть пристрій.";
    case "NotReadableError":
    case "TrackStartError":
      return "Не вдалося прочитати з мікрофона (можливо, зайнятий іншим застосунком).";
    case "OverconstrainedError":
      return "Обраний пристрій не підтримує задані параметри.";
    default:
      return err?.message || "Невідома помилка доступу до мікрофона.";
  }
}

export function pickRecorderMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm"];
  for (const type of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return "audio/webm";
}
