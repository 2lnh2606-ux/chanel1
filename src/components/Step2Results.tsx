/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  BookOpen,
  MessageSquare,
  Download,
  BookmarkPlus,
  Layers,
  Search,
  ArrowUpDown,
  Trophy,
  Check,
  Copy,
  BarChart3,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { CourseAnalysisResult, InstructorStat, ItemStat } from '../types';
import { exportCourseResultToExcel } from '../utils/excelExport';

interface Step2ResultsProps {
  result: CourseAnalysisResult;
  onSaveToCumulative: () => void;
  isSavedInCumulative: boolean;
  onGoToComparison: () => void;
  onBackToStep1: () => void;
}

export const Step2Results: React.FC<Step2ResultsProps> = ({
  result,
  onSaveToCumulative,
  isSavedInCumulative,
  onGoToComparison,
  onBackToStep1,
}) => {
  const [activeTab, setActiveTab] = useState<
    'course' | 'instructor' | 'respondent' | 'opinions' | 'charts'
  >('course');

  // 응답자 점수표 검색 및 정렬 상태
  const [respondentSearch, setRespondentSearch] = useState('');
  const [sortField, setSortField] = useState<'id' | 'avg'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 주관식 의견 검색 및 필터
  const [opinionSearch, setOpinionSearch] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 셀 점수 스타일링 헬퍼 (4.5 이상 초록색, 4.0 미만 주황색)
  const getScoreBadgeClass = (score: number | null | undefined) => {
    if (score === null || score === undefined || isNaN(score)) {
      return 'bg-slate-100 text-slate-400 border-slate-200';
    }
    if (score >= 4.5) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    }
    if (score < 4.0) {
      return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
    }
    return 'bg-slate-50 text-slate-800 border-slate-200 font-semibold';
  };

  // 응답자 목록 필터링 및 정렬
  const filteredRespondents = useMemo(() => {
    let list = [...result.respondentScores];

    if (respondentSearch.trim()) {
      const q = respondentSearch.trim().toLowerCase();
      list = list.filter((r) => String(r.respondentIndex).includes(q));
    }

    list.sort((a, b) => {
      if (sortField === 'id') {
        return sortOrder === 'asc'
          ? a.respondentIndex - b.respondentIndex
          : b.respondentIndex - a.respondentIndex;
      } else {
        const avgA = a.courseAvg ?? -1;
        const avgB = b.courseAvg ?? -1;
        return sortOrder === 'asc' ? avgA - avgB : avgB - avgA;
      }
    });

    return list;
  }, [result.respondentScores, respondentSearch, sortField, sortOrder]);

  // 주관식 의견 필터링
  const filteredOpinions = useMemo(() => {
    if (!opinionSearch.trim()) return result.opinions;
    const q = opinionSearch.trim().toLowerCase();
    return result.opinions.filter(
      (o) =>
        o.text.toLowerCase().includes(q) ||
        o.questionName.toLowerCase().includes(q) ||
        String(o.respondentIndex).includes(q)
    );
  }, [result.opinions, opinionSearch]);

  const handleCopyOpinion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* 과정 기본 타이틀 및 상단 컨트롤 액션 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
              {result.year}년도
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {result.courseName}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            분석 파일: {result.fileName} · 분석 일시: {new Date(result.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => exportCourseResultToExcel(result)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
            title="과정만족도, 교수만족도, 응답자별 점수가 각각 별도 시트로 구성된 엑셀 파일 다운로드"
          >
            <Download className="w-4 h-4" />
            엑셀 결과 다운로드 (3개 시트)
          </button>

          <button
            onClick={onSaveToCumulative}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              isSavedInCumulative
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            {isSavedInCumulative ? '✓ 누적 저장소 보관됨' : '누적 저장소에 보관'}
          </button>

          <button
            onClick={onGoToComparison}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            다개년 비교
          </button>
        </div>
      </div>

      {/* 4대 핵심 요약 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 응답자 수 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">총 설문 응답자</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {result.totalRespondents}
              <span className="text-sm font-semibold text-slate-500 ml-1">명</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              결측치 자동 제외 집계
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* 과정만족도 전체 평균 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">과정만족도 종합 평균</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-red-700">
                {result.courseOverallAvg.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 5.00점</span>
            </div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] border ${getScoreBadgeClass(
                  result.courseOverallAvg
                )}`}
              >
                100점 환산: {((result.courseOverallAvg / 5) * 100).toFixed(1)}점
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* 교수만족도 전체 평균 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">교수만족도 종합 평균</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700">
                {result.instructorOverallAvg.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 5.00점</span>
            </div>
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] border ${getScoreBadgeClass(
                  result.instructorOverallAvg
                )}`}
              >
                총 {result.instructorItems.length}명 교수 평가
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* 주관식 의견 수 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">주관식 의견 수집</p>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {result.opinions.length}
              <span className="text-sm font-semibold text-slate-500 ml-1">건</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              실시간 키워드 검색 가능
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 점수 강조 기준 범례 */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-600">
          <span>평균 점수 강조 기준:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 4.5 이상 (매우 우수)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 4.0 미만 (개선 필요)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-300">
            4.0 ~ 4.49 (양호)
          </span>
        </div>

        <button
          onClick={onBackToStep1}
          className="text-red-600 hover:text-red-800 font-medium text-xs flex items-center gap-0.5 cursor-pointer"
        >
          열 구분 수정하러 가기 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 분석 세부 탭 버튼 */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="결과 탭">
          <button
            onClick={() => setActiveTab('course')}
            className={`py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'course'
                ? 'border-red-600 text-red-700 bg-red-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            과정만족도 항목별 평균 ({result.courseItems.length}문항)
          </button>

          <button
            onClick={() => setActiveTab('instructor')}
            className={`py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'instructor'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            교수만족도 순위 및 점수 ({result.instructorItems.length}명)
          </button>

          <button
            onClick={() => setActiveTab('respondent')}
            className={`py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'respondent'
                ? 'border-slate-800 text-slate-900 bg-slate-100/70 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            응답자별 점수표 ({result.respondentScores.length}명)
          </button>

          <button
            onClick={() => setActiveTab('opinions')}
            className={`py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'opinions'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            주관식 의견 모음 ({result.opinions.length}건)
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`py-2.5 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'charts'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            만족도 시각화 차트
          </button>
        </nav>
      </div>

      {/* 탭 1: 과정만족도 항목별 평균표 */}
      {activeTab === 'course' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                과정만족도 항목별 평균 점수표
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                5점 척도 기준 · 빈 셀은 계산에서 제외되며 소수점 둘째 자리까지 표시됩니다.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              과정 전체 평균: <strong className="text-red-700 font-bold">{result.courseOverallAvg.toFixed(2)}점</strong>
            </div>
          </div>

          {result.courseItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              지정된 과정 만족도 문항이 없습니다. 1단계에서 열 구분을 '과정'으로 지정해주세요.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 min-w-[720px]">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-14 text-center">번호</th>
                    <th className="py-3 px-4 min-w-[260px]">평가 문항명</th>
                    <th className="py-3 px-4 w-28 text-center">평균 점수</th>
                    <th className="py-3 px-4 w-24 text-center">100점 환산</th>
                    <th className="py-3 px-4 w-24 text-center">유효 응답수</th>
                    <th className="py-3 px-4 min-w-[180px]">점수 시각화 막대</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.courseItems.map((item, idx) => {
                    const badgeClass = getScoreBadgeClass(item.avg);
                    const pct = Math.min(100, Math.max(0, (item.avg / 5) * 100));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClass}`}
                          >
                            {item.avg.toFixed(2)}점
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {item.score100.toFixed(1)}점
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">
                          {item.count}명
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.avg >= 4.5
                                    ? 'bg-emerald-500'
                                    : item.avg < 4.0
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-slate-900">
                      ★ 과정만족도 전체 종합 평균
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${getScoreBadgeClass(
                          result.courseOverallAvg
                        )}`}
                      >
                        {result.courseOverallAvg.toFixed(2)}점
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-800">
                      {((result.courseOverallAvg / 5) * 100).toFixed(1)}점
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {result.totalRespondents}명
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-normal text-[11px]">
                      과정 내 모든 평가 항목의 통합 평균치
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 교수만족도 순위 및 분석표 */}
      {activeTab === 'instructor' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                교수(강사·교과목) 만족도 순위 및 개인별 점수표
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                열 1개를 강사 1명으로 취급하며, 평균 점수 순으로 순위를 산출합니다.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              교수 전체 평균: <strong className="text-emerald-700 font-bold">{result.instructorOverallAvg.toFixed(2)}점</strong>
            </div>
          </div>

          {result.instructorItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              지정된 교수 문항이 없습니다. 1단계에서 열 구분을 '교수'로 지정해주세요.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-16 text-center">순위</th>
                    <th className="py-3 px-4 min-w-[240px]">교수(강사) / 교과목명</th>
                    <th className="py-3 px-4 w-28 text-center">평균 점수</th>
                    <th className="py-3 px-4 w-24 text-center">100점 환산</th>
                    <th className="py-3 px-4 w-24 text-center">유효 응답수</th>
                    <th className="py-3 px-4 w-28 text-center">최고 / 최저</th>
                    <th className="py-3 px-4 min-w-[160px]">점수 게이지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.instructorItems.map((inst) => {
                    const badgeClass = getScoreBadgeClass(inst.avg);
                    const pct = Math.min(100, Math.max(0, (inst.avg / 5) * 100));

                    // 1위, 2위, 3위 뱃지 스타일
                    let rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs inline-flex items-center justify-center font-mono">
                        {inst.rank}
                      </span>
                    );
                    if (inst.rank === 1) {
                      rankBadge = (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs inline-flex items-center gap-1 shadow-2xs">
                          <Trophy className="w-3 h-3 text-amber-600 fill-amber-500" />
                          1위
                        </span>
                      );
                    } else if (inst.rank === 2) {
                      rankBadge = (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-black text-xs inline-flex items-center gap-1">
                          2위
                        </span>
                      );
                    } else if (inst.rank === 3) {
                      rankBadge = (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-black text-xs inline-flex items-center gap-1">
                          3위
                        </span>
                      );
                    }

                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center">
                          {rankBadge}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {inst.instructorName}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${badgeClass}`}
                          >
                            {inst.avg.toFixed(2)}점
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">
                          {inst.score100.toFixed(1)}점
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500 font-mono">
                          {inst.count}명
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                          {inst.max}점 / {inst.min}점
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  inst.avg >= 4.5
                                    ? 'bg-emerald-500'
                                    : inst.avg < 4.0
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-slate-900">
                      ★ 교수(강사) 만족도 종합 평균
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${getScoreBadgeClass(
                          result.instructorOverallAvg
                        )}`}
                      >
                        {result.instructorOverallAvg.toFixed(2)}점
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-800">
                      {((result.instructorOverallAvg / 5) * 100).toFixed(1)}점
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {result.totalRespondents}명
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-slate-400 font-normal text-[11px]">
                      모든 교수 평가 응답의 전체 합산 평균
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 탭 3: 응답자별 점수표 */}
      {activeTab === 'respondent' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                응답자별 점수표 (총 {result.respondentScores.length}명)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                개인별 과정 평균 및 각 교수별 점수를 확인하고 정렬할 수 있습니다.
              </p>
            </div>

            {/* 검색 및 정렬 컨트롤 */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="응답자 번호 검색..."
                  value={respondentSearch}
                  onChange={(e) => setRespondentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-500 bg-white"
                />
              </div>

              <button
                onClick={() => {
                  if (sortField === 'avg') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('avg');
                    setSortOrder('desc');
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  sortField === 'avg'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                과정 평균순 {sortField === 'avg' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>

              <button
                onClick={() => {
                  setSortField('id');
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  sortField === 'id'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                응답 순번 {sortField === 'id' ? (sortOrder === 'asc' ? '1→N' : 'N→1') : ''}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[560px]">
            <table className="w-full text-left text-xs text-slate-700 min-w-[850px] relative">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10 uppercase text-[11px] shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center bg-slate-50 sticky left-0 z-20">
                    응답자
                  </th>
                  <th className="py-2.5 px-3 w-28 text-center bg-slate-50">
                    과정 평균
                  </th>
                  {/* 교수 점수 열들 */}
                  {result.instructorItems.map((inst) => (
                    <th
                      key={inst.id}
                      className="py-2.5 px-3 min-w-[130px] text-center bg-emerald-50/50 text-emerald-900 border-l border-slate-200"
                    >
                      [교수] {inst.instructorName}
                    </th>
                  ))}
                  {/* 과정 문항 점수 열들 */}
                  {result.courseItems.map((item) => (
                    <th
                      key={item.id}
                      className="py-2.5 px-3 min-w-[140px] text-center bg-red-50/40 text-red-900 border-l border-slate-200"
                    >
                      [과정] {item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRespondents.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 bg-white sticky left-0 z-10 shadow-r">
                        #{r.respondentIndex}
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold">
                        {r.courseAvg !== null ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs border ${getScoreBadgeClass(
                              r.courseAvg
                            )}`}
                          >
                            {r.courseAvg.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 교수별 점수 */}
                      {result.instructorItems.map((inst) => {
                        const score = r.instructorScores[inst.instructorName];
                        return (
                          <td
                            key={inst.id}
                            className="py-2.5 px-3 text-center border-l border-slate-100 font-mono"
                          >
                            {score !== null && score !== undefined ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  score >= 4.5
                                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                                    : score < 4.0
                                    ? 'bg-amber-50 text-amber-800 font-bold'
                                    : 'text-slate-700'
                                }`}
                              >
                                {score}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* 과정문항별 점수 */}
                      {result.courseItems.map((item) => {
                        const score = r.courseScores[item.name];
                        return (
                          <td
                            key={item.id}
                            className="py-2.5 px-3 text-center border-l border-slate-100 font-mono"
                          >
                            {score !== null && score !== undefined ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs ${
                                  score >= 4.5
                                    ? 'text-emerald-700 font-semibold'
                                    : score < 4.0
                                    ? 'text-amber-700 font-semibold'
                                    : 'text-slate-600'
                                }`}
                              >
                                {score}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 탭 4: 주관식 의견 모음 */}
      {activeTab === 'opinions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                주관식 의견 및 건의사항 (총 {result.opinions.length}건)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                교육생들이 작성한 소감과 개선 요청사항을 검색하고 클립보드로 복사할 수 있습니다.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="의견 내용 및 키워드 검색..."
                value={opinionSearch}
                onChange={(e) => setOpinionSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-white w-64"
              />
            </div>
          </div>

          {filteredOpinions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {opinionSearch ? '검색된 주관식 의견이 없습니다.' : '수집된 주관식 의견이 없습니다.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredOpinions.map((op, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        응답자 #{op.respondentIndex}
                      </span>
                      <span className="text-slate-400 truncate max-w-[200px]" title={op.questionName}>
                        {op.questionName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      "{op.text}"
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleCopyOpinion(op.text, idx)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-purple-700 cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">복사 완료</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>텍스트 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 탭 5: 만족도 시각화 차트 */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* 과정 만족도 항목별 바 차트 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  과정만족도 항목별 비교 차트
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  기준선: 4.5점(우수 녹색 점선), 4.0점(보통 주황 점선)
                </p>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                과정 평균 {result.courseOverallAvg.toFixed(2)}점
              </span>
            </div>

            {result.courseItems.length === 0 ? (
              <p className="text-xs text-slate-400">항목 데이터가 없습니다.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {result.courseItems.map((item) => {
                  const pct = (item.avg / 5) * 100;
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-800 truncate max-w-[70%]" title={item.name}>
                          {item.name}
                        </span>
                        <span
                          className={`font-bold font-mono px-1.5 py-0.2 rounded text-[11px] ${
                            item.avg >= 4.5
                              ? 'text-emerald-700 bg-emerald-50'
                              : item.avg < 4.0
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-700 bg-red-50'
                          }`}
                        >
                          {item.avg.toFixed(2)}점
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden relative">
                        {/* 4.0점 기준선 (80%) */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 opacity-75"
                          style={{ left: '80%' }}
                          title="4.0점 기준선"
                        ></div>
                        {/* 4.5점 기준선 (90%) */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10 opacity-75"
                          style={{ left: '90%' }}
                          title="4.5점 우수 기준선"
                        ></div>
                        <div
                          className={`h-full rounded-lg transition-all duration-500 ${
                            item.avg >= 4.5
                              ? 'bg-emerald-500'
                              : item.avg < 4.0
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 교수만족도 바 차트 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  교수(강사)만족도 순위별 비교 차트
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  각 교수별 만족도 점수 비교
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                교수 종합 {result.instructorOverallAvg.toFixed(2)}점
              </span>
            </div>

            {result.instructorItems.length === 0 ? (
              <p className="text-xs text-slate-400">교수 평가 데이터가 없습니다.</p>
            ) : (
              <div className="space-y-3.5 pt-2">
                {result.instructorItems.map((inst) => {
                  const pct = (inst.avg / 5) * 100;
                  return (
                    <div key={inst.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="font-mono text-emerald-700">[{inst.rank}위]</span>
                          <span>{inst.instructorName}</span>
                        </div>
                        <span
                          className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                            inst.avg >= 4.5
                              ? 'text-emerald-700 bg-emerald-50'
                              : inst.avg < 4.0
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-slate-700 bg-slate-100'
                          }`}
                        >
                          {inst.avg.toFixed(2)}점
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-lg overflow-hidden relative">
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 opacity-75"
                          style={{ left: '80%' }}
                        ></div>
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10 opacity-75"
                          style={{ left: '90%' }}
                        ></div>
                        <div
                          className={`h-full rounded-lg transition-all duration-500 ${
                            inst.avg >= 4.5
                              ? 'bg-emerald-500'
                              : inst.avg < 4.0
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
