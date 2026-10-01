/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileSpreadsheet, BarChart2, Layers, CheckCircle2 } from 'lucide-react';

export type StepId = 'step1_upload' | 'step2_results' | 'step3_comparison';

interface StepNavigationProps {
  currentStep: StepId;
  onSelectStep: (step: StepId) => void;
  hasCalculatedResult: boolean;
  savedCourseCount: number;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  onSelectStep,
  hasCalculatedResult,
  savedCourseCount,
}) => {
  const steps = [
    {
      id: 'step1_upload' as StepId,
      number: '①',
      title: '엑셀 올리기 & 열 구분 지정',
      desc: '설문 파일 업로드 및 문항 유형 자동 추정/설정',
      icon: FileSpreadsheet,
      stripeColor: 'border-l-red-600',
      activeBg: 'bg-red-50/70 border-red-300 ring-2 ring-red-500/20',
      inactiveBg: 'bg-white hover:bg-slate-50 border-slate-200',
      badgeColor: 'bg-red-100 text-red-700',
      iconColor: 'text-red-600',
      accessible: true,
      ready: true,
    },
    {
      id: 'step2_results' as StepId,
      number: '②',
      title: '결과 확인 및 분석 보고서',
      desc: '과정·교수별 평균, 순위, 응답자별 점수, 엑셀 다운',
      icon: BarChart2,
      stripeColor: 'border-l-emerald-600',
      activeBg: 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20',
      inactiveBg: 'bg-white hover:bg-slate-50 border-slate-200',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      iconColor: 'text-emerald-600',
      accessible: hasCalculatedResult,
      ready: hasCalculatedResult,
    },
    {
      id: 'step3_comparison' as StepId,
      number: '③',
      title: '과정 간 비교 및 누적 관리',
      desc: '다개년 과정 누적 저장, 비교 매트릭스, 차트 및 백업',
      icon: Layers,
      stripeColor: 'border-l-amber-600',
      activeBg: 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20',
      inactiveBg: 'bg-white hover:bg-slate-50 border-slate-200',
      badgeColor: 'bg-amber-100 text-amber-800',
      iconColor: 'text-amber-600',
      accessible: true, // 누적 저장소가 있을 수 있으므로 접근 가능
      ready: savedCourseCount > 0,
    },
  ];

  return (
    <nav className="mb-6" aria-label="3단계 작업 흐름">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {steps.map((s) => {
          const isActive = currentStep === s.id;
          const Icon = s.icon;

          return (
            <button
              key={s.id}
              onClick={() => {
                if (s.accessible) {
                  onSelectStep(s.id);
                }
              }}
              disabled={!s.accessible}
              className={`text-left p-4 rounded-xl border-l-[6px] ${s.stripeColor} border transition-all duration-200 shadow-2xs relative flex flex-col justify-between cursor-pointer ${
                isActive
                  ? s.activeBg
                  : !s.accessible
                  ? 'bg-slate-50/80 border-slate-200 opacity-60 cursor-not-allowed'
                  : s.inactiveBg
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${s.badgeColor}`}
                  >
                    {s.number}
                  </span>
                  <span className="font-bold text-slate-900 text-sm tracking-tight">
                    {s.title}
                  </span>
                </div>
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive ? 'bg-white shadow-2xs' : 'bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                {s.desc}
              </p>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                {s.id === 'step1_upload' ? (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    {isActive ? '● 현재 작성 중' : '파일 변경 가능'}
                  </span>
                ) : s.id === 'step2_results' ? (
                  hasCalculatedResult ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 분석 완료
                    </span>
                  ) : (
                    <span className="text-slate-400">1단계 파일 필요</span>
                  )
                ) : (
                  <span className="text-amber-700 font-medium">
                    누적 보관 {savedCourseCount}건
                  </span>
                )}

                {isActive && (
                  <span className="text-[11px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    선택됨
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
