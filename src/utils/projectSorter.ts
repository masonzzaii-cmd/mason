import { Project } from '../types';

/**
 * Parses a project's year/date string into a numeric sortable value.
 * Handles formats like:
 * - "2024.06", "2024.6", "2024-06", "2024/06", "2024年6月"
 * - "2024.06.15", "2024-06-15"
 * - "2024"
 * - Ranges: "2023.08 — 2024.05", "2021.03 - 2025.04" (takes the latest date in range)
 */
export const parseProjectDateValue = (dateStr?: string): number => {
  if (!dateStr || typeof dateStr !== 'string') return 0;

  const trimmed = dateStr.trim();
  if (!trimmed) return 0;

  // If there are multiple date tokens (like ranges e.g. "2023.08 - 2024.05" or "2021.03 — 2025.04")
  // Extract all 4-digit years with their optional months and calculate the max date
  const dateSegmentRegex = /(\d{4})(?:[.\-/年](\d{1,2}))?(?:[.\-/月](\d{1,2}))?/g;
  let maxScore = 0;
  let match: RegExpExecArray | null;

  while ((match = dateSegmentRegex.exec(trimmed)) !== null) {
    const year = parseInt(match[1], 10);
    const month = match[2] ? parseInt(match[2], 10) : 1;
    const day = match[3] ? parseInt(match[3], 10) : 1;

    // Sanity check on year
    if (year >= 1900 && year <= 2100) {
      const score = year * 10000 + Math.min(Math.max(month, 1), 12) * 100 + Math.min(Math.max(day, 1), 31);
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }

  if (maxScore > 0) {
    return maxScore;
  }

  // Fallback: search for any 4 digit number
  const yearMatch = trimmed.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10) * 10000 + 100 + 1;
  }

  return 0;
};

/**
 * Sorts an array of projects by their year/date in descending order (latest first).
 * Automatically updates project numbers (01, 02, 03...) to match the chronological order.
 */
export const sortProjectsByDateDesc = (projects: Project[]): Project[] => {
  if (!Array.isArray(projects)) return [];

  const sorted = [...projects].sort((a, b) => {
    const scoreA = parseProjectDateValue(a.year);
    const scoreB = parseProjectDateValue(b.year);

    if (scoreB !== scoreA) {
      return scoreB - scoreA; // Descending: newest date first
    }

    // Tie-breaker: sort by title
    return (a.title || '').localeCompare(b.title || '', 'zh-CN');
  });

  // Re-number projects sequentially so "NO. 01" is the latest project
  return sorted.map((item, index) => ({
    ...item,
    number: String(index + 1).padStart(2, '0'),
  }));
};
