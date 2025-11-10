"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, StatusBadge } from "@thai-escrow/ui";
import type { DealStatusType } from "@thai-escrow/core";

export default function PayPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [deal, setDeal] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  useEffect(() => {
    fetchDealByToken();
  }, [token]);

  async function fetchDealByToken() {
    try {
      // In production, this would be a public endpoint
      const response = await fetch(`http://localhost:4000/api/v1/deals/by-token/${token}`);
      
      // For demo, we'll mock the deal data
      setDeal({
        id: "demo-deal-001",
        title: "iPhone 13 Pro มือสอง สภาพดี",
        amount_satang: 2500000,
        currency: "THB",
        status: "PENDING" as DealStatusType,
        seller: {
          display_name: "สมหญิง ผู้ขาย",
          seller_profile: {
            verified: true,
            reputation_score: 4.5,
          },
        },
      });
      setLoading(false);
    } catch (err) {
      setError("ไม่พบ Paylink นี้ หรือ Paylink หมดอายุแล้ว");
      setLoading(false);
    }
  }

  async function createPayment() {
    try {
      const response = await fetch("http://localhost:4000/api/v1/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paylink_token: token }),
      });

      const data = await response.json();
      if (data.success) {
        setQrDataUrl(data.qr_data_url);
      }
    } catch (err) {
      setError("ไม่สามารถสร้าง QR Code ได้");
    }
  }

  async function simulatePayment() {
    try {
      await fetch("http://localhost:4000/api/v1/payments/webhook/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_ref: "MOCK_REF_123",
          status: "success",
          signature: "mock_secret",
        }),
      });

      setPaymentStatus("paid");
      alert("✅ ชำระเงินสำเร็จ! เงินถูกพักไว้จนกว่าคุณจะกดยืนยันรับของ");
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>ชำระเงิน - Thai Escrow</CardTitle>
            <CardDescription>เงินจะถูกพักไว้จนกว่าคุณจะยืนยันรับของ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Deal Info */}
            <div className="border-b pb-4">
              <h2 className="font-semibold text-lg mb-2">{deal.title}</h2>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold text-blue-600">
                  ฿{(deal.amount_satang / 100).toLocaleString()}
                </span>
                <StatusBadge status={deal.status} />
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">ผู้ขาย</p>
              <div className="flex justify-between items-center">
                <span className="font-semibold">{deal.seller.display_name}</span>
                {deal.seller.seller_profile?.verified && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    ✓ Verified Seller
                  </span>
                )}
              </div>
              {deal.seller.seller_profile?.reputation_score && (
                <p className="text-sm text-gray-600 mt-1">
                  ⭐ {deal.seller.seller_profile.reputation_score}/5.0
                </p>
              )}
            </div>

            {/* Payment Method */}
            {paymentStatus === "pending" && !qrDataUrl && (
              <div>
                <Button onClick={createPayment} className="w-full" size="lg">
                  สร้าง QR Code PromptPay
                </Button>
              </div>
            )}

            {qrDataUrl && paymentStatus === "pending" && (
              <div className="text-center space-y-4">
                <p className="font-semibold">สแกน QR Code เพื่อชำระเงิน</p>
                <img
                  src={qrDataUrl}
                  alt="PromptPay QR Code"
                  className="mx-auto border-4 border-blue-500 rounded-lg"
                />
                <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-2">⚠️ เงินยังไม่เข้าผู้ขาย</p>
                  <p>
                    เงินจะถูกพักไว้จนกว่าคุณจะกดยืนยันรับของ
                    หรือระบบจะปล่อยเงินอัตโนมัติหลัง 48 ชั่วโมงหลังจัดส่งสำเร็จ
                  </p>
                </div>

                {/* Mock payment button for demo */}
                <Button onClick={simulatePayment} variant="outline" className="w-full">
                  🧪 [Demo] จำลองการชำระเงิน
                </Button>
              </div>
            )}

            {paymentStatus === "paid" && (
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <p className="text-2xl mb-2">✅ ชำระเงินสำเร็จ!</p>
                <p className="text-gray-600">
                  เงินถูกพักไว้แล้ว รอผู้ขายส่งของ คุณจะได้รับการแจ้งเตือนเมื่อมีการอัปเดต
                </p>
                <Button className="mt-4" onClick={() => window.location.href = "/buyer/deals"}>
                  ดูรายการซื้อของฉัน
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
