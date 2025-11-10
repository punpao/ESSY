"use client";

import { FormEvent, useEffect, useState } from "react";
import { AuthToolbar } from "../../../components/AuthToolbar";
import { apiRequest } from "../../../components/api-client";
import { Badge, Button, Card, CardContent, CardHeader } from "@thai-social-escrow/ui";

interface SellerProfile {
  promptpayName: string;
  promptpayId: string;
  verified: boolean;
  kycStatus: string;
  reputationScore: number;
}

export default function SellerKycPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [promptpayId, setPromptpayId] = useState("");
  const [promptpayName, setPromptpayName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [message, setMessage] = useState<string>("");

  const loadProfile = async () => {
    try {
      const data = await apiRequest<{ seller: { sellerProfile: SellerProfile | null } }>("/seller/me");
      setProfile(data.seller.sellerProfile ?? null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest("/seller/verify/basic", {
        method: "POST",
        body: { promptpayId, promptpayName, selfieUrl }
      });
      setMessage("ส่งข้อมูล KYC แล้ว ทีมจะตรวจสอบภายใน 24 ชั่วโมง");
      loadProfile();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "ส่งข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-6">
      <AuthToolbar />
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold text-emerald-700">ยืนยันตัวตนผู้ขาย</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <p>PromptPay: {profile.promptpayName} ({profile.promptpayId})</p>
                  <p>คะแนนความน่าเชื่อถือ: {(profile.reputationScore * 100).toFixed(0)} %</p>
                </div>
                <Badge tone={profile.verified ? "RELEASED" : profile.kycStatus === "pending" ? "PENDING" : "DISPUTE"}>
                  {profile.verified ? "Verified Seller" : profile.kycStatus === "pending" ? "รอตรวจสอบ" : "ยังไม่ยืนยัน"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">ยังไม่ได้ยืนยันตัวตน กรอกข้อมูลเพื่อรับตรา Verified Seller</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600">PromptPay ID</label>
              <input
                required
                value={promptpayId}
                onChange={(e) => setPromptpayId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">ชื่อที่แสดงใน PromptPay</label>
              <input
                required
                value={promptpayName}
                onChange={(e) => setPromptpayName(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">ลิงก์รูปเซลฟี่ (จำลองการตรวจสอบ)</label>
              <input
                value={selfieUrl}
                onChange={(e) => setSelfieUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit">ส่งข้อมูลยืนยันตัวตน</Button>
          </form>
          {message && <div className="text-sm text-emerald-700">{message}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
