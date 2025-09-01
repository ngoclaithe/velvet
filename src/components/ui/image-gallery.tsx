'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  thumbnail?: string
}

interface ImageGalleryProps {
  media: MediaItem[]
  className?: string
}

export function ImageGallery({ media, className = '' }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!media || media.length === 0) return null

  const openViewer = (index: number) => {
    setSelectedIndex(index)
  }

  const closeViewer = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') closeViewer()
  }

  const getGridLayout = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count === 3) return 'grid-cols-3'
    if (count === 4) return 'grid-cols-2'
    return 'grid-cols-3'
  }

  const getImageClass = (count: number, index: number) => {
    if (count === 1) return 'aspect-[16/10] rounded-lg'
    if (count === 2) return 'aspect-square rounded-lg'
    if (count === 3) return 'aspect-square rounded-lg'
    if (count === 4) {
      return index < 2 ? 'aspect-square rounded-lg' : 'aspect-square rounded-lg'
    }
    if (count > 4) {
      if (index < 4) return 'aspect-square rounded-lg'
      return 'aspect-square rounded-lg'
    }
    return 'aspect-square rounded-lg'
  }

  const visibleMedia = media.length > 4 ? media.slice(0, 4) : media
  const remainingCount = media.length - 4

  return (
    <>
      <div className={`${className}`}>
        <div className={`grid gap-2 ${getGridLayout(visibleMedia.length)}`}>
          {visibleMedia.map((item, index) => (
            <div
              key={item.id}
              className={`relative cursor-pointer group overflow-hidden ${getImageClass(media.length, index)}`}
              onClick={() => openViewer(index)}
            >
              <img
                src={item.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Video play button overlay */}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-gray-800 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}

              {/* More images overlay */}
              {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    +{remainingCount}
                  </span>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Full Screen Viewer */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && closeViewer()}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          <DialogTitle className="sr-only">Trình xem ảnh</DialogTitle>
          {selectedIndex !== null && (
            <div className="relative w-full h-[95vh] flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={closeViewer}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Navigation buttons */}
              {media.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-10 text-white hover:bg-white/20 disabled:opacity-50"
                    onClick={goToPrevious}
                    disabled={selectedIndex === 0}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-16 z-10 text-white hover:bg-white/20 disabled:opacity-50"
                    onClick={goToNext}
                    disabled={selectedIndex === media.length - 1}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Image/Video */}
              <div className="w-full h-full flex items-center justify-center p-8">
                {media[selectedIndex].type === 'image' ? (
                  <img
                    src={media[selectedIndex].url}
                    alt={`Image ${selectedIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <video
                    src={media[selectedIndex].url}
                    controls
                    className="max-w-full max-h-full"
                    autoPlay
                  />
                )}
              </div>

              {/* Bottom info bar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex items-center bg-black/60 rounded-full px-4 py-2">
                  <span className="text-white text-sm">
                    {selectedIndex + 1} / {media.length}
                  </span>
                </div>
              </div>

              {/* Thumbnail strip for multiple images (right side) */}
              {media.length > 1 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
                  <div className="flex flex-col space-y-2 bg-black/60 rounded-lg p-2 max-h-[70vh] overflow-y-auto">
                    {media.map((item, index) => (
                      <button
                        key={item.id}
                        className={`w-14 h-14 rounded overflow-hidden border-2 ${
                          index === selectedIndex ? 'border-white' : 'border-transparent'
                        }`}
                        onClick={() => setSelectedIndex(index)}
                      >
                        <img
                          src={item.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile thumbnails (bottom) */}
              {media.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 sm:hidden">
                  <div className="flex space-x-2 bg-black/60 rounded-lg p-2 max-w-[85vw] overflow-x-auto">
                    {media.map((item, index) => (
                      <button
                        key={item.id}
                        className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 ${
                          index === selectedIndex ? 'border-white' : 'border-transparent'
                        }`}
                        onClick={() => setSelectedIndex(index)}
                      >
                        <img
                          src={item.url}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
