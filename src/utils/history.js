const HISTORY_KEY = 'absolute_cinema_history';

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
      const filtered = history.filter((item) => item.id !== movie.id);
      const updated = [
        {
          id: movie.id,
          title: movie.title,
          poster_url: movie.poster_url,
          year: movie.year,
          rating: movie.rating
        },
        ...filtered
      ].slice(0, 20);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Ошибка записи истории:', e);
    }
  },

  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  }
};
