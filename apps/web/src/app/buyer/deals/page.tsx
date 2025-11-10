"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, Button, StatusBadge } from "@thai-escrow/ui";
import { Package, AlertCircle } from "lucide-react";

export default function BuyerDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    // Mock data
    setDeals([
      {
        id: "deal-hold-001",
        title: "MacBook Air M2 ใหม่กริ๊บ",
        amount_satang: 3800000,
        status: "HOLD",
        seller: {
          display_name: "สมหญิง ผู้ขาย",
          seller_profile: { verified: true },
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "deal-shipped-001",
        title: "AirPods Pro Gen 2",
        amount_satang: 890000,
        status: "SHIPPED",
        tracking_number: "TH1234567890TH",
        courier: "Kerry Express",
        seller: {
          display_name: "สมหญิง ผู้ขาย",
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "deal-dispute-001",
        title: "Samsung Galaxy S23 Ultra",
        amount_satang: 3200000,
        status: "DISPUTE",
        seller: {
          display_name: "ผู้ขายอื่น",
        },
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            🛡️ Thai Escrow
          </Link>
          <nav className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">หน้าแรก</Button>
            </Link>
            <Button variant="ghost">ออกจากระบบ</Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">รายการซื้อของฉัน</h1>

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
                    <p className="text-sm text-gray-600 mb-1">
                      ผู้ขาย: {deal.seller.display_name}
                      {deal.seller.seller_profile?.verified && (
                        <span className="ml-2 text-green-600">✓ Verified</span>
                      )}
                    </p>
                    {deal.tracking_number && (
                      <p className="text-sm text-gray-600">
                        <Package className="inline w-4 h-4 mr-1" />
                        Tracking: {deal.tracking_number} ({deal.courier})
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {deal.status === "SHIPPED" && (
                      <>
                        <Button size="sm">ยืนยันรับของแล้ว</Button>
                        <Button variant="destructive" size="sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          เปิด Dispute
                        </Button>
                      </>
                    )}
                    {deal.status === "DISPUTE" && (
                      <Link href={`/buyer/dispute/${deal.id}`}>
                        <Button variant="outline" size="sm">
                          ดู Dispute
                        </Button>
                      </Link>
                    )}
                    {deal.status === "HOLD" && (
                      <p className="text-sm text-gray-600">รอผู้ขายจัดส่ง</p>
                    )}
                  </div>
                </div>

                {deal.status === "HOLD" && (
                  <div className="mt-4 bg-yellow-50 p-3 rounded-lg text-sm">
                    <p className="font-semibold">⏳ เงินถูกพักไว้</p>
                    <p className="text-gray-700">รอผู้ขายจัดส่งสินค้า</p>
                  </div>
                )}

                {deal.status === "SHIPPED" && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm">
                    <p className="font-semibold">📦 สินค้าจัดส่งแล้ว</p>
                    <p className="text-gray-700">
                      กดยืนยันรับของเมื่อได้รับสินค้าแล้ว
                      หรือระบบจะปล่อยเงินอัตโนมัติภายใน 48 ชั่วโมง
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {deals.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <p>ยังไม่มีรายการซื้อ</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
