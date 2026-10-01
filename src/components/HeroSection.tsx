/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  Layers,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  TrendingUp,
  Award,
  CheckCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HeroSectionProps {
  onLoadSample: () => void;
  onTriggerUpload: () => void;
  onGoToComparison: () => void;
  savedCourseCount: number;
  hasAnalyzedData: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLoadSample,
  onTriggerUpload,
  onGoToComparison,
  savedCourseCount,
  hasAnalyzedData,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800 shadow-xl transition-all duration-300">
      {/* 배경 장식 그리드 및 소프트 글로우 효과 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(239,68,68,0.22),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 섬세한 엔터프라이즈 배경 그리드 패턴 */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        {/* 접기/펼치기 토글 (결과 확인 시 공간 절약용) */}
        {hasAnalyzedData && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              <span>{isCollapsed ? '히어로 배너 펼치기' : '히어로 배너 접기'}</span>
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* 접힌 상태일 때의 미니 요약 바 */}
        {isCollapsed && hasAnalyzedData ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">
                교육과정 만족도 결과 자동 분석 솔루션
              </span>
              <span className="text-slate-500 hidden md:inline">·</span>
              <span className="text-slate-400 hidden md:inline">
                서버 전송 없는 브라우저 단독 안심 분석 & 3개 시트 엑셀 자동 보고서
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onLoadSample}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition cursor-pointer"
              >
                샘플 데이터 로드
              </button>
              <button
                onClick={onGoToComparison}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                누적 비교 ({savedCourseCount}개)
              </button>
            </div>
          </div>
        ) : (
          /* 전체 확장된 임팩트 히어로 레이아웃 */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* 좌측: 타이틀, 핵심 가치 제안, 강력한 액션 버튼군 (7칸) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 아이브로우 라벨 */}
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                <span>교육운영 담당자를 위한 차세대 만족도 분석 솔루션</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 font-normal">PC 최적화</span>
              </div>

              {/* 메인 헤드라인 */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  설문 엑셀 한 장으로 끝내는
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
                    과정 및 교수 만족도 심층 분석
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal pt-1">
                  복잡한 피벗테이블과 수식 작업 없이, 원본 엑셀 파일을 올리면 <strong>3초 만에</strong> 문항별 평균, 교수 순위, 응답자별 점수표와 <strong>3개 시트 엑셀 보고서</strong>까지 완벽하게 자동 생성합니다.
                </p>
              </div>

              {/* 핵심 액션 버튼군 */}
              <div className="pt-1 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-red-600 hover:bg-red-500 transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-500/40 hover:-translate-y-0.5 cursor-pointer ring-1 ring-red-400/50"
                >
                  <Sparkles className="w-4 h-4 text-red-200" />
                  <span>샘플 데이터로 3초 만에 체험하기</span>
                </button>

                <button
                  type="button"
                  onClick={onTriggerUpload}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 hover:text-white border border-slate-700 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-slate-300" />
                  <span>내 설문 엑셀 파일 바로 분석</span>
                </button>

                {savedCourseCount > 0 && (
                  <button
                    type="button"
                    onClick={onGoToComparison}
                    className="inline-flex items-center gap-2 px-3.5 py-3 rounded-xl font-semibold text-xs text-amber-300 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>누적 비교 ({savedCourseCount}개)</span>
                  </button>
                )}
              </div>

              {/* 4대 안심 & 효율성 혜택 바 (노-필 디자인 원칙 준수) */}
              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">개인정보 안심</span>
                    <span className="text-[11px] text-slate-400">외부 서버 전송 ZERO</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">3초 자동 산출</span>
                    <span className="text-[11px] text-slate-400">문항별·교수별 평균&순위</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">3개 시트 엑셀</span>
                    <span className="text-[11px] text-slate-400">과정·교수·개인별 저장</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">다개년 누적 비교</span>
                    <span className="text-[11px] text-slate-400">연도별 추이 대조 분석</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측: 고품질 시각적 쇼케이스 (5칸) */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* 외곽 소프트 네온 테두리 */}
                <div className="relative rounded-2xl p-1 bg-gradient-to-br from-red-500/30 via-rose-500/20 to-amber-500/30 shadow-2xl backdrop-blur-md">
                  <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 aspect-[16/10]">
                    {/* 이미지 렌더링 또는 폴백 컨테이너 */}
                    {!imageError ? (
                      <img
                        src="/src/assets/images/hero_analytics_dashboard_1790829810064.jpg"
                        alt="교육과정 만족도 분석 대시보드 시각화"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
                      />
                    ) : (
                      /* Zero-Broken-Image Fallback Container */
                      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-bold text-red-400">교육과정 만족도 분석기</span>
                          <span className="text-emerald-400 font-mono">● LIVE ANALYTICS</span>
                        </div>
                        <div className="space-y-2 py-4">
                          <div className="h-3 w-3/4 bg-red-500/30 rounded"></div>
                          <div className="h-3 w-1/2 bg-rose-500/30 rounded"></div>
                          <div className="h-3 w-2/3 bg-emerald-500/30 rounded"></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <BarChart3 className="w-4 h-4 text-red-400" />
                          <span>통계 및 순위 자동 산출 모듈</span>
                        </div>
                      </div>
                    )}

                    {/* 오버레이 스크림 및 인터랙티브 프리뷰 뱃지 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                    {/* 플로팅 지표 카드 1: 종합 평균 */}
                    <div className="absolute top-3.5 left-3.5 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs shadow-lg flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                      <span className="text-slate-300">종합 만족도:</span>
                      <span className="font-extrabold text-emerald-400 font-mono">4.68 / 5.00</span>
                      <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/60 font-semibold">
                        우수
                      </span>
                    </div>

                    {/* 플로팅 지표 카드 2: 교수 순위 */}
                    <div className="absolute bottom-3.5 right-3.5 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-xs shadow-lg flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300">교수 평가 1위:</span>
                      <span className="font-bold text-amber-300">김영호 교수 (4.85점)</span>
                    </div>

                    {/* 하단 중앙 기능 태그 */}
                    <div className="absolute bottom-3.5 left-3.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-red-400" />
                      <span>3개 시트 엑셀 내보내기 지원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
