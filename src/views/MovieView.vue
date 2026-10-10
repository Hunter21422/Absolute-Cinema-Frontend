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
        Онлайн просмотр
      </span>

      <button @click="toggleFav" class="glass-panel p-2.5 rounded-2xl active:scale-95 transition-transform">
        <svg class="w-5 h-5" :class="movie.is_favorite ? 'text-rose-500 fill-current' : 'text-zinc-300'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      </button>
    </div>

    <!-- Видеоплеер -->
    <div class="px-4">
      <VideoPlayer :video-url="movie.video_url" />
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/client'
import { useMovieStore } from '../stores/movie'
import { historyService } from '../utils/history'
import VideoPlayer from '../components/VideoPlayer.vue'

const route = useRoute()
const movieStore = useMovieStore()
const movie = ref(null)

const load = async () => {
  try {
    const { data } = await api.get(`/movies/${route.params.id}`)
    movie.value = data
    // Сохраняем фильм в историю при открытии
    historyService.addToHistory(data)
  } catch (err) {
    console.error('Ошибка загрузки фильма:', err)
  }
}

const toggleFav = () => {
  if (movie.value) movieStore.toggleFavorite(movie.value)
}

onMounted(load)
</script>