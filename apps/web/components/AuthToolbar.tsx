"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader } from "@thai-social-escrow/ui";
import { getApiBase } from "./api-client";

export function AuthToolbar() {
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem("promptHoldToken");
    if (stored) {
      setToken(stored);
    }
  }, []);

  const saveToken = () => {
    window.localStorage.setItem("promptHoldToken", token);
    setStatus("บันทึกโทเค็นเรียบร้อย");
  };

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardHeader>
        <div className="text-sm font-semibold text-emerald-700">เข้าสู่ระบบ (ชั่วคราว)</div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>
          ใช้ LINE Login หรือ Email OTP ผ่าน API เพื่อรับ JWT แล้ววางในช่องนี้ โทเค็นจะถูกเก็บใน{" "}
          <code>localStorage.promptHoldToken</code> เพื่อเรียก API อื่น ๆ
        </p>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="JWT Token"
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <Button type="button" onClick={saveToken}>
            บันทึกโทเค็น
          </Button>
        </div>
        {status && <div className="text-xs text-emerald-600">{status}</div>}
        <div className="text-xs text-slate-500">
          API Base: <code>{getApiBase()}</code>
        </div>
      </CardContent>
    </Card>
  );
}
