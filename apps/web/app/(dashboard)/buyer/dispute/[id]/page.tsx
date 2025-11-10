'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, CardBody, CardHeader, EmptyState, Table, TableCell, TableHead, TableRow } from '@thai-escrow/ui';
import { useAuth } from '../../../../../lib/auth-context';
import { apiFetch } from '../../../../../lib/apiClient';
import Link from 'next/link';

type EvidenceKind = 'image' | 'chatlog' | 'other';

interface BuyerDisputeResponse {
  dispute: {
    id: string;
    status: 'OPEN' | 'NEED_MORE_INFO' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';
    reasonText: string;
    createdAt: string;
    resolutionNote?: string | null;
    deal: {
      id: string;
      title: string;
      status: string;
      amountSatang: number;
      paylinkToken: string;
    };
    evidence: Array<{
      id: string;
      kind: EvidenceKind;
      url: string;
      note?: string | null;
      createdAt: string;
    }>;
  };
}

export default function BuyerDisputeDetailPage({ params }: { params: { id: string } }) {
  const { token, user } = useAuth();
  if (user && user.role !== 'buyer') {
    return (
      <RoleWarning message="หน้านี้สำหรับผู้ซื้อเท่านั้น กรุณาเข้าสู่ระบบด้วยบัญชีผู้ซื้อ" />
    );
  }
  const queryClient = useQueryClient();
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind>('image');
  const [note, setNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-dispute', params.id],
    queryFn: () =>
      apiFetch<BuyerDisputeResponse>(`/buyer/disputes/${params.id}`, {
        token
      }),
    enabled: Boolean(token)
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/disputes/${params.id}/evidence`, {
        method: 'POST',
        token,
        body: {
          items: [
            {
              kind: evidenceKind,
              url: evidenceUrl,
              note: note || undefined
            }
          ]
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-dispute', params.id] });
      setEvidenceUrl('');
      setNote('');
    }
  });

  const dispute = data?.dispute;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">ข้อพิพาท</h1>
        <p className="text-sm text-slate-500">
          อัปโหลดหลักฐานเพื่อให้ทีมงานตัดสินได้รวดเร็วขึ้น
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">กำลังโหลด...</p>
      ) : dispute ? (
        <>
          <Card>
            <CardHeader
              title={dispute.deal.title}
              description={`สถานะข้อพิพาท: ${disputeStatusLabel(dispute.status)}`}
            />
            <CardBody className="space-y-3 text-sm text-slate-600">
              <p>เหตุผลที่เปิด: {dispute.reasonText}</p>
              <p>
                ยอดเงิน:{' '}
                {(dispute.deal.amountSatang / 100).toLocaleString('th-TH', {
                  style: 'currency',
                  currency: 'THB'
                })}
              </p>
              <Link
                className="text-blue-600 underline"
                href={`/pay/${dispute.deal.paylinkToken}`}
                target="_blank"
              >
                เปิดเพย์ลิงก์
              </Link>
              {dispute.resolutionNote ? (
                <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
                  สรุปจากทีมงาน: {dispute.resolutionNote}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="หลักฐานที่ส่งแล้ว" />
            <CardBody>
              {dispute.evidence.length === 0 ? (
                <EmptyState
                  title="ยังไม่มีหลักฐาน"
                  description="อัปโหลดภาพสลิป แชท หรือข้อมูลอื่น ๆ เพื่อช่วยการพิจารณา"
                />
              ) : (
                <Table>
                  <thead>
                    <TableRow>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                      <TableHead>เวลาอัปโหลด</TableHead>
                    </TableRow>
                  </thead>
                  <tbody>
                    {dispute.evidence.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{evidenceKindLabel(item.kind)}</TableCell>
                        <TableCell>
                          <a href={item.url} target="_blank" className="text-blue-600 underline">
                            {item.url}
                          </a>
                          {item.note ? <p className="text-xs text-slate-500">{item.note}</p> : null}
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="อัปโหลดหลักฐานเพิ่ม" />
            <CardBody>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  mutation.mutate();
                }}
              >
                <label className="block text-sm font-medium text-slate-700">
                  ลิงก์หลักฐาน
                  <input
                    required
                    value={evidenceUrl}
                    onChange={(event) => setEvidenceUrl(event.target.value)}
                    placeholder="https://example.com/proof.jpg"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  ประเภทหลักฐาน
                  <select
                    value={evidenceKind}
                    onChange={(event) => setEvidenceKind(event.target.value as EvidenceKind)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="image">รูปภาพ</option>
                    <option value="chatlog">ข้อความแชท</option>
                    <option value="other">อื่น ๆ</option>
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  หมายเหตุ (ไม่บังคับ)
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                <Button type="submit" disabled={mutation.isPending}>
                  อัปโหลดหลักฐาน
                </Button>
                {mutation.isError ? (
                  <p className="text-sm text-rose-600">
                    {(mutation.error as Error)?.message ?? 'เกิดข้อผิดพลาด'}
                  </p>
                ) : null}
                {mutation.isSuccess ? (
                  <p className="text-sm text-blue-600">
                    ส่งหลักฐานแล้ว ทีมงานจะอัปเดตสถานะให้เร็วที่สุด
                  </p>
                ) : null}
              </form>
            </CardBody>
          </Card>
        </>
      ) : (
        <EmptyState title="ไม่พบข้อพิพาท" description="ตรวจสอบลิงก์ว่าถูกต้องหรือไม่" />
      )}
    </div>
  );
}

const disputeStatusLabel = (
  status: 'OPEN' | 'NEED_MORE_INFO' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE'
) => {
  switch (status) {
    case 'OPEN':
      return 'รอทีมงานตรวจสอบ';
    case 'NEED_MORE_INFO':
      return 'ต้องการข้อมูลเพิ่มเติม';
    case 'RESOLVED_REFUND':
      return 'คืนเงินผู้ซื้อ';
    case 'RESOLVED_RELEASE':
      return 'ปล่อยเงินให้ผู้ขาย';
    default:
      return status;
  }
};

const evidenceKindLabel = (kind: EvidenceKind) => {
  switch (kind) {
    case 'image':
      return 'รูปภาพ';
    case 'chatlog':
      return 'หลักฐานแชท';
    case 'other':
      return 'อื่น ๆ';
    default:
      return kind;
  }
};

const RoleWarning = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
    {message}
  </div>
);
