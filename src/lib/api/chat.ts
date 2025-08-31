import { api } from './core'

export const chatApi = {
  getMessages: (streamId: string) =>
    api.get(`/chats/${streamId}`),
  
  sendMessage: ( data: any) =>
    api.post(`/chats/`, data),

  deleteMessage: (messageId: string) =>
    api.delete(`/chats/${messageId}`),

  getConversations: () => api.get('/conversations'),
  
  getConversation: (conversationId: string) =>
    api.get(`/messages/conversations/${conversationId}`),
  
  sendDirectMessage: (conversationId: string, data: any) =>
    api.post(`/messages/conversations/${conversationId}/messages`, data),
}