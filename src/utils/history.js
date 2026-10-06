const HISTORY_KEY = 'watch_history';
const MAX_HISTORY_ITEMS = 20;

export const historyService = {
  // Получить весь список просмотренных тайтлов
  getHistory: () => {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Добавить фильм в историю при открытии плеера
  addToHistory: (movie) => {
    if (!movie || !movie.id) return;

    try {
      const history = historyService.getHistory();
      
      // Удаляем фильм, если он уже был в истории (чтобы поднять его на первое место)
      const filtered = history.filter((item) => item.id !== movie.id);
      
      const newItem = {
        id: movie.id,
        title: movie.title,
        poster_url: movie.poster_url,
        year: movie.year,
        rating: movie.rating,
        watched_at: new Date().toISOString(),
      };

      // Добавляем в начало и ограничиваем размер истории
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Ошибка записи истории:', err);
    }
  },

  // Очистить историю
  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
  }
};
