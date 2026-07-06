import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export function useVisualizer(
  canvas: Ref<HTMLCanvasElement | null>,
  analyser: Ref<AnalyserNode | null>,
) {
  const level = ref(0)
  const peak = ref(0)
  let raf = 0

  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  function render() {
    raf = requestAnimationFrame(render)
    const a = analyser.value
    const cvs = canvas.value
    if (!a || !cvs) return

    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssW = cvs.clientWidth
    const cssH = cvs.clientHeight
    if (cvs.width !== cssW * dpr || cvs.height !== cssH * dpr) {
      cvs.width = cssW * dpr
      cvs.height = cssH * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const buf = new Uint8Array(a.fftSize)
    a.getByteTimeDomainData(buf)

    let sumSq = 0
    let localPeak = 0
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128
      sumSq += v * v
      const abs = Math.abs(v)
      if (abs > localPeak) localPeak = abs
    }
    level.value = Math.sqrt(sumSq / buf.length)
    peak.value = localPeak

    ctx.clearRect(0, 0, cssW, cssH)
    ctx.lineWidth = 2
    ctx.strokeStyle = localPeak > 0.98 ? '#e5484d' : '#3b82f6'
    ctx.beginPath()
    const slice = cssW / buf.length
    for (let i = 0; i < buf.length; i++) {
      const y = (buf[i] / 255) * cssH
      const x = i * slice
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  watch(
    analyser,
    (a) => {
      stop()
      if (a) render()
    },
    { immediate: true },
  )

  onBeforeUnmount(stop)

  return { level, peak }
}
