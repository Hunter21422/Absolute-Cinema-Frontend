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

    <!-- ЗАЯВКИ ЗРИТЕЛЕЙ (СТОЛ ЗАКАЗОВ) -->
    <div class="glass-panel p-4 rounded-2xl space-y-3 border border-white/10">
      <div class="flex justify-between items-center pb-1 border-b border-white/5">
        <div>
          <h2 class="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <span>📬</span> Заявки зрителей
          </h2>
          <p class="text-[10px] text-zinc-500">Заказы на добавление кино</p>
        </div>
        <button
          @click="loadRequests"
          :disabled="requestsLoading"
          class="glass-pill px-2.5 py-1 rounded-xl text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition"
        >
          <span :class="{ 'animate-spin': requestsLoading }">🔄</span>
        </button>
      </div>

      <!-- Табы фильтров -->
      <div class="flex gap-1.5 overflow-x-auto pb-1 text-xs custom-scrollbar-x">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          @click="activeFilter = tab.value"
          :class="[
            'px-2.5 py-1 rounded-xl font-medium transition text-[10px] whitespace-nowrap',
            activeFilter === tab.value
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-black/30 text-zinc-400 hover:text-white'
          ]"
        >
          {{ tab.label }}
          <span class="opacity-70 ml-0.5">({{ tab.count }})</span>
        </button>
      </div>

      <!-- Загрузка заявок -->
      <div v-if="requestsLoading" class="py-6 text-center text-zinc-500 text-xs">
        <div class="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Загрузка...
      </div>

      <!-- Пусто -->
      <div v-else-if="filteredRequests.length === 0" class="py-6 text-center text-zinc-500 text-xs">
        📭 Заявок в этом разделе нет
      </div>

      <!-- Карточки заявок -->
      <div v-else class="space-y-2.5 pt-1">
        <div
          v-for="req in filteredRequests"
          :key="req.id"
          class="bg-black/30 border border-white/5 rounded-xl p-3 space-y-2"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span>{{ req.title }}</span>
                <a
                  :href="`https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(req.title)}`"
                  target="_blank"
                  class="text-[9px] bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 px-1.5 py-0.5 rounded transition inline-flex items-center"
                >
                  КП ↗
                </a>
              </div>
              <p class="text-[10px] text-zinc-500 mt-0.5">
                @{{ req.username || 'Аноним' }} • {{ formatDate(req.created_at) }}
              </p>
            </div>

            <!-- Бейдж статуса -->
            <span
              :class="[
                'text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0',
                statusBadge(req.status).class
              ]"
            >
              {{ statusBadge(req.status).label }}
            </span>
          </div>

          <!-- Комментарий к заявке -->
          <p v-if="req.comment" class="bg-black/40 rounded-lg p-2 text-[10px] text-zinc-400 border border-white/5">
            <span class="text-zinc-500">Пожелание:</span> {{ req.comment }}
          </p>

          <!-- Действия -->
          <div class="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
            <div class="flex items-center gap-1.5">
              <button
                v-if="req.status !== 'completed'"
                @click="updateRequestStatus(req.id, 'completed')"
                class="px-2 py-0.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-medium transition"
              >
                ✓ Готово (пуш)
              </button>

              <button
                v-if="req.status !== 'rejected'"
                @click="updateRequestStatus(req.id, 'rejected')"
                class="px-2 py-0.5 rounded-lg bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 font-medium transition"
              >
                ✕ Отклонить
              </button>

              <button
                v-if="req.status !== 'pending'"
                @click="updateRequestStatus(req.id, 'pending')"
                class="px-2 py-0.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition"
              >
                В ожидание
              </button>
            </div>

            <button
              @click="deleteRequest(req.id)"
              class="text-zinc-500 hover:text-rose-400 px-1 py-0.5 transition"
              title="Удалить заявку"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

// Состояние заявок стола заказов
const requests = ref([])
const requestsLoading = ref(false)
const activeFilter = ref('pending')

const filterTabs = computed(() => [
  { label: 'Ожидают', value: 'pending', count: requests.value.filter(r => r.status === 'pending').length },
  { label: 'Все', value: 'all', count: requests.value.length },
  { label: 'Добавлены', value: 'completed', count: requests.value.filter(r => r.status === 'completed').length },
  { label: 'Отклонены', value: 'rejected', count: requests.value.filter(r => r.status === 'rejected').length }
])

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return requests.value
  return requests.value.filter(r => r.status === activeFilter.value)
})

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

const loadRequests = async () => {
  requestsLoading.value = true
  try {
    const { data } = await api.get('/requests/')
    requests.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Ошибка загрузки заявок:', err)
  } finally {
    requestsLoading.value = false
  }
}

const updateRequestStatus = async (id, status) => {
  try {
    await api.patch(`/requests/${id}`, { status })
    const target = requests.value.find(r => r.id === id)
    if (target) target.status = status
  } catch (err) {
    console.error('Ошибка обновления статуса заявки:', err)
  }
}

const deleteRequest = async (id) => {
  if (!confirm('Удалить эту заявку?')) return
  try {
    await api.delete(`/requests/${id}`)
    requests.value = requests.value.filter(r => r.id !== id)
  } catch (err) {
    console.error('Ошибка удаления заявки:', err)
  }
}

const statusBadge = (status) => {
  switch (status) {
    case 'completed':
      return { label: 'Добавлен', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
    case 'rejected':
      return { label: 'Отклонён', class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
    default:
      return { label: 'Ожидает', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
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

onMounted(() => {
  loadStats()
  loadRequests()
})
</script>