'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@essy/ui';
import Link from 'next/link';

export default function DealSuccessPage() {
  const searchParams = useSearchParams();
  const paylinkUrl = searchParams.get('url');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-4">สร้าง Paylink สำเร็จ!</h1>
        {paylinkUrl && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">ลิงก์ Paylink:</p>
            <div className="bg-gray-100 p-3 rounded break-all text-sm">
              {paylinkUrl}
            </div>
            <Button
              onClick={() => navigator.clipboard.writeText(paylinkUrl)}
              className="mt-2"
              size="sm"
            >
              คัดลอกลิงก์
            </Button>
          </div>
        )}
        <Link href="/seller/dashboard">
          <Button>กลับไปแดชบอร์ด</Button>
        </Link>
      </div>
    </div>
  );
}
