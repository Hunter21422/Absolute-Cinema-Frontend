<template>
  <router-link
    :to="`/movie/${movie.id}`"
    class="group relative glass-panel rounded-2xl overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-all duration-200"
  >
    <div class="relative w-full aspect-[2/3] overflow-hidden bg-zinc-900">
      <img
        v-if="!posterError && movie.poster_url"
        :src="movie.poster_url"
        :alt="movie.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        @error="posterError = true"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-zinc-600 text-2xl">
        🎬
      </div>

      <div class="absolute top-2 right-2 glass-pill px-2 py-0.5 rounded-lg text-[9px] font-bold text-amber-400 flex items-center gap-1 shadow-md">
        ★ {{ rating }}
      </div>

      <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider text-zinc-300 uppercase">
        {{ badge }}
      </div>
    </div>

    <div class="p-2.5 flex flex-col justify-between flex-grow gap-1">
      <h3 class="text-xs font-semibold text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors">
        {{ movie.title }}
      </h3>
      <div class="flex justify-between items-center text-[10px] text-zinc-500">
        <span>{{ movie.year }}</span>
        <span class="truncate max-w-[80px]">{{ movie.genre }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  movie: { type: Object, required: true }
})

const posterError = ref(false)

const rating = computed(() => {
  const r = Number(props.movie.rating)
  return Number.isFinite(r) && r > 0 ? r.toFixed(1) : '—'
})

const badge = computed(() => {
  if (props.movie.is_series) return 'СЕРИАЛ'
  return props.movie.quality || 'ФИЛЬМ'
})
</script>