import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, 
  Twitter, 
  Instagram, 
  Youtube, 
  Facebook,
  Mail,
  MapPin,
  Phone
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                VelvetSocial
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Nền tảng mạng xã hội adult 18+ hàng đầu. Kết nối, chia sẻ và khám phá
              trong cộng đồng an toàn và thân thiện.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Youtube className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Facebook className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Khám phá</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
                  Bảng tin
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog & Bài viết
                </Link>
              </li>
              <li>
                <Link href="/creators" className="text-muted-foreground hover:text-foreground transition-colors">
                  Creators
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Danh mục
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-muted-foreground hover:text-foreground transition-colors">
                  Nội dung Premium
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/creator-guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hướng dẫn Creator
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="text-muted-foreground hover:text-foreground transition-colors">
                  Quy tắc cộng đồng
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-muted-foreground hover:text-foreground transition-colors">
                  An toàn & Bảo mật
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold">Cập nhật mới nhất</h4>
            <p className="text-sm text-muted-foreground">
              Đăng ký để nhận thông tin về tính năng mới và sự kiện đặc biệt.
            </p>
            <div className="flex space-x-2">
              <Input 
                type="email" 
                placeholder="Email của bạn" 
                className="flex-1"
              />
              <Button size="sm">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="h-3 w-3" />
                <span>Hà Nội, Việt Nam</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-3 w-3" />
                <span>+84 (0) 123 456 789</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3" />
                <span>support@streamhub.vn</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Chính sách Cookie
            </Link>
            <Link href="/dmca" className="hover:text-foreground transition-colors">
              DMCA
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © {currentYear} StreamHub. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>
    </footer>
  )
}
