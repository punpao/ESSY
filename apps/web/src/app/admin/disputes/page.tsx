'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, ApiError } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function AdminDisputesPage() {
  const { toast } = useToast()
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDisputes()
  }, [])

  async function loadDisputes() {
    try {
      const result = await api.getAdminDisputes({ status: 'OPEN' })
      setDisputes(result.disputes)
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof ApiError ? error.message : 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function resolveDispute(disputeId: string, resolution: string) {
    try {
      await api.resolveDispute(disputeId, {
        resolution,
        resolution_note: `Admin resolved: ${resolution}`,
      })
      
      toast({
        title: 'แก้ไขข้อพิพาทสำเร็จ',
        description: resolution === 'RESOLVED_REFUND' ? 'คืนเงินให้ผู้ซื้อแล้ว' : 'โอนเงินให้ผู้ขายแล้ว',
      })
      
      loadDisputes()
    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error instanceof ApiError ? error.message : 'ไม่สามารถแก้ไขข้อพิพาทได้',
        variant: 'destructive',
      })
    }
  }

  function getSLABadge(hours: number) {
    if (hours > 72) return <Badge variant="destructive">เกินกำหนด ({Math.round(hours)}h)</Badge>
    if (hours > 48) return <Badge className="bg-orange-500">เตือน ({Math.round(hours)}h)</Badge>
    if (hours > 24) return <Badge className="bg-yellow-500">ใกล้ครบ ({Math.round(hours)}h)</Badge>
    return <Badge variant="outline">ปกติ ({Math.round(hours)}h)</Badge>
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">จัดการข้อพิพาท (Admin)</h1>
          <p className="text-sm text-gray-600">แก้ไขข้อพิพาทภายใน 24-72 ชั่วโมง</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>ข้อพิพาทที่รออนุมัติ</CardTitle>
            <CardDescription>
              จำนวนทั้งหมด: {disputes.length} รายการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {disputes.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">ไม่มีข้อพิพาทที่รออนุมัติ</p>
              </div>
            ) : (
              <div className="space-y-6">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border rounded-lg p-6 space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{dispute.deal.title}</h3>
                        <p className="text-sm text-gray-600">
                          ดีล ID: {dispute.deal.id.slice(0, 8)}...
                        </p>
                      </div>
                      {getSLABadge(dispute.hours_since_created || 0)}
                    </div>

                    {/* Dispute Info */}
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900">
                            เหตุผล: {dispute.reason === 'not_received' ? 'ยังไม่ได้รับสินค้า' : dispute.reason === 'not_as_described' ? 'สินค้าไม่ตรงปก' : 'อื่นๆ'}
                          </p>
                          <p className="text-sm text-red-800 mt-1">{dispute.reason_text}</p>
                        </div>
                      </div>
                    </div>

                    {/* Deal Details */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">ผู้ซื้อ</p>
                        <p className="font-semibold">{dispute.deal.buyer?.display_name}</p>
                        <p className="text-xs text-gray-500">{dispute.deal.buyer?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">ผู้ขาย</p>
                        <p className="font-semibold">{dispute.deal.seller?.display_name}</p>
                        <p className="text-xs text-gray-500">{dispute.deal.seller?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">ยอดเงิน</p>
                        <p className="font-semibold text-lg">{formatCurrency(dispute.deal.amount_satang)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">เปิดข้อพิพาทเมื่อ</p>
                        <p className="font-semibold">{formatDate(dispute.created_at)}</p>
                      </div>
                    </div>

                    {/* Evidence */}
                    {dispute.evidence && dispute.evidence.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">หลักฐาน ({dispute.evidence.length})</p>
                        <div className="space-y-2">
                          {dispute.evidence.map((ev: any) => (
                            <div key={ev.id} className="text-sm border rounded p-2">
                              <p className="font-semibold">{ev.kind}</p>
                              <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                {ev.url}
                              </a>
                              {ev.note && <p className="text-gray-600 text-xs mt-1">{ev.note}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => resolveDispute(dispute.id, 'RESOLVED_REFUND')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        คืนเงินให้ผู้ซื้อ
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => resolveDispute(dispute.id, 'RESOLVED_RELEASE')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        โอนเงินให้ผู้ขาย
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
