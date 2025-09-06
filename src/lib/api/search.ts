import { api } from './core'

export const searchAPI = {
  search: (query: string, limit?: number) =>
    api.get(`/search/all`, { query, ...(limit ? { limit: String(limit) } : {}) }),
}
