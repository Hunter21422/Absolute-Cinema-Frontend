<template>
  <div 
    ref="playerWrapper"
    :class="[
      isPseudoFullscreen 
        ? 'fixed inset-0 z-[9999] bg-black flex flex-col justify-center items-center w-screen h-screen' 
        : 'relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl'
    ]"
  >
    <!-- Плавающая панель управления для Android WebApp -->
    <div class="absolute top-3 right-3 z-30 flex items-center gap-2">
      <!-- Кнопка псевдо-фуллскрина (растягивает контейнер на весь экран Telegram) -->
      <button 
        type="button" 
        @click="togglePseudoFullscreen"
        class="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg"
        :title="isPseudoFullscreen ? 'Свернуть' : 'Развернуть на весь экран'"
      >
        <svg v-if="!isPseudoFullscreen" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Запасной выход: открыть фильм в обычном Chrome/браузере, где нативный Fullscreen работает без ограничений -->
      <button 
        type="button" 
        @click="openInExternalBrowser"
        class="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg text-xs flex items-center gap-1"
        title="Открыть в браузере"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
    </div>

    <!-- Спиннер загрузки -->
    <div v-if="isLoading && !hasError" class="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-20 pointer-events-none">
      <div class="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-if="hasError" class="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-zinc-950/90 text-zinc-400 text-xs px-4 text-center">
      <span>Не удалось загрузить видеопоток</span>
      <button type="button" @click="setupVideo" class="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg">
        Повторить попытку
      </button>
    </div>

    <!-- Iframe плеера -->
    <iframe
      v-if="url && isIframe"
      :key="'iframe_' + streamKey"
      :src="embedUrl"
      class="w-full h-full border-0 relative z-10"
      allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *; gyroscope *; accelerometer *"
      allowfullscreen="true"
      webkitallowfullscreen="true"
      mozallowfullscreen="true"
      frameborder="0"
      @load="isLoading = false"
    ></iframe>

    <!-- Нативное видео (mp4 / m3u8) -->
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

    <!-- Заглушка при отсутствии URL -->
    <div v-else class="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">
      Видео недоступно
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

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
const playerWrapper = ref(null)
const isLoading = ref(true)
const hasError = ref(false)
const isPseudoFullscreen = ref(false)

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

function togglePseudoFullscreen() {
  isPseudoFullscreen.value = !isPseudoFullscreen.value
  const tg = window.Telegram?.WebApp

  if (isPseudoFullscreen.value) {
    tg?.requestFullscreen?.()
    tg?.disableVerticalSwipes?.()
    try {
      screen?.orientation?.lock?.('landscape').catch(() => {})
    } catch (e) {}
  } else {
    try {
      screen?.orientation?.unlock?.()
    } catch (e) {}
  }
}

function openInExternalBrowser() {
  const targetUrl = embedUrl.value || url.value
  if (!targetUrl) return
  const tg = window.Telegram?.WebApp

  if (typeof tg?.openLink === 'function') {
    tg.openLink(targetUrl)
  } else {
    window.open(targetUrl, '_blank')
  }
}

function onError() {
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
  video.src = url.value
  video.load()
}

watch(() => [url.value, props.season, props.episode, props.translation], setupVideo)

onMounted(() => {
  setupVideo()
  const tg = window.Telegram?.WebApp
  tg?.expand?.()
  tg?.disableVerticalSwipes?.()
})

onBeforeUnmount(() => {
  if (isPseudoFullscreen.value) {
    try {
      screen?.orientation?.unlock?.()
    } catch (e) {}
  }
})
</script>