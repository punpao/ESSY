'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, ApiError } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DealStatusBadge } from '@/components/deal-status-badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Package, TrendingUp, CheckCircle } from 'lucide-react'

export default function SellerDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const profileResult = await api.getSellerProfile()
      setProfile(profileResult.profile)
      
      // In real app, fetch deals from API
      setDeals([
        {
          id: '1',
          title: 'iPhone 13 Pro Max 256GB',
          amount_satang: 2500000,
          status: 'HOLD',
          created_at: new Date(),
        },
        {
          id: '2',
          title: 'MacBook Air M1',
          amount_satang: 3200000,
          status: 'SHIPPED',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ])
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">แดชบอร์ดผู้ขาย</h1>
              <p className="text-sm text-gray-600">
                {profile?.verified ? (
                  <span className="text-green-600">✓ ยืนยันตัวตนแล้ว</span>
                ) : (
                  <Link href="/seller/kyc" className="text-blue-600 hover:underline">
                    ยังไม่ยืนยันตัวตน (คลิกเพื่อยืนยัน)
                  </Link>
                )}
              </p>
            </div>
            <Link href="/seller/deal/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                สร้าง Paylink ใหม่
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">คะแนนความน่าเชื่อถือ</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.reputation_score || 0}/100</div>
              <p className="text-xs text-muted-foreground">
                จากการทำธุรกรรมทั้งหมด
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ดีลที่กำลังดำเนินการ</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deals.filter(d => ['HOLD', 'SHIPPED'].includes(d.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                รอจัดส่งหรือยืนยันรับของ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ดีลสำเร็จ</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deals.filter(d => d.status === 'RELEASED').length}
              </div>
              <p className="text-xs text-muted-foreground">
                โอนเงินให้แล้ว
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Deals List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการดีลทั้งหมด</CardTitle>
            <CardDescription>จัดการและติดตามสถานะดีลของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">ยังไม่มีดีล</p>
                <Link href="/seller/deal/new">
                  <Button>สร้าง Paylink แรก</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/seller/deal/${deal.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{deal.title}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(deal.created_at)}
                        </p>
                      </div>
                      <DealStatusBadge status={deal.status} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(deal.amount_satang)}
                      </span>
                      <Button variant="outline" size="sm">
                        ดูรายละเอียด →
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
