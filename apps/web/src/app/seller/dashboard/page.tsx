"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, StatusBadge } from "@thai-escrow/ui";
import { Plus, Package } from "lucide-react";

export default function SellerDashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Mock data for demo
    setProfile({
      verified: true,
      kyc_status: "verified",
      promptpay_id: "0812345678",
      reputation_score: 4.5,
    });

    setDeals([
      {
        id: "deal-pending-001",
        title: "iPhone 13 Pro มือสอง",
        amount_satang: 2500000,
        status: "PENDING",
        created_at: new Date().toISOString(),
        paylink_token: "paylink-pending-001",
      },
      {
        id: "deal-hold-001",
        title: "MacBook Air M2",
        amount_satang: 3800000,
        status: "HOLD",
        created_at: new Date().toISOString(),
        buyer: { display_name: "สมชาย ผู้ซื้อ" },
      },
      {
        id: "deal-shipped-001",
        title: "AirPods Pro Gen 2",
        amount_satang: 890000,
        status: "SHIPPED",
        tracking_number: "TH1234567890TH",
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            🛡️ Thai Escrow
          </Link>
          <nav className="flex gap-4">
            <Link href="/seller/kyc">
              <Button variant="ghost">KYC Verification</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">ออกจากระบบ</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>โปรไฟล์ผู้ขาย</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">สถานะ KYC</p>
                <p className="font-semibold">
                  {profile?.verified ? "✅ Verified Seller" : "⚠️ ยังไม่ยืนยันตัวตน"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reputation Score</p>
                <p className="font-semibold">⭐ {profile?.reputation_score || 0}/5.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">PromptPay ID</p>
                <p className="font-semibold">{profile?.promptpay_id || "ยังไม่ตั้งค่า"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">รายการขาย</h1>
          <Link href="/seller/deal/new">
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              สร้าง Paylink ใหม่
            </Button>
          </Link>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {deals.map((deal) => (
            <Card key={deal.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{deal.title}</h3>
                      <StatusBadge status={deal.status} />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      ฿{(deal.amount_satang / 100).toLocaleString()}
                    </p>
                    {deal.buyer && (
                      <p className="text-sm text-gray-600">ผู้ซื้อ: {deal.buyer.display_name}</p>
                    )}
                    {deal.tracking_number && (
                      <p className="text-sm text-gray-600">
                        <Package className="inline w-4 h-4 mr-1" />
                        Tracking: {deal.tracking_number}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {deal.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/pay/${deal.paylink_token}`;
                          navigator.clipboard.writeText(url);
                          alert("คัดลอก Paylink แล้ว!");
                        }}
                      >
                        คัดลอก Paylink
                      </Button>
                    )}
                    {deal.status === "HOLD" && (
                      <Link href={`/seller/deal/${deal.id}/ship`}>
                        <Button size="sm">เพิ่มเลขพัสดุ</Button>
                      </Link>
                    )}
                    <Link href={`/seller/deal/${deal.id}`}>
                      <Button variant="outline" size="sm">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {deals.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <p className="mb-4">ยังไม่มีรายการขาย</p>
                <Link href="/seller/deal/new">
                  <Button>สร้าง Paylink แรก</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
