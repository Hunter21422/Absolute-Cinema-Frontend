<template>
  <div class="relative w-full aspect-video bg-black rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
    <!-- Спиннер загрузки плеера -->
    <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-20">
      <div class="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Заглушка при ошибке -->
    <div v-if="hasError" class="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-zinc-950/90 text-zinc-400 text-xs px-4 text-center">
      <svg class="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <span>Не удалось загрузить видеопоток</span>
    </div>

    <!-- 1. Iframe балансера (Kinobox, Kodik, Collaps и т.д.) -->
    <iframe
      v-if="isIframe"
      :key="streamKey"
      :src="embedUrl"
      class="w-full h-full border-0 relative z-10"
      allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
      allowfullscreen
      webkitallowfullscreen
      mozallowfullscreen
      @load="isLoading = false"
      @error="onError"
    ></iframe>

    <!-- 2. Нативный плеер (mp4 / m3u8 / webm) -->
    <video
      v-else
      ref="videoEl"
      class="w-full h-full object-contain relative z-10"
      controls
      playsinline
      webkit-playsinline
      @loadeddata="isLoading = false"
      @error="onError"
    ></video>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Hls from 'hls.js'

const props = defineProps({
  videoUrl: { type: String, required: true },
  season: { type: Number, default: 1 },
  episode: { type: Number, default: 1 },
  translation: { type: String, default: '' },
  isSeries: { type: Boolean, default: false }
})

const videoEl = ref(null)
const isLoading = ref(true)
const hasError = ref(false)
let hls = null

// Извлечение расширения файла без query и hash
const ext = computed(() => {
  try {
    const path = new URL(props.videoUrl, location.href).pathname
    return path.split('.').pop().toLowerCase()
  } catch {
    return ''
  }
})

// Если поток прямой файл — используем тег <video>, иначе <iframe>
const isIframe = computed(() => !['mp4', 'm3u8', 'webm'].includes(ext.value))

// Уникальный ключ для перерендера узла при переключении серии/озвучки
const streamKey = computed(() => {
  return `${props.videoUrl}_s${props.season}_e${props.episode}_t${props.translation}`
})

// Сборка embed URL с параметрами эпизода и автозапуска
const embedUrl = computed(() => {
  if (!props.videoUrl) return ''
  try {
    const url = new URL(props.videoUrl, location.href)
    if (props.isSeries) {
      url.searchParams.set('season', String(props.season))
      url.searchParams.set('episode', String(props.episode))
    }
    if (props.translation) {
      url.searchParams.set('translation', props.translation)
    }
    url.searchParams.set('auto', '1')
    url.searchParams.set('hide_selectors', 'true')
    return url.toString()
  } catch {
    const sep = props.videoUrl.includes('?') ? '&' : '?'
    let extra = 'auto=1&hide_selectors=true'
    if (props.isSeries) extra += `&season=${props.season}&episode=${props.episode}`
    if (props.translation) extra += `&translation=${encodeURIComponent(props.translation)}`
    return `${props.videoUrl}${sep}${extra}`
  }
})

function onError() {
  isLoading.value = false
  hasError.value = true
}

function destroyHls() {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

async function setupVideo() {
  destroyHls()
  isLoading.value = true
  hasError.value = false

  if (isIframe.value) return

  await nextTick()
  const video = videoEl.value
  if (!video) return

  if (ext.value === 'm3u8' && Hls.isSupported()) {
    hls = new Hls({ enableWorker: true, lowLatencyMode: true })
    hls.loadSource(props.videoUrl)
    hls.attachMedia(video)
    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) onError()
    })
  } else {
    // MP4/WebM или Safari с нативной поддержкой HLS
    video.src = props.videoUrl
  }
}

watch(
  () => [props.videoUrl, props.season, props.episode, props.translation],
  setupVideo
)

onMounted(() => {
  setupVideo()

  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.disableVerticalSwipes?.()
    tg.requestFullscreen?.()
    tg.expand?.()
  }
})

onBeforeUnmount(() => {
  destroyHls()
  window.Telegram?.WebApp?.enableVerticalSwipes?.()
})
</script>