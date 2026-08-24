import { Project } from '../types';

/**
 * Parses a project's year/date string into a numeric sortable value.
 * Higher = newer = sorts first in DESC order.
 *
 * Rules:
 *  - Missing / malformed → -Infinity （放到最后面，保证所有有日期的项目都在前面）
 *  - Only year, no month → 当作该年 12 月（把"全年项目"排在该年 12 月位置）
 *  - Ranges like "2023.08 — 2024.05" → 取末端日期排序（把项目按"完成时间"排）
 *
 * Handles formats:
 *  - "2024.06", "2024.6", "2024-06", "2024/06", "2024年6月"
 *  - "2024.06.15", "2024-06-15"
 *  - "2024"
 *  - Ranges: "2023.08 — 2024.05", "2021.03 - 2025.04" (takes the latest date in range)
 */
export const parseProjectDateValue = (dateStr?: string): number => {
  if (!dateStr || typeof dateStr !== 'string') return -Infinity;

  const trimmed = dateStr.trim();
  if (!trimmed) return -Infinity;

  // Extract all 4-digit years with their optional months and calculate the max date
  const dateSegmentRegex = /(\d{4})(?:[.\-/年](\d{1,2}))?(?:[.\-/月](\d{1,2})\s*(?:日)?)?/g;
  let maxScore = -Infinity;
  let match: RegExpExecArray | null;
  let anyMatched = false;

  while ((match = dateSegmentRegex.exec(trimmed)) !== null) {
    anyMatched = true;
    const year = parseInt(match[1], 10);
    // 关键：缺 month → 默认 12 月；缺 day → 默认 31 日（同月/同年里该项目会被推到该年最末尾，符合"全年=年底"）
    const month = match[2] ? parseInt(match[2], 10) : 12;
    const day = match[3] ? parseInt(match[3], 10) : 31;

    if (year >= 1900 && year <= 2100) {
      const m = Math.min(Math.max(month, 1), 12);
      const d = Math.min(Math.max(day, 1), 31);
      const score = year * 10000 + m * 100 + d;
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }

  if (anyMatched && maxScore !== -Infinity) {
    return maxScore;
  }

  // Fallback: search for any 4 digit number (standalone year)
  const yearMatch = trimmed.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    // 只有年份：默认 12/31
    return y * 10000 + 1200 + 31;
  }

  // 完全无法解析 → 排最后
  return -Infinity;
};

/**
 * Sorts an array of projects by their year/date in DESCENDING order (latest first).
 * Automatically updates project numbers (01, 02, 03...) to match the chronological order.
 *
 * Tie-break (same year+month+day):
 *   1) title 中文 localeCompare (按标题拼音排序，稳定)
 *   2) project.id (保证即使标题相同, 多次刷新顺序也不抖动)
 */
export const sortProjectsByDateDesc = (projects: Project[]): Project[] => {
  if (!Array.isArray(projects)) return [];

  const sorted = [...projects].sort((a, b) => {
    const scoreA = parseProjectDateValue(a.year);
    const scoreB = parseProjectDateValue(b.year);

    // 1. 主排序：日期得分降序 (新项目/有日期在前, 空值/坏数据在最后)
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // 2. 同月同日：按标题中文拼音稳定排序
    const titleCmp = (a.title || '').localeCompare(b.title || '', 'zh-CN', {
      numeric: true,
      sensitivity: 'base',
    });
    if (titleCmp !== 0) return titleCmp;

    // 3. 再相同：按 id 排序，保证刷新不抖动
    return (a.id || '').localeCompare(b.id || '', 'zh-CN');
  });

  // Re-number projects sequentially so "NO. 01" is the latest project
  return sorted.map((item, index) => ({
    ...item,
    number: String(index + 1).padStart(2, '0'),
  }));
};
