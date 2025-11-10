'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { DealStatusBadge } from '@/components/deal-status-badge'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function PaymentPage() {
  const params = useParams()
  const token = params.token as string
  const { toast } = useToast()
  
  const [deal, setDeal] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [qrImage, setQrImage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    loadDeal()
  }, [token])

  async function loadDeal() {
    try {
      // In a real app, we'd look up deal by paylink_token
      // For MVP, we'll need to implement a public endpoint
      toast({
        title: 'โหลดข้อมูลดีล',
        description: 'กำลังดึงข้อมูล...',
      })
      setLoading(false)
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof ApiError ? error.message : 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  async function createPayment() {
    if (!deal) return

    try {
      setPaying(true)
      const result = await api.createPayment(deal.id)
      setPayment(result.payment)
      
      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(result.qr_string)
      setQrImage(qrDataUrl)
      
      toast({
        title: 'สร้าง QR Code สำเร็จ',
        description: 'กรุณาสแกนเพื่อชำระเงิน',
      })
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof ApiError ? error.message : 'ไม่สามารถสร้าง QR ได้',
        variant: 'destructive',
      })
    } finally {
      setPaying(false)
    }
  }

  async function mockPayment() {
    if (!payment) return

    try {
      await api.mockWebhook(payment.provider_ref, 'PAID')
      
      toast({
        title: 'ชำระเงินสำเร็จ!',
        description: 'เงินถูกพักไว้แล้ว รอคุณยืนยันรับสินค้า',
      })
      
      // Reload deal
      setTimeout(() => loadDeal(), 1000)
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof ApiError ? error.message : 'ไม่สามารถชำระเงินได้',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Mock deal for demo
  const mockDeal = {
    id: 'demo',
    title: 'iPhone 13 Pro Max 256GB',
    amount_satang: 2500000,
    status: 'PENDING',
    seller: {
      display_name: 'ผู้ขายตัวอย่าง',
      seller_profile: {
        verified: true,
        reputation_score: 85,
      },
    },
  }

  const displayDeal = deal || mockDeal

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">ชำระเงินผ่าน PromptPay</CardTitle>
            <CardDescription>
              เงินจะถูกพักไว้จนกว่าคุณจะยืนยันรับสินค้า
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deal Info */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{displayDeal.title}</h3>
                  <p className="text-sm text-gray-600">
                    จาก: {displayDeal.seller.display_name}
                    {displayDeal.seller.seller_profile?.verified && (
                      <span className="ml-2 text-green-600">✓ ยืนยันตัวตนแล้ว</span>
                    )}
                  </p>
                </div>
                <DealStatusBadge status={displayDeal.status} />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(displayDeal.amount_satang)}
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">ℹ️ สิ่งสำคัญที่ต้องรู้</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>เงินยังไม่เข้าผู้ขาย จนกว่าคุณจะกดยืนยันรับของ</li>
                <li>หากสินค้ามีปัญหา คุณสามารถเปิดข้อพิพาทได้</li>
                <li>ระบบจะโอนเงินให้ผู้ขายอัตโนมัติหลัง 48 ชั่วโมง</li>
              </ul>
            </div>

            {/* QR Code or Payment Button */}
            {!payment && !qrImage ? (
              <Button 
                className="w-full" 
                size="lg" 
                onClick={createPayment}
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสร้าง QR...
                  </>
                ) : (
                  'สร้าง QR Code เพื่อชำระเงิน'
                )}
              </Button>
            ) : qrImage ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrImage} alt="PromptPay QR" className="w-64 h-64" />
                </div>
                <p className="text-center text-sm text-gray-600">
                  สแกน QR Code นี้เพื่อชำระเงิน
                </p>
                
                {/* Mock payment button for testing */}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2 text-center">
                    (ทดสอบ: จำลองการชำระเงิน)
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={mockPayment}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    จำลองการชำระเงินสำเร็จ
                  </Button>
                </div>
              </div>
            ) : null}

            {displayDeal.status === 'HOLD' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900 mb-1">ชำระเงินสำเร็จ!</h3>
                <p className="text-sm text-green-800">
                  เงินถูกพักไว้แล้ว รอคุณยืนยันรับสินค้า
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
