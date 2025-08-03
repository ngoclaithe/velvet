# Streaming Platform Frontend

A modern, feature-rich streaming platform built with Next.js, TypeScript, and Tailwind CSS. This platform supports live video streaming, real-time chat, virtual gifts, private shows, and comprehensive user management.

## 🚀 Features

### Core Features
- **Live Streaming**: HD quality streaming with WebRTC support
- **Real-time Chat**: Interactive chat with emojis, gifts, and moderation
- **User Authentication**: Secure login/register with social OAuth
- **Virtual Economy**: Tips, gifts, and subscription system
- **Private Shows**: One-on-one exclusive streaming sessions
- **Social Features**: Follow/unfollow, profiles, and social interactions

### Technical Features
- **Responsive Design**: Mobile-first, responsive UI
- **Dark/Light Themes**: Automatic theme switching
- **Real-time Updates**: WebSocket integration
- **State Management**: Zustand for efficient state handling
- **Type Safety**: Full TypeScript support
- **Form Validation**: Zod schema validation
- **Component Library**: shadcn/ui with Radix UI primitives

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Real-time**: WebSocket
- **Video/Audio**: WebRTC

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   ├── (streaming)/       # Streaming pages
│   │   ├── (social)/          # Social features
│   │   ├── (admin)/           # Admin panel
│   │   ├── (marketing)/       # Marketing pages
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   ├── auth/              # Auth components
│   │   ├── streaming/         # Streaming components
│   │   ├── chat/              # Chat components
│   │   ├── payments/          # Payment components
│   │   ├── profile/           # Profile components
│   │   ├── admin/             # Admin components
│   │   ├── social/            # Social components
│   │   └── common/            # Common components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # CSS styles and themes
├── public/                    # Static assets
└── docker/                    # Docker configuration
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streaming-platform-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/streaming_platform"
   
   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Add other environment variables as needed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🎨 UI Components

The project uses [shadcn/ui](https://ui.shadcn.com/) components built on top of Radix UI primitives. Key components include:

### Basic Components
- Button, Input, Card, Avatar, Badge
- Dialog, Dropdown Menu, Toast, Tooltip
- Select, Checkbox, Radio Group, Switch, Tabs

### Custom Components
- Stream Player with controls
- Chat interface with real-time messaging
- User profiles and settings
- Payment and wallet management
- Admin dashboard components

## 🔧 Configuration

### Tailwind CSS
The project uses a custom Tailwind configuration with:
- Custom color palette for streaming themes
- Extended animations and keyframes
- Responsive breakpoints
- Dark/light theme support

### TypeScript
Strict TypeScript configuration with:
- Path aliases for clean imports
- Comprehensive type definitions
- Runtime type validation with Zod

## 🌐 State Management

The application uses Zustand for state management with separate stores for:

- **Auth Store**: User authentication and session management
- **User Store**: User profiles and settings
- **Streaming Store**: Stream creation and management
- **Chat Store**: Real-time messaging
- **Payment Store**: Wallet and transactions

## 🔌 Real-time Features

WebSocket integration provides:
- Live chat updates
- Stream viewer counts
- Notifications
- Real-time tips and gifts
- Stream status updates

## 🎯 Key Features Implementation

### Authentication
- JWT-based authentication
- Social OAuth (Google, GitHub)
- Password reset functionality
- KYC verification process

### Streaming
- WebRTC for peer-to-peer connections
- Multiple quality options
- Stream recording
- Private show booking

### Chat System
- Real-time messaging
- Emoji support
- Message moderation
- User roles (viewer, subscriber, moderator, VIP)

### Payment System
- Wallet management
- Tips and virtual gifts
- Subscription plans
- Secure payment processing

## 🔒 Security

- Input validation with Zod schemas
- CSRF protection
- Rate limiting
- Content sanitization
- Secure authentication flows

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Optimized layouts for different screen sizes
- Touch-friendly interfaces
- Progressive Web App features

## 🌙 Theme Support

Built-in theme system with:
- Light and dark modes
- System preference detection
- Persistent theme selection
- Accessible color contrasts

## 🚀 Deployment

### Environment Variables
Set up the following environment variables for production:

```env
# Required
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret
DATABASE_URL=your-production-database-url

# Optional but recommended
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... other OAuth providers

# Streaming & WebRTC
STUN_SERVER_URL=stun:stun.l.google.com:19302
TURN_SERVER_URL=turn:your-turn-server.com:3478

# Payment Processing
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
```

### Build and Deploy
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔮 Future Enhancements

Planned features for future releases:
- Mobile applications (React Native)
- Advanced analytics dashboard
- AI-powered content moderation
- Multi-language support
- Advanced streaming features (screen sharing, co-streaming)
- Enhanced social features (groups, events)

---

Built with ❤️ using modern web technologies.
