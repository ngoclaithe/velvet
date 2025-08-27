'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from '@/components/common/Icons'
import { 
  Wallet, 
  Plus, 
  Minus, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Gift,
  Coins,
  History,
  Download,
  Upload,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { walletAPI, requestDeposit } from '@/lib/api'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'earning' | 'spending' | 'gift_received' | 'gift_sent'
  amount: number
  description: string
  date: Date
  status: 'completed' | 'pending' | 'failed'
  transactionId?: string
}

interface PaymentMethod {
  id: string
  type: 'bank' | 'card' | 'e_wallet'
  name: string
  details: string
  isDefault: boolean
}

export default function WalletPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showBalance, setShowBalance] = useState(true)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

  // Real API data
  const [balance, setBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')

  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'bank',
      name: 'Vietcombank',
      details: '**** **** **** 1234',
      isDefault: true
    },
    {
      id: '2',
      type: 'e_wallet',
      name: 'MoMo',
      details: '0987654321',
      isDefault: false
    },
    {
      id: '3',
      type: 'card',
      name: 'Visa Card',
      details: '**** **** **** 5678',
      isDefault: false
    }
  ]

  // Load wallet data and transactions from API
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return

      setIsLoadingWallet(true)
      try {
        // Fetch wallet balance
        const walletResponse = await walletAPI.getWallet()
        if (walletResponse.success && walletResponse.data) {
          setBalance(walletResponse.data.balance || 0)
          setLockedBalance(walletResponse.data.lockedBalance || 0)
          setTotalEarnings(walletResponse.data.totalEarnings || 0)
          setMonthlyIncome(walletResponse.data.monthlyIncome || 0)
        }

        // Fetch transactions
        const transactionsResponse = await walletAPI.getTransactions()
        if (transactionsResponse.success && transactionsResponse.data) {
          setTransactions(transactionsResponse.data.map((t: any) => ({
            ...t,
            date: new Date(t.date || t.createdAt)
          })))
        }
      } catch (error) {
        console.error('Failed to load wallet data:', error)
        toast({
          title: "Không thể tải dữ liệu ví",
          description: "Vui lòng thử lại sau",
          variant: "destructive"
        })
      } finally {
        setIsLoadingWallet(false)
      }
    }

    fetchWalletData()
  }, [user, toast])

  const handleDeposit = async () => {
    if (!depositAmount || !selectedPaymentMethod) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền và chọn phương thức thanh toán",
        variant: "destructive"
      })
      return
    }

    setIsDepositing(true)
    try {
      const response = await walletAPI.deposit({
        amount: parseFloat(depositAmount),
        paymentMethodId: selectedPaymentMethod
      })

      if (response.success) {
        toast({
          title: "Nạp tiền thành công!",
          description: `Đã nạp $${depositAmount} vào ví của bạn`,
          variant: "default"
        })

        // Refresh wallet data
        const walletResponse = await walletAPI.getWallet()
        if (walletResponse.success && walletResponse.data) {
          setBalance(walletResponse.data.balance || 0)
        }

        setDepositAmount('')
        setSelectedPaymentMethod('')
      } else {
        toast({
          title: "Lỗi nạp tiền",
          description: response.error || "Không thể nạp tiền",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi nạp tiền",
        description: "Không thể nạp tiền. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !selectedPaymentMethod) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền và chọn phương thức rút tiền",
        variant: "destructive"
      })
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (amount > balance) {
      toast({
        title: "Số dư không đủ",
        description: "Số tiền rút vượt quá số dư hiện tại",
        variant: "destructive"
      })
      return
    }

    setIsWithdrawing(true)
    try {
      const response = await walletAPI.withdraw({
        amount: amount,
        paymentMethodId: selectedPaymentMethod
      })

      if (response.success) {
        toast({
          title: "Yêu cầu rút tiền thành công!",
          description: `Yêu cầu rút $${withdrawAmount} đang được xử lý`,
          variant: "default"
        })

        // Refresh wallet data
        const walletResponse = await walletAPI.getWallet()
        if (walletResponse.success && walletResponse.data) {
          setBalance(walletResponse.data.balance || 0)
          setLockedBalance(walletResponse.data.lockedBalance || 0)
        }

        setWithdrawAmount('')
        setSelectedPaymentMethod('')
      } else {
        toast({
          title: "Lỗi rút tiền",
          description: response.error || "Không thể tạo yêu cầu rút tiền",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi rút tiền",
        description: "Không thể tạo yêu cầu rút tiền. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'earning': return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'spending': return <Minus className="h-4 w-4 text-orange-600" />
      case 'gift_received': return <Gift className="h-4 w-4 text-purple-600" />
      case 'gift_sent': return <Gift className="h-4 w-4 text-pink-600" />
      default: return <Coins className="h-4 w-4" />
    }
  }

  const getTransactionStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-100 text-green-800">Hoàn thành</Badge>
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Đang xử lý</Badge>
      case 'failed': return <Badge variant="destructive">Thất bại</Badge>
      default: return null
    }
  }

  const formatAmount = (amount: number, showSign = true) => {
    const formatted = Math.abs(amount).toFixed(2)
    if (!showSign) return `$${formatted}`
    return amount >= 0 ? `+$${formatted}` : `-$${formatted}`
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || isLoadingWallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải dữ liệu ví...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Component sẽ redirect trước khi render
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ví của tôi</h1>
          <p className="text-muted-foreground">Quản lý tài chính và giao dịch</p>
        </div>
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Balance Overview - Different for Users vs Creators */}
      {user?.role === 'creator' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="h-4 w-4"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
              </div>
              <p className="text-xs text-muted-foreground">
                Khả dụng cho rút tiền
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng thu nhập</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? `$${totalEarnings.toFixed(2)}` : '••••••'}
              </div>
              <p className="text-xs text-green-600">
                Tổng thu nhập từ streaming
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thu nhập tháng này</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalance ? `$${monthlyIncome.toFixed(2)}` : '••••••'}
              </div>
              <p className="text-xs text-blue-600">
                Thu nhập trong tháng
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          <Card className="max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư ví</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="h-4 w-4"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {showBalance ? `$${balance.toFixed(2)}` : '••••••'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Số dư khả dụng để sử dụng trong ứng dụng
              </p>
              {balance === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Chưa có số dư. Nạp tiền để bắt đầu sử dụng.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="deposit">Nạp tiền</TabsTrigger>
          <TabsTrigger value="withdraw">Rút tiền</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lịch sử giao dịch</CardTitle>
                  <CardDescription>Tất cả các giao dịch gần đây</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Xuất file
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{transaction.date.toLocaleDateString('vi-VN')}</span>
                          <span>•</span>
                          <span>ID: {transaction.transactionId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatAmount(transaction.amount)}
                        </p>
                        {getTransactionStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Nạp tiền</span>
                </CardTitle>
                <CardDescription>
                  Thêm tiền vào ví của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Số tiền ($)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phương thức thanh toán</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức thanh toán" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{method.name} - {method.details}</span>
                            {method.isDefault && <Badge variant="secondary" className="ml-2">Mặc định</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Thông tin quan trọng:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Số tiền nạp tối thiểu: $1.00</li>
                    <li>• Số tiền nạp tối đa: $10,000.00 mỗi giao dịch</li>
                    <li>• Phí giao dịch: 2.5% (tối thiểu $0.50)</li>
                    <li>• Thời gian xử lý: 1-3 phút</li>
                  </ul>
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount || !selectedPaymentMethod}
                  className="w-full"
                >
                  {isDepositing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Nạp tiền
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gói nạp tiền nhanh</CardTitle>
                <CardDescription>Chọn gói nạp tiền có sẵn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[10, 25, 50, 100, 250, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setDepositAmount(amount.toString())}
                      className="h-16 flex flex-col"
                    >
                      <span className="text-lg font-bold">${amount}</span>
                      <span className="text-xs text-muted-foreground">
                        Phí: ${(amount * 0.025).toFixed(2)}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="withdraw" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Minus className="h-5 w-5" />
                  <span>Rút tiền</span>
                </CardTitle>
                <CardDescription>
                  Rút tiền từ ví về tài khoản của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Số tiền ($)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10"
                    max={balance}
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">
                    Số dư khả dụng: ${(balance - lockedBalance).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Phương thức rút tiền</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức rút tiền" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{method.name} - {method.details}</span>
                            {method.isDefault && <Badge variant="secondary" className="ml-2">Mặc định</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Lưu ý rút tiền:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Số tiền rút tối thiểu: $10.00</li>
                    <li>• Phí rút tiền: $2.00 cho giao dịch dưới $100</li>
                    <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
                    <li>• Có thể bị khóa tạm thời để xác minh</li>
                  </ul>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || !selectedPaymentMethod}
                  className="w-full"
                  variant="outline"
                >
                  {isWithdrawing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Rút tiền
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
                <CardDescription>Quản lý các phương thức thanh toán</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <Badge variant="secondary">Mặc định</Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          Chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm phương thức thanh toán
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
