import { api } from './core'

export const creatorAPI = {
    getAllCreators: () => api.get('/creators'),
    getCreatorById: (id: number) => api.get(`/creators/${id}`),
    getUsersFollowMe: () => api.get('/follows/followers'),
    deleteUserFollow: (userId: number) => api.delete(`/follows/followers/${userId}`),
    getFeaturedCreator: () => api.get('/creators/featured'),
    getCallgirl: (params?: { page?: number; limit?: number; city?: string; minPrice?: number; maxPrice?: number; sortBy?: string }) => {
        const qp: Record<string, string> = {}
        if (params?.page) qp.page = String(params.page)
        if (params?.limit) qp.limit = String(params.limit)
        if (params?.city) qp.city = params.city
        if (params?.minPrice != null) qp.minPrice = String(params.minPrice)
        if (params?.maxPrice != null) qp.maxPrice = String(params.maxPrice)
        if (params?.sortBy) qp.sortBy = params.sortBy
        return api.get('/creators/callgirls', qp)
    },
}
