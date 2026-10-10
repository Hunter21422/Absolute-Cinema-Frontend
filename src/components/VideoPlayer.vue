<template>
  <div class="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
    <!-- Спиннер -->
    <div v-if="isLoading && !hasError" class="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-20">
      <div class="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Ошибка -->
    <div v-if="hasError" class="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-zinc-950/90 text-zinc-400 text-xs px-4 text-center">
      <span>Не удалось загрузить видеопоток</span>
      <button type="button" @click="setupVideo"
        class="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg">
        Повторить попытку
      </button>
    </div>

    <!-- Iframe-балансер -->
    <iframe
      v-if="url && isIframe"
      :key="'iframe_' + streamKey"
      :src="embedUrl"
      class="w-full h-full border-0 relative z-10"
      allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
      allowfullscreen
      @load="isLoading = false"
    ></iframe>

    <!-- Нативный плеер -->
    <video
      v-else-if="url"
      ref="videoEl"
      :key="'video_' + streamKey"
      class="w-full h-full object-contain relative z-10"
      :poster="poster || undefined"
      controls
      playsinline
      webkit-playsinline
      preload="metadata"
      @canplay="isLoading = false"
      @loadeddata="isLoading = false"
      @error="onError"
    ></video>

    <!-- Нет ссылки -->
    <div v-else class="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">
      Видео недоступно
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Принимает и videoUrl, и src — чтобы работать с любым вызовом из родителя
const props = defineProps({
  videoUrl: { type: String, default: '' },
  src: { type: String, default: '' },
  poster: { type: String, default: '' },
  title: { type: String, default: '' },
  season: { type: Number, default: 1 },
  episode: { type: Number, default: 1 },
  translation: { type: String, default: '' },
  isSeries: { type: Boolean, default: false }
})

defineEmits(['close'])

const videoEl = ref(null)
const isLoading = ref(true)
const hasError = ref(false)

const url = computed(() => props.videoUrl || props.src || '')

const ext = computed(() => {
  if (!url.value) return ''
  try {
    return new URL(url.value, location.href).pathname.split('.').pop().toLowerCase()
  } catch {
    return ''
  }
})

const isIframe = computed(() => !['mp4', 'm3u8', 'webm', 'mov'].includes(ext.value))

const streamKey = computed(() =>
  `${url.value}_s${props.season}_e${props.episode}_t${props.translation}`
)

const embedUrl = computed(() => {
  try {
    const u = new URL(url.value, location.href)
    if (props.isSeries) {
      u.searchParams.set('season', String(props.season))
      u.searchParams.set('episode', String(props.episode))
    }
    if (props.translation) u.searchParams.set('translation', props.translation)
    return u.toString()
  } catch {
    return url.value
  }
})

function onError() {
  console.error('[VideoPlayer] error:', url.value, videoEl.value?.error)
  isLoading.value = false
  hasError.value = true
}

async function setupVideo() {
  hasError.value = false
  if (!url.value) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  if (isIframe.value) return

  await nextTick()
  const video = videoEl.value
  if (!video) return

  // m3u8 нативно играет на iOS/Safari; на ПК-Chrome без hls.js не пойдёт
  if (ext.value === 'm3u8' && !video.canPlayType('application/vnd.apple.mpegurl')) {
    console.warn('[VideoPlayer] HLS не поддерживается этим браузером без hls.js')
  }
  video.src = url.value
  video.load()
}

// Безопасный вызов методов Telegram: на старых клиентах они кидают WebAppMethodUnsupported
function tgSafe(minVersion, fn) {
  try {
    const tg = window.Telegram?.WebApp
    if (!tg) return
    if (minVersion && !(tg.isVersionAtLeast?.(minVersion))) return
    fn(tg)
  } catch (e) {
    console.warn('[Telegram.WebApp] ignored:', e?.message || e)
  }
}

watch(() => [url.value, props.season, props.episode, props.translation], setupVideo)

onMounted(() => {
  setupVideo()
  tgSafe(null, tg => tg.expand?.())
  tgSafe('7.7', tg => tg.disableVerticalSwipes?.())
  // requestFullscreen намеренно НЕ вызываем автоматически —
  // у <video controls> есть своя кнопка полноэкранного режима
})

onBeforeUnmount(() => {
  tgSafe('7.7', tg => tg.enableVerticalSwipes?.())
})
</script>
