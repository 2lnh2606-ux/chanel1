/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { RawSurveyData } from '../types';

/**
 * 업로드된 엑셀/CSV 파일을 브라우저 메모리 상에서 읽어 2D 배열로 변환하는 함수
 * 서버로 데이터를 전송하지 않음
 */
export async function parseExcelFile(file: File): Promise<RawSurveyData> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('파일에 유효한 시트가 존재하지 않습니다.');
  }

  // 첫 번째 시트 사용
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // header: 1 옵션으로 2차원 배열 형태로 추출 (행 단위)
  const rows: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(
    worksheet,
    { header: 1, defval: null }
  );

  if (!rows || rows.length === 0) {
    throw new Error('엑셀 파일이 비어 있습니다.');
  }

  // 첫 번째 행은 헤더(문항명)
  const rawHeaders = rows[0] || [];
  const headers = rawHeaders.map((h, i) => {
    const str = h !== null && h !== undefined ? String(h).trim() : '';
    return str.length > 0 ? str : `열 ${i + 1}`;
  });

  // 데이터 행 (빈 행 필터링)
  const dataRows = rows.slice(1).filter((row) => {
    if (!row || !Array.isArray(row)) return false;
    // 모든 셀이 null이거나 공백이면 제외
    return row.some(
      (cell) =>
        cell !== null &&
        cell !== undefined &&
        String(cell).trim() !== ''
    );
  });

  if (headers.length === 0) {
    throw new Error('헤더(첫 번째 행)에 문항명이 존재하지 않습니다.');
  }

  if (dataRows.length === 0) {
    throw new Error('헤더 아래에 분석할 설문 응답 데이터가 0건입니다.');
  }

  return {
    fileName: file.name,
    headers,
    rows: dataRows,
  };
}
