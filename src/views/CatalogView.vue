<template>
  <div class="space-y-5 pt-2 pb-14 text-white">
    <!-- 1. ПОИСКОВАЯ СТРОКА -->
    <div class="px-4">
      <div class="relative">
        <input
          v-model="movieStore.filters.search"
          @input="onSearchInput"
          type="text"
          placeholder="Поиск фильмов и сериалов..."
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

    <!-- 2. ВЫБОР ТИПА: Все / Фильмы / Сериалы -->
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

    <!-- 3. ГОРИЗОНТАЛЬНАЯ ЛЕНТА ЖАНРОВ -->
    <div class="px-4 flex gap-2 overflow-x-auto custom-scrollbar-x pb-1">
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

    <!-- ЕСЛИ ВКЛЮЧЕН ПОИСК, ВЫБРАН ЖАНР ИЛИ ТИП: ПОКАЗЫВАЕМ СЕТКУ ВЫДАЧИ -->
    <div v-if="hasActiveFilters" class="px-4 space-y-4">
      <div class="flex justify-between items-center text-xs">
        <span class="text-zinc-400">Найдено: <b class="text-white">{{ movieStore.total }}</b></span>
        <button @click="movieStore.resetFilters()" class="text-rose-400 font-medium hover:underline">
          Сбросить всё ✕
        </button>
      </div>

      <div v-if="movieStore.loading" class="py-16 flex justify-center">
        <div class="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="movieStore.movies.length === 0" class="glass-panel p-6 rounded-3xl text-center space-y-3 mt-2 border border-white/5">
        <div class="text-3xl mb-1">🔍</div>
        <p class="text-xs text-zinc-200 font-bold">
          {{ movieStore.filters.search ? `По запросу «${movieStore.filters.search}» ничего не найдено` : 'В этой категории пока ничего нет' }}
        </p>
        <p class="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
          Этого фильма пока нет в каталоге, но мы можем найти и добавить его специально для вас!
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

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <MovieCard v-for="m in movieStore.movies" :key="m.id" :movie="m" />
      </div>
    </div>

    <!-- ДЕФОЛТНЫЙ ВИД: КИНЕМАТОГРАФИЧНЫЕ ПОЛКИ (КОГДА ФИЛЬТРЫ НЕ АКТИВНЫ) -->
    <div v-else class="space-y-6">

      <!-- 4. HERO-БАННЕР ХИТА (ФИЛЬМ С МАКСИМАЛЬНОЙ ОЦЕНКОЙ) -->
      <div v-if="featuredMovie" class="px-4">
        <div class="relative w-full h-[370px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
          <img
            :src="featuredMovie.poster_url"
            referrerpolicy="no-referrer"
            class="w-full h-full object-cover object-top scale-105 filter brightness-75"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/40 to-transparent"></div>

          <div class="absolute bottom-4 left-4 right-4 space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-rose-600 text-white shadow-lg">ХИТ</span>
              <span class="glass-pill px-2 py-0.5 rounded-full text-[10px] font-medium text-amber-300">★ {{ Number(featuredMovie.rating || 0).toFixed(1) }}</span>
              <span class="glass-pill px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-300">{{ featuredMovie.year }}</span>
              <span class="glass-pill px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-300">{{ featuredMovie.is_series ? 'Сериал' : 'Фильм' }}</span>
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

      <!-- 5. ИСТОРИЯ ПРОСМОТРОВ -->
      <div v-if="historyList.length > 0" class="px-4 space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <span>⏱️</span> Продолжить просмотр
          </span>
          <button @click="clearHistory" class="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors">
            Очистить
          </button>
        </div>
        <div class="flex gap-3 overflow-x-auto custom-scrollbar-x pb-2">
          <div
            v-for="item in historyList"
            :key="'hist_' + item.id"
            @click="$router.push(`/movie/${item.id}`)"
            class="flex-shrink-0 w-28 cursor-pointer group"
          >
            <div class="relative aspect-[2/3] rounded-2xl overflow-hidden glass-panel border border-white/10 group-hover:border-rose-500/50 transition-all">
              <img :src="item.poster_url" referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <span v-if="item.rating" class="absolute top-1.5 right-1.5 glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300">
                ★ {{ Number(item.rating).toFixed(1) }}
              </span>
            </div>
            <p class="text-[11px] text-zinc-200 font-medium truncate mt-1.5">{{ item.title }}</p>
            <p class="text-[10px] text-zinc-500">{{ item.year }}</p>
          </div>
        </div>
      </div>

      <!-- 6. ПОЛКА: ПОПУЛЯРНЫЕ НОВИНКИ (ВЫСОКИЙ РЕЙТИНГ + СВЕЖИЕ ГОДЫ) -->
      <section v-if="popularMovies.length > 0" class="space-y-3">
        <div class="px-4 flex justify-between items-center">
          <h2 class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>🔥</span> Популярные новинки
          </h2>
          <span class="text-[11px] text-zinc-500 font-medium">Свайп →</span>
        </div>

        <div class="flex gap-3 overflow-x-auto custom-scrollbar-x px-4 pb-2">
          <div
            v-for="m in popularMovies"
            :key="'pop_' + m.id"
            @click="$router.push(`/movie/${m.id}`)"
            class="flex-shrink-0 w-32 cursor-pointer group"
          >
            <div class="relative aspect-[2/3] rounded-2xl overflow-hidden glass-panel border border-white/10 group-hover:border-rose-500/50 transition-all shadow-lg">
              <img :src="m.poster_url" referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <span class="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[9px] font-bold text-rose-400 border border-white/10">
                TOP
              </span>
              <span class="absolute top-1.5 right-1.5 glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300">
                ★ {{ Number(m.rating || 0).toFixed(1) }}
              </span>
            </div>
            <h3 class="text-xs font-semibold text-zinc-100 truncate mt-1.5 group-hover:text-rose-400 transition">
              {{ m.title }}
            </h3>
            <p class="text-[10px] text-zinc-500 truncate">{{ m.year }} • {{ m.genre }}</p>
          </div>
        </div>
      </section>

      <!-- 7. БЛОК СЕТЕЙ И СТУДИЙ -->
      <section class="space-y-2.5 px-4">
        <div class="flex justify-between items-center">
          <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <span>⚡</span> Студии и Сети
          </h2>
        </div>

        <div class="flex gap-2 overflow-x-auto custom-scrollbar-x pb-1">
          <button
            v-for="net in networks"
            :key="net.name"
            @click="filterByNetwork(net.query)"
            :class="[
              'px-4 py-2 rounded-xl text-xs font-black tracking-wide shrink-0 transition active:scale-95 shadow-md flex items-center gap-1.5',
              net.bgClass
            ]"
          >
            <span>{{ net.icon }}</span>
            <span>{{ net.name }}</span>
          </button>
        </div>
      </section>

      <!-- 8. ПОЛКА: НОВЫЕ ФИЛЬМЫ (СТРОГО ПО ГОДУ ВЫПУСКА DESC) -->
      <section v-if="freshMovies.length > 0" class="space-y-3">
        <div class="px-4 flex justify-between items-center">
          <h2 class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>🎬</span> Новые фильмы
          </h2>
          <button @click="selectContentType('movie')" class="text-[11px] text-rose-400 hover:underline">
            Все фильмы →
          </button>
        </div>

        <div class="flex gap-3 overflow-x-auto custom-scrollbar-x px-4 pb-2">
          <div
            v-for="m in freshMovies"
            :key="'film_' + m.id"
            @click="$router.push(`/movie/${m.id}`)"
            class="flex-shrink-0 w-32 cursor-pointer group"
          >
            <div class="relative aspect-[2/3] rounded-2xl overflow-hidden glass-panel border border-white/10 group-hover:border-rose-500/50 transition-all shadow-lg">
              <img :src="m.poster_url" referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <span class="absolute top-1.5 right-1.5 glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300">
                ★ {{ Number(m.rating || 0).toFixed(1) }}
              </span>
            </div>
            <h3 class="text-xs font-semibold text-zinc-100 truncate mt-1.5 group-hover:text-rose-400 transition">
              {{ m.title }}
            </h3>
            <p class="text-[10px] text-zinc-500 truncate">{{ m.year }} • {{ m.genre }}</p>
          </div>
        </div>
      </section>

      <!-- 9. ПОЛКА: НОВЫЕ СЕРИАЛЫ (СТРОГО ПО ГОДУ ВЫПУСКА DESC) -->
      <section v-if="seriesList.length > 0" class="space-y-3">
        <div class="px-4 flex justify-between items-center">
          <h2 class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>📺</span> Новые сериалы
          </h2>
          <button @click="selectContentType('series')" class="text-[11px] text-rose-400 hover:underline">
            Все сериалы →
          </button>
        </div>

        <div class="flex gap-3 overflow-x-auto custom-scrollbar-x px-4 pb-2">
          <div
            v-for="m in seriesList"
            :key="'ser_' + m.id"
            @click="$router.push(`/movie/${m.id}`)"
            class="flex-shrink-0 w-32 cursor-pointer group"
          >
            <div class="relative aspect-[2/3] rounded-2xl overflow-hidden glass-panel border border-white/10 group-hover:border-rose-500/50 transition-all shadow-lg">
              <img :src="m.poster_url" referrerpolicy="no-referrer" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              <span class="absolute bottom-1.5 left-1.5 bg-rose-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                СЕРИАЛ
              </span>
              <span class="absolute top-1.5 right-1.5 glass-pill px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-300">
                ★ {{ Number(m.rating || 0).toFixed(1) }}
              </span>
            </div>
            <h3 class="text-xs font-semibold text-zinc-100 truncate mt-1.5 group-hover:text-rose-400 transition">
              {{ m.title }}
            </h3>
            <p class="text-[10px] text-zinc-500 truncate">{{ m.year }} • {{ m.genre }}</p>
          </div>
        </div>
      </section>

      <!-- 10. КАРТОЧКА ЗАКАЗА КИНО В ПОДВАЛЕ -->
      <div class="px-4 pt-2">
        <div class="glass-panel p-5 rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-950/20 to-black/40 text-center space-y-2.5">
          <div class="text-2xl">🍿</div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">Не нашли нужный фильм?</h3>
          <p class="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Оставьте заявку — мы найдем его в хорошем качестве и добавим в бота!
          </p>
          <button
            @click="openRequestModal('')"
            class="glow-button px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white inline-flex items-center gap-1.5 active:scale-95 transition"
          >
            <span>✨</span>
            <span>Заказать кино</span>
          </button>
        </div>
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
              Укажите название фильма, и мы постараемся выложить его в бота как можно быстрее.
            </p>

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
                  Год или пожелания
                </label>
                <input
                  v-model="requestForm.comment"
                  type="text"
                  placeholder="Например: 2020 год, RHS"
                  class="w-full bg-[#18181e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div v-if="requestSuccess" class="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-xl text-center">
                {{ requestSuccess }}
              </div>

              <div v-if="requestError" class="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl text-center">
                {{ requestError }}
              </div>

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

