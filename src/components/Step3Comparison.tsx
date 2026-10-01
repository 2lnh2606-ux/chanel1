/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Download,
  Upload,
  Trash2,
  Eye,
  Filter,
  BarChart2,
  Calendar,
  PlusCircle,
  FileJson,
  CheckSquare,
  Square,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { CourseAnalysisResult } from '../types';
import { buildComparisonMatrix } from '../utils/calculation';
import { exportComparisonToExcel } from '../utils/excelExport';
import {
  exportBackupJSON,
  importBackupJSON,
} from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface Step3ComparisonProps {
  storedCourses: CourseAnalysisResult[];
  onSelectCourseForView: (course: CourseAnalysisResult) => void;
  onDeleteCourse: (courseId: string) => void;
  onCoursesUpdated: (courses: CourseAnalysisResult[]) => void;
  onAddNewCourse: () => void;
}

export const Step3Comparison: React.FC<Step3ComparisonProps> = ({
  storedCourses,
  onSelectCourseForView,
  onDeleteCourse,
  onCoursesUpdated,
  onAddNewCourse,
}) => {
  // 연도 필터 상태
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // 비교 대상 선택 (기본적으로 모두 선택)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() =>
    storedCourses.map((c) => c.id)
  );

  // 삭제 확인 모달 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>('');

  // 차트 뷰 모드 ('bar' | 'table')
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // 백업 파일 인풋 ref
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 고유 연도 목록 추출
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(storedCourses.map((c) => c.year)));
    return years.sort((a, b) => b.localeCompare(a));
  }, [storedCourses]);

  // 연도 필터링된 과정 목록
  const filteredCourses = useMemo(() => {
    if (selectedYear === 'all') return storedCourses;
    return storedCourses.filter((c) => c.year === selectedYear);
  }, [storedCourses, selectedYear]);

  // 비교 대상 선택된 과정들
  const comparedCourses = useMemo(() => {
    return storedCourses.filter((c) => selectedCourseIds.includes(c.id));
  }, [storedCourses, selectedCourseIds]);

  // 비교 매트릭스 데이터 생성
  const { matrixRows } = useMemo(() => {
    return buildComparisonMatrix(comparedCourses);
  }, [comparedCourses]);

  // 전체 선택 / 해제 토글
  const handleToggleSelectAll = () => {
    if (selectedCourseIds.length === filteredCourses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(filteredCourses.map((c) => c.id));
    }
  };

  const handleToggleCourse = (id: string) => {
    if (selectedCourseIds.includes(id)) {
      setSelectedCourseIds(selectedCourseIds.filter((cid) => cid !== id));
    } else {
      setSelectedCourseIds([...selectedCourseIds, id]);
    }
  };

  // 삭제 요청 핸들러
  const handleRequestDelete = (course: CourseAnalysisResult) => {
    setDeleteTargetId(course.id);
    setDeleteTargetTitle(`[${course.year}년] ${course.courseName}`);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDeleteCourse(deleteTargetId);
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== deleteTargetId));
      setDeleteTargetId(null);
      showToast('해당 과정이 누적 저장소에서 삭제되었습니다.');
    }
  };

  // 백업 복원 핸들러
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const res = await importBackupJSON(file);
      if (res.success) {
        onCoursesUpdated(res.courses);
        setSelectedCourseIds(res.courses.map((c) => c.id));
        showToast(res.message);
      } else {
        alert(res.message);
      }
      e.target.value = '';
    }
  };

  // 셀 점수 스타일링 헬퍼 (4.5 이상 초록색, 4.0 미만 주황색)
  const getCellScoreClass = (score: number | null | undefined) => {
    if (score === null || score === undefined || isNaN(score)) {
      return 'text-slate-300 font-mono';
    }
    if (score >= 4.5) {
      return 'bg-emerald-50 text-emerald-800 font-bold';
    }
    if (score < 4.0) {
      return 'bg-amber-50 text-amber-800 font-bold';
    }
    return 'text-slate-800 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 액션 및 요약 바 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              교육과정 간 누적 비교 및 보관 관리
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            누적 저장된 여러 과정의 연도별 만족도 추이와 항목별 점수를 한눈에 대조 분석합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 비교표 엑셀 다운로드 */}
          <button
            onClick={() => exportComparisonToExcel(comparedCourses)}
            disabled={comparedCourses.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
              comparedCourses.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            비교표 엑셀 다운로드
          </button>

          {/* 백업 JSON 다운로드 */}
          <button
            onClick={() => exportBackupJSON(storedCourses)}
            disabled={storedCourses.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="현재 누적 저장된 모든 과정 데이터를 JSON 파일로 백업합니다"
          >
            <FileJson className="w-3.5 h-3.5 text-slate-600" />
            백업 (JSON)
          </button>

          {/* 복원 JSON 업로드 */}
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            title="이전에 백업한 JSON 파일을 올려 데이터를 복원합니다"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            복원 (JSON)
          </button>
          <input
            type="file"
            ref={jsonInputRef}
            onChange={handleRestoreFile}
            accept=".json"
            className="hidden"
          />

          {/* 새 과정 추가하기 */}
          <button
            onClick={onAddNewCourse}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            새 과정 엑셀 올리기
          </button>
        </div>
      </div>

      {/* 저장된 과정이 없는 경우 */}
      {storedCourses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              누적 저장된 과정이 아직 없습니다
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              1단계에서 엑셀을 업로드하고 2단계 결과 화면에서 '누적 저장소에 보관' 버튼을 누르면 이 화면에서 다개년 과정을 비교할 수 있습니다.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onAddNewCourse}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              지금 과정 엑셀 올리기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 보관함 과정 관리 목록 & 연도 필터 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  저장된 과정 목록 ({storedCourses.length}개)
                </span>
                <span className="text-[11px] text-slate-400">
                  • 체크박스로 비교할 과정을 선택하세요
                </span>
              </div>

              {/* 연도 필터 탭 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> 연도:
                </span>
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    selectedYear === 'all'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  전체 ({storedCourses.length})
                </button>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {yr}년 ({storedCourses.filter((c) => c.year === yr).length})
                  </button>
                ))}
              </div>
            </div>

            {/* 개별 과정 카드/목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {filteredCourses.map((c) => {
                const isChecked = selectedCourseIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleCourse(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isChecked
                        ? 'border-red-300 bg-red-50/40 shadow-xs ring-1 ring-red-400/30'
                        : 'border-slate-200 bg-slate-50/40 hover:bg-white text-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCourse(c.id);
                            }}
                            className="text-red-600 cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 fill-red-600 text-white" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                            {c.year}년
                          </span>
                        </div>

                        {/* 개별 액션 버튼들 */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectCourseForView(c)}
                            className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-white transition cursor-pointer"
                            title="이 과정의 3개 시트 결과표 상세 보기"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDelete(c)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                            title="과정 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 mt-2 line-clamp-1">
                        {c.courseName}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>응답 {c.totalRespondents}명</span>
                      <div className="flex items-center gap-2">
                        <span>
                          과정: <strong className="text-red-700 font-mono">{c.courseOverallAvg.toFixed(2)}</strong>
                        </span>
                        <span>
                          교수: <strong className="text-emerald-700 font-mono">{c.instructorOverallAvg.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 전체 선택 토글 */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-red-600 hover:text-red-800 font-semibold cursor-pointer"
              >
                {selectedCourseIds.length === filteredCourses.length
                  ? '선택 전체 해제'
                  : '현재 목록 전체 선택'}
              </button>
              <span>
                비교 선택: <strong className="text-slate-900">{comparedCourses.length}</strong> / {filteredCourses.length}개
              </span>
            </div>
          </div>

          {/* 뷰 모드 토글 (테이블 vs 차트) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                비교 매트릭스 표
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                과정별 평균 비교 차트
              </button>
            </div>

            <div className="text-xs text-slate-500">
              * 4.5 이상(초록), 4.0 미만(주황)으로 강조 표시됩니다.
            </div>
          </div>

          {/* 1. 비교 매트릭스 표 */}
          {viewMode === 'table' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    교육과정별 만족도 누적 비교표
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    열은 과정(연도+과정명), 행은 평가 항목이며 최상단에 종합 평균 요약행이 배치됩니다.
                  </p>
                </div>
              </div>

              {comparedCourses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  비교할 과정을 1개 이상 선택해주세요.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-3 w-24 text-center bg-slate-50">
                          구분
                        </th>
                        <th className="py-3 px-4 min-w-[220px] bg-slate-50">
                          평가 항목명
                        </th>
                        {comparedCourses.map((c) => (
                          <th
                            key={c.id}
                            className="py-3 px-3 min-w-[150px] text-center border-l border-slate-200 bg-slate-50"
                          >
                            <div className="text-red-700 font-bold">[{c.year}년]</div>
                            <div className="text-slate-800 truncate" title={c.courseName}>
                              {c.courseName}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matrixRows.map((row, rIdx) => {
                        const isSummary = row.rowCategory === 'summary';
                        const isInstructor = row.rowCategory === 'instructor_item';

                        let rowBg = 'hover:bg-slate-50/70';
                        if (isSummary) {
                          rowBg = 'bg-amber-50/50 font-bold';
                        } else if (isInstructor) {
                          rowBg = 'bg-emerald-50/20 hover:bg-emerald-50/40';
                        }

                        return (
                          <tr key={rIdx} className={`transition-colors ${rowBg}`}>
                            {/* 구분 열 */}
                            <td className="py-2.5 px-3 text-center">
                              {isSummary ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900">
                                  ★ 요약
                                </span>
                              ) : isInstructor ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                  교수(강사)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                                  과정문항
                                </span>
                              )}
                            </td>

                            {/* 항목명 */}
                            <td className={`py-2.5 px-4 ${isSummary ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                              {row.itemName}
                            </td>

                            {/* 각 과정별 점수 셀 */}
                            {comparedCourses.map((c) => {
                              const val = row.courseValues[c.id];
                              if (row.itemName === '총 응답자 수') {
                                return (
                                  <td
                                    key={c.id}
                                    className="py-2.5 px-3 text-center border-l border-slate-100 font-mono font-bold text-slate-800"
                                  >
                                    {val?.count !== null && val?.count !== undefined ? `${val.count}명` : '-'}
                                  </td>
                                );
                              }

                              const avg = val?.avg;
                              return (
                                <td
                                  key={c.id}
                                  className="py-2.5 px-3 text-center border-l border-slate-100"
                                >
                                  {avg !== null && avg !== undefined ? (
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-xs border ${
                                        isSummary
                                          ? 'border-amber-300 font-black text-amber-950'
                                          : getCellScoreClass(avg)
                                      }`}
                                    >
                                      {avg.toFixed(2)}점
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">-</span>
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
              )}
            </div>
          )}

          {/* 2. 과정별 평균 비교 차트 */}
          {viewMode === 'chart' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    과정만족도 vs 교수만족도 연도/과정별 비교 차트
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    빨간색 바: 과정만족도 평균 · 초록색 바: 교수만족도 평균
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-red-700 font-bold">
                    <span className="w-3 h-3 rounded bg-red-600"></span> 과정 종합 평균
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <span className="w-3 h-3 rounded bg-emerald-600"></span> 교수 종합 평균
                  </span>
                </div>
              </div>

              {comparedCourses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  비교할 과정을 선택해주세요.
                </div>
              ) : (
                <div className="space-y-5 pt-2">
                  {comparedCourses.map((c) => {
                    const cPct = (c.courseOverallAvg / 5) * 100;
                    const iPct = (c.instructorOverallAvg / 5) * 100;

                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">
                            [{c.year}년] {c.courseName}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            응답자 {c.totalRespondents}명
                          </span>
                        </div>

                        {/* 과정만족도 바 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">과정만족도 평균</span>
                            <span className="font-bold text-red-700 font-mono">
                              {c.courseOverallAvg.toFixed(2)} / 5.00점
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-3.5 rounded-md overflow-hidden relative">
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                              style={{ left: '80%' }}
                              title="4.0 기준"
                            ></div>
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10"
                              style={{ left: '90%' }}
                              title="4.5 우수 기준"
                            ></div>
                            <div
                              className="h-full bg-red-600 rounded-md transition-all duration-500"
                              style={{ width: `${cPct}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* 교수만족도 바 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">교수만족도 평균</span>
                            <span className="font-bold text-emerald-700 font-mono">
                              {c.instructorOverallAvg.toFixed(2)} / 5.00점
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-3.5 rounded-md overflow-hidden relative">
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                              style={{ left: '80%' }}
                            ></div>
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 z-10"
                              style={{ left: '90%' }}
                            ></div>
                            <div
                              className="h-full bg-emerald-600 rounded-md transition-all duration-500"
                              style={{ width: `${iPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 과정 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="과정 데이터 삭제 확인"
        message={`'${deleteTargetTitle}' 데이터를 누적 저장소에서 완전히 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.`}
        confirmLabel="삭제하기"
        cancelLabel="취소"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
