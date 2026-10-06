<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="glass-panel w-full max-w-sm p-6 rounded-3xl text-center space-y-4 border border-rose-500/20 shadow-2xl">
      <div class="w-12 h-12 bg-rose-600/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>

      <div>
        <h2 class="text-base font-bold text-white tracking-wide">Панель управления</h2>
        <p class="text-xs text-zinc-400 mt-0.5">Вход защищен мастер-ключом</p>
      </div>

      <form @submit.prevent="submit" class="space-y-3">
        <input
          v-model="password"
          type="password"
          placeholder="••••••••••••"
          autofocus
          class="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-white focus:outline-none focus:border-rose-500 tracking-widest"
        />

        <button
          type="submit"
          :disabled="loading || !password"
          class="glow-button w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {{ loading ? 'Проверка...' : 'Разблокировать' }}
        </button>
      </form>

      <p v-if="error" class="text-xs text-rose-400 font-medium">{{ error }}</p>
      
      <button @click="$router.push('/')" class="text-[11px] text-zinc-500 hover:text-zinc-300">
        Вернуться в кинотеатр
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/client'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post('/admin/login', { password: password.value })
    sessionStorage.setItem('admin_token', data.admin_token)
    router.push({ name: 'admin-dashboard' })
  } catch (err) {
    error.value = err.response?.data?.detail || 'Неверный мастер-пароль'
  } finally {
    loading.value = false
  }
}
</script>