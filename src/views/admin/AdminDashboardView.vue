<template>
  <div class="px-4 py-6 max-w-md mx-auto space-y-6 text-zinc-100">
    <!-- Шапка панели -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-lg font-black text-rose-500 tracking-wide">Панель управления</h1>
        <p class="text-[11px] text-zinc-400">Управление контентом платформы</p>
      </div>
      <button @click="logout" class="glass-pill px-3 py-1.5 rounded-xl text-[10px] text-zinc-400 hover:text-white">
        Выйти
      </button>
    </div>

    <!-- Метрики -->
    <div v-if="stats" class="grid grid-cols-2 gap-2.5">
      <div class="glass-panel p-3 rounded-2xl">
        <span class="text-[10px] text-zinc-500 uppercase font-bold">Зрители</span>
        <p class="text-base font-black text-white mt-0.5">{{ stats.total_users }}</p>
      </div>
      <div class="glass-panel p-3 rounded-2xl">
        <span class="text-[10px] text-zinc-500 uppercase font-bold">Просмотры</span>
        <p class="text-base font-black text-rose-400 mt-0.5">{{ stats.total_views }}</p>
      </div>
      <div class="glass-panel p-3 rounded-2xl">
        <span class="text-[10px] text-zinc-500 uppercase font-bold">Фильмы</span>
        <p class="text-base font-black text-white mt-0.5">{{ stats.total_movies }}</p>
      </div>
      <div class="glass-panel p-3 rounded-2xl">
        <span class="text-[10px] text-zinc-500 uppercase font-bold">Сериалы</span>
        <p class="text-base font-black text-white mt-0.5">{{ stats.total_series }}</p>
      </div>
    </div>

    <!-- АВТОПАРСИНГ -->
    <div class="glass-panel p-4 rounded-2xl space-y-3 border border-rose-500/20">
      <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-300">Добавить фильм по ID</h2>
      <div class="flex gap-2">
        <input
          v-model.number="kpId"
          type="number"
          placeholder="ID Кинопоиска (напр. 301)"
          class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          @keyup.enter="parseKp"
        />
        <button
          @click="parseKp"
          :disabled="isParsing || !kpId"
          class="glow-button px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap disabled:opacity-50"
        >
          {{ isParsing ? 'Поиск...' : 'Спарсить' }}
        </button>
      </div>
      <p v-if="parseError" class="text-xs text-rose-400 font-medium">{{ parseError }}</p>
    </div>

    <!-- ПРЕДПРОСМОТР КАРТОЧКИ И ПУБЛИКАЦИЯ -->
    <form v-if="form" @submit.prevent="publish" class="space-y-4">
      <div class="glass-panel p-3 rounded-2xl flex gap-3 items-center">
        <img :src="form.poster_url" class="w-14 h-20 object-cover rounded-xl bg-zinc-800 flex-shrink-0" />
        <div class="overflow-hidden space-y-1">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300">★ {{ form.rating }}</span>
          <h3 class="text-xs font-bold text-white truncate">{{ form.title }}</h3>
          <p class="text-[10px] text-zinc-400">{{ form.year }} • {{ form.genre }}</p>
        </div>
      </div>

      <div class="glass-panel p-4 rounded-2xl space-y-3 text-xs">
        <div>
          <label class="block text-zinc-400 text-[10px] uppercase font-bold mb-1">Название</label>
          <input v-model="form.title" type="text" required class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white" />
        </div>

        <div>
          <label class="block text-zinc-400 text-[10px] uppercase font-bold mb-1">Ссылка плеера</label>
          <input v-model="form.video_url" type="text" required class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-[11px]" />
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="seriesFlag" v-model="form.is_series" class="accent-rose-600 w-4 h-4 rounded" />
          <label for="seriesFlag" class="text-zinc-300">Это сериал</label>
        </div>
      </div>

      <button
        type="submit"
        :disabled="isPublishing"
        class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
      >
        {{ isPublishing ? 'Сохранение...' : 'Опубликовать в каталог' }}
      </button>

      <p v-if="publishSuccess" class="text-center text-xs text-emerald-400 font-bold">✓ Фильм успешно добавлен в базу!</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/client'

const router = useRouter()
const stats = ref(null)
const kpId = ref(null)
const isParsing = ref(false)
const isPublishing = ref(false)
const parseError = ref('')
const publishSuccess = ref(false)
const form = ref(null)

const loadStats = async () => {
  try {
    const { data } = await api.get('/admin/stats')
    stats.value = data
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      logout()
    }
  }
}

const parseKp = async () => {
  isParsing.value = true
  parseError.value = ''
  publishSuccess.value = false
  try {
    const { data } = await api.post('/admin/parse-kp', { kinopoisk_id: kpId.value })
    form.value = { ...data }
  } catch (err) {
    parseError.value = err.response?.data?.detail || 'Фильм не найден у балансера'
    form.value = null
  } finally {
    isParsing.value = false
  }
}

const publish = async () => {
  isPublishing.value = true
  try {
    await api.post('/admin/movies', form.value)
    publishSuccess.value = true
    form.value = null
    kpId.value = null
    loadStats()
  } catch (err) {
    parseError.value = err.response?.data?.detail || 'Ошибка добавления'
  } finally {
    isPublishing.value = false
  }
}

const logout = () => {
  sessionStorage.removeItem('admin_token')
  router.push('/')
}

onMounted(loadStats)
</script>