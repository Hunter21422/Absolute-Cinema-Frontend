<template>
  <div class="space-y-4 text-white">
    <!-- Шапка и статистика -->
    <div class="flex items-center justify-between pb-2 border-b border-white/10">
      <div>
        <h2 class="text-lg font-bold flex items-center gap-2">
          <span>📬</span> Заявки на добавление
        </h2>
        <p class="text-xs text-gray-400">Стол заказов от пользователей бота</p>
      </div>
      <button 
        @click="fetchRequests" 
        class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition text-xs flex items-center gap-1"
        :disabled="loading"
      >
        <span :class="{ 'animate-spin': loading }">🔄</span> Обновить
      </button>
    </div>

    <!-- Фильтры по статусам -->
    <div class="flex gap-2 overflow-x-auto pb-1 text-xs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="currentFilter = tab.value"
        :class="[
          'px-3.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap',
          currentFilter === tab.value 
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
            : 'bg-[#202026] text-gray-400 hover:text-white'
        ]"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="ml-1 opacity-70">({{ tab.count }})</span>
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="py-12 text-center text-gray-400 text-xs">
      <div class="inline-block animate-spin text-2xl mb-2">⏳</div>
      <div>Загружаем заявки...</div>
    </div>

    <!-- Список пуст -->
    <div v-else-if="filteredRequests.length === 0" class="py-12 text-center text-gray-500 text-xs bg-[#16161a] rounded-2xl border border-white/5">
      <div class="text-3xl mb-2">📭</div>
      Нет заявок в этой категории
    </div>

    <!-- Список карточек заявок -->
    <div v-else class="space-y-3">
      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="bg-[#18181e] border border-white/10 rounded-2xl p-4 transition hover:border-white/20 space-y-3"
      >
        <!-- Верхняя строка карточки: название + статус -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="text-base font-bold text-white flex items-center gap-2">
              {{ req.title }}
              <a 
                :href="`https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(req.title)}`" 
                target="_blank" 
                class="text-[10px] bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-2 py-0.5 rounded-lg transition"
                title="Искать на Кинопоиске"
              >
                Поиск на КП ↗
              </a>
            </div>
            <div class="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
              <span>👤 @{{ req.username || 'Аноним' }}</span>
              <span>•</span>
              <span>📅 {{ formatDate(req.created_at) }}</span>
            </div>
          </div>

          <!-- Бейдж статуса -->
          <span
            :class="[
              'text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0',
              statusBadge(req.status).class
            ]"
          >
            {{ statusBadge(req.status).label }}
          </span>
        </div>

        <!-- Комментарий зрителя, если есть -->
        <div v-if="req.comment" class="bg-[#202026] rounded-xl p-2.5 text-xs text-gray-300 border border-white/5">
          <span class="text-gray-500">Комментарий:</span> {{ req.comment }}
        </div>

        <!-- Кнопки быстрых действий -->
        <div class="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
          <div class="flex items-center gap-2">
            <!-- Кнопка Добавлено -->
            <button
              v-if="req.status !== 'completed'"
              @click="setStatus(req.id, 'completed')"
              class="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl font-medium transition flex items-center gap-1"
            >
              ✓ Добавлено
            </button>

            <!-- Кнопка Отклонить -->
            <button
              v-if="req.status !== 'rejected'"
              @click="setStatus(req.id, 'rejected')"
              class="px-3 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 rounded-xl font-medium transition flex items-center gap-1"
            >
              ✕ Отклонить
            </button>

            <!-- Вернуть в ожидание -->
            <button
              v-if="req.status !== 'pending'"
              @click="setStatus(req.id, 'pending')"
              class="px-2.5 py-1.5 bg-white/5 text-gray-400 hover:text-white rounded-xl transition"
            >
              В ожидание
            </button>
          </div>

          <!-- Удалить заявку -->
          <button
            @click="deleteRequest(req.id)"
            class="text-gray-500 hover:text-rose-400 p-1.5 transition"
            title="Удалить заявку"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const requests = ref([])
const loading = ref(false)
const currentFilter = ref('pending') // по умолчанию смотрим только те, что ждут

const tabs = computed(() => [
  { label: 'Ожидают', value: 'pending', count: requests.value.filter(r => r.status === 'pending').length },
  { label: 'Все', value: 'all', count: requests.value.length },
  { label: 'Добавленные', value: 'completed', count: requests.value.filter(r => r.status === 'completed').length },
  { label: 'Отклонённые', value: 'rejected', count: requests.value.filter(r => r.status === 'rejected').length }
])

const filteredRequests = computed(() => {
  if (currentFilter.value === 'all') return requests.value
  return requests.value.filter(r => r.status === currentFilter.value)
})

const fetchRequests = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/v1/requests/?limit=100')
    requests.value = res.data
  } catch (err) {
    console.error('Ошибка загрузки заявок:', err)
  } finally {
    loading.value = false
  }
}

const setStatus = async (id, status) => {
  try {
    await axios.patch(`/api/v1/requests/${id}`, { status })
    const item = requests.value.find(r => r.id === id)
    if (item) item.status = status
  } catch (err) {
    console.error('Ошибка обновления статуса:', err)
  }
}

const deleteRequest = async (id) => {
  if (!confirm('Точно удалить эту заявку?')) return
  try {
    await axios.delete(`/api/v1/requests/${id}`)
    requests.value = requests.value.filter(r => r.id !== id)
  } catch (err) {
    console.error('Ошибка удаления заявки:', err)
  }
}

const statusBadge = (status) => {
  switch (status) {
    case 'completed':
      return { label: 'Добавлен', class: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' }
    case 'rejected':
      return { label: 'Отклонён', class: 'bg-rose-500/20 text-rose-400 border border-rose-500/30' }
    default:
      return { label: 'Ожидает', class: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  fetchRequests()
})
</script>