import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Streaming Platform</h1>
        <p className="text-lg mb-6">A modern streaming platform</p>
        <div className="space-x-4">
          <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
            Login
          </Link>
          <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
