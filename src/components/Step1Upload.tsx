/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sliders,
  Info,
} from 'lucide-react';
import { ColumnMapping, ColumnType, RawSurveyData } from '../types';
import { autoDetectColumnType } from '../utils/calculation';

interface Step1UploadProps {
  rawData: RawSurveyData | null;
  columnMappings: ColumnMapping[];
  year: string;
  courseName: string;
  onYearChange: (year: string) => void;
  onCourseNameChange: (name: string) => void;
  onFileUpload: (file: File) => void;
  onMappingChange: (colIndex: number, newType: ColumnType, customName?: string) => void;
  onBatchSetType: (targetType: ColumnType) => void;
  onResetAutoDetection: () => void;
  onLoadSample: () => void;
  onProceedToResults: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const Step1Upload: React.FC<Step1UploadProps> = ({
  rawData,
  columnMappings,
  year,
  courseName,
  onYearChange,
  onCourseNameChange,
  onFileUpload,
  onMappingChange,
  onBatchSetType,
  onResetAutoDetection,
  onLoadSample,
  onProceedToResults,
  isLoading,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchColumnTerm, setSearchColumnTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileUpload(file);
    }
  };

  // 통계 요약 (과정 문항 수, 교수 문항 수, 의견 문항 수, 무시 문항 수)
  const courseCount = columnMappings.filter((m) => m.type === 'course').length;
  const instructorCount = columnMappings.filter((m) => m.type === 'instructor').length;
  const opinionCount = columnMappings.filter((m) => m.type === 'opinion').length;
  const ignoreCount = columnMappings.filter((m) => m.type === 'ignore').length;

  const hasValidNumericColumns = courseCount > 0 || instructorCount > 0;

  // 필터링된 열 목록
  const filteredMappings = columnMappings.filter((m) =>
    m.originalHeader.toLowerCase().includes(searchColumnTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 팁 안내 박스 */}
      <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-900 shadow-2xs">
        <div className="p-1.5 bg-red-100 rounded-lg text-red-700 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-red-950">
            엑셀 파일 업로드 가이드
          </p>
          <p className="text-xs sm:text-sm text-red-800 leading-relaxed">
            • <strong>첫 행은 반드시 문항명(헤더)</strong>이어야 하며, <strong>응답자 1명이 1행</strong>으로 구성되어야 합니다.
            <br />
            • 업로드된 모든 엑셀 데이터는 <strong>브라우저 안에서만 처리</strong>되며 외부로 전송되지 않습니다.
            <br />
            • 업로드 후 하단의 <strong>열 구분(과정 / 교수 / 의견 / 무시)</strong>을 확인하고 필요시 변경하세요.
          </p>
        </div>
      </div>

      {/* 파일 업로드 드롭존 & 기본 메타데이터 입력 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 드롭존 (8칸) */}
        <div className="lg:col-span-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] ${
              isDragOver
                ? 'border-red-500 bg-red-50/50 scale-[1.005]'
                : rawData
                ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50'
                : 'border-slate-300 bg-white hover:border-red-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-slate-700">
                  엑셀 파일을 안전하게 분석하고 있습니다...
                </p>
              </div>
            ) : rawData ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {rawData.fileName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    총 {rawData.rows.length}명 응답자 데이터 · 총 {rawData.headers.length}개 열 감지됨
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
                >
                  다른 파일로 다시 올리기
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-2xs">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    설문 엑셀 파일(.xlsx, .xls, .csv)을 마우스로 끌어다 놓으세요
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    또는 클릭하여 컴퓨터에서 직접 파일을 선택하세요
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shadow-2xs"
                  >
                    파일 선택하기
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadSample();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-red-600" />
                    샘플 엑셀로 테스트
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">파일 처리 중 오류가 발생했습니다</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* 과정 정보 설정 카드 (4칸) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                과정 기본 정보
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  분석 연도
                </label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => onYearChange(e.target.value)}
                  placeholder="예: 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  다개년 누적 비교 시 연도별로 분류됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  교육과정명
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => onCourseNameChange(e.target.value)}
                  placeholder="예: 빅데이터 기반 AI 서비스 기획 과정"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  보고서 및 엑셀 다운로드 파일명에 반영됩니다.
                </p>
              </div>
            </div>
          </div>

          {rawData && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>감지된 응답자:</span>
                <span className="font-bold text-slate-900">{rawData.rows.length}명</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>과정 문항 수:</span>
                <span className="font-semibold text-red-600">{courseCount}개</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>교수 평가 문항:</span>
                <span className="font-semibold text-emerald-600">{instructorCount}개</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>주관식 의견 열:</span>
                <span className="font-semibold text-purple-600">{opinionCount}개</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 열 구분 지정 섹션 */}
      {rawData && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900">
                  열 구분 지정 및 자동 추정 결과
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                각 열의 유형(과정 문항 / 교수 평가 / 주관식 의견 / 무시)을 확인하세요. 드롭다운을 변경하면 즉시 재계산됩니다.
              </p>
            </div>

            {/* 일괄 액션 버튼 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={onResetAutoDetection}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                title="헤더 키워드와 값 분포를 기준으로 다시 자동 분류합니다"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                자동 추정 재실행
              </button>
              <button
                type="button"
                onClick={() => onBatchSetType('course')}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition cursor-pointer"
              >
                모두 과정으로
              </button>
            </div>
          </div>

          {/* 유효성 경고 알림 */}
          {!hasValidNumericColumns && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>주의:</strong> 현재 '과정' 또는 '교수'로 지정된 문항이 0개입니다. 1개 이상의 열을 '과정' 또는 '교수'로 지정해야 평균이 계산됩니다.
              </span>
            </div>
          )}

          {/* 열 요약 뱃지 바 */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 font-medium">분류 현황:</span>
            <span className="px-2.5 py-1 rounded-md bg-red-100 text-red-800 font-semibold">
              과정 문항 {courseCount}개
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
              교수 평가 {instructorCount}개 (열 1개 = 강사 1명)
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-semibold">
              주관식 의견 {opinionCount}개
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold">
              무시/제외 {ignoreCount}개
            </span>
          </div>

          {/* 열 검색 입력창 */}
          {columnMappings.length > 6 && (
            <div className="pt-1">
              <input
                type="text"
                placeholder="문항명 검색..."
                value={searchColumnTerm}
                onChange={(e) => setSearchColumnTerm(e.target.value)}
                className="max-w-xs px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-500 bg-white"
              />
            </div>
          )}

          {/* 열 지정 테이블 (가로 스크롤 가능) */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">번호</th>
                  <th className="py-2.5 px-4 min-w-[220px]">엑셀 헤더(문항명)</th>
                  <th className="py-2.5 px-4 w-40">열 구분 지정</th>
                  <th className="py-2.5 px-4 min-w-[180px]">교수명/표시명 (선택)</th>
                  <th className="py-2.5 px-4 min-w-[200px]">샘플 데이터 미리보기 (1~3행)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMappings.map((m) => {
                  const isInstructor = m.type === 'instructor';
                  const isCourse = m.type === 'course';
                  const isOpinion = m.type === 'opinion';
                  const isIgnore = m.type === 'ignore';

                  let rowBg = 'hover:bg-slate-50/70';
                  if (isInstructor) rowBg = 'bg-emerald-50/30 hover:bg-emerald-50/50';
                  else if (isCourse) rowBg = 'bg-red-50/20 hover:bg-red-50/40';
                  else if (isIgnore) rowBg = 'bg-slate-50/50 text-slate-400';

                  return (
                    <tr key={m.colIndex} className={`transition-colors ${rowBg}`}>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {m.colIndex + 1}
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="line-clamp-2" title={m.originalHeader}>
                          {m.originalHeader}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={m.type}
                          onChange={(e) =>
                            onMappingChange(
                              m.colIndex,
                              e.target.value as ColumnType,
                              m.customName
                            )
                          }
                          className={`w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isCourse
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : isInstructor
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isOpinion
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <option value="course">과정 (5점 척도)</option>
                          <option value="instructor">교수/강사 (5점 척도)</option>
                          <option value="opinion">주관식 의견 (텍스트)</option>
                          <option value="ignore">무시 (식별자/미사용)</option>
                        </select>
                      </td>

                      <td className="py-3 px-4">
                        {isInstructor ? (
                          <div>
                            <input
                              type="text"
                              value={m.customName || ''}
                              onChange={(e) =>
                                onMappingChange(m.colIndex, m.type, e.target.value)
                              }
                              placeholder={m.originalHeader}
                              className="w-full px-2 py-1 text-xs border border-emerald-300 rounded bg-white font-medium text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                            />
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              * 순위표 및 보고서에 표시될 강사명
                            </p>
                          </div>
                        ) : isCourse ? (
                          <span className="text-[11px] text-slate-400">
                            과정 만족도 항목으로 집계
                          </span>
                        ) : isOpinion ? (
                          <span className="text-[11px] text-purple-600">
                            주관식 의견 모음에 등록
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            계산에서 제외됨
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {m.sampleValues.slice(0, 3).map((val, sIdx) => {
                            const display =
                              val === null || val === undefined || String(val).trim() === ''
                                ? '(빈칸)'
                                : String(val);
                            return (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] text-slate-700 font-mono truncate max-w-[120px]"
                                title={display}
                              >
                                {display}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 하단 진행 버튼 */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              열 구분을 변경하면 결과표와 통계가 실시간으로 재산출됩니다.
            </div>

            <button
              type="button"
              onClick={onProceedToResults}
              disabled={!hasValidNumericColumns}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer ${
                hasValidNumericColumns
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <span>② 결과 확인 및 분석 보고서 보기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
