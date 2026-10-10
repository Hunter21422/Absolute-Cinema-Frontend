<template>
  <div class="video-player-container" ref="playerContainer">
    <!-- Верхняя панель управления -->
    <div class="player-header" :class="{ 'fade-out': !showControls && isPlaying }">
      <button class="back-btn" @click="handleBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Назад</span>
      </button>
      <h2 class="movie-title">{{ title || 'Просмотр фильма' }}</h2>
    </div>

    <!-- Видеоэлемент -->
    <video
      ref="videoRef"
      class="video-element"
      :src="src"
      :poster="poster"
      playsinline
      webkit-playsinline
      @click="toggleControls"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
      @waiting="isLoading = true"
      @playing="isLoading = false"
    ></video>

    <!-- Спиннер буферизации -->
    <div v-if="isLoading" class="loader-overlay">
      <div class="spinner"></div>
    </div>

    <!-- Центральная кнопка Play/Pause (при паузе) -->
    <div
      v-if="!isPlaying && !isLoading"
      class="center-play-btn"
      @click="togglePlay"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>

    <!-- Нижняя панель управления -->
    <div class="player-controls" :class="{ 'fade-out': !showControls && isPlaying }">
      <!-- Таймлайн / Слайдер -->
      <div class="progress-bar-container" @click="seek">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="controls-row">
        <div class="left-controls">
          <button class="control-btn" @click="togglePlay">
            <svg v-if="!isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>

          <span class="time-label">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>

        <div class="right-controls">
          <button class="control-btn" @click="toggleFullscreen">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const videoRef = ref(null)
const playerContainer = ref(null)

const isPlaying = ref(false)
const isLoading = ref(false)
const showControls = ref(true)
const currentTime = ref(0)
const duration = ref(0)
let controlsTimer = null

// Безопасное получение объекта Telegram WebApp
const getTelegram = () => {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : null
}

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const togglePlay = () => {
  const video = videoRef.value
  if (!video) return

  if (video.paused) {
    video.play().catch(e => console.warn('Автовоспроизведение заблокировано:', e))
    isPlaying.value = true
    resetControlsTimer()
  } else {
    video.pause()
    isPlaying.value = false
    showControls.value = true
  }

  // Безопасный виброотклик Telegram
  try {
    const tg = getTelegram()
    tg?.HapticFeedback?.impactOccurred?.('light')
  } catch (err) {
    // Игнорируем в браузере ПК
  }
}

const toggleControls = () => {
  showControls.value = !showControls.value
  if (showControls.value && isPlaying.value) {
    resetControlsTimer()
  }
}

const resetControlsTimer = () => {
  clearTimeout(controlsTimer)
  controlsTimer = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3500)
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const onLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
}

const onEnded = () => {
  isPlaying.value = false
  showControls.value = true
}

const seek = (event) => {
  const video = videoRef.value
  if (!video || !duration.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const newPercent = Math.max(0, Math.min(1, clickX / rect.width))
  video.currentTime = newPercent * duration.value
  currentTime.value = video.currentTime
}

const toggleFullscreen = () => {
  const container = playerContainer.value
  if (!container) return

  const tg = getTelegram()

  // 1. Попытка полноэкранного режима внутри Telegram Bot API 8.0+
  try {
    if (tg?.requestFullscreen && typeof tg.requestFullscreen === 'function') {
      tg.requestFullscreen()
      return
    }
  } catch (err) {
    console.warn('Telegram requestFullscreen error:', err)
  }

  // 2. Стандартный полноэкранный режим браузера HTML5
  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {})
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }
}

const handleBack = () => {
  if (videoRef.value) {
    videoRef.value.pause()
  }
  emit('close')
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
}

onMounted(() => {
  const tg = getTelegram()
  // Безопасное подключение BackButton в Telegram
  try {
    if (tg?.BackButton) {
      tg.BackButton.show?.()
      tg.BackButton.onClick?.(handleBack)
    }
    // Отключение свайпа закрытия модалки в Telegram при просмотре
    tg?.disableVerticalSwipes?.()
  } catch (e) {
    console.warn('Telegram UI API unsupported:', e)
  }

  // Автозапуск видео при открытии
  if (videoRef.value) {
    videoRef.value.play().then(() => {
      isPlaying.value = true
      resetControlsTimer()
    }).catch(() => {
      isPlaying.value = false
    })
  }
})

onUnmounted(() => {
  clearTimeout(controlsTimer)
  const tg = getTelegram()
  try {
    if (tg?.BackButton) {
      tg.BackButton.offClick?.(handleBack)
      tg.BackButton.hide?.()
    }
    tg?.enableVerticalSwipes?.()
  } catch (e) {}
})
</script>

<style scoped>
.video-player-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
  transition: opacity 0.3s ease;
}

.back-btn {
  background: transparent;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
}

.back-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.movie-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.center-play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(229, 9, 20, 0.9);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.player-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px 24px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0) 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
  transition: opacity 0.3s ease;
}

.fade-out {
  opacity: 0;
  pointer-events: none;
}

.progress-bar-container {
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #e50914;
  border-radius: 2px;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.time-label {
  color: #ddd;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.loader-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 5;
}

.spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #e50914;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>