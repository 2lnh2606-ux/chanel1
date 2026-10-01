/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  GraduationCap,
  Sparkles,
  Database,
  RefreshCw,
} from 'lucide-react';
import { StepId } from './StepNavigation';

interface HeaderProps {
  onLoadSample: () => void;
  savedCourseCount: number;
  onGoToComparison: () => void;
  onResetAll: () => void;
  hasCurrentData: boolean;
  currentStep?: StepId;
  onSelectStep?: (step: StepId) => void;
  hasCalculatedResult?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  savedCourseCount,
  onGoToComparison,
  onResetAll,
  hasCurrentData,
  currentStep,
  onSelectStep,
  hasCalculatedResult,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Zone 1: 브랜드 타이틀 워드마크 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onSelectStep?.('step1_upload');
              }}
              className="text-base font-bold text-white tracking-tight hover:text-red-400 transition-colors whitespace-nowrap"
            >
              과정별 만족도 분석기
            </a>
          </div>

          {/* Zone 2: 빠른 스텝 텍스트 네비게이션 */}
          {onSelectStep && (
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
              <button
                type="button"
                onClick={() => onSelectStep('step1_upload')}
                className={`transition-colors hover:text-white cursor-pointer ${
                  currentStep === 'step1_upload'
                    ? 'text-red-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                ① 엑셀 올리기 & 열 지정
              </button>
              <button
                type="button"
                onClick={() => hasCalculatedResult && onSelectStep('step2_results')}
                disabled={!hasCalculatedResult}
                className={`transition-colors cursor-pointer ${
                  currentStep === 'step2_results'
                    ? 'text-emerald-400 font-bold'
                    : hasCalculatedResult
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                ② 결과 확인 및 보고서
              </button>
              <button
                type="button"
                onClick={() => onSelectStep('step3_comparison')}
                className={`transition-colors hover:text-white cursor-pointer ${
                  currentStep === 'step3_comparison'
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                ③ 과정 간 비교·누적 관리
              </button>
            </nav>
          )}

          {/* Zone 3: 주요 액션 버튼군 */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
              title="과정 문항 8개, 교수 3명, 30명 응답 샘플 데이터를 즉시 로드합니다"
            >
              <Sparkles className="w-3.5 h-3.5 text-red-200" />
              <span>체험 샘플</span>
            </button>

            <button
              onClick={onGoToComparison}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>누적 ({savedCourseCount})</span>
            </button>

            {hasCurrentData && (
              <button
                onClick={onResetAll}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="현재 입력 중인 데이터를 초기화하고 처음으로 돌아갑니다"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>새 파일</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

