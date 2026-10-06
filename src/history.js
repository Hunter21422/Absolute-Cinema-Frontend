const HISTORY_KEY = 'watch_history';

export const historyService = {
  getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory(movie) {
    if (!movie || !movie.id) return;
    try {
      const history = this.getHistory();
      // Убираем дубликат, если этот фильм уже смотрели ранее
      const filtered = history.filter((item) => item.id !== movie.id);
      // Добавляем в начало списка и держим максимум 20 фильмов
      const updated = [
        {
          id: movie.id,
          title: movie.title,
          poster_url: movie.poster_url,
          year: movie.year,
          video_url: movie.video_url
        },
        ...filtered
      ].slice(0, 20);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Ошибка записи истории в localStorage:', e);
    }
  },

  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }
};
