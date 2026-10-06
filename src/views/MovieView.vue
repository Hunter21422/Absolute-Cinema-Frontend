<template>
  <div v-if="movie" class="relative min-h-screen space-y-4 pb-12">
    <!-- Фоновый бэкдроп -->
    <div class="fixed inset-0 pointer-events-none -z-10">
      <img :src="movie.poster_url" class="w-full h-full object-cover blur-3xl opacity-20 scale-125" />
      <div class="absolute inset-0 bg-[#08090d]/80"></div>
    </div>

    <!-- Верхний навбар -->
    <div class="px-4 pt-3 flex justify-between items-center">
      <button @click="$router.back()" class="glass-panel p-2.5 rounded-2xl active:scale-95 transition-transform">
        <svg class="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <span class="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        {{ movie.is_series ? `Сезон ${selectedSeason} • Серия ${selectedEpisode}` : 'Онлайн просмотр' }}
      </span>

      <button @click="toggleFav" class="glass-panel p-2.5 rounded-2xl active:scale-95 transition-transform">
        <svg class="w-5 h-5" :class="movie.is_favorite ? 'text-rose-500 fill-current' : 'text-zinc-300'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </button>
    </div>

    <!-- Видеоплеер -->
    <div class="px-4">
      <VideoPlayer
        :video-url="movie.video_url"
        :season="selectedSeason"
        :episode="selectedEpisode"
        :translation="selectedTranslation"
        :is-series="movie.is_series"
      />
    </div>

    <!-- Выбор озвучки (для фильмов, мультфильмов и сериалов) -->
    <div v-if="availableTranslations.length" class="px-4 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Озвучка / Перевод</span>
        <span class="text-[10px] text-zinc-500">{{ selectedTranslation || 'По умолчанию' }}</span>
      </div>
      <div class="flex gap-2 overflow-x-auto custom-scrollbar-x py-1">
        <button
          v-for="voice in availableTranslations"
          :key="voice"
          @click="selectedTranslation = voice"
          class="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border"
          :class="selectedTranslation === voice 
            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30' 
            : 'glass-panel text-zinc-400 hover:text-white border-transparent'"
        >
          🎙️ {{ voice }}
        </button>
      </div>
    </div>

    <!-- Блок сериала: Выбор сезона и номера серии -->
    <div v-if="movie.is_series" class="px-4 space-y-3">
      <!-- 1. Сезоны -->
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Сезоны</span>
      </div>
      <div class="flex gap-2 overflow-x-auto custom-scrollbar-x py-1">
        <button
          v-for="s in (movie.seasons_count || 1)"
          :key="s"
          @click="selectSeason(s)"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap"
          :class="selectedSeason === s 
            ? 'bg-white/20 text-white border-white/30 shadow-md' 
            : 'glass-panel text-zinc-400 hover:text-white border-transparent'"
        >
          {{ s }} Сезон
        </button>
      </div>

      <!-- 2. Сетка серий -->
      <div class="flex items-center justify-between pt-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Серии</span>
        <span class="text-[10px] text-zinc-500">Серия {{ selectedEpisode }} из {{ movie.episodes_count || 12 }}</span>
      </div>
      <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
        <button
          v-for="ep in (movie.episodes_count || 12)"
          :key="ep"
          @click="selectedEpisode = ep"
          class="aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-95 border"
          :class="selectedEpisode === ep 
            ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/40' 
            : 'glass-panel text-zinc-300 hover:border-white/20 border-transparent'"
        >
          {{ ep }}
        </button>
      </div>
    </div>

    <!-- Информация о тайтле -->
    <div class="px-4 space-y-4 pt-2">
      <div>
        <h1 class="text-xl font-black text-white tracking-tight">{{ movie.title }}</h1>
        <p class="text-xs text-zinc-500 font-medium mt-0.5">{{ movie.original_title || movie.title }}</p>
      </div>

      <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar-x py-1">
        <span class="glass-pill px-3 py-1 rounded-xl text-xs font-bold text-amber-400">★ {{ movie.rating?.toFixed(1) || '0.0' }}</span>
        <span class="glass-pill px-3 py-1 rounded-xl text-xs text-zinc-300">{{ movie.year }}</span>
        <span class="glass-pill px-3 py-1 rounded-xl text-xs text-zinc-300">{{ movie.country || 'Мир' }}</span>
        <span class="glass-pill px-3 py-1 rounded-xl text-xs text-zinc-300">{{ movie.genre }}</span>
        <span class="glass-pill px-3 py-1 rounded-xl text-xs text-zinc-400">👁️ {{ movie.views_count || 0 }}</span>
      </div>

      <div class="glass-panel p-4 rounded-2xl space-y-2">
        <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">Сюжет</h3>
        <p class="text-xs text-zinc-300 leading-relaxed font-light">
          {{ movie.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/client'
import { useMovieStore } from '../stores/movie'
import { historyService } from '../utils/history'
import VideoPlayer from '../components/VideoPlayer.vue'

const route = useRoute()
const movieStore = useMovieStore()
const movie = ref(null)

const selectedSeason = ref(1)
const selectedEpisode = ref(1)
const selectedTranslation = ref('')

const defaultTranslations = [
  'Дубляж',
  'HDRezka Studio',
  'LostFilm',
  'Кубик в кубе',
  'Субтитры'
]

const availableTranslations = computed(() => {
  if (movie.value?.translations && movie.value.translations.length > 0) {
    return movie.value.translations
  }
  return defaultTranslations
})

const load = async () => {
  try {
    const { data } = await api.get(`/movies/${route.params.id}`)
    movie.value = data
    if (availableTranslations.value.length > 0) {
      selectedTranslation.value = availableTranslations.value[0]
    }
    // Сохраняем фильм в историю при открытии
    historyService.addToHistory(data)
  } catch (err) {
    console.error('Ошибка загрузки фильма:', err)
  }
}

const selectSeason = (s) => {
  selectedSeason.value = s
  selectedEpisode.value = 1
}

const toggleFav = () => {
  if (movie.value) movieStore.toggleFavorite(movie.value)
}

onMounted(load)
</script>