const contentTabs = [
  { label: 'Все подряд', value: 'all' },
  { label: 'Фильмы', value: 'movie' },
  { label: 'Сериалы', value: 'series' }
]

// Сети и студии
const networks = [
  { name: 'Netflix', query: 'Netflix', bgClass: 'bg-[#E50914] text-white', icon: '🔴' },
  { name: 'HBO Max', query: 'HBO', bgClass: 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white', icon: '🟣' },
  { name: 'Apple TV+', query: 'Apple', bgClass: 'bg-zinc-800 border border-white/20 text-white', icon: '🍏' },
  { name: 'Disney+', query: 'Disney', bgClass: 'bg-[#113CCF] text-white', icon: '✨' },
  { name: 'Amazon Prime', query: 'Amazon', bgClass: 'bg-[#00A8E1] text-zinc-950 font-black', icon: '📦' },
  { name: 'Hulu', query: 'Hulu', bgClass: 'bg-[#1CE783] text-black font-black', icon: '🟢' }
]

const filterByNetwork = (query) => {
  movieStore.filters.search = query
  movieStore.fetchMovies(true)
}

// Выбор жанра
const selectGenre = (genre) => {
  if (movieStore.filters.genre === genre) return
  movieStore.filters.genre = genre
  movieStore.fetchMovies(true)
}

// Выбор категории (Фильмы/Сериалы)
const selectContentType = (type) => {
  if (movieStore.filters.contentType === type) return
  movieStore.filters.contentType = type
  movieStore.fetchMovies(true)
}

const allMovies = computed(() => movieStore.movies || [])

// 1. HERO-БАННЕР: СТРОГО ФИЛЬМ С МАКСИМАЛЬНОЙ ОЦЕНКОЙ
const featuredMovie = computed(() => {
  if (!allMovies.value.length) return null
  return [...allMovies.value].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))[0]
})

