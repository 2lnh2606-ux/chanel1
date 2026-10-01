/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CourseAnalysisResult, CumulativeStorage } from '../types';

const STORAGE_KEY = 'edu_course_satisfaction_data_v1';

/**
 * 로컬스토리지에서 저장된 모든 과정 분석 목록 불러오기
 */
export function loadStoredCourses(): CourseAnalysisResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: CumulativeStorage = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.courses)) {
      return parsed.courses;
    }
    return [];
  } catch (err) {
    console.error('Failed to load courses from localStorage:', err);
    return [];
  }
}

/**
 * 로컬스토리지에 전체 과정 목록 저장하기
 */
export function saveAllCourses(courses: CourseAnalysisResult[]): void {
  try {
    const data: CumulativeStorage = {
      version: 1,
      updatedAt: new Date().toISOString(),
      courses,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    throw new Error('로컬 저장소 공간이 부족하거나 저장 중 오류가 발생했습니다.');
  }
}

/**
 * 단일 과정 결과를 누적 저장소에 추가 또는 덮어쓰기
 * 동일한 (연도 + 과정명)이 존재할 경우 기존 데이터를 대체
 */
export function saveCourseToCumulative(course: CourseAnalysisResult): {
  isOverwritten: boolean;
  updatedCourses: CourseAnalysisResult[];
} {
  const current = loadStoredCourses();
  const existingIndex = current.findIndex(
    (c) =>
      c.year === course.year &&
      c.courseName.trim().toLowerCase() === course.courseName.trim().toLowerCase()
  );

  let isOverwritten = false;
  let updated: CourseAnalysisResult[];

  if (existingIndex >= 0) {
    isOverwritten = true;
    updated = [...current];
    updated[existingIndex] = { ...course, id: current[existingIndex].id };
  } else {
    updated = [course, ...current];
  }

  saveAllCourses(updated);
  return { isOverwritten, updatedCourses: updated };
}

/**
 * 저장소에서 특정 과정 삭제
 */
export function removeCourseFromCumulative(courseId: string): CourseAnalysisResult[] {
  const current = loadStoredCourses();
  const updated = current.filter((c) => c.id !== courseId);
  saveAllCourses(updated);
  return updated;
}

/**
 * 누적 데이터 백업 (JSON 파일 다운로드)
 */
export function exportBackupJSON(courses: CourseAnalysisResult[]): void {
  const backupData: CumulativeStorage = {
    version: 1,
    updatedAt: new Date().toISOString(),
    courses,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  link.download = `교육과정_만족도_누적백업_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 누적 데이터 복원 (JSON 파일 파싱 및 복원)
 */
export function importBackupJSON(file: File): Promise<{
  success: boolean;
  count: number;
  courses: CourseAnalysisResult[];
  message: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        let incomingCourses: CourseAnalysisResult[] = [];
        if (parsed && Array.isArray(parsed.courses)) {
          incomingCourses = parsed.courses;
        } else if (Array.isArray(parsed)) {
          incomingCourses = parsed;
        } else {
          resolve({
            success: false,
            count: 0,
            courses: [],
            message: '올바른 백업 JSON 파일 형식이 아닙니다.',
          });
          return;
        }

        if (incomingCourses.length === 0) {
          resolve({
            success: false,
            count: 0,
            courses: [],
            message: '백업 파일 내에 저장된 과정 데이터가 없습니다.',
          });
          return;
        }

        // 기존 데이터와 병합 (연도+과정명 기준 중복 시 최신 복원 파일 우선)
        const current = loadStoredCourses();
        const mergedMap = new Map<string, CourseAnalysisResult>();

        current.forEach((c) => {
          mergedMap.set(`${c.year}_${c.courseName}`, c);
        });
        incomingCourses.forEach((c) => {
          mergedMap.set(`${c.year}_${c.courseName}`, c);
        });

        const mergedCourses = Array.from(mergedMap.values());
        saveAllCourses(mergedCourses);

        resolve({
          success: true,
          count: incomingCourses.length,
          courses: mergedCourses,
          message: `성공적으로 ${incomingCourses.length}개 과정 데이터를 복원 및 동기화했습니다.`,
        });
      } catch (err) {
        console.error('Failed to parse backup JSON:', err);
        resolve({
          success: false,
          count: 0,
          courses: [],
          message: 'JSON 파일 읽기 실패: 파일 내용이 손상되었거나 유효하지 않습니다.',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        count: 0,
        courses: [],
        message: '파일을 읽는 도중 오류가 발생했습니다.',
      });
    };

    reader.readAsText(file);
  });
}
