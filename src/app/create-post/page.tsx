'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Icons } from '@/components/common/Icons'
import { 
  PenTool, 
  Save, 
  Send, 
  Image as ImageIcon, 
  Video, 
  Mic,
  Eye,
  EyeOff,
  Upload,
  X,
  Plus,
  Hash,
  DollarSign,
  Clock,
  Users,
  Globe,
  Lock,
  Heart,
  MessageCircle,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { postsApi } from '@/lib/api/posts'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import type { ApiResponse, UploadResponse } from '@/types/api'
import type { CloudinaryUploadResponse } from '@/types/cloudinary'

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'audio'
  url: string
  thumbnail?: string
}

export default function CreatePostPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cloudinary upload hook
  const {
    uploadMultiple,
    uploading: cloudinaryUploading,
    progress: uploadProgress,
    error: uploadError,
    clearError: clearUploadError,
    results: uploadResults,
    clearResults: clearUploadResults
  } = useCloudinaryUpload()
  
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    visibility: 'public' as 'public' | 'private' | 'followers',
    allowComments: true,
    allowLikes: true,
    allowSharing: true,
    isPremium: false,
    price: 0,
    scheduledAt: '',
  })

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'audio'>('text')
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  const categories = [
    'Giải trí',
    'Giáo dục',
    'Công nghệ',
    'Âm nhạc',
    'Nghệ thuật',
    'Gaming',
    'Thể thao',
    'Du lịch',
    'Nấu ăn',
    'Làm đẹp',
    'Khác'
  ]

  const handleInputChange = (field: string, value: any) => {
    setPostData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newMediaFile: MediaFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'audio',
          url: e.target?.result as string
        }
        
        setMediaFiles(prev => [...prev, newMediaFile])
        
        // Auto-detect post type based on first uploaded media
        if (mediaFiles.length === 0) {
          setPostType(newMediaFile.type === 'audio' ? 'audio' : 
                    newMediaFile.type === 'video' ? 'video' : 'image')
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== id))
  }

  const addTag = () => {
    if (currentTag && !postData.tags.includes(currentTag)) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tag: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const validatePost = () => {
    if (!postData.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề bài viết",
        variant: "destructive"
      })
      return false
    }

    if (!postData.content.trim() && mediaFiles.length === 0) {
      toast({
        title: "Lỗi", 
        description: "Bài viết phải có nội dung hoặc media",
        variant: "destructive"
      })
      return false
    }

    if (postData.isPremium && postData.price <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đặt giá cho nội dung premium",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  const handlePost = async (saveAsDraft = false) => {
    if (!validatePost() && !saveAsDraft) return

    setIsPosting(true)
    setIsDraft(saveAsDraft)

    // Clear any previous upload errors
    if (uploadError) {
      clearUploadError()
    }

    try {
      // Prepare post data for API
      const postPayload: any = {
        title: postData.title,
        content: postData.content,
        category: postData.category,
        tags: postData.tags,
        visibility: postData.visibility,
        allowComments: postData.allowComments,
        allowLikes: postData.allowLikes,
        allowSharing: postData.allowSharing,
        isPremium: postData.isPremium,
        price: postData.isPremium ? postData.price : undefined,
        scheduledAt: postData.scheduledAt ? new Date(postData.scheduledAt).toISOString() : undefined,
        status: saveAsDraft ? 'draft' : 'published',
        type: postType,
        mediaFiles: mediaFiles.length > 0 ? mediaFiles.map(file => ({
          type: file.type,
          fileName: file.file.name,
          fileSize: file.file.size,
        })) : undefined
      }

      // Upload media files to Cloudinary first if any
      const uploadedMediaUrls: string[] = []
      if (mediaFiles.length > 0) {
        try {
          const files = mediaFiles.map(mediaFile => mediaFile.file)
          console.log('📤 Starting media upload to Cloudinary:', {
            fileCount: files.length,
            files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
          })

          // Sử dụng folder và tags từ backend signature
          console.log('📤 Using backend-provided folder and tags from signature')

          const cloudinaryResults: CloudinaryUploadResponse[] = await uploadMultiple(files)

          // Extract URLs from Cloudinary results
          uploadedMediaUrls.push(...cloudinaryResults.map(result => result.secure_url))

          console.log('✅ Successfully uploaded to Cloudinary:', {
            count: cloudinaryResults.length,
            urls: uploadedMediaUrls
          })
        } catch (uploadError) {
          console.error('❌ Failed to upload media to Cloudinary:', uploadError)

          // Provide more specific error messages based on the error type
          let errorMessage = 'Không thể tải lên media. Vui lòng thử lại.'

          if (uploadError instanceof Error) {
            if (uploadError.message.includes('File quá lớn')) {
              errorMessage = 'File quá lớn. Vui lòng chọn file nhỏ hơn.'
            } else if (uploadError.message.includes('Định dạng file')) {
              errorMessage = 'Định dạng file không được hỗ trợ. Vui lòng chọn file khác.'
            } else if (uploadError.message.includes('Invalid transformation')) {
              errorMessage = 'Lỗi xử lý media. Vui lòng thử lại hoặc chọn file khác.'
            } else if (uploadError.message.includes('Network error') || uploadError.message.includes('timeout')) {
              errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.'
            }
          }

          throw new Error(errorMessage)
        }

        // Add uploaded media URLs to post payload
        if (uploadedMediaUrls.length > 0) {
          postPayload.mediaUrls = uploadedMediaUrls
        }
      }

      // Log the complete post payload for debugging
      console.log('=== POST DATA BEING SENT ===')
      console.log('Post Payload:', JSON.stringify(postPayload, null, 2))
      console.log('Original Form Data:', {
        title: postData.title,
        content: postData.content,
        category: postData.category,
        tags: postData.tags,
        visibility: postData.visibility,
        allowComments: postData.allowComments,
        allowLikes: postData.allowLikes,
        allowSharing: postData.allowSharing,
        isPremium: postData.isPremium,
        price: postData.price,
        scheduledAt: postData.scheduledAt,
      })
      console.log('Media Files:', mediaFiles.map(file => ({
        id: file.id,
        type: file.type,
        fileName: file.file.name,
        fileSize: file.file.size,
        url: file.url
      })))
      console.log('Post Type:', postType)
      console.log('Is Draft:', saveAsDraft)
      console.log('Uploaded Media URLs:', uploadedMediaUrls)
      console.log('=== END POST DATA ===')

      // Create the post
      const response = await postsApi.createPost(postPayload) as ApiResponse<{ id: string; url?: string }>

      console.log('Post creation response:', response)

      if (response.success) {
        toast({
          title: saveAsDraft ? "Lưu nháp thành công!" : "Đăng bài thành công!",
          description: saveAsDraft ? "Bài viết đã được lưu vào nháp" : "Bài viết của bạn đã được đăng tải",
          variant: "default"
        })

        // Reset form
        setPostData({
          title: '',
          content: '',
          category: '',
          tags: [],
          visibility: 'public',
          allowComments: true,
          allowLikes: true,
          allowSharing: true,
          isPremium: false,
          price: 0,
          scheduledAt: '',
        })
        setMediaFiles([])
        setPostType('text')

        // Redirect to the created post or home
        setTimeout(() => {
          if (response.data?.id && !saveAsDraft) {
            router.push(`/post/${response.data.id}`)
          } else {
            router.push('/')
          }
        }, 1500)
      } else {
        throw new Error(response.error || 'Failed to create post')
      }

    } catch (error) {
      console.error('Failed to create post:', error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể đăng bài. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsPosting(false)
      setIsDraft(false)
    }
  }

  const MediaPreview = ({ file }: { file: MediaFile }) => {
    const [isPlaying, setIsPlaying] = useState(false)
    
    return (
      <div className="relative group">
        {file.type === 'image' && (
          <img
            src={file.url}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
          />
        )}
        
        {file.type === 'video' && (
          <div className="relative">
            <video
              src={file.url}
              className="w-full h-32 object-cover rounded-lg"
              controls={false}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        
        {file.type === 'audio' && (
          <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
            <div className="text-center">
              <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{file.file.name}</p>
            </div>
          </div>
        )}
        
        <Button
          size="icon"
          variant="destructive"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeMediaFile(file.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Vui lòng đăng nhập để tạo bài viết</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tạo bài viết mới</h1>
          <p className="text-muted-foreground">Chia sẻ nội dung với cộng đồng</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePost(true)}
            disabled={isPosting || cloudinaryUploading}
          >
            {isDraft ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu nháp
              </>
            )}
          </Button>
          <Button
            onClick={() => handlePost(false)}
            disabled={isPosting || cloudinaryUploading}
          >
            {isPosting && !isDraft ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng...
              </>
            ) : cloudinaryUploading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Đang tải media...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Đăng bài
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung bài viết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  value={postData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {postData.title.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  placeholder="Chia sẻ suy nghĩ, câu chuyện của bạn..."
                  value={postData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={8}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {postData.content.length}/5000
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5" />
                <span>Media</span>
              </CardTitle>
              <CardDescription>
                Thêm hình ảnh, video hoặc âm thanh vào bài viết
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                    disabled={cloudinaryUploading || isPosting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Tải lên file
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Đang tải lên...</p>
                    {Object.entries(uploadProgress).map(([fileIndex, progress]) => (
                      <div key={fileIndex} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>File {parseInt(fileIndex) + 1}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                    <div className="flex justify-between items-center">
                      <span>{uploadError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearUploadError}
                        className="h-auto p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaFiles.map((file) => (
                      <MediaPreview key={file.id} file={file} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hash className="h-5 w-5" />
                <span>Thẻ tag</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Thêm thẻ tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={addTag} disabled={!currentTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {postData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {postData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer">
                        #{tag}
                        <X 
                          className="ml-1 h-3 w-3" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt bài viết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="space-y-2">
                <Label>Quyền riêng tư</Label>
                <Select 
                  value={postData.visibility} 
                  onValueChange={(value: any) => handleInputChange('visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Công khai</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="followers">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Người theo dõi</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>Riêng tư</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Cho phép bình luận</Label>
                  <Switch
                    checked={postData.allowComments}
                    onCheckedChange={(checked) => handleInputChange('allowComments', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Cho phép thích</Label>
                  <Switch
                    checked={postData.allowLikes}
                    onCheckedChange={(checked) => handleInputChange('allowLikes', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Cho phép chia sẻ</Label>
                  <Switch
                    checked={postData.allowSharing}
                    onCheckedChange={(checked) => handleInputChange('allowSharing', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Nội dung premium</Label>
                  <Switch
                    checked={postData.isPremium}
                    onCheckedChange={(checked) => handleInputChange('isPremium', checked)}
                  />
                </div>

                {postData.isPremium && (
                  <div className="space-y-2">
                    <Label>Giá ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={postData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Hẹn giờ đăng</Label>
                <Input
                  type="datetime-local"
                  value={postData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Xem trước</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="font-medium truncate">
                  {postData.title || 'Tiêu đề bài viết'}
                </div>
                <div className="text-muted-foreground line-clamp-3">
                  {postData.content || 'Nội dung bài viết sẽ hiển thị ở đây...'}
                </div>
                {mediaFiles.length > 0 && (
                  <div className="text-xs text-blue-600">
                    📎 {mediaFiles.length} file media
                  </div>
                )}
                {postData.tags.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {postData.tags.map(tag => `#${tag}`).join(' ')}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <div className="flex space-x-4">
                    <span className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>0</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>0</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Share2 className="h-3 w-3" />
                      <span>0</span>
                    </span>
                  </div>
                  {postData.isPremium && (
                    <Badge variant="secondary" className="text-xs">
                      ${postData.price}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