// 2. ПОПУЛЯРНЫЕ НОВИНКИ: СОРТИРОВКА ПО РЕЙТИНГУ СРЕДИ СВЕЖИХ РЕЛИЗОВ
const popularMovies = computed(() => {
  return [...allMovies.value]
    .sort((a, b) => {
      // Сначала более высокий рейтинг, при равенстве - свежий год
      const rDiff = Number(b.rating || 0) - Number(a.rating || 0)
      if (rDiff !== 0) return rDiff
      return Number(b.year || 0) - Number(a.year || 0)
    })
    .slice(0, 10)
})

// 3. НОВЫЕ ФИЛЬМЫ: СТРОГО ПО ГОДУ ВЫХОДА (СВЕЖИЕ ГОДЫ ВПЕРЕД, А НЕ ПО ДАТЕ ДОБАВЛЕНИЯ В БАЗУ)
const freshMovies = computed(() => {
  return [...allMovies.value]
    .filter(m => !m.is_series)
    .sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0)
      if (yearDiff !== 0) return yearDiff
      return Number(b.rating || 0) - Number(a.rating || 0)
    })
    .slice(0, 10)
})

// 4. НОВЫЕ СЕРИАЛЫ: СТРОГО ПО ГОДУ ВЫХОДА СЕРИАЛА (YEAR DESC)
const seriesList = computed(() => {
  return [...allMovies.value]
    .filter(m => m.is_series)
    .sort((a, b) => {
      const yearDiff = Number(b.year || 0) - Number(a.year || 0)
      if (yearDiff !== 0) return yearDiff
      return Number(b.rating || 0) - Number(a.rating || 0)
    })
    .slice(0, 10)
})

// Проверка активности фильтров
const hasActiveFilters = computed(() => {
  return (
    Boolean(movieStore.filters.search && movieStore.filters.search.trim() !== '') ||
    Boolean(movieStore.filters.genre && movieStore.filters.genre !== 'Все') ||
    Boolean(movieStore.filters.contentType && movieStore.filters.contentType !== 'all')
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

const clearHistory = () => {
  historyService.clearHistory()
  historyList.value = []
}

// Модальное окно
const isRequestModalOpen = ref(false)
const requestLoading = ref(false)
const requestSuccess = ref('')
const requestError = ref('')
const requestForm = reactive({ title: '', comment: '' })

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

    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (rawInitData) headers['X-Telegram-Init-Data'] = encodeURI(rawInitData)

    const response = await fetch('/api/v1/requests/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: requestForm.title.trim(),
        comment: requestForm.comment.trim()
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Не удалось отправить заявку')

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