import { api } from './core'

export const reactApi = {
  toggleReactionPost: (data: any) => api.post(`/reactions`, data),

}