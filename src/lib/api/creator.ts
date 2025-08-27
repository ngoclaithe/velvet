import { api } from './core'

export const creatorAPI = {
    getAllCreators: () => api.get('/creator')
}