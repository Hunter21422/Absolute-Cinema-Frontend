import { defineStore } from 'pinia'
import api from '../api/client'

export const useMovieStore = defineStore('movie', {
  state: () => ({
    movies: [],
    total: 0,
    page: 1,
    limit: 20,
    genres: [],
    loading: false,
    favorites: [],
    filters: {
      search: '',
      genre: 'Все',
      contentType: 'all' // 'all' | 'movie' | 'series'
    }
  }),
  actions: {
    async fetchGenres() {
      try {
        const { data } = await api.get('/movies/genres')
        this.genres = ['Все', ...data]
      } catch {
        this.genres = ['Все', 'Боевик', 'Фантастика', 'Комедия', 'Триллер', 'Драма', 'Аниме', 'Мультфильм']
      }
    },

    async fetchMovies(resetPage = false) {
      if (resetPage) this.page = 1
      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit,
          content_type: this.filters.contentType
        }
        if (this.filters.search.trim()) {
          params.search = this.filters.search.trim()
        }
        if (this.filters.genre && this.filters.genre !== 'Все') {
          params.genre = this.filters.genre
        }

        const { data } = await api.get('/movies/', { params })
        this.movies = data.items
        this.total = data.total
      } catch (err) {
        console.error('Ошибка загрузки фильмов:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchFavorites() {
      try {
        const { data } = await api.get('/favorites/')
        this.favorites = data
      } catch (err) {
        console.error('Ошибка загрузки избранного:', err)
      }
    },

    async toggleFavorite(movie) {
      const prev = movie.is_favorite
      movie.is_favorite = !prev
      try {
        const { data } = await api.post(`/favorites/toggle/${movie.id}`)
        movie.is_favorite = data.is_favorite
        if (!data.is_favorite) {
          this.favorites = this.favorites.filter((m) => m.id !== movie.id)
        }
      } catch (err) {
        movie.is_favorite = prev
        console.error('Ошибка избранного:', err)
      }
    },

    resetFilters() {
      this.filters.search = ''
      this.filters.genre = 'Все'
      this.filters.contentType = 'all'
      this.fetchMovies(true)
    }
  }
})