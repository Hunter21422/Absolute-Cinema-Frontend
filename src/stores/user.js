import { defineStore } from 'pinia'
import api from '../api/client'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAdmin: false,
    loading: false
  }),
  actions: {
    async fetchProfile() {
      try {
        const { data } = await api.get('/users/me')
        this.user = data
        this.isAdmin = data.is_admin
      } catch (err) {
        console.error('Ошибка профиля:', err)
      }
    }
  }
})