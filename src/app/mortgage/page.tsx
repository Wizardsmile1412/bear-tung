"use client";

import { useState } from "react";
import Link from "next/link";

import { DEFAULT_DSR_LIMIT, DEFAULT_INTEREST_RATE_PERCENT, DEFAULT_LOAN_TERM_YEARS } from "@/domain/config/defaults";
import { MonthKey } from "@/domain/model/MonthKey";
import { Money } from "@/domain/model/Money";
import { MortgageInput } from "@/domain/mortgage/MortgageService";

import { useProfile } from "@/components/profile/useProfile";
import { useProjectionSeries } from "@/components/health/useProjectionSeries";
import { MonthSlider } from "@/components/health/MonthSlider";
import { AssumptionPanel } from "@/components/mortgage/AssumptionPanel";
import { CoBorrowerSection } from "@/components/mortgage/CoBorrowerSection";
import { MortgageInputForm } from "@/components/mortgage/MortgageInputForm";
import { MortgageResultCard } from "@/components/mortgage/MortgageResultCard";
import { useCoBorrower, useMortgage } from "@/components/mortgage/useMortgage";

export default function MortgagePage() {
  const { profile, isLoaded: profileLoaded } = useProfile();
  const { series, isLoaded: seriesLoaded } = useProjectionSeries();

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [homePrice, setHomePrice] = useState(0);
  const [homeOrder, setHomeOrder] = useState<1 | 2 | 3>(1);
  const [firstHomePaidAtLeastTwoYears, setFirstHomePaidAtLeastTwoYears] = useState(false);
  const [borrowerAge, setBorrowerAge] = useState(0);
  const [downPaymentAvailable, setDownPaymentAvailable] = useState(() => profile.assets.savings);

  const [interestRatePercent, setInterestRatePercent] = useState(DEFAULT_INTEREST_RATE_PERCENT);
  const [loanTermYears, setLoanTermYears] = useState(DEFAULT_LOAN_TERM_YEARS);
  const [dsrLimitPercent, setDsrLimitPercent] = useState(DEFAULT_DSR_LIMIT * 100);

  const [coBorrowerEnabled, setCoBorrowerEnabled] = useState(false);
  const [coDebt, setCoDebt] = useState(0);
  const [coIncomeProvided, setCoIncomeProvided] = useState<number | undefined>(undefined);

  if (!profileLoaded || !seriesLoaded) {
    return null;
  }

  const hasInput = homePrice > 0 && borrowerAge > 0;
  const selectedEntry = series[selectedIndex];

  return (
    <main className="mx-auto flex w-full max-w-[772px] flex-col gap-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold text-ink">ประเมินสินเชื่อบ้าน</h1>
        <p className="mt-1 text-base text-ink-muted">ดูว่าคุณสามารถซื้อบ้านราคานี้ได้หรือไม่ ตามเกณฑ์ของธนาคารไทย</p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover">
          ← กลับไปดูสุขภาพการเงิน
        </Link>
      </header>

      {profile.items.length === 0 ? (
        <div className="rounded-card border border-dashed border-outline bg-surface px-6 py-12 text-center">
          <p className="text-base text-ink-muted">ยังไม่มีข้อมูล — เริ่มกรอก Cash Flow ของคุณ</p>
          <Link
            href="/cashflow"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-[12px] bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            เริ่มกรอก Cash Flow
          </Link>
        </div>
      ) : (
        <MortgagePageContent
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          selectedEntry={selectedEntry}
          months={series.map((entry) => entry.month)}
          homePrice={homePrice}
          setHomePrice={setHomePrice}
          homeOrder={homeOrder}
          setHomeOrder={setHomeOrder}
          firstHomePaidAtLeastTwoYears={firstHomePaidAtLeastTwoYears}
          setFirstHomePaidAtLeastTwoYears={setFirstHomePaidAtLeastTwoYears}
          borrowerAge={borrowerAge}
          setBorrowerAge={setBorrowerAge}
          downPaymentAvailable={downPaymentAvailable}
          setDownPaymentAvailable={setDownPaymentAvailable}
          interestRatePercent={interestRatePercent}
          setInterestRatePercent={setInterestRatePercent}
          loanTermYears={loanTermYears}
          setLoanTermYears={setLoanTermYears}
          dsrLimitPercent={dsrLimitPercent}
          setDsrLimitPercent={setDsrLimitPercent}
          coBorrowerEnabled={coBorrowerEnabled}
          setCoBorrowerEnabled={setCoBorrowerEnabled}
          coDebt={coDebt}
          setCoDebt={setCoDebt}
          coIncomeProvided={coIncomeProvided}
          setCoIncomeProvided={setCoIncomeProvided}
          hasInput={hasInput}
        />
      )}
    </main>
  );
}

interface MortgagePageContentProps {
  selectedIndex: number;
  setSelectedIndex(index: number): void;
  selectedEntry: { month: string; totalIncome: number; totalDebt: number };
  months: string[];
  homePrice: number;
  setHomePrice(value: number): void;
  homeOrder: 1 | 2 | 3;
  setHomeOrder(value: 1 | 2 | 3): void;
  firstHomePaidAtLeastTwoYears: boolean;
  setFirstHomePaidAtLeastTwoYears(value: boolean): void;
  borrowerAge: number;
  setBorrowerAge(value: number): void;
  downPaymentAvailable: number;
  setDownPaymentAvailable(value: number): void;
  interestRatePercent: number;
  setInterestRatePercent(value: number): void;
  loanTermYears: number;
  setLoanTermYears(value: number): void;
  dsrLimitPercent: number;
  setDsrLimitPercent(value: number): void;
  coBorrowerEnabled: boolean;
  setCoBorrowerEnabled(value: boolean): void;
  coDebt: number;
  setCoDebt(value: number): void;
  coIncomeProvided: number | undefined;
  setCoIncomeProvided(value: number | undefined): void;
  hasInput: boolean;
}

/**
 * Split out from the page component so `useMortgage`/`useCoBorrower` are
 * only ever called when `hasInput` is true (the "Guard" requirement) — a
 * conditionally-skipped hook call would break the Rules of Hooks if it
 * lived directly in `MortgagePage`'s render body, so the guard branches at
 * this component-selection level instead.
 */
function MortgagePageContent(props: MortgagePageContentProps) {
  const monthlyIncome = props.selectedEntry.totalIncome;
  const existingDebt = props.selectedEntry.totalDebt;

  return (
    <div className="flex flex-col gap-8">
      <MonthSlider
        months={props.months}
        selectedIndex={props.selectedIndex}
        onChange={props.setSelectedIndex}
        ariaLabel="เลือกเดือนที่ใช้ประเมินสินเชื่อ"
      />

      <MortgageInputForm
        homePrice={props.homePrice}
        onHomePriceChange={props.setHomePrice}
        homeOrder={props.homeOrder}
        onHomeOrderChange={props.setHomeOrder}
        firstHomePaidAtLeastTwoYears={props.firstHomePaidAtLeastTwoYears}
        onFirstHomePaidAtLeastTwoYearsChange={props.setFirstHomePaidAtLeastTwoYears}
        borrowerAge={props.borrowerAge}
        onBorrowerAgeChange={props.setBorrowerAge}
        downPaymentAvailable={props.downPaymentAvailable}
        onDownPaymentAvailableChange={props.setDownPaymentAvailable}
      />

      <section className="rounded-card border border-outline bg-surface p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <h2 className="text-xl font-semibold text-ink">รายได้และหนี้ปัจจุบัน (จาก Cash Flow)</h2>
        <p className="mt-2 text-sm text-ink-muted">
          รายได้ต่อเดือน (จาก Cash Flow ของเดือนที่ประเมิน): {Money.formatWithUnit(monthlyIncome)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          หนี้ปัจจุบันต่อเดือน (จาก Cash Flow ของเดือนที่ประเมิน): {Money.formatWithUnit(existingDebt)}
        </p>
      </section>

      {props.hasInput ? (
        <MortgageEvaluation {...props} monthlyIncome={monthlyIncome} existingDebt={existingDebt} />
      ) : (
        <>
          <AssumptionPanel
            interestRatePercent={props.interestRatePercent}
            onInterestRatePercentChange={props.setInterestRatePercent}
            loanTermYears={props.loanTermYears}
            onLoanTermYearsChange={props.setLoanTermYears}
            dsrLimitPercent={props.dsrLimitPercent}
            onDsrLimitPercentChange={props.setDsrLimitPercent}
            ltvPolicyName=""
          />
          <p className="text-base text-ink-muted">กรอกราคาบ้านและอายุผู้กู้เพื่อดูผลการประเมิน</p>
        </>
      )}
    </div>
  );
}

interface MortgageEvaluationProps extends MortgagePageContentProps {
  monthlyIncome: number;
  existingDebt: number;
}

/**
 * Only mounted when `hasInput` is true — guarantees `useMortgage`/
 * `useCoBorrower` never run against a degenerate zero-based input and never
 * render a result that would look real but isn't.
 */
function MortgageEvaluation(props: MortgageEvaluationProps) {
  const assessmentDate = MonthKey.parse(props.selectedEntry.month).toDate();

  const mortgageInput: MortgageInput = {
    homePrice: props.homePrice,
    homeOrder: props.homeOrder,
    firstHomePaidAtLeastTwoYears: props.homeOrder === 2 ? props.firstHomePaidAtLeastTwoYears : undefined,
    borrowerAge: props.borrowerAge,
    interestRatePercent: props.interestRatePercent,
    loanTermYears: props.loanTermYears,
    downPaymentAvailable: props.downPaymentAvailable,
    monthlyIncome: props.monthlyIncome,
    existingDebt: props.existingDebt,
    dsrLimit: props.dsrLimitPercent / 100,
    assessmentDate,
  };

  const mortgageResult = useMortgage(mortgageInput);

  const coBorrowerResult = useCoBorrower(mortgageResult, {
    homePrice: props.homePrice,
    downPaymentAvailable: props.downPaymentAvailable,
    userIncome: props.monthlyIncome,
    userDebt: props.existingDebt,
    coDebt: props.coDebt,
    dsrLimit: props.dsrLimitPercent / 100,
    coIncomeProvided: props.coIncomeProvided,
  });

  return (
    <>
      <AssumptionPanel
        interestRatePercent={props.interestRatePercent}
        onInterestRatePercentChange={props.setInterestRatePercent}
        loanTermYears={props.loanTermYears}
        onLoanTermYearsChange={props.setLoanTermYears}
        dsrLimitPercent={props.dsrLimitPercent}
        onDsrLimitPercentChange={props.setDsrLimitPercent}
        ltvPolicyName={mortgageResult.ltvPolicyName}
      />

      <MortgageResultCard result={mortgageResult} downPaymentAvailable={props.downPaymentAvailable} />

      <CoBorrowerSection
        enabled={props.coBorrowerEnabled}
        onEnabledChange={props.setCoBorrowerEnabled}
        coDebt={props.coDebt}
        onCoDebtChange={props.setCoDebt}
        coIncomeProvided={props.coIncomeProvided}
        onCoIncomeProvidedChange={props.setCoIncomeProvided}
        result={props.coBorrowerEnabled ? coBorrowerResult : null}
      />
    </>
  );
}
