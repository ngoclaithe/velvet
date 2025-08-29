import type { IClientOptions, MqttClient } from 'mqtt'
import mqtt from 'mqtt'

let client: MqttClient | null = null
let isConnecting = false
const subscribedTopics = new Set<string>()

const getBrokerUrl = () => {
  // Prefer WebSocket URL for browser (ws or wss)
  const envUrl = process.env.NEXT_PUBLIC_MQTT_URL
  if (envUrl && envUrl.trim().length > 0) return envUrl
  // Fallback to ws on localhost (must be a WS-enabled MQTT broker)
  return 'ws://localhost:1883'
}

const getAuth = () => {
  const username = process.env.NEXT_PUBLIC_MQTT_USERNAME || 'client123'
  const password = process.env.NEXT_PUBLIC_MQTT_PASSWORD || 'client123'
  return { username, password }
}

export const connectMqtt = async (): Promise<MqttClient | null> => {
  if (typeof window === 'undefined') return null
  if (client && client.connected) return client
  if (isConnecting) return client
  isConnecting = true

  const url = getBrokerUrl()
  const { username, password } = getAuth()

  const options: IClientOptions = {
    username,
    password,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30_000,
    // Unique clientId per tab
    clientId: `web_${Math.random().toString(16).slice(2)}`,
    protocolVersion: 4,
  }

  return new Promise((resolve) => {
    try {
      client = mqtt.connect(url, options)

      client.on('connect', () => {
        isConnecting = false
        resolve(client!)
      })

      client.on('reconnect', () => {
        // no-op
      })

      client.on('error', () => {
        isConnecting = false
        resolve(client)
      })

      client.on('close', () => {
        // no-op
      })
    } catch {
      isConnecting = false
      resolve(null)
    }
  })
}

export const subscribeTopic = async (topic: string): Promise<boolean> => {
  if (!topic) return false
  const c = await connectMqtt()
  if (!c) return false

  return new Promise((resolve) => {
    c.subscribe(topic, { qos: 0 }, (err) => {
      if (!err) {
        subscribedTopics.add(topic)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

export const unsubscribeTopic = async (topic: string): Promise<boolean> => {
  if (!client || !client.connected) return false
  return new Promise((resolve) => {
    client!.unsubscribe(topic, (err) => {
      if (!err) {
        subscribedTopics.delete(topic)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

export const subscribeUserNotifications = async (userId: string | number) => {
  if (!userId) return false
  const topic = `noti/${userId}`
  return subscribeTopic(topic)
}

export const unsubscribeAll = async () => {
  if (!client || !client.connected) return
  const topics = Array.from(subscribedTopics)
  await Promise.all(topics.map((t) => unsubscribeTopic(t)))
}

export const disconnectMqtt = async () => {
  if (client) {
    try {
      await unsubscribeAll()
    } finally {
      client.end(true)
      client = null
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Fire-and-forget; broker should clean retained subscriptions if clean session
    if (client) {
      try {
        const topics = Array.from(subscribedTopics)
        topics.forEach((t) => {
          try { client!.unsubscribe(t) } catch {}
        })
      } catch {}
      try { client.end(true) } catch {}
      client = null
    }
  })
}
