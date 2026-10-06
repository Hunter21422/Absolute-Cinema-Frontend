<template>
  <div class="space-y-4 pt-2 pb-8">
    <!-- Поисковая строка -->
    <div class="px-4">
      <div class="relative">
        <input
          v-model="movieStore.filters.search"
          @input="onSearchInput"
          type="text"
          placeholder="Поиск по названию (на русском или английском)..."
          class="w-full glass-panel rounded-2xl py-3 pl-11 pr-10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
        />
        <svg class="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <button
          v-if="movieStore.filters.search"
          @click="clearSearch"
          class="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 1. ИСТОРИЯ ПРОСМОТРОВ (показывается только если нет поиска) -->
    <div v-if="!hasActiveFilters && historyList.length > 0" class="px-4 space-y-2">
      <div class="flex justify-between items-center">
        <span class="text-xs font-bold uppercase tracking-wider text-zinc-400">Продолжить просмотр</span>
        <button @click="clearHistory" class="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors">
          Очистить
        </button>
      </div>
      
      <!-- Горизонтальная лента с кастомным скроллбаром -->
      <div class="flex gap-3 overflow-x-auto custom-scrollbar-x pb-2">
        <div
          v-for="item in historyList"
          :key="item.id"
          @click="$router.push(`/movie/${item.id}`)"
          class="flex-shrink-0 w-28 cursor-pointer group"
        >
          <div class="relative aspect-[2/3] rounded-2xl overflow-hidden glass-panel border border-white/10 group-hover:border-rose-500/50 transition-all">
            <img :src="item.poster_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <span v-if="item.rating" class="absolute top-1.5 right-1.5 glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300">
              ★ {{ Number(item.rating).toFixed(1) }}
            </span>
          </div>
          <p class="text-[11px] text-zinc-200 font-medium truncate mt-1.5">{{ item.title }}</p>
          <p class="text-[10px] text-zinc-500">{{ item.year }}</p>
        </div>
      </div>
    </div>

    <!-- Hero-баннер (скрывается, если применен поиск или фильтры) -->
    <div v-if="!hasActiveFilters && featuredMovie" class="px-4">
      <div class="relative w-full h-[360px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
        <img
          :src="featuredMovie.poster_url"
          class="w-full h-full object-cover object-top scale-105 filter brightness-75"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/40 to-transparent"></div>

        <div class="absolute bottom-4 left-4 right-4 space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-rose-600 text-white shadow-lg">ХИТ</span>
            <span class="glass-pill px-2 py-0.5 rounded-full text-[10px] font-medium text-amber-300">★ {{ featuredMovie.rating?.toFixed(1) || '0.0' }}</span>
            <span class="glass-pill px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-300">{{ featuredMovie.year }}</span>
          </div>

          <h2 class="text-xl font-black tracking-tight text-white line-clamp-1">
            {{ featuredMovie.title }}
          </h2>
          <p class="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-light">
            {{ featuredMovie.description }}
          </p>

          <div class="pt-1 flex gap-2">
            <button
              @click="$router.push(`/movie/${featuredMovie.id}`)"
              class="glow-button flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 text-white"
            >
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              Смотреть
            </button>
            <button
              @click="movieStore.toggleFavorite(featuredMovie)"
              class="glass-panel px-3.5 py-2.5 rounded-xl active:scale-95 transition-transform"
            >
              <svg class="w-4 h-4" :class="featuredMovie.is_favorite ? 'text-rose-500 fill-current' : 'text-zinc-400'" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Категории: Все / Фильмы / Сериалы -->
    <div class="px-4 flex gap-1.5 p-1 glass-panel rounded-2xl max-w-md mx-auto">
      <button
        v-for="tab in contentTabs"
        :key="tab.value"
        @click="selectContentType(tab.value)"
        class="flex-1 py-1.5 text-[11px] font-semibold rounded-xl transition-all"
        :class="movieStore.filters.contentType === tab.value ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Горизонтальная лента жанров с кастомным скроллбаром -->
    <div class="px-4 flex gap-2 overflow-x-auto custom-scrollbar-x pb-2">
      <button
        v-for="genre in movieStore.genres"
        :key="genre"
        @click="selectGenre(genre)"
        class="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
        :class="movieStore.filters.genre === genre 
          ? 'bg-rose-600 text-white border border-rose-500 shadow-lg shadow-rose-600/30' 
          : 'glass-panel text-zinc-400 hover:text-zinc-200 border-transparent'"
      >
        {{ genre }}
      </button>
    </div>

    <!-- Индикатор выдачи и кнопка сброса -->
    <div class="px-4 flex justify-between items-center text-[11px]">
      <div class="flex items-center gap-1.5 text-zinc-400">
        <span>Найдено: <b class="text-zinc-200">{{ movieStore.total }}</b></span>
        <span v-if="hasActiveFilters" class="text-rose-500">• Фильтры активны</span>
      </div>
      <button
        v-if="hasActiveFilters"
        @click="movieStore.resetFilters()"
        class="text-rose-400 hover:underline font-medium"
      >
        Сбросить всё
      </button>
    </div>

    <!-- Сетка карточек -->
    <div class="px-4">
      <div v-if="movieStore.loading" class="py-16 flex justify-center">
        <div class="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="movieStore.movies.length === 0" class="glass-panel p-8 rounded-3xl text-center space-y-2 mt-2">
        <p class="text-xs text-zinc-300 font-bold">Ничего не найдено</p>
        <p class="text-[11px] text-zinc-500">Попробуйте изменить запрос или выбрать другой жанр</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3.5">
        <MovieCard v-for="m in movieStore.movies" :key="m.id" :movie="m" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMovieStore } from '../stores/movie'
import { historyService } from '../utils/history'
import MovieCard from '../components/MovieCard.vue'

const movieStore = useMovieStore()
const historyList = ref([])

const contentTabs = [
  { label: 'Все подряд', value: 'all' },
  { label: 'Фильмы', value: 'movie' },
  { label: 'Сериалы', value: 'series' }
]

const featuredMovie = computed(() => movieStore.movies[0] || null)

const hasActiveFilters = computed(() => {
  return (
    movieStore.filters.search.trim() !== '' ||
    movieStore.filters.genre !== 'Все' ||
    movieStore.filters.contentType !== 'all'
  )
})

let debounceTimer = null

const onSearchInput = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    movieStore.fetchMovies(true)
  }, 350)
}

const clearSearch = () => {
  clearTimeout(debounceTimer)
  movieStore.filters.search = ''
  movieStore.fetchMovies(true)
}

const selectContentType = (type) => {
  if (movieStore.filters.contentType === type) return
  movieStore.filters.contentType = type
  movieStore.fetchMovies(true)
}

const selectGenre = (genre) => {
  if (movieStore.filters.genre === genre) return
  movieStore.filters.genre = genre
  movieStore.fetchMovies(true)
}

const clearHistory = () => {
  historyService.clearHistory()
  historyList.value = []
}

onMounted(async () => {
  historyList.value = historyService.getHistory()
  await movieStore.fetchGenres()
  movieStore.fetchMovies()
})
</script>
