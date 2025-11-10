'use client';

import { useEffect, useState } from "react";
import { useAuth } from "../../../components/auth-provider";
import { getSellerProfile, submitSellerKyc } from "../../../lib/api";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@escrow/ui";

type SellerProfile = {
  promptPayId: string;
  promptPayName: string;
  verified: boolean;
  kycStatus: "unverified" | "pending" | "verified";
  reputationScore: number;
  kycSelfieUrl?: string | null;
};

export default function SellerKycPage() {
  const auth = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    promptPayId: "",
    promptPayName: "",
    selfieUrl: ""
  });
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token || auth.user?.role !== "seller") return;
    setLoading(true);
    getSellerProfile(auth.token)
      .then((res) => {
        setProfile(res.profile as SellerProfile);
        setForm({
          promptPayId: res.profile.promptPayId ?? "",
          promptPayName: res.profile.promptPayName ?? "",
          selfieUrl: res.profile.kycSelfieUrl ?? ""
        });
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [auth.token, auth.user]);

  if (!auth.token) {
    return (
      <div className="mx-auto mt-20 max-w-3xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบในฐานะผู้ขาย</h1>
        <p className="mt-3 text-sm text-slate-600">
          เพื่อยืนยันตัวตนและรับ Verified Seller badge กรุณาเข้าสู่ระบบก่อน
        </p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.promptPayId || !form.promptPayName || !form.selfieUrl) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);
    try {
      const res = await submitSellerKyc(auth.token!, {
        promptPayId: form.promptPayId,
        promptPayName: form.promptPayName,
        selfieUrl: form.selfieUrl
      });
      setProfile(res.profile);
      setSuccess("ส่งข้อมูลยืนยันเรียบร้อย ทีมงานจะตรวจสอบภายใน 24 ชั่วโมง");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel =
    profile?.kycStatus === "verified"
      ? "ผ่านการยืนยันแล้ว"
      : profile?.kycStatus === "pending"
        ? "กำลังตรวจสอบ (ภายใน 24 ชม.)"
        : "ยังไม่ยืนยัน";

  return (
    <div className="mx-auto mt-10 max-w-3xl px-6 pb-16">
      <Card>
        <CardHeader>
          <CardTitle>ยืนยันตัวตนผู้ขาย (PromptPay + Selfie)</CardTitle>
          <CardDescription>
            เพื่อแสดง Badge “Verified Seller” และเพิ่มความมั่นใจให้ผู้ซื้อ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              สถานะปัจจุบัน:{" "}
              <span className="font-semibold text-slate-900">
                {profile ? statusLabel : "ยังไม่ส่งข้อมูล"}
              </span>
            </p>
            {profile?.verified && (
              <p className="mt-2 text-sm text-brand">
                ✅ Verified Seller • คะแนนความน่าเชื่อถือ {profile.reputationScore.toFixed(2)}
              </p>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                PromptPay ID (เบอร์โทร / เลขบัตรประชาชน)
              </label>
              <input
                value={form.promptPayId}
                onChange={(e) => setForm((prev) => ({ ...prev, promptPayId: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ชื่อที่ปรากฏบน PromptPay
              </label>
              <input
                value={form.promptPayName}
                onChange={(e) => setForm((prev) => ({ ...prev, promptPayName: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ลิงก์รูปถ่ายเซลฟี่พร้อมบัตร (mock)
              </label>
              <input
                value={form.selfieUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, selfieUrl: e.target.value }))}
                placeholder="https://..."
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
              />
              <p className="mt-1 text-xs text-slate-500">
                สำหรับเดโม สามารถใส่ลิงก์ placeholder เช่น https://placehold.co/400x400
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "กำลังส่ง..." : "ส่งข้อมูลตรวจสอบ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
