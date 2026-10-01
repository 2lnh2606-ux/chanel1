/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ColumnMapping,
  ColumnType,
  CourseAnalysisResult,
  InstructorStat,
  ItemStat,
  OpinionItem,
  RawSurveyData,
  RespondentScore,
} from '../types';

/**
 * 셀 값이 유효한 숫자인지 판정하고 파싱하는 함수
 * 빈 칸이나 문자열 기호('-', 'N/A') 등은 null로 처리하여 계산에서 제외
 */
export function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === '' || str === '-' || str.toLowerCase() === 'n/a' || str === '.') {
    return null;
  }
  const num = Number(str);
  if (isNaN(num)) return null;
  return num;
}

/**
 * 헤더명과 샘플 데이터 분포를 기반으로 열 구분을 자동 추정하는 함수
 * - 숫자 비율 80% 이상 & 최대값 10 이하: 척도 문항 후보
 * - 헤더에 교수·강사·강의·교관 키워드가 있으면: 교수
 * - 번호·순번·성명·이름·기수 키워드가 있으면: 무시
 * - 의견·건의·기타·소감 키워드가 있거나 텍스트 위주이면: 의견
 */
export function autoDetectColumnType(
  header: string,
  sampleValues: unknown[]
): ColumnType {
  const h = (header || '').toLowerCase().trim();

  // 1. 제외/무시 키워드 우선 체크
  const ignoreKeywords = [
    '번호',
    '순번',
    '성명',
    '이름',
    '기수',
    '학번',
    '사번',
    '소속',
    '부서',
    '직급',
    '이메일',
    'email',
    '연락처',
    '전화',
    '제출일시',
    '타임스탬프',
    'timestamp',
    'id',
    'no',
  ];
  if (ignoreKeywords.some((k) => h === k || h.startsWith(k + ' ') || h.includes(`[${k}]`))) {
    return 'ignore';
  }

  // 2. 주관식 의견 키워드 우선 체크
  const opinionKeywords = [
    '의견',
    '건의',
    '기타',
    '소감',
    '바라는',
    '피드백',
    '개선사항',
    '주관식',
    '하고싶은',
    '메모',
  ];
  if (opinionKeywords.some((k) => h.includes(k))) {
    return 'opinion';
  }

  // 3. 샘플 데이터 값의 숫자 비율 및 범위 분석
  const validSamples = sampleValues.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== ''
  );

  let numericCount = 0;
  let maxVal = -Infinity;
  let minVal = Infinity;
  let totalLength = 0;

  validSamples.forEach((val) => {
    const num = parseNumericValue(val);
    if (num !== null) {
      numericCount++;
      if (num > maxVal) maxVal = num;
      if (num < minVal) minVal = num;
    }
    totalLength += String(val).trim().length;
  });

  const numericRatio =
    validSamples.length > 0 ? numericCount / validSamples.length : 0;
  const isNumericLikely =
    numericRatio >= 0.8 &&
    validSamples.length > 0 &&
    maxVal <= 10 &&
    minVal >= 0;

  // 4. 교수/강사 키워드 체크
  const instructorKeywords = [
    '교수',
    '강사',
    '강의',
    '교관',
    '멘토',
    '튜터',
    '코치',
    '과목',
    '교과목',
  ];
  const hasInstructorKeyword = instructorKeywords.some((k) => h.includes(k));

  if (hasInstructorKeyword) {
    // 교수 문항에 숫자가 주로 입력되는 경우
    return 'instructor';
  }

  if (isNumericLikely) {
    // 5점 척도 일반 과정 만족도 문항
    return 'course';
  }

  // 글자가 길거나 주관식 성격인 경우
  const avgLength =
    validSamples.length > 0 ? totalLength / validSamples.length : 0;
  if (avgLength > 10) {
    return 'opinion';
  }

  // 기본적으로 숫자가 없는 식별자성 열이면 무시, 아니면 과정으로 분류
  if (ignoreKeywords.some((k) => h.includes(k))) {
    return 'ignore';
  }

  return 'course';
}

/**
 * 소수점 둘째 자리 반올림 헬퍼
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * 과정 설문 데이터로부터 통계 지표와 응답자별 점수를 계산하는 메인 로직
 */
export function calculateCourseAnalysis(
  raw: RawSurveyData,
  mappings: ColumnMapping[],
  year: string,
  courseName: string
): CourseAnalysisResult {
  const { headers, rows, fileName } = raw;
  const totalRespondents = rows.length;

  const courseMappings = mappings.filter((m) => m.type === 'course');
  const instructorMappings = mappings.filter((m) => m.type === 'instructor');
  const opinionMappings = mappings.filter((m) => m.type === 'opinion');

  // 1. 과정만족도 항목별 통계 계산
  const courseItems: ItemStat[] = courseMappings.map((m) => {
    const values: number[] = [];
    const distribution: { [score: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    rows.forEach((row) => {
      const val = parseNumericValue(row[m.colIndex]);
      if (val !== null) {
        values.push(val);
        const roundedInt = Math.round(val);
        if (roundedInt >= 1 && roundedInt <= 5) {
          distribution[roundedInt] = (distribution[roundedInt] || 0) + 1;
        }
      }
    });

    const count = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = count > 0 ? roundToTwo(sum / count) : 0;
    const min = count > 0 ? Math.min(...values) : 0;
    const max = count > 0 ? Math.max(...values) : 0;
    const score100 = roundToTwo((avg / 5) * 100);

    return {
      id: `course_${m.colIndex}`,
      colIndex: m.colIndex,
      name: m.customName || m.originalHeader || `과정문항 ${m.colIndex + 1}`,
      type: 'course',
      avg,
      count,
      min,
      max,
      score100,
      distribution,
    };
  });

  // 2. 교수만족도 항목별 통계 계산 및 순위 매기기
  const rawInstructorStats: (ItemStat & { instructorName: string })[] =
    instructorMappings.map((m) => {
      const values: number[] = [];
      const distribution: { [score: number]: number } = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      rows.forEach((row) => {
        const val = parseNumericValue(row[m.colIndex]);
        if (val !== null) {
          values.push(val);
          const roundedInt = Math.round(val);
          if (roundedInt >= 1 && roundedInt <= 5) {
            distribution[roundedInt] = (distribution[roundedInt] || 0) + 1;
          }
        }
      });

      const count = values.length;
      const sum = values.reduce((acc, v) => acc + v, 0);
      const avg = count > 0 ? roundToTwo(sum / count) : 0;
      const min = count > 0 ? Math.min(...values) : 0;
      const max = count > 0 ? Math.max(...values) : 0;
      const score100 = roundToTwo((avg / 5) * 100);
      const instructorName =
        m.customName || m.originalHeader || `교수/강사 ${m.colIndex + 1}`;

      return {
        id: `instructor_${m.colIndex}`,
        colIndex: m.colIndex,
        name: instructorName,
        instructorName,
        type: 'instructor',
        avg,
        count,
        min,
        max,
        score100,
        distribution,
      };
    });

  // 교수 순위 계산: 평균 기준 내림차순 정렬 후 순위 부여 (동점자 동일 순위)
  const sortedInstructors = [...rawInstructorStats].sort(
    (a, b) => b.avg - a.avg
  );
  let currentRank = 1;
  const instructorItems: InstructorStat[] = sortedInstructors.map(
    (item, idx, arr) => {
      if (idx > 0 && item.avg < arr[idx - 1].avg) {
        currentRank = idx + 1;
      }
      return {
        ...item,
        rank: currentRank,
      };
    }
  );

  // 3. 전체 평균 계산
  // 과정만족도 전체 평균 (유효한 모든 과정 문항 응답의 총합 / 총 유효 응답수)
  let totalCourseSum = 0;
  let totalCourseValidCount = 0;
  courseItems.forEach((item) => {
    totalCourseSum += item.avg * item.count;
    totalCourseValidCount += item.count;
  });
  const courseOverallAvg =
    totalCourseValidCount > 0
      ? roundToTwo(totalCourseSum / totalCourseValidCount)
      : 0;

  // 교수만족도 전체 평균
  let totalInstSum = 0;
  let totalInstValidCount = 0;
  instructorItems.forEach((item) => {
    totalInstSum += item.avg * item.count;
    totalInstValidCount += item.count;
  });
  const instructorOverallAvg =
    totalInstValidCount > 0
      ? roundToTwo(totalInstSum / totalInstValidCount)
      : 0;

  // 4. 응답자별 점수표 계산
  const respondentScores: RespondentScore[] = rows.map((row, rIdx) => {
    const courseScores: { [itemName: string]: number | null } = {};
    const instructorScores: { [instructorName: string]: number | null } = {};

    let rCourseSum = 0;
    let rCourseCount = 0;

    courseMappings.forEach((m) => {
      const val = parseNumericValue(row[m.colIndex]);
      const key = m.customName || m.originalHeader;
      courseScores[key] = val;
      if (val !== null) {
        rCourseSum += val;
        rCourseCount++;
      }
    });

    instructorMappings.forEach((m) => {
      const val = parseNumericValue(row[m.colIndex]);
      const key = m.customName || m.originalHeader;
      instructorScores[key] = val;
    });

    const courseAvg =
      rCourseCount > 0 ? roundToTwo(rCourseSum / rCourseCount) : null;

    return {
      id: rIdx + 1,
      respondentIndex: rIdx + 1,
      courseAvg,
      instructorScores,
      courseScores,
      rawRow: row,
    };
  });

  // 5. 주관식 의견 목록 추출
  const opinions: OpinionItem[] = [];
  rows.forEach((row, rIdx) => {
    opinionMappings.forEach((m) => {
      const rawVal = row[m.colIndex];
      if (rawVal !== null && rawVal !== undefined) {
        const text = String(rawVal).trim();
        if (text.length > 0 && text !== '-' && text.toLowerCase() !== 'n/a') {
          opinions.push({
            respondentIndex: rIdx + 1,
            questionName: m.originalHeader,
            text,
          });
        }
      }
    });
  });

  const id = `${year}_${courseName.replace(/\s+/g, '_')}_${Date.now()}`;

  return {
    id,
    year,
    courseName,
    createdAt: new Date().toISOString(),
    fileName,
    totalRespondents,
    courseOverallAvg,
    instructorOverallAvg,
    courseItems,
    instructorItems,
    respondentScores,
    opinions,
    columnMappings: mappings,
    headers,
  };
}

/**
 * 여러 과정의 누적 비교 매트릭스 계산 함수
 * 열: 과정(연도 과정명)
 * 행: [요약] 과정 평균, [요약] 교수 평균, [요약] 응답자 수, 그리고 개별 항목들
 */
export interface ComparisonMatrixRow {
  rowCategory: 'summary' | 'course_item' | 'instructor_item';
  itemName: string;
  courseValues: {
    [courseId: string]: {
      avg: number | null;
      count: number | null;
      rank?: number | null;
    };
  };
}

export function buildComparisonMatrix(courses: CourseAnalysisResult[]): {
  courses: CourseAnalysisResult[];
  matrixRows: ComparisonMatrixRow[];
} {
  if (courses.length === 0) {
    return { courses: [], matrixRows: [] };
  }

  const matrixRows: ComparisonMatrixRow[] = [];

  // 1. 요약 행 3개 (최상단)
  const summaryCourseAvgRow: ComparisonMatrixRow = {
    rowCategory: 'summary',
    itemName: '과정만족도 종합 평균',
    courseValues: {},
  };
  const summaryInstructorAvgRow: ComparisonMatrixRow = {
    rowCategory: 'summary',
    itemName: '교수만족도 종합 평균',
    courseValues: {},
  };
  const summaryCountRow: ComparisonMatrixRow = {
    rowCategory: 'summary',
    itemName: '총 응답자 수',
    courseValues: {},
  };

  courses.forEach((c) => {
    summaryCourseAvgRow.courseValues[c.id] = {
      avg: c.courseOverallAvg,
      count: c.totalRespondents,
    };
    summaryInstructorAvgRow.courseValues[c.id] = {
      avg: c.instructorOverallAvg,
      count: c.totalRespondents,
    };
    summaryCountRow.courseValues[c.id] = {
      avg: null,
      count: c.totalRespondents,
    };
  });

  matrixRows.push(summaryCourseAvgRow);
  matrixRows.push(summaryInstructorAvgRow);
  matrixRows.push(summaryCountRow);

  // 2. 고유 과정 문항 추출
  const courseItemNames = new Set<string>();
  courses.forEach((c) => {
    c.courseItems.forEach((item) => courseItemNames.add(item.name));
  });

  courseItemNames.forEach((itemName) => {
    const row: ComparisonMatrixRow = {
      rowCategory: 'course_item',
      itemName,
      courseValues: {},
    };
    courses.forEach((c) => {
      const match = c.courseItems.find((it) => it.name === itemName);
      if (match) {
        row.courseValues[c.id] = {
          avg: match.avg,
          count: match.count,
        };
      } else {
        row.courseValues[c.id] = {
          avg: null,
          count: null,
        };
      }
    });
    matrixRows.push(row);
  });

  // 3. 고유 교수/과목 항목 추출
  const instructorNames = new Set<string>();
  courses.forEach((c) => {
    c.instructorItems.forEach((inst) =>
      instructorNames.add(inst.instructorName)
    );
  });

  instructorNames.forEach((instName) => {
    const row: ComparisonMatrixRow = {
      rowCategory: 'instructor_item',
      itemName: instName,
      courseValues: {},
    };
    courses.forEach((c) => {
      const match = c.instructorItems.find(
        (it) => it.instructorName === instName
      );
      if (match) {
        row.courseValues[c.id] = {
          avg: match.avg,
          count: match.count,
          rank: match.rank,
        };
      } else {
        row.courseValues[c.id] = {
          avg: null,
          count: null,
          rank: null,
        };
      }
    });
    matrixRows.push(row);
  });

  return {
    courses,
    matrixRows,
  };
}

/**
 * 테스트용 샘플 데이터 생성 함수
 * 요구사항: 과정 문항 8개, 교수 문항 3개, 응답자 30명, 임의의 5점 척도 값, 주관식 의견
 */
export function generateSampleData(): {
  raw: RawSurveyData;
  defaultYear: string;
  defaultCourseName: string;
} {
  const headers = [
    '응답자 번호',
    '성명(비공개)',
    '1. 교육목표의 명확성 및 기대 부합도',
    '2. 교재 및 실습자료의 충실도',
    '3. 실무 업무 적용 가능성 및 유용성',
    '4. 강의 시간 배분 및 진도 적절성',
    '5. 실습 환경 및 전산 기자재 만족도',
    '6. 교육 운영 지원 및 안내 만족도',
    '7. 교육 난이도의 적절성',
    '8. 본 교육과정의 타인 추천 의향',
    '[교수평가] 김영호 교수 (빅데이터 분석 기법)',
    '[교수평가] 이지은 수석강사 (파이썬 실습 및 데이터 파이프라인)',
    '[교수평가] 박준형 겸임교수 (머신러닝 & 딥러닝 모델링)',
    '교육과정 총평 및 개선을 위한 주관식 건의사항',
  ];

  const sampleComments = [
    '강사님들의 실무 경험이 풍부하여 강의 집중도가 매우 높았습니다.',
    '실습 위주로 진행되어 업무에 바로 활용할 수 있는 인사이트를 얻었습니다.',
    '교재 내용이 체계적이고 실습 코드가 잘 정리되어 있어 복습에 큰 도움이 됩니다.',
    '실습 PC 환경이 매우 쾌적했고 운영진 분들의 신속한 지원에 감사드립니다.',
    '난이도가 다소 있는 부분은 보조 강사님의 1:1 질의응답 덕분에 잘 따라갈 수 있었습니다.',
    '머신러닝 알고리즘 수학적 기초가 조금 더 쉬운 예시로 보강되면 더욱 좋겠습니다.',
    '시간 배분이 알차고 최신 AI 트렌드를 빠르게 습득할 수 있어 주변에 강력 추천합니다.',
    '파이썬 실습 시간이 조금 더 넉넉했으면 좋았을 것 같습니다. 전반적으로 대만족입니다.',
    '앞으로도 이러한 실무 중심의 심화 과정이 계속 개설되길 바랍니다.',
    '과정 기획과 강사진 구성이 완벽했습니다. 다음 기수 동료들에게 추천하겠습니다.',
  ];

  const rows: (string | number | null)[][] = [];

  // 가중치를 두어 realistic한 5점 척도 점수 생성 (4점, 5점 빈도 높게)
  const getRandomRating = (bias: number = 0): number => {
    const r = Math.random();
    if (r < 0.05) return 2;
    if (r < 0.2) return 3;
    if (r < 0.55 - bias) return 4;
    return 5;
  };

  for (let i = 1; i <= 30; i++) {
    const respondentId = `R-${String(i).padStart(3, '0')}`;
    const maskName = `교육생_${i}`;

    const course1 = getRandomRating(0.1);
    const course2 = getRandomRating(0.05);
    const course3 = getRandomRating(0.15); // 실무 유용성 높게
    const course4 = getRandomRating();
    const course5 = getRandomRating(0.05);
    const course6 = getRandomRating(0.1);
    const course7 = getRandomRating(-0.05); // 난이도
    const course8 = getRandomRating(0.15); // 추천 의향

    const inst1 = getRandomRating(0.2); // 김영호 교수 (높은 점수)
    const inst2 = getRandomRating(0.1); // 이지은 강사
    const inst3 = getRandomRating(0.05); // 박준형 교수

    const comment =
      i % 3 === 0
        ? sampleComments[Math.floor(Math.random() * sampleComments.length)]
        : i % 2 === 0
        ? '전반적으로 만족스러운 교육이었습니다.'
        : '';

    rows.push([
      respondentId,
      maskName,
      course1,
      course2,
      course3,
      course4,
      course5,
      course6,
      course7,
      course8,
      inst1,
      inst2,
      inst3,
      comment,
    ]);
  }

  const currentYear = new Date().getFullYear().toString();

  return {
    raw: {
      fileName: '2026_빅데이터_AI_서비스기획과정_만족도_결과.xlsx',
      headers,
      rows,
    },
    defaultYear: currentYear,
    defaultCourseName: '빅데이터 기반 AI 서비스 기획 과정',
  };
}
