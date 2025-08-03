#!/bin/bash

echo "🚀 Chuẩn bị push project lên GitHub..."

# Khởi tạo git repository
git init

# Thêm tất cả files
git add .

# Commit với message chi tiết
git commit -m "feat: initial commit - streaming platform frontend

✨ Features:
- Next.js 14 with App Router and TypeScript
- Tailwind CSS with shadcn/ui components
- Comprehensive folder structure for streaming platform
- Authentication system (login, register, forgot password)
- Streaming features (WebRTC, private shows, analytics)
- Real-time chat with WebSocket integration
- Payment system (wallet, tips, gifts, subscriptions)
- User management and social features
- Admin panel with content moderation
- Responsive design with dark/light themes
- State management with Zustand
- Form validation with Zod and React Hook Form
- Custom hooks and utility libraries
- Full TypeScript type definitions

🛠️ Tech Stack:
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- Framer Motion
- Zustand
- React Hook Form
- Zod

📁 Structure:
- Complete app router structure
- Organized components by feature
- Type definitions for all features
- Custom hooks and utilities
- Zustand stores for state management
- Comprehensive styling system

🚀 Ready for production deployment!"

echo "✅ Git repository đã được khởi tạo và commit!"
echo ""
echo "📋 Tiếp theo, bạn cần:"
echo "1. Tạo repository mới trên GitHub.com"
echo "2. Copy URL repository (ví dụ: https://github.com/username/repo-name.git)"
echo "3. Chạy các lệnh sau:"
echo ""
echo "git remote add origin YOUR_GITHUB_REPO_URL"
echo "git branch -M main"
echo "git push -u origin main"
echo ""
echo "🎉 Hoàn thành!"
