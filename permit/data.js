const DATA_ROOT = './assets/data/retrofit-v2';

export const DATA_FILES = {
  wardSummary: 'ward_summary.csv',
  communitySummary: 'community_summary.csv',
  retrofitWeekly: 'retrofit_activity_weekly.csv',
  processingByWard: 'processing_time_by_ward.csv',
  processingMonthly: 'processing_time_monthly.csv'
};

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function coerceValue(value) {
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return trimmed;
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return [];
  }

  const headers = splitCSVLine(lines[0]).map((header) => header.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCSVLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      const value = values[index] ?? '';
      row[header] = coerceValue(String(value));
    });

    rows.push(row);
  }

  return rows;
}

export function buildMap(rows, keyField) {
  const map = new Map();
  const keyName = keyField || (rows[0] ? Object.keys(rows[0])[0] : null);

  if (!keyName) {
    return map;
  }

  rows.forEach((row) => {
    const rawKey = row[keyName];
    const normalizedKey = rawKey === null || rawKey === undefined ? '' : String(rawKey);
    map.set(normalizedKey, row);
  });

  return map;
}

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.text();
}

async function loadCSV(filename) {
  const text = await fetchText(`${DATA_ROOT}/${filename}`);
  return parseCSV(text);
}

export async function loadPermitData() {
  const [
    wardRows,
    communityRows,
    weeklyRows,
    processingByWardRows,
    processingMonthlyRows
  ] = await Promise.all([
    loadCSV(DATA_FILES.wardSummary),
    loadCSV(DATA_FILES.communitySummary),
    loadCSV(DATA_FILES.retrofitWeekly),
    loadCSV(DATA_FILES.processingByWard),
    loadCSV(DATA_FILES.processingMonthly)
  ]);

  return {
    wardSummary: buildMap(wardRows),
    communitySummary: buildMap(communityRows),
    retrofitWeekly: weeklyRows,
    processingByWard: processingByWardRows,
    processingMonthly: processingMonthlyRows
  };
}

export function getDataSourcePath(filename) {
  return `${DATA_ROOT}/${filename}`;
}
