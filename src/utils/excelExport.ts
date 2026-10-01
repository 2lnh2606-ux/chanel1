/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { CourseAnalysisResult } from '../types';
import { buildComparisonMatrix } from './calculation';

/**
 * 특정 과정의 분석 결과를 3개 시트(과정만족도, 교수만족도, 응답자별)로 구성하여 엑셀로 내려받는 함수
 */
export function exportCourseResultToExcel(course: CourseAnalysisResult): void {
  const wb = XLSX.utils.book_new();

  // 1. [과정만족도] 시트 구성
  const sheet1Data: (string | number)[][] = [
    ['교육과정 만족도 항목별 분석 결과'],
    [
      `과정명: ${course.courseName}`,
      `연도: ${course.year}`,
      `총 응답자: ${course.totalRespondents}명`,
      `과정 전체 평균: ${course.courseOverallAvg}점`,
    ],
    [],
    [
      '번호',
      '문항(평가 항목명)',
      '평균 점수 (5점 만점)',
      '100점 환산 점수',
      '유효 응답수',
      '최고점',
      '최저점',
    ],
  ];

  course.courseItems.forEach((item, idx) => {
    sheet1Data.push([
      idx + 1,
      item.name,
      item.avg,
      item.score100,
      item.count,
      item.max,
      item.min,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  // 컬럼 너비 지정
  ws1['!cols'] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '과정만족도');

  // 2. [교수만족도] 시트 구성
  const sheet2Data: (string | number)[][] = [
    ['교수(강사) 만족도 분석 결과'],
    [
      `과정명: ${course.courseName}`,
      `연도: ${course.year}`,
      `교수 전체 평균: ${course.instructorOverallAvg}점`,
    ],
    [],
    [
      '순위',
      '교수 / 교과목명',
      '평균 점수 (5점 만점)',
      '100점 환산 점수',
      '유효 응답수',
      '최고점',
      '최저점',
    ],
  ];

  course.instructorItems.forEach((item) => {
    sheet2Data.push([
      `${item.rank}위`,
      item.instructorName,
      item.avg,
      item.score100,
      item.count,
      item.max,
      item.min,
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '교수만족도');

  // 3. [응답자별] 시트 구성
  const headerRow3: (string | number)[] = ['응답자 번호', '과정 평균'];
  course.instructorItems.forEach((inst) => {
    headerRow3.push(`[교수] ${inst.instructorName}`);
  });
  course.courseItems.forEach((item) => {
    headerRow3.push(`[과정] ${item.name}`);
  });

  const sheet3Data: (string | number)[][] = [
    ['응답자별 상세 점수표'],
    headerRow3,
  ];

  course.respondentScores.forEach((r) => {
    const row: (string | number)[] = [r.respondentIndex, r.courseAvg ?? '-'];
    course.instructorItems.forEach((inst) => {
      const val = r.instructorScores[inst.instructorName];
      row.push(val !== null && val !== undefined ? val : '-');
    });
    course.courseItems.forEach((item) => {
      const val = r.courseScores[item.name];
      row.push(val !== null && val !== undefined ? val : '-');
    });
    sheet3Data.push(row);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, '응답자별');

  // 파일 내려받기 실행
  const safeName = `${course.year}_${course.courseName}`.replace(
    /[\s/\\?%*:|"<>]/g,
    '_'
  );
  XLSX.writeFile(wb, `${safeName}_만족도결과보고.xlsx`);
}

/**
 * 누적 저장된 다개년/다과정 비교표를 엑셀 파일로 내려받는 함수
 */
export function exportComparisonToExcel(courses: CourseAnalysisResult[]): void {
  if (courses.length === 0) return;

  const { matrixRows } = buildComparisonMatrix(courses);
  const wb = XLSX.utils.book_new();

  const courseHeaders = courses.map((c) => `[${c.year}] ${c.courseName}`);
  const headerRow: string[] = ['구분', '항목명', ...courseHeaders];

  const data: (string | number)[][] = [
    ['교육과정별 만족도 누적 비교 분석표'],
    [
      `추출일시: ${new Date().toLocaleDateString('ko-KR')}`,
      `비교 대상 과정 수: ${courses.length}개`,
    ],
    [],
    headerRow,
  ];

  matrixRows.forEach((row) => {
    let cat = '과정 문항';
    if (row.rowCategory === 'summary') cat = '★ 종합 요약';
    else if (row.rowCategory === 'instructor_item') cat = '교수(강사)';

    const rowData: (string | number)[] = [cat, row.itemName];
    courses.forEach((c) => {
      const v = row.courseValues[c.id];
      if (row.itemName === '총 응답자 수') {
        rowData.push(v?.count !== null && v?.count !== undefined ? `${v.count}명` : '-');
      } else {
        rowData.push(v?.avg !== null && v?.avg !== undefined ? v.avg : '-');
      }
    });
    data.push(rowData);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 42 },
    ...courses.map(() => ({ wch: 25 })),
  ];
  XLSX.utils.book_append_sheet(wb, ws, '과정별누적비교표');

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `교육과정_누적만족도_비교표_${today}.xlsx`);
}
