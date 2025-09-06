import { api } from './core'

export const searchAPI = {
    search: (query: string) => api.get(`/search/all`, { params: { q: query } }),
}