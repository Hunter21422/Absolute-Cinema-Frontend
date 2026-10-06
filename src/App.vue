<script setup>
import { ref, onMounted } from 'vue';
import { historyService } from './history';

// Состояния
const movies = ref([]);               // Список фильмов из API
const selectedMovie = ref(null);       // Выбранный фильм для плеера
const historyList = ref([]);           // Список просмотренных фильмов

// Загрузка истории при старте приложения
onMounted(() => {
  historyList.value = historyService.getHistory();
});

// Главная функция: открывает фильм и фиксирует в истории
function openMovie(movie) {
  selectedMovie.value = movie;
  
  // Сохраняем фильм в память
  historyService.addToHistory(movie);
  // Обновляем список истории на экране
  historyList.value = historyService.getHistory();
}

function clearHistory() {
  historyService.clearHistory();
  historyList.value = [];
}
</script>

<template>
  <div class="app-container">
    <!-- 1. Лента истории просмотров (показывается только если есть история) -->
    <section v-if="historyList.length > 0" class="history-section">
      <div class="section-header">
        <h3 class="section-title">Вы недавно смотрели</h3>
        <button class="clear-btn" @click="clearHistory">Очистить</button>
      </div>

      <!-- Горизонтальная лента со скроллбаром -->
      <div class="horizontal-scroll">
        <div 
          v-for="item in historyList" 
          :key="item.id" 
          class="history-card"
          @click="openMovie(item)"
        >
          <img :src="item.poster_url" :alt="item.title" class="history-poster" />
          <span class="history-title">{{ item.title }}</span>
        </div>
      </div>
    </section>

    <!-- 2. Каталог фильмов (основной список) -->
    <section class="catalog-section">
      <h3>Каталог</h3>
      <div class="movies-grid">
        <div 
          v-for="movie in movies" 
          :key="movie.id" 
          class="movie-card"
          @click="openMovie(movie)"
        >
          <img :src="movie.poster_url" :alt="movie.title" />
          <h4>{{ movie.title }}</h4>
          <span class="badge">{{ movie.year }}</span>
        </div>
      </div>
    </section>

    <!-- 3. Модальное окно или блок плеера -->
    <div v-if="selectedMovie" class="modal-overlay" @click.self="selectedMovie = null">
      <div class="modal-content">
        <button class="close-btn" @click="selectedMovie = null">✕</button>
        <iframe 
          :src="selectedMovie.video_url" 
          frameborder="0" 
          allowfullscreen 
          class="player-frame"
        ></iframe>
        <h2>{{ selectedMovie.title }} ({{ selectedMovie.year }})</h2>
      </div>
    </div>
  </div>
</template>

<style>
/* === СКРОЛЛБАРЫ (Вертикальный и Горизонтальный) === */

/* Тонкий вертикальный скроллбар всей страницы */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.45);
}

/* Стили горизонтальной ленты */
.horizontal-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}

/* Цветной тонкий бегунок для ленты */
.horizontal-scroll::-webkit-scrollbar {
  height: 4px;
}

.horizontal-scroll::-webkit-scrollbar-thumb {
  background: #3b82f6; /* Акцентный синий цвет */
  border-radius: 10px;
}

/* Базовая разметка блоков */
.app-container {
  padding: 12px;
  color: #fff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 15px;
  margin: 0;
}

.clear-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
}

.history-card {
  flex: 0 0 100px;
  cursor: pointer;
}

.history-poster {
  width: 100px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
}

.history-title {
  display: block;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 4px;
}

.player-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
}
</style>
