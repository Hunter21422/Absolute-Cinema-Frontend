<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        @click.self="close"
      >
        <div class="w-full max-w-md bg-[#16161a] border border-white/10 rounded-3xl p-6 text-white shadow-2xl animate-slide-up">
          
          <!-- Шапка модалки -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🍿</span>
              <h3 class="text-lg font-bold">Заказать фильм или сериал</h3>
            </div>
            <button 
              @click="close" 
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p class="text-xs text-gray-400 mb-5 leading-relaxed">
            Напишите название, и мы постараемся найти его в хорошем качестве и добавить в бота как можно быстрее.
          </p>

          <!-- Форма -->
          <form @submit.prevent="submitRequest" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1.5">
                Название фильма / сериала <span class="text-red-500">*</span>
              </label>
              <input
                v-model="title"
                type="text"
                placeholder="Например: Острые козырьки"
                class="w-full bg-[#202026] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
                required
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1.5">
                Комментарий / Год / Озвучка (необязательно)
              </label>
              <input
                v-model="comment"
                type="text"
                placeholder="Например: 2 сезон в дубляже Red Head Sound"
                class="w-full bg-[#202026] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <!-- Сообщение об успехе -->
            <div v-if="successMsg" class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center">
              {{ successMsg }}
            </div>

            <!-- Ошибка -->
            <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
              {{ errorMsg }}
            </div>

            <!-- Кнопка отправки в стиле СМОТРЕТЬ -->
            <button
              type="submit"
              :disabled="loading || !title.trim()"
              class="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
            >
              <span v-if="loading" class="animate-spin text-base">⏳</span>
              <span v-else>Отправить заявку 🚀</span>
            </button>
          </form>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios' // или твой настроенный api-клиент

const props = defineProps({
  isOpen: Boolean,
  initialTitle: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:isOpen'])

const title = ref(props.initialTitle)
const comment = ref('')
const loading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const close = () => {
  emit('update:isOpen', false)
  successMsg.value = ''
  errorMsg.value = ''
}

const submitRequest = async () => {
  if (!title.value.trim()) return

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    // URL твоего API
    await axios.post('/api/v1/requests/', {
      title: title.value.trim(),
      comment: comment.value.trim()
    })

    successMsg.value = 'Заявка принята! Мы скоро добавим этот фильм.'
    title.value = ''
    comment.value = ''
    
    // Закрываем окно через 1.5 секунды
    setTimeout(() => {
      close()
    }, 1500)
  } catch (err) {
    errorMsg.value = err.response?.data?.detail || 'Не удалось отправить заявку. Попробуйте позже.'
  } finally {
    loading.value = false
  }
}
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