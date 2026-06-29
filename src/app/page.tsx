"use client";

import Link from "next/link";

import { useProfile } from "@/components/profile/useProfile";

/**
 * Home / Onboarding screen (spec section 10, screen 1): a short explanation
 * of what the app does + a single start button. Replaces the unmodified
 * create-next-app placeholder that shipped with the project scaffold.
 *
 * The primary CTA depends on whether the user already has data: a brand
 * new visitor is pushed to `/cashflow` to start entering data, while a
 * returning user (this app persists to localStorage) is taken straight to
 * `/dashboard` to see their existing health check, with a smaller secondary
 * link to edit their cash flow.
 */
export default function Home() {
  const { profile, isLoaded } = useProfile();

  // Gate on isLoaded the same way every other page does, to avoid a
  // hydration flash of the wrong CTA (e.g. "เริ่มต้นใช้งาน" flashing before
  // swapping to "ดูสุขภาพการเงินของคุณ" once localStorage is read).
  if (!isLoaded) {
    return null;
  }

  const hasData = profile.items.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-[772px] lg:max-w-[1080px] flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-10 text-ink sm:text-4xl sm:leading-[48px]">
          เช็กสุขภาพการเงินของคุณ ใน Bear-tung
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-7 text-ink-muted">
          กรอกรายรับ รายจ่าย และหนี้สินของคุณ แล้ว Bear-tung จะช่วยวิเคราะห์ด้วยกราฟและอัตราส่วนสำคัญ
          พร้อมคะแนนสุขภาพการเงิน ดูแนวโน้ม 5 ปีข้างหน้า ประเมินความสามารถซื้อบ้านตามเกณฑ์ธนาคารไทย
          และส่งออกผลลัพธ์เป็นไฟล์ Excel ได้ทันที —{" "}
          <span className="block font-semibold text-ink">ข้อมูลทั้งหมดเก็บไว้ในเครื่องของคุณเท่านั้น</span>
        </p>
      </div>

      {hasData ? (
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-button bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
          >
            ดูสุขภาพการเงินของคุณ
          </Link>
          <Link
            href="/cashflow"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            แก้ไข Cash Flow
          </Link>
        </div>
      ) : (
        <Link
          href="/cashflow"
          className="inline-flex h-12 items-center justify-center rounded-button bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
        >
          เริ่มต้นใช้งาน
        </Link>
      )}
    </main>
  );
}
