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

    <!-- Индикатор выдачи, кнопка заказа и кнопка сброса -->
    <div class="px-4 flex justify-between items-center text-[11px]">
      <div class="flex items-center gap-2 text-zinc-400">
        <span>Найдено: <b class="text-zinc-200">{{ movieStore.total }}</b></span>
        <span v-if="hasActiveFilters" class="text-rose-500 font-medium">Фильтры активны</span>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Кнопка вызова заказа фильма -->
        <button
          @click="openRequestModal('')"
          class="text-zinc-400 hover:text-rose-400 active:scale-95 transition-all flex items-center gap-1 font-medium"
        >
          <span>✨</span>
          <span>Заказать фильм</span>
        </button>

        <button
          v-if="hasActiveFilters"
          @click="movieStore.resetFilters()"
          class="text-rose-400 hover:underline font-medium"
        >
          Сбросить всё
        </button>
      </div>
    </div>

    <!-- Сетка карточек -->
    <div class="px-4">
      <div v-if="movieStore.loading" class="py-16 flex justify-center">
        <div class="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Ничего не найдено + Предложка -->
      <div v-else-if="movieStore.movies.length === 0" class="glass-panel p-6 rounded-3xl text-center space-y-3 mt-2 border border-white/5">
        <div class="text-3xl mb-1">🔍</div>
        <p class="text-xs text-zinc-200 font-bold">
          {{ movieStore.filters.search ? `По запросу «${movieStore.filters.search}» ничего не найдено` : 'Ничего не найдено' }}
        </p>
        <p class="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Этого фильма пока нет в каталоге, но мы можем найти и загрузить его специально для вас!
        </p>
        <div class="pt-1">
          <button
            @click="openRequestModal(movieStore.filters.search)"
            class="glow-button px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white inline-flex items-center gap-2 active:scale-95 transition-all"
          >
            <span>🍿</span>
            <span>Заказать добавление</span>
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-3.5">
        <MovieCard v-for="m in movieStore.movies" :key="m.id" :movie="m" />
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО СТОЛА ЗАКАЗОВ -->
    <Teleport to="body">
      <Transition name="fade">
        <div 
          v-if="isRequestModalOpen" 
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          @click.self="closeRequestModal"
        >
          <div class="w-full max-w-sm glass-panel border border-white/10 rounded-3xl p-5 text-white shadow-2xl space-y-4">
            
            <!-- Заголовок -->
            <div class="flex items-center justify-between pb-2 border-b border-white/5">
              <div class="flex items-center gap-2">
                <span class="text-xl">🎬</span>
                <h3 class="text-sm font-bold tracking-tight">Заказать фильм или сериал</h3>
              </div>
              <button 
                @click="closeRequestModal" 
                class="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white active:scale-90 transition"
              >
                ✕
              </button>
            </div>

            <p class="text-[11px] text-zinc-400 leading-relaxed">
              Укажите название фильма, и мы постараемся найти его в хорошем качестве и выложить в бота.
            </p>

            <!-- Форма заказа -->
            <form @submit.prevent="submitMovieRequest" class="space-y-3">
              <div>
                <label class="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Название <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="requestForm.title"
                  type="text"
                  placeholder="Например: Джентльмены"
                  class="w-full bg-[#18181e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>

              <div>
                <label class="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Год или пожелание к озвучке
                </label>
                <input
                  v-model="requestForm.comment"
                  type="text"
                  placeholder="Например: 2020 год, дубляж RHS"
                  class="w-full bg-[#18181e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <!-- Уведомления об успехе или ошибке -->
              <div v-if="requestSuccess" class="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-xl text-center">
                {{ requestSuccess }}
              </div>

              <div v-if="requestError" class="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl text-center">
                {{ requestError }}
              </div>

              <!-- Кнопка отправки -->
              <button
                type="submit"
                :disabled="requestLoading || !requestForm.title.trim()"
                class="w-full mt-2 glow-button py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
              >
                <span v-if="requestLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span v-else>Отправить заявку 🚀</span>
              </button>
            </form>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useMovieStore } from '../stores/movie'
import { historyService } from '../utils/history'
import MovieCard from '../components/MovieCard.vue'

const movieStore = useMovieStore()
const historyList = ref([])

// Состояние модального окна предложки
const isRequestModalOpen = ref(false)
const requestLoading = ref(false)
const requestSuccess = ref('')
const requestError = ref('')
const requestForm = reactive({
  title: '',
  comment: ''
})

const openRequestModal = (initialTitle = '') => {
  requestForm.title = initialTitle || ''
  requestForm.comment = ''
  requestSuccess.value = ''
  requestError.value = ''
  isRequestModalOpen.value = true
}

const closeRequestModal = () => {
  isRequestModalOpen.value = false
  requestSuccess.value = ''
  requestError.value = ''
}

const submitMovieRequest = async () => {
  if (!requestForm.title.trim()) return

  requestLoading.value = true
  requestError.value = ''
  requestSuccess.value = ''

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
    const rawInitData = window.Telegram?.WebApp?.initData || ''

    const headers = {
      'Content-Type': 'application/json'
    }

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`
    }

    // encodeURI защищает Safari/iOS WebKit от падения на не-ASCII символах в заголовках
    if (rawInitData) {
      headers['X-Telegram-Init-Data'] = encodeURI(rawInitData)
    }

    const response = await fetch('/api/v1/requests/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: requestForm.title.trim(),
        comment: requestForm.comment.trim()
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'Не удалось отправить заявку')
    }

    requestSuccess.value = 'Заявка принята! Мы скоро добавим этот фильм.'
    requestForm.title = ''
    requestForm.comment = ''

    setTimeout(() => {
      closeRequestModal()
    }, 1600)
  } catch (err) {
    requestError.value = err.message || 'Ошибка соединения с сервером'
  } finally {
    requestLoading.value = false
  }
}

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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>