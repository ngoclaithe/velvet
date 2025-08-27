'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from '@/components/common/Icons'
import {
  Plus,
  CreditCard,
  Edit,
  Trash,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { infoPaymentApi } from '@/lib/api'

interface PaymentInfo {
  id: number
  bankNumber: string
  accountName: string
  bankName: string
  email: string
  phone: string
  metadata: any
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [paymentInfos, setPaymentInfos] = useState<PaymentInfo[]>([])
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    bankName: '',
    bankNumber: '',
    accountName: '',
    email: '',
    phone: '',
    active: true
  })

  // Load payment data
  useEffect(() => {
    const loadPaymentData = async () => {
      setIsLoading(true)
      try {
        const response = await infoPaymentApi.getInfoPayments()

        if (response.success && response.data) {
          setPaymentInfos(response.data)
        } else {
          throw new Error(response.error || 'Failed to load payment data')
        }
      } catch (error) {
        console.error('Failed to load payment data:', error)
        toast.error('Không thể tải dữ liệu thanh toán')
        setPaymentInfos([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPaymentData()
  }, [])

  const handleCreatePaymentInfo = async () => {
    try {
      // Validation
      if (!paymentForm.bankName || !paymentForm.bankNumber || !paymentForm.accountName) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }

      const response = await infoPaymentApi.createInfoPayment({
        bankName: paymentForm.bankName,
        accountNumber: paymentForm.bankNumber,
        accountHolderName: paymentForm.accountName,
        isActive: paymentForm.active
      })

      if (response.success && response.data) {
        // Reload data to get updated list
        const reloadResponse = await infoPaymentApi.getInfoPayments()
        if (reloadResponse.success && reloadResponse.data) {
          setPaymentInfos(reloadResponse.data)
        }

        setPaymentForm({
          bankName: '',
          bankNumber: '',
          accountName: '',
          email: '',
          phone: '',
          active: true
        })
        setIsEditingPayment(false)

        toast.success('Đã tạo thông tin thanh toán thành công')
      } else {
        throw new Error(response.error || 'Failed to create payment info')
      }
    } catch (error) {
      console.error('Create payment error:', error)
      toast.error('Có lỗi xảy ra khi tạo thông tin thanh toán')
    }
  }

  const handleUpdatePaymentInfo = async () => {
    try {
      if (!editingPaymentId) return

      // Validation
      if (!paymentForm.bankName || !paymentForm.bankNumber || !paymentForm.accountName) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
        return
      }

      const response = await infoPaymentApi.updateInfoPayment(editingPaymentId.toString(), {
        bankName: paymentForm.bankName,
        accountNumber: paymentForm.bankNumber,
        accountHolderName: paymentForm.accountName,
        isActive: paymentForm.active
      })

      if (response.success) {
        // Reload data to get updated list
        const reloadResponse = await infoPaymentApi.getInfoPayments()
        if (reloadResponse.success && reloadResponse.data) {
          setPaymentInfos(reloadResponse.data)
        }

        setPaymentForm({
          bankName: '',
          bankNumber: '',
          accountName: '',
          email: '',
          phone: '',
          active: true
        })
        setIsEditingPayment(false)
        setEditingPaymentId(null)

        toast.success('Đã cập nhật thông tin thanh toán thành công')
      } else {
        throw new Error(response.error || 'Failed to update payment info')
      }
    } catch (error) {
      console.error('Update payment error:', error)
      toast.error('Có lỗi xảy ra khi cập nhật thông tin thanh toán')
    }
  }

  const handleEditPaymentInfo = (paymentInfo: PaymentInfo) => {
    setPaymentForm({
      bankName: paymentInfo.bankName,
      bankNumber: paymentInfo.bankNumber,
      accountName: paymentInfo.accountName,
      email: paymentInfo.email,
      phone: paymentInfo.phone,
      active: paymentInfo.active
    })
    setEditingPaymentId(paymentInfo.id)
    setIsEditingPayment(true)
  }

  const handleDeletePaymentInfo = async (paymentId: number) => {
    try {
      const response = await infoPaymentApi.deleteInfoPayment(paymentId.toString())

      if (response.success) {
        // Reload data to get updated list
        const reloadResponse = await infoPaymentApi.getInfoPayments()
        if (reloadResponse.success && reloadResponse.data) {
          setPaymentInfos(reloadResponse.data)
        }

        toast.success('Đã xóa thông tin thanh toán thành công')
      } else {
        throw new Error(response.error || 'Failed to delete payment info')
      }
    } catch (error) {
      console.error('Delete payment error:', error)
      toast.error('Có lỗi xảy ra khi xóa thông tin thanh toán')
    }
  }

  const handleTogglePaymentStatus = async (paymentId: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setPaymentInfos(prev => prev.map(info =>
        info.id === paymentId
          ? { ...info, isActive: !info.isActive, updatedAt: new Date().toISOString() }
          : info
      ))

      toast.success('Đã cập nhật trạng thái thành công')
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải dữ liệu thanh toán...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thông tin thanh toán</h1>
          <p className="text-gray-600">Thêm và quản lý thông tin ngân hàng cho thanh toán</p>
        </div>
        <Button
          onClick={() => setIsEditingPayment(true)}
          disabled={isEditingPayment}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm thông tin thanh toán
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {isEditingPayment && (
            <Card className="mb-6 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingPaymentId ? 'Chỉnh sửa thông tin thanh toán' : 'Thêm thông tin thanh toán mới'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Tên ngân hàng *</Label>
                    <Input
                      id="bankName"
                      value={paymentForm.bankName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="VD: Vietcombank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Số tài khoản *</Label>
                    <Input
                      id="accountNumber"
                      value={paymentForm.accountNumber}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="VD: 1234567890"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Tên chủ tài khoản *</Label>
                  <Input
                    id="accountHolderName"
                    value={paymentForm.accountHolderName}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    placeholder="VD: NGUYEN VAN A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qrCodeUrl">URL QR Code</Label>
                  <Input
                    id="qrCodeUrl"
                    value={paymentForm.qrCodeUrl}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, qrCodeUrl: e.target.value }))}
                    placeholder="https://example.com/qr-code.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Trạng thái hoạt động
                  </Label>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={paymentForm.isActive}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    onClick={editingPaymentId ? handleUpdatePaymentInfo : handleCreatePaymentInfo}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {editingPaymentId ? 'Cập nhật' : 'Tạo mới'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingPayment(false)
                      setEditingPaymentId(null)
                      setPaymentForm({
                        bankName: '',
                        accountNumber: '',
                        accountHolderName: '',
                        qrCodeUrl: '',
                        isActive: true
                      })
                    }}
                  >
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {paymentInfos.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có thông tin thanh toán</h3>
                <p className="text-gray-500">Thêm thông tin ngân hàng để quản lý thanh toán</p>
              </div>
            ) : (
              paymentInfos.map((paymentInfo) => (
                <div key={paymentInfo.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">{paymentInfo.bankName}</p>
                      <p className="text-sm text-muted-foreground">
                        Số TK: {paymentInfo.accountNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Chủ TK: {paymentInfo.accountHolderName}
                      </p>
                      {paymentInfo.qrCodeUrl && (
                        <p className="text-sm text-blue-600">Có QR Code</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={paymentInfo.isActive ? 'default' : 'secondary'}>
                          {paymentInfo.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Cập nhật: {new Date(paymentInfo.updatedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPaymentInfo(paymentInfo)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePaymentStatus(paymentInfo.id)}
                    >
                      {paymentInfo.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Tắt
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Bật
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePaymentInfo(paymentInfo.id)}
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
