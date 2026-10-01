/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { StepNavigation, StepId } from './components/StepNavigation';
import { Step1Upload } from './components/Step1Upload';
import { Step2Results } from './components/Step2Results';
import { Step3Comparison } from './components/Step3Comparison';
import {
  ColumnMapping,
  ColumnType,
  CourseAnalysisResult,
  RawSurveyData,
} from './types';
import { parseExcelFile } from './utils/excelParser';
import {
  autoDetectColumnType,
  calculateCourseAnalysis,
  generateSampleData,
} from './utils/calculation';
import {
  loadStoredCourses,
  saveCourseToCumulative,
  removeCourseFromCumulative,
  saveAllCourses,
} from './utils/storage';

export default function App() {
  const [currentStep, setCurrentStep] = useState<StepId>('step1_upload');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [courseName, setCourseName] = useState<string>('');

  const [rawData, setRawData] = useState<RawSurveyData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<CourseAnalysisResult | null>(null);
  const [isSavedInCumulative, setIsSavedInCumulative] = useState(false);

  const [storedCourses, setStoredCourses] = useState<CourseAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 로컬스토리지에서 기존 저장 데이터 불러오기 및 기본 시드 데이터 세팅
  useEffect(() => {
    const loaded = loadStoredCourses();
    if (loaded && loaded.length > 0) {
      setStoredCourses(loaded);
    } else {
      // 최초 사용자를 위한 이전 연도 비교 시드 데이터 자동 초기화 (2025년 데이터)
      const sample = generateSampleData();
      const sampleMappings: ColumnMapping[] = sample.raw.headers.map((h, idx) => {
        const samples = sample.raw.rows.map((r) => r[idx]);
        const detected = autoDetectColumnType(h, samples);
        let customName = h;
        if (detected === 'instructor') {
          // 간결한 강사명 추출
          if (h.includes('김영호')) customName = '김영호 교수 (빅데이터 분석)';
          else if (h.includes('이지은')) customName = '이지은 강사 (파이썬 실습)';
          else if (h.includes('박준형')) customName = '박준형 교수 (머신러닝 모델링)';
        }
        return {
          colIndex: idx,
          originalHeader: h,
          type: detected,
          detectedType: detected,
          customName: detected === 'instructor' ? customName : undefined,
          sampleValues: samples.slice(0, 5),
        };
      });

      const seedCourse2025 = calculateCourseAnalysis(
        sample.raw,
        sampleMappings,
        '2025',
        '빅데이터 기반 AI 서비스 기획 과정 (1기)'
      );
      // 약간의 점수 차이를 주어 비교 재미 제공
      seedCourse2025.courseOverallAvg = 4.38;
      seedCourse2025.instructorOverallAvg = 4.45;

      saveAllCourses([seedCourse2025]);
      setStoredCourses([seedCourse2025]);
    }
  }, []);

  // 컬럼 매핑 또는 메타데이터 변경 시 즉시 재계산
  const recalculateCurrentAnalysis = useCallback(
    (
      raw: RawSurveyData,
      mappings: ColumnMapping[],
      targetYear: string,
      targetCourseName: string
    ) => {
      try {
        const result = calculateCourseAnalysis(
          raw,
          mappings,
          targetYear,
          targetCourseName || raw.fileName.replace(/\.[^/.]+$/, '')
        );
        setCurrentAnalysis(result);
        setIsSavedInCumulative(false);
        setErrorMessage(null);
        return result;
      } catch (err: any) {
        console.error('Calculation error:', err);
        setErrorMessage(err.message || '만족도 계산 중 오류가 발생했습니다.');
        return null;
      }
    },
    []
  );

  // 엑셀 파일 업로드 핸들러
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const parsed = await parseExcelFile(file);

      // 파일명에서 확장자를 제거하여 기본 과정명으로 세팅
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
      const cleanCourseName = courseName.trim() ? courseName : baseName;

      setCourseName(cleanCourseName);
      setRawData(parsed);

      // 컬럼 매핑 자동 추정
      const initialMappings: ColumnMapping[] = parsed.headers.map((header, idx) => {
        const sampleVals = parsed.rows.map((r) => r[idx]);
        const detected = autoDetectColumnType(header, sampleVals);
        return {
          colIndex: idx,
          originalHeader: header,
          type: detected,
          detectedType: detected,
          customName: detected === 'instructor' ? header : undefined,
          sampleValues: sampleVals.slice(0, 5),
        };
      });

      setColumnMappings(initialMappings);

      // 즉시 결과 계산
      const result = recalculateCurrentAnalysis(
        parsed,
        initialMappings,
        year,
        cleanCourseName
      );

      if (result) {
        // 성공 시 1단계에서 열 구분을 검토할 수 있도록 유지하거나 버튼 활성화
      }
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setErrorMessage(
        err.message || '엑셀 파일을 읽는 도중 오류가 발생했습니다. 올바른 형식인지 확인해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 열 구분 변경 핸들러
  const handleMappingChange = (
    colIndex: number,
    newType: ColumnType,
    customName?: string
  ) => {
    const updated = columnMappings.map((m) => {
      if (m.colIndex === colIndex) {
        return {
          ...m,
          type: newType,
          customName: customName !== undefined ? customName : m.customName,
        };
      }
      return m;
    });

    setColumnMappings(updated);

    if (rawData) {
      recalculateCurrentAnalysis(rawData, updated, year, courseName);
    }
  };

  // 일괄 열 구분 변경
  const handleBatchSetType = (targetType: ColumnType) => {
    const updated = columnMappings.map((m) => ({
      ...m,
      type: targetType,
    }));
    setColumnMappings(updated);
    if (rawData) {
      recalculateCurrentAnalysis(rawData, updated, year, courseName);
    }
  };

  // 자동 추정 재실행
  const handleResetAutoDetection = () => {
    if (!rawData) return;
    const resetMappings: ColumnMapping[] = rawData.headers.map((header, idx) => {
      const sampleVals = rawData.rows.map((r) => r[idx]);
      const detected = autoDetectColumnType(header, sampleVals);
      return {
        colIndex: idx,
        originalHeader: header,
        type: detected,
        detectedType: detected,
        customName: detected === 'instructor' ? header : undefined,
        sampleValues: sampleVals.slice(0, 5),
      };
    });
    setColumnMappings(resetMappings);
    recalculateCurrentAnalysis(rawData, resetMappings, year, courseName);
  };

  // 테스트용 샘플 데이터 즉시 로드
  const handleLoadSample = () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const sample = generateSampleData();
      setYear(sample.defaultYear);
      setCourseName(sample.defaultCourseName);
      setRawData(sample.raw);

      const sampleMappings: ColumnMapping[] = sample.raw.headers.map((h, idx) => {
        const samples = sample.raw.rows.map((r) => r[idx]);
        const detected = autoDetectColumnType(h, samples);
        let customName = h;
        if (detected === 'instructor') {
          if (h.includes('김영호')) customName = '김영호 교수 (빅데이터 분석)';
          else if (h.includes('이지은')) customName = '이지은 수석강사 (파이썬 실습)';
          else if (h.includes('박준형')) customName = '박준형 겸임교수 (머신러닝)';
        }
        return {
          colIndex: idx,
          originalHeader: h,
          type: detected,
          detectedType: detected,
          customName: detected === 'instructor' ? customName : undefined,
          sampleValues: samples.slice(0, 5),
        };
      });

      setColumnMappings(sampleMappings);
      recalculateCurrentAnalysis(
        sample.raw,
        sampleMappings,
        sample.defaultYear,
        sample.defaultCourseName
      );
      // 샘플 로드 시 바로 결과 화면(Step 2)으로 전환
      setCurrentStep('step2_results');
    } catch (err: any) {
      setErrorMessage('샘플 데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 연도 변경
  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    if (rawData) {
      recalculateCurrentAnalysis(rawData, columnMappings, newYear, courseName);
    }
  };

  // 과정명 변경
  const handleCourseNameChange = (newName: string) => {
    setCourseName(newName);
    if (rawData) {
      recalculateCurrentAnalysis(rawData, columnMappings, year, newName);
    }
  };

  // 누적 저장소에 현재 결과 저장
  const handleSaveToCumulative = () => {
    if (!currentAnalysis) return;
    const { updatedCourses } = saveCourseToCumulative(currentAnalysis);
    setStoredCourses(updatedCourses);
    setIsSavedInCumulative(true);
  };

  // 누적 저장소에서 과정 삭제
  const handleDeleteCourse = (courseId: string) => {
    const updated = removeCourseFromCumulative(courseId);
    setStoredCourses(updated);
  };

  // 과거 저장된 과정 상세 보기 (Step 2로 로드)
  const handleSelectCourseForView = (course: CourseAnalysisResult) => {
    setCurrentAnalysis(course);
    setYear(course.year);
    setCourseName(course.courseName);
    setColumnMappings(course.columnMappings || []);
    setIsSavedInCumulative(true);
    setCurrentStep('step2_results');
  };

  // 전체 초기화 (새 파일 분석 시작)
  const handleResetAll = () => {
    setRawData(null);
    setColumnMappings([]);
    setCurrentAnalysis(null);
    setIsSavedInCumulative(false);
    setCourseName('');
    setErrorMessage(null);
    setCurrentStep('step1_upload');
  };

  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const handleTriggerUploadFromHero = () => {
    setCurrentStep('step1_upload');
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-red-100 selection:text-red-900">
      {/* 상단 글로벌 헤더 */}
      <Header
        onLoadSample={handleLoadSample}
        savedCourseCount={storedCourses.length}
        onGoToComparison={() => setCurrentStep('step3_comparison')}
        onResetAll={handleResetAll}
        hasCurrentData={rawData !== null || currentAnalysis !== null}
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        hasCalculatedResult={currentAnalysis !== null}
      />

      {/* 임팩트 있는 히어로 섹션 */}
      <HeroSection
        onLoadSample={handleLoadSample}
        onTriggerUpload={handleTriggerUploadFromHero}
        onGoToComparison={() => setCurrentStep('step3_comparison')}
        savedCourseCount={storedCourses.length}
        hasAnalyzedData={currentAnalysis !== null}
      />

      {/* 메인 작업 영역 */}
      <main ref={uploadSectionRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 3단계 진행 흐름 네비게이션 */}
        <StepNavigation
          currentStep={currentStep}
          onSelectStep={(step) => setCurrentStep(step)}
          hasCalculatedResult={currentAnalysis !== null}
          savedCourseCount={storedCourses.length}
        />

        {/* 단계별 화면 렌더링 */}
        {currentStep === 'step1_upload' && (
          <Step1Upload
            rawData={rawData}
            columnMappings={columnMappings}
            year={year}
            courseName={courseName}
            onYearChange={handleYearChange}
            onCourseNameChange={handleCourseNameChange}
            onFileUpload={handleFileUpload}
            onMappingChange={handleMappingChange}
            onBatchSetType={handleBatchSetType}
            onResetAutoDetection={handleResetAutoDetection}
            onLoadSample={handleLoadSample}
            onProceedToResults={() => setCurrentStep('step2_results')}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        )}

        {currentStep === 'step2_results' && currentAnalysis && (
          <Step2Results
            result={currentAnalysis}
            onSaveToCumulative={handleSaveToCumulative}
            isSavedInCumulative={isSavedInCumulative}
            onGoToComparison={() => setCurrentStep('step3_comparison')}
            onBackToStep1={() => setCurrentStep('step1_upload')}
          />
        )}

        {currentStep === 'step3_comparison' && (
          <Step3Comparison
            storedCourses={storedCourses}
            onSelectCourseForView={handleSelectCourseForView}
            onDeleteCourse={handleDeleteCourse}
            onCoursesUpdated={(courses) => setStoredCourses(courses)}
            onAddNewCourse={() => {
              handleResetAll();
              setCurrentStep('step1_upload');
            }}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            교육기관 과정별 만족도 결과 정리 및 비교 분석 웹앱 · SheetJS(xlsx) 기반 클라이언트 전용 분석기
          </p>
          <p>
            보안: 업로드된 모든 데이터는 브라우저 내부 메모리와 localStorage에만 저장됩니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
