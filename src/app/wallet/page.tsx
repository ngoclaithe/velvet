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
  AlertCircle,
  Copy,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { walletAPI } from '@/lib/api/wallet'
import { requestDeposit } from '@/lib/api/requestDeposit'
import { infoPaymentApi, type InfoPayment } from '@/lib/api/infoPayment'
import { generateSepayQRUrl } from '@/lib/utils' 

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'earning' | 'spending' | 'gift_received' | 'gift_sent'
  amount: number
  description: string
  date: Date
  status: 'completed' | 'pending' | 'failed'
  transactionId?: string
}

interface RequestDeposit {
  id: string
  amount: number
  infoPaymentId: number
  transactionCode?: string
  note?: string
  status: 'pending' | 'approved' | 'rejected'
  codePay: string
  createdAt: Date
  infoPayment?: InfoPayment
}

export default function WalletPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showBalance, setShowBalance] = useState(true)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  // Real API data
  const [balance, setBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [requestDeposits, setRequestDeposits] = useState<RequestDeposit[]>([])
  
  // New deposit flow state
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<InfoPayment[]>([])
  const [selectedInfoPaymentId, setSelectedInfoPaymentId] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState('')
  
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [generatedCodePay, setGeneratedCodePay] = useState('')
  const [showDepositInstructions, setShowDepositInstructions] = useState(false)
  // Snapshot of last created deposit to ensure dialog can show QR even after form is reset
  const [lastDepositData, setLastDepositData] = useState<{ payment?: InfoPayment; amount: number; codePay: string } | null>(null)

  // Generate unique codepay
  const generateCodePay = () => {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `PAY${timestamp.slice(-6)}${random}`
  }

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Đã sao chép!",
        description: "Đã sao chép vào clipboard",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép vào clipboard",
        variant: "destructive"
      })
    }
  }

  // Load available payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoadingPaymentMethods(true)
      try {
        const response = await infoPaymentApi.getPublicInfoPayments()
        console.log("Giá trị của reponse khi request infopayment là", response)
        if (response.success && response.data && Array.isArray(response.data)) {
          setAvailablePaymentMethods(response.data.filter((payment: InfoPayment) => payment.isActive))
        }
      } catch (error) {
        console.error('Failed to load payment methods:', error)
        toast({
          title: "Không thể tải phương thức thanh toán",
          description: "Vui lòng thử lại sau",
          variant: "destructive"
        })
      } finally {
        setIsLoadingPaymentMethods(false)
      }
    }

    fetchPaymentMethods()
  }, [toast])

  // Load wallet data and transactions from API
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!user) return

      setIsLoadingWallet(true)
      try {
        // Fetch wallet balance
        const walletResponse = await walletAPI.getWallet()
        if (walletResponse.success && walletResponse.data) {
          setBalance(Number(walletResponse.data.balance) || 0)
        setLockedBalance(Number(walletResponse.data.lockedBalance) || 0)
        setTotalEarnings(Number(walletResponse.data.totalEarnings) || 0)
        setMonthlyIncome(Number(walletResponse.data.monthlyIncome) || 0)
        }

        // Fetch transactions
        const transactionsResponse = await walletAPI.getTransactions()
        if (transactionsResponse.success && transactionsResponse.data && transactionsResponse.data.data) {
          setTransactions(transactionsResponse.data.data.map((t: any) => ({
            ...t,
            date: new Date(t.date || t.createdAt)
          })))
        }

        // Fetch request deposits
        const requestDepositsResponse = await requestDeposit.getRequestDeposit()
        if (requestDepositsResponse.success && requestDepositsResponse.data && Array.isArray(requestDepositsResponse.data)) {
          setRequestDeposits(requestDepositsResponse.data.map((rd: any) => ({
            ...rd,
            createdAt: new Date(rd.createdAt)
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

  const handleCreateDepositRequest = async () => {
    if (!depositAmount || !selectedInfoPaymentId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền và chọn phương thức thanh toán",
        variant: "destructive"
      })
      return
    }

    const amount = parseFloat(depositAmount)
    if (amount < 1000) {
      toast({
        title: "Lỗi",
        description: "Số tiền nạp tối thiểu là 1,000 VND",
        variant: "destructive"
      })
      return
    }

    const codePay = generateCodePay()

    // Prepare data according to backend validator
    const depositData = {
      amount: amount,
      infoPaymentId: parseInt(selectedInfoPaymentId),
      codePay: codePay,
      metadata: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        depositType: 'manual_request'
      }
    }

    setIsDepositing(true)
    try {
      const response = await requestDeposit.createRequestDeposit(depositData)

      if (response.success) {
        setGeneratedCodePay(codePay)
        setShowDepositInstructions(true)
        
        toast({
          title: "Tạo yêu cầu nạp tiền thành công!",
          description: `Mã giao dịch: ${codePay}`,
          variant: "default"
        })

        // Reset form
        setDepositAmount('')
        setSelectedInfoPaymentId('')

        // Refresh request deposits
        const requestDepositsResponse = await requestDeposit.getRequestDeposit()
        if (requestDepositsResponse.success && requestDepositsResponse.data && Array.isArray(requestDepositsResponse.data)) {
          setRequestDeposits(requestDepositsResponse.data.map((rd: any) => ({
            ...rd,
            createdAt: new Date(rd.createdAt)
          })))
        }
      } else {
        toast({
          title: "Lỗi tạo yêu cầu",
          description: response.error || "Không thể tạo yêu cầu nạp tiền",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Lỗi tạo yêu cầu",
        description: "Không thể tạo yêu cầu nạp tiền. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !bankName || !accountNumber || !accountHolderName) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin rút tiền",
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
        bankName: bankName,
        accountNumber: accountNumber,
        accountHolderName: accountHolderName
      })

      if (response.success) {
        toast({
          title: "Yêu cầu rút tiền thành công!",
          description: `Yêu cầu rút ${Number(withdrawAmount).toLocaleString('vi-VN')} VND đang được xử lý`,
          variant: "default"
        })

        // Refresh wallet data
        const walletResponse = await walletAPI.getWallet()
        if (walletResponse.success && walletResponse.data) {
          setBalance(Number(walletResponse.data.balance) || 0)
          setLockedBalance(Number(walletResponse.data.lockedBalance) || 0)
        }

        setWithdrawAmount('')
        setBankName('')
        setAccountNumber('')
        setAccountHolderName('')
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

  const getRequestDepositStatusBadge = (status: RequestDeposit['status']) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-green-100 text-green-800">Đã duyệt</Badge>
      case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>
      case 'rejected': return <Badge variant="destructive">Từ chối</Badge>
      default: return null
    }
  }

  const formatAmount = (amount: number, showSign = true) => {
    const numAmount = Number(amount) || 0
    const formatted = Math.abs(numAmount).toLocaleString('vi-VN')
    if (!showSign) return `${formatted} VND`
    return numAmount >= 0 ? `+${formatted} VND` : `-${formatted} VND`
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
                {showBalance ? `${Number(balance || 0).toLocaleString('vi-VN')} VND` : '••••••'}
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
                {showBalance ? `${Number(totalEarnings || 0).toLocaleString('vi-VN')} VND` : '••••••'}
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
                {showBalance ? `${Number(monthlyIncome || 0).toLocaleString('vi-VN')} VND` : '••••••'}
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
                {showBalance ? `${Number(balance || 0).toLocaleString('vi-VN')} VND` : '••••••'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Số dư khả dụng để sử dụng trong ứng dụng
              </p>
              {(balance || 0) === 0 && (
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
                  Tạo yêu cầu nạp tiền vào ví
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Số tiền (VND)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="1000"
                    step="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phương thức thanh toán</Label>
                  {isLoadingPaymentMethods ? (
                    <div className="flex items-center space-x-2">
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Đang tải...</span>
                    </div>
                  ) : (
                    <Select value={selectedInfoPaymentId} onValueChange={setSelectedInfoPaymentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tài khoản ngân hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePaymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{method.bankName}</span>
                              <span className="text-sm text-muted-foreground">
                                {method.accountName} - {method.bankNumber}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>


                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Thông tin quan trọng:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Số tiền nạp tối thiểu: 1,000 VND</li>
                    <li>• Thời gian xử lý: 5-15 phút sau khi chuyển khoản</li>
                    <li>• Vui lòng giữ lại mã giao dịch để tra cứu</li>
                    <li>• Liên hệ hỗ trợ nếu không nhận được tiền sau 30 phút</li>
                  </ul>
                </div>

                <Button
                  onClick={handleCreateDepositRequest}
                  disabled={isDepositing || !depositAmount || !selectedInfoPaymentId}
                  className="w-full"
                >
                  {isDepositing ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo yêu cầu...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Tạo yêu cầu nạp tiền
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
                  {[10000, 50000, 100000, 200000, 500000, 1000000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setDepositAmount(amount.toString())}
                      className="h-16 flex flex-col"
                    >
                      <span className="text-lg font-bold">{amount.toLocaleString('vi-VN')} VND</span>
                      <span className="text-xs text-muted-foreground">
                        Nạp nhanh
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deposit Instructions Dialog */}
          <Dialog open={showDepositInstructions} onOpenChange={setShowDepositInstructions}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Yêu cầu đã được tạo</span>
                </DialogTitle>
                <DialogDescription>
                  Vui lòng thực hiện chuyển khoản theo thông tin bên dưới với số tiền chính xác
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedInfoPaymentId && (
                  <div className="space-y-3">
                    {(() => {
                      const selectedPayment = availablePaymentMethods.find(
                        p => p.id.toString() === selectedInfoPaymentId
                      )
                      if (!selectedPayment) return null

                      return (
                        <>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium">Ngân hàng</p>
                            <p className="text-lg">{selectedPayment.bankName}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium">Số tài khoản</p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-mono">{selectedPayment.bankNumber}</span>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedPayment.bankNumber)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium">Tên tài khoản</p>
                            <p className="text-lg">{selectedPayment.accountName}</p>
                          </div>

                          {/* QR Code Section */}
                          <div className="bg-white p-4 rounded border text-center">
                            <p className="text-sm font-medium mb-3">Mã QR thanh toán</p>
                            <div className="flex justify-center">
                              <img
                                src={generateSepayQRUrl({
                                  accountNumber: selectedPayment.bankNumber,
                                  name: selectedPayment.accountName,
                                  bank: selectedPayment.bankName,
                                  amount: Number(depositAmount || 0),
                                  code_pay: generatedCodePay
                                })}
                                alt="QR Code thanh toán"
                                className="w-48 h-48 border rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Quét mã QR để thanh toán nhanh
                            </p>
                          </div>
                        </>
                      )
                    })()}
                    
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-sm font-medium text-blue-900">Mã giao dịch</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-mono text-blue-900">{generatedCodePay}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedCodePay)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-800 mt-1">
                        Vui lòng ghi mã này vào nội dung chuyển khoản
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-sm font-medium text-green-900">Số tiền</p>
                      <p className="text-xl font-bold text-green-900">{Number(depositAmount || 0).toLocaleString('vi-VN')} VND</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-sm font-medium text-yellow-900">Lưu ý quan trọng:</p>
                  <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                    <li>• Bắt buộc ghi mã giao dịch vào nội dung chuyển khoản</li>
                    <li>• Chuyển đúng số tiền như hiển thị</li>
                    <li>• Tiền sẽ được cộng vào ví trong 5-15 phút</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                  <Label htmlFor="withdrawAmount">Số tiền (VND)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10000"
                    max={balance}
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Số dư khả dụng: {(Number(balance || 0) - Number(lockedBalance || 0)).toLocaleString('vi-VN')} VND
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Tên ngân hàng</Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="VD: Vietcombank, BIDV, Techcombank..."
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Số tài khoản</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    placeholder="Nhập số tài khoản ngân hàng"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Tên chủ tài khoản</Label>
                  <Input
                    id="accountHolderName"
                    type="text"
                    placeholder="Nhập tên chủ tài khoản"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                  />
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Lưu ý rút tiền:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Số tiền rút tối thiểu: 10,000 VND</li>
                    <li>• Phí rút tiền: 2,000 VND cho giao dịch dưới 100,000 VND</li>
                    <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
                    <li>• Có thể bị khóa tạm thời để xác minh</li>
                  </ul>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || !bankName || !accountNumber || !accountHolderName}
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
                <CardTitle>Lưu ý quan trọng</CardTitle>
                <CardDescription>Thông tin cần lưu ý khi rút tiền</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Thông tin quan trọng:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Kiểm tra kỹ thông tin ngân hàng trước khi gửi</li>
                      <li>• Tên chủ tài khoản phải trùng với tên đăng ký</li>
                      <li>• Số tài khoản phải chính xác và hoạt động</li>
                      <li>• Yêu cầu rút tiền sẽ được xử lý trong 1-3 ngày làm việc</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Chú ý bảo mật:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Không chia sẻ thông tin tài khoản với người khác</li>
                      <li>• Kiểm tra email xác nhận sau khi gửi yêu cầu</li>
                      <li>• Liên hệ hỗ trợ nếu có vấn đề</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
