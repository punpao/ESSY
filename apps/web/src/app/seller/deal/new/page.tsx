'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function NewDealPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    buyer_note: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.title || !formData.amount) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const amount_satang = Math.round(parseFloat(formData.amount) * 100)
      
      const result = await api.createDeal({
        title: formData.title,
        amount_satang,
        buyer_note: formData.buyer_note || undefined,
      })
      
      toast({
        title: 'สร้าง Paylink สำเร็จ!',
        description: 'คัดลอกลิงก์ไปแชร์ให้ผู้ซื้อได้เลย',
      })
      
      // Show paylink URL
      setTimeout(() => {
        router.push(`/seller/deal/${result.deal.id}?paylink=${encodeURIComponent(result.paylink_url)}`)
      }, 1000)
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof ApiError ? error.message : 'ไม่สามารถสร้างดีลได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">สร้าง Paylink ใหม่</CardTitle>
            <CardDescription>
              สร้างลิงก์ชำระเงินและแชร์ให้ผู้ซื้อผ่าน LINE, Facebook, Instagram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">ชื่อสินค้า *</Label>
                <Input
                  id="title"
                  placeholder="เช่น: iPhone 13 Pro Max 256GB มือสอง"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">ราคา (บาท) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="25000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer_note">หมายเหตุถึงผู้ซื้อ (ถ้ามี)</Label>
                <Input
                  id="buyer_note"
                  placeholder="เช่น: รับสินค้าที่กรุงเทพฯเท่านั้น"
                  value={formData.buyer_note}
                  onChange={(e) => setFormData({ ...formData, buyer_note: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <h4 className="font-semibold text-blue-900 mb-2">💡 เคล็ดลับ</h4>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>ใส่รายละเอียดสินค้าให้ชัดเจน</li>
                  <li>แนบรูปภาพในแชทก่อนส่งลิงก์</li>
                  <li>ตรวจสอบราคาให้ถูกต้องก่อนแชร์</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  'สร้าง Paylink'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
