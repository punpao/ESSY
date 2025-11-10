"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@escrow/ui";
import { postJson } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

const roles = [
  { value: "buyer", label: "ผู้ซื้อ" },
  { value: "seller", label: "ผู้ขาย" }
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [message, setMessage] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleRequestOtp = async () => {
    try {
      await postJson("/auth/email/request", { email, role });
      setMessage("ส่งรหัส OTP ไปที่อีเมลแล้ว (ตรวจสอบกล่องจดหมาย / spam)");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const data = await postJson<{ token: string; user: any }>("/auth/email/verify", {
        email,
        code,
        role
      });
      setAuth(data.token, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        displayName: data.user.displayName
      });
      router.push(role === "seller" ? "/seller/dashboard" : "/buyer/deals");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const handleLineLogin = async () => {
    try {
      const data = await postJson<{ token: string; user: any }>("/auth/line/callback", {
        line_sub: `mock-line-${Date.now()}`,
        display_name: "LINE ผู้ใช้",
        email: email || `line-user-${Date.now()}@mock.line`,
        role
      });
      setAuth(data.token, {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        displayName: data.user.displayName
      });
      router.push("/seller/dashboard");
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>เข้าสู่ระบบ / สมัครสมาชิก</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <label className="block text-slate-600">อีเมล</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label className="block text-slate-600">บทบาท</label>
            <div className="mt-2 flex gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value as typeof role)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    role === r.value
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRequestOtp} disabled={!email}>
              ขอรหัส OTP ทางอีเมล
            </Button>
            <Button variant="secondary" onClick={handleLineLogin}>
              เข้าสู่ระบบด้วย LINE (จำลอง)
            </Button>
          </div>
          <div>
            <label className="block text-slate-600">กรอกรหัส OTP</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="6 หลัก"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <Button
              className="mt-3"
              onClick={handleVerifyOtp}
              disabled={code.length !== 6 || !email}
            >
              ยืนยัน OTP
            </Button>
          </div>

          {message ? <p className="text-xs text-slate-500">{message}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
