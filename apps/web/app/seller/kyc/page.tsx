"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";

interface SellerProfileResponse {
  profile: {
    userId: string;
    verified: boolean;
    promptpayId: string;
    promptpayName: string;
    reputationScore: number;
    kycStatus: "unverified" | "pending" | "verified";
    selfieUrl?: string | null;
  } | null;
}

export default function SellerKycPage() {
  const [profile, setProfile] = useState<SellerProfileResponse["profile"]>(null);
  const [promptpayId, setPromptpayId] = useState("");
  const [promptpayName, setPromptpayName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getJson<SellerProfileResponse>("/seller/me");
        setProfile(data.profile);
        if (data.profile) {
          setPromptpayId(data.profile.promptpayId);
          setPromptpayName(data.profile.promptpayName);
          setSelfieUrl(data.profile.selfieUrl ?? "");
        }
      } catch (error) {
        setMessage((error as Error).message);
      }
    };
    void loadProfile();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const res = await postJson<SellerProfileResponse>("/seller/verify/basic", {
        promptpay_id: promptpayId,
        promptpay_name: promptpayName,
        selfie_url: selfieUrl,
        phone
      });
      setProfile(res.profile);
      setMessage("ส่งข้อมูลเรียบร้อย ทีมงานจะตรวจสอบภายใน 1 วันทำการ");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>สถานะผู้ขาย</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            สถานะ KYC:{" "}
            <span className="font-medium text-slate-900">
              {profile?.kycStatus ?? "ยังไม่ยื่น"}
            </span>
          </p>
          <p>
            PromptPay:{" "}
            {profile?.promptpayId ? (
              <>
                {profile.promptpayId} ({profile.promptpayName})
              </>
            ) : (
              "ยังไม่ตั้งค่า"
            )}
          </p>
          <p>
            คะแนนความน่าเชื่อถือ:{" "}
            {profile ? profile.reputationScore.toFixed(2) : "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ยื่นข้อมูลตรวจสอบ (PromptPay + Selfie)</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
            <div>
              <label className="block text-slate-600">PromptPay ID</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={promptpayId}
                onChange={(event) => setPromptpayId(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-600">ชื่อบัญชี PromptPay</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={promptpayName}
                onChange={(event) => setPromptpayName(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-600">ลิงก์รูปเซลฟี่ถือบัตรประชาชน</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={selfieUrl}
                onChange={(event) => setSelfieUrl(event.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="block text-slate-600">เบอร์โทรศัพท์ติดต่อ</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="081-xxx-xxxx"
              />
            </div>
            <Button type="submit">ส่งตรวจสอบ</Button>
            {message ? <p className="text-xs text-slate-500">{message}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
