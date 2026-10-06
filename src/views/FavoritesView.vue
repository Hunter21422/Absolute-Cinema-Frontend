<template>
  <div class="px-4 py-4 space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="text-lg font-black text-white tracking-wide">Мои закладки</h1>
      <span class="text-xs text-zinc-500">{{ movieStore.favorites.length }} сохраненных</span>
    </div>

    <div v-if="movieStore.favorites.length === 0" class="glass-panel rounded-3xl p-8 text-center space-y-3 mt-8">
      <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-zinc-500">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
        </svg>
      </div>
      <p class="text-xs text-zinc-400 font-medium">Ваш список пуст</p>
      <p class="text-[11px] text-zinc-500">Добавляйте фильмы кнопкой сердечка в каталоге</p>
    </div>

    <div v-else class="grid grid-cols-2 gap-3.5">
      <MovieCard v-for="m in movieStore.favorites" :key="m.id" :movie="m" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useMovieStore } from '../stores/movie'
import MovieCard from '../components/MovieCard.vue'

const movieStore = useMovieStore()
onMounted(() => movieStore.fetchFavorites())
</script>