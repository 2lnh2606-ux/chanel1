/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ColumnType = 'course' | 'instructor' | 'opinion' | 'ignore';

export interface ColumnMapping {
  colIndex: number;
  originalHeader: string;
  type: ColumnType;
  customName?: string; // used for instructor or display name
  detectedType: ColumnType;
  sampleValues: (string | number | null | undefined)[];
}

export interface RawSurveyData {
  fileName: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

export interface ItemStat {
  id: string;
  colIndex: number;
  name: string;
  type: 'course' | 'instructor';
  avg: number;
  count: number;
  min: number;
  max: number;
  score100: number; // 100점 환산
  distribution: { [score: number]: number };
}

export interface InstructorStat extends ItemStat {
  rank: number;
  instructorName: string;
}

export interface RespondentScore {
  id: number;
  respondentIndex: number;
  courseAvg: number | null;
  instructorScores: { [instructorName: string]: number | null };
  courseScores: { [itemName: string]: number | null };
  rawRow: (string | number | null | undefined)[];
}

export interface OpinionItem {
  respondentIndex: number;
  questionName: string;
  text: string;
}

export interface CourseAnalysisResult {
  id: string; // unique identifier (e.g. `${year}_${courseName}`)
  year: string;
  courseName: string;
  createdAt: string;
  fileName: string;
  totalRespondents: number;
  courseOverallAvg: number;
  instructorOverallAvg: number;
  courseItems: ItemStat[];
  instructorItems: InstructorStat[];
  respondentScores: RespondentScore[];
  opinions: OpinionItem[];
  columnMappings: ColumnMapping[];
  headers: string[];
}

export interface CumulativeStorage {
  version: number;
  updatedAt: string;
  courses: CourseAnalysisResult[];
}
