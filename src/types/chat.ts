export interface ChatMessage {
  id: string
  streamId?: string
  conversationId?: string
  senderId: string
  sender: {
    id: string
    username: string
    avatar?: string
    role: ViewerRole
    isVerified: boolean
  }
  content: string
  type: MessageType
  replyTo?: string
  attachments?: MessageAttachment[]
  reactions: MessageReaction[]
  isDeleted: boolean
  isEdited: boolean
  createdAt: Date
  updatedAt: Date
}

export type MessageType = 'text' | 'emoji' | 'tip' | 'gift' | 'system' | 'image' | 'video' | 'audio'

export interface MessageAttachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'file'
  url: string
  filename: string
  size: number
  thumbnail?: string
}

export interface MessageReaction {
  emoji: string
  userId: string
  username: string
  createdAt: Date
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  participants: ConversationParticipant[]
  lastMessage?: ChatMessage
  unreadCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ConversationParticipant {
  userId: string
  username: string
  avatar?: string
  role: 'member' | 'admin'
  joinedAt: Date
  lastSeen?: Date
}

export interface DirectMessage extends ChatMessage {
  conversationId: string
  isRead: boolean
  readAt?: Date
}

export interface StreamChat {
  streamId: string
  messages: ChatMessage[]
  activeUsers: StreamViewer[]
  settings: ChatSettings
  moderators: string[]
}

export interface ChatSettings {
  enabled: boolean
  subscribersOnly: boolean
  followersOnly: boolean
  slowMode: number
  maxMessageLength: number
  allowEmojis: boolean
  allowLinks: boolean
  wordFilter: string[]
  bannedWords: string[]
}

export interface ChatModeration {
  userId: string
  action: ModerationAction
  reason?: string
  duration?: number
  moderatorId: string
  createdAt: Date
}

export type ModerationAction = 'timeout' | 'ban' | 'unban' | 'delete_message' | 'warn'

export interface Emoji {
  id: string
  name: string
  url: string
  category: string
  isCustom: boolean
  cost?: number
}

export interface Gift {
  id: string
  name: string
  image: string
  animation?: string
  cost: number
  category: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isActive: boolean
}

export interface Tip {
  id: string
  senderId: string
  receiverId: string
  amount: number
  message?: string
  isAnonymous: boolean
  streamId?: string
  createdAt: Date
}

export interface GiftSent {
  id: string
  giftId: string
  gift: Gift
  senderId: string
  receiverId: string
  quantity: number
  totalCost: number
  message?: string
  streamId?: string
  createdAt: Date
}

export interface ChatStore {
  streamChats: { [streamId: string]: StreamChat }
  conversations: Conversation[]
  activeConversation: string | null
  unreadCount: number
  isTyping: { [conversationId: string]: string[] }
  
  // Actions
  sendMessage: (data: SendMessageData) => Promise<void>
  sendDirectMessage: (data: SendDirectMessageData) => Promise<void>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  reactToMessage: (messageId: string, emoji: string) => Promise<void>
  joinStreamChat: (streamId: string) => Promise<void>
  leaveStreamChat: (streamId: string) => Promise<void>
  sendTip: (data: SendTipData) => Promise<void>
  sendGift: (data: SendGiftData) => Promise<void>
  moderateMessage: (data: ModerationData) => Promise<void>
  setTyping: (conversationId: string, isTyping: boolean) => void
  markAsRead: (conversationId: string) => Promise<void>
  createConversation: (participantIds: string[]) => Promise<Conversation>
}

export interface SendMessageData {
  streamId?: string
  conversationId?: string
  content: string
  type?: MessageType
  replyTo?: string
  attachments?: File[]
}

export interface SendDirectMessageData {
  recipientId: string
  content: string
  attachments?: File[]
}

export interface SendTipData {
  receiverId: string
  amount: number
  message?: string
  isAnonymous: boolean
  streamId?: string
}

export interface SendGiftData {
  giftId: string
  receiverId: string
  quantity: number
  message?: string
  streamId?: string
}

export interface ModerationData {
  userId: string
  action: ModerationAction
  reason?: string
  duration?: number
  messageId?: string
}
