<template>
  <div class="min-h-screen bg-[#08090d] text-white flex flex-col justify-between selection:bg-rose-500/30">
    <!-- Фоновое свечение -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-[130px] pointer-events-none z-0"></div>

    <main class="flex-grow z-10" :class="{ 'pb-24': $route.meta.showDock }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Плавающий нижний стеклянный Dock Bar (Каталог и Закладки) -->
    <nav v-if="$route.meta.showDock" class="fixed bottom-4 left-4 right-4 z-50">
      <div class="glass-panel max-w-xs mx-auto rounded-2xl p-2 px-8 flex justify-around items-center shadow-2xl">
        <router-link to="/" class="nav-item" active-class="nav-active">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span class="text-[10px] font-medium tracking-wide">Каталог</span>
        </router-link>

        <router-link to="/favorites" class="nav-item" active-class="nav-active">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
          <span class="text-[10px] font-medium tracking-wide">Закладки</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

onMounted(() => {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()
    if (tg.disableVerticalSwipes) tg.disableVerticalSwipes()
    tg.headerColor = '#08090d'
    tg.backgroundColor = '#08090d'
  }
  userStore.fetchProfile()
})
</script>

<style scoped>
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #71717a;
  transition-property: color, transform;
  transition-duration: 200ms;
}

.nav-active {
  color: #f43f5e;
  transform: scale(1.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>