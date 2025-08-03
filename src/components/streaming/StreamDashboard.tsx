'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Eye,
  DollarSign,
  Heart,
  MessageCircle,
  Gift,
  Settings,
  Zap,
  TrendingUp,
  Clock,
  BarChart3,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  Save
} from 'lucide-react'

interface StreamStats {
  currentViewers: number
  totalViews: number
  followers: number
  donations: number
  chatMessages: number
  streamDuration: string
}

interface StreamSettings {
  title: string
  description: string
  category: string
  tags: string[]
  isPrivate: boolean
  allowRecording: boolean
  chatEnabled: boolean
  donationsEnabled: boolean
}

export default function StreamDashboard() {
  const [isLive, setIsLive] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(true)
  
  const [stats] = useState<StreamStats>({
    currentViewers: 1247,
    totalViews: 15420,
    followers: 3892,
    donations: 425.50,
    chatMessages: 2341,
    streamDuration: '2:34:12'
  })

  const [settings, setSettings] = useState<StreamSettings>({
    title: 'Epic Gaming Session - Boss Battles!',
    description: 'Join me for some intense gaming action as we take on the toughest bosses!',
    category: 'Gaming',
    tags: ['gaming', 'action', 'boss-fights'],
    isPrivate: false,
    allowRecording: true,
    chatEnabled: true,
    donationsEnabled: true
  })

  const handleStartStream = () => {
    setIsLive(true)
  }

  const handleStopStream = () => {
    setIsLive(false)
  }

  const handleSettingsChange = (key: keyof StreamSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const categories = [
    'Gaming', 'Music', 'Art', 'Cooking', 'Technology', 'Fitness', 'Education', 'Entertainment'
  ]

  return (
    <div className="space-y-6">
      {/* Stream Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Stream Controls
              </CardTitle>
              <CardDescription>
                Manage your live stream settings and controls
              </CardDescription>
            </div>
            <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-red-500" : ""}>
              {isLive ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                  LIVE
                </>
              ) : (
                'OFFLINE'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={cameraEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setCameraEnabled(!cameraEnabled)}
              >
                {cameraEnabled ? <Camera className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                Camera
              </Button>
              <Button
                variant={micEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setMicEnabled(!micEnabled)}
              >
                {micEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                Microphone
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {!isLive ? (
                <Button onClick={handleStartStream} className="bg-red-600 hover:bg-red-700">
                  <Zap className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              ) : (
                <Button onClick={handleStopStream} variant="destructive">
                  Stop Stream
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viewers</p>
                <p className="text-2xl font-bold">{stats.currentViewers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-2xl font-bold">{stats.followers.toLocaleString()}</p>
              </div>
              <Heart className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Donations</p>
                <p className="text-2xl font-bold">${stats.donations}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{stats.chatMessages.toLocaleString()}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">{stats.streamDuration}</p>
              </div>
              <Clock className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Stream Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Information</CardTitle>
              <CardDescription>
                Configure your stream title, description and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Stream Title</Label>
                  <Input
                    id="title"
                    value={settings.title}
                    onChange={(e) => handleSettingsChange('title', e.target.value)}
                    placeholder="Enter stream title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={settings.category} onValueChange={(value) => handleSettingsChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => handleSettingsChange('description', e.target.value)}
                  placeholder="Describe your stream"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={settings.tags.join(', ')}
                  onChange={(e) => handleSettingsChange('tags', e.target.value.split(', '))}
                  placeholder="gaming, action, boss-fights"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Private Stream</Label>
                    <p className="text-sm text-muted-foreground">
                      Only invited viewers can watch
                    </p>
                  </div>
                  <Switch
                    checked={settings.isPrivate}
                    onCheckedChange={(checked) => handleSettingsChange('isPrivate', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Recording</Label>
                    <p className="text-sm text-muted-foreground">
                      Save stream for later viewing
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowRecording}
                    onCheckedChange={(checked) => handleSettingsChange('allowRecording', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Chat</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow viewers to chat
                    </p>
                  </div>
                  <Switch
                    checked={settings.chatEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('chatEnabled', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Donations</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept donations from viewers
                    </p>
                  </div>
                  <Switch
                    checked={settings.donationsEnabled}
                    onCheckedChange={(checked) => handleSettingsChange('donationsEnabled', checked)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Stream Analytics
              </CardTitle>
              <CardDescription>
                Track your stream performance and viewer engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Analytics charts would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Recent Donations
              </CardTitle>
              <CardDescription>
                Manage donations and virtual gifts from your viewers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Donation management interface would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Chat Moderation
              </CardTitle>
              <CardDescription>
                Manage chat settings and moderation tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Moderation tools would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
