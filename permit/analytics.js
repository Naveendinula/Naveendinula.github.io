/*
Truth table for analytics metrics:

- Summary window (ward/community):
  Source: ward_summary.csv or community_summary.csv.
  Leaders by retrofit activity: top 3 by retrofit_likely count.
  Leaders by retrofit rate: top 3 by (retrofit_likely / permits) with permits >= 50.
  Top category: max of {heat_pump, insulation, hvac, elec_upg, ductwork, lighting, envelope}.

- Retrofit Activity Pulse chart:
  Source: retrofit_activity_weekly.csv.
  Series values: weekly counts for HEAT_PUMP, INSULATION, ELECTRICAL_UPGRADE, ENVELOPE,
  HVAC_GENERAL, LIGHTING_RETROFIT; rolling avg from rolling_avg_4w.
  Date grouping: week_start (ISO week start); last 52 weeks displayed.

- Cumulative Retrofits chart:
  Source: retrofit_activity_weekly.csv.
  Series values: cumulative sums of weekly category counts over time; last 72 weeks displayed.

- Permit Processing Leaderboard (overview):
  Source: processing_time_by_ward.csv (median_days, p25, p75, permits).
  Retrofit counts: ward_summary.csv retrofit_likely (joined by ward).
  City median: weighted median of ward medians (weights = permits).

- Processing Time Trend chart:
  Source: processing_time_monthly.csv (city_median_days, fast_wards_days, slow_wards_days).
  Date grouping: month (YYYY-MM-01); rendered in local time.

- Processing Timeline chart:
  Source: processing_time_monthly.csv (category-specific median days).
  Date grouping: month (YYYY-MM-01); rendered in local time.
*/

export const SUMMARY_CATEGORIES = [
  { key: 'heat_pump', label: 'Heat Pump' },
  { key: 'insulation', label: 'Insulation' },
  { key: 'hvac', label: 'HVAC' },
  { key: 'elec_upg', label: 'Elec Upgrade' },
  { key: 'ductwork', label: 'Ductwork' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'envelope', label: 'Envelope' }
];

export const WEEKLY_CATEGORIES = [
  { key: 'HEAT_PUMP', label: 'Heat Pump', color: '#dc2626' },
  { key: 'INSULATION', label: 'Insulation', color: '#ea580c' },
  { key: 'ELECTRICAL_UPGRADE', label: 'Electrical Upgrade', color: '#d97706' },
  { key: 'ENVELOPE', label: 'Envelope', color: '#65a30d' },
  { key: 'HVAC_GENERAL', label: 'HVAC General', color: '#2563eb' },
  { key: 'LIGHTING_RETROFIT', label: 'Lighting Retrofit', color: '#0284c7' }
];

const MIN_PERMITS_FOR_RATE = 50;

function toNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toNumberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function formatMonthLabel(date) {
  if (!date) {
    return '';
  }

  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function getValidKey(key) {
  return key !== '' && key !== '0' && key !== null && key !== undefined;
}

function getTopCategory(row) {
  const categories = SUMMARY_CATEGORIES.map((category) => ({
    label: category.label,
    value: toNumber(row[category.key])
  }));

  const sorted = categories.filter((category) => category.value > 0).sort((a, b) => b.value - a.value);

  if (sorted.length === 0) {
    return { label: 'None', value: 0 };
  }

  return sorted[0];
}

export function computeOverviewStats(wardSummary, communitySummary) {
  const wardEntries = Array.from(wardSummary.entries());
  const communityEntries = Array.from(communitySummary.entries());

  const totalPermits = wardEntries.reduce((sum, [, row]) => sum + toNumber(row.permits), 0);
  const totalWards = wardEntries.filter(([key]) => getValidKey(key)).length;
  const totalCommunities = communityEntries.filter(([key]) => getValidKey(key)).length;

  return {
    totalPermits,
    totalWards,
    totalCommunities
  };
}

export function computeSummaryLeaders(summaryMap) {
  const rows = Array.from(summaryMap.entries())
    .map(([key, row]) => ({
      key: String(key),
      permits: toNumber(row.permits),
      retrofitLikely: toNumber(row.retrofit_likely),
      topCategory: getTopCategory(row)
    }))
    .filter((row) => getValidKey(row.key));

  const activityLeaders = [...rows]
    .sort((a, b) => b.retrofitLikely - a.retrofitLikely)
    .slice(0, 3)
    .map((row) => ({
      ...row,
      retrofitRate: row.permits > 0 ? row.retrofitLikely / row.permits : 0
    }));

  const rateLeaders = rows
    .filter((row) => row.permits >= MIN_PERMITS_FOR_RATE)
    .map((row) => ({
      ...row,
      retrofitRate: row.permits > 0 ? row.retrofitLikely / row.permits : 0
    }))
    .sort((a, b) => b.retrofitRate - a.retrofitRate)
    .slice(0, 3);

  const highlightKeys = Array.from(new Set([
    ...activityLeaders.map((row) => row.key),
    ...rateLeaders.map((row) => row.key)
  ]));

  return {
    activityLeaders,
    rateLeaders,
    highlightKeys
  };
}

export function computeRetrofitPulseSeries(weeklyRows) {
  const rows = weeklyRows
    .map((row) => {
      const weekStart = parseDate(row.week_start);
      return {
        week: row.iso_year_week || '',
        weekStart,
        rollingAverage: toNumber(row.rolling_avg_4w),
        stackedTotal: toNumber(row.stacked_total),
        categories: WEEKLY_CATEGORIES.reduce((acc, category) => {
          acc[category.key] = toNumber(row[category.key]);
          return acc;
        }, {})
      };
    })
    .filter((row) => row.weekStart);

  rows.sort((a, b) => a.weekStart - b.weekStart);

  return rows.slice(-52);
}

export function computeCumulativeRetrofitSeries(weeklyRows) {
  const rows = weeklyRows
    .map((row) => ({
      week: row.iso_year_week || '',
      date: parseDate(row.week_start),
      categories: WEEKLY_CATEGORIES.reduce((acc, category) => {
        acc[category.key] = toNumber(row[category.key]);
        return acc;
      }, {})
    }))
    .filter((row) => row.date);

  rows.sort((a, b) => a.date - b.date);

  const totals = WEEKLY_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = 0;
    return acc;
  }, {});

  const cumulative = rows.map((row) => {
    WEEKLY_CATEGORIES.forEach((category) => {
      totals[category.key] += row.categories[category.key];
    });

    return {
      week: row.week,
      date: row.date,
      categories: { ...totals }
    };
  });

  return cumulative.slice(-72);
}

function weightedMedian(values) {
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);
  let cumulative = 0;

  for (let i = 0; i < sorted.length; i += 1) {
    cumulative += sorted[i].weight;
    if (cumulative >= totalWeight / 2) {
      return sorted[i].value;
    }
  }

  return sorted.length ? sorted[sorted.length - 1].value : null;
}

export function computeProcessingLeaderboard(processingRows, wardSummary) {
  const wards = processingRows
    .filter((row) => row.WARD && toNumber(row.median_days) > 0)
    .map((row) => {
      const wardKey = String(row.WARD);
      const summary = wardSummary.get(wardKey);
      const permits = toNumber(row.permits);
      const retrofitLikely = summary ? toNumber(summary.retrofit_likely) : null;
      const retrofitRate = retrofitLikely !== null && permits > 0 ? retrofitLikely / permits : null;

      return {
        ward: wardKey,
        volume: permits,
        median: toNumber(row.median_days),
        p25: toNumberOrNull(row.p25),
        p75: toNumberOrNull(row.p75),
        retrofitLikely,
        retrofitRate
      };
    })
    .filter((row) => row.median > 0)
    .sort((a, b) => a.median - b.median);

  const weightedValues = wards
    .filter((row) => row.volume > 0)
    .map((row) => ({ value: row.median, weight: row.volume }));

  const cityMedian = weightedValues.length ? weightedMedian(weightedValues) : null;

  return {
    wards,
    cityMedian
  };
}

export function computeProcessingTrend(monthlyRows) {
  const months = monthlyRows
    .map((row) => {
      const date = parseDate(row.month);
      return {
        date,
        monthLabel: formatMonthLabel(date),
        cityMedian: toNumberOrNull(row.city_median_days),
        fastWards: toNumberOrNull(row.fast_wards_days),
        slowWards: toNumberOrNull(row.slow_wards_days)
      };
    })
    .filter((row) => row.date)
    .sort((a, b) => a.date - b.date);

  return months;
}

const OUTLIER_THRESHOLD_DAYS = 180;

function capOutlier(value) {
  if (value === null || value === undefined) {
    return null;
  }
  return value > OUTLIER_THRESHOLD_DAYS ? null : value;
}

export function computeProcessingTimeline(monthlyRows) {
  const months = monthlyRows
    .map((row) => {
      const date = parseDate(row.month);
      return {
        date,
        monthLabel: formatMonthLabel(date),
        cityMedian: toNumberOrNull(row.city_median_days),
        heat_pump: capOutlier(toNumberOrNull(row.HEAT_PUMP_median_days)),
        insulation: capOutlier(toNumberOrNull(row.INSULATION_median_days)),
        elec_upg: capOutlier(toNumberOrNull(row.ELECTRICAL_UPGRADE_median_days)),
        envelope: capOutlier(toNumberOrNull(row.ENVELOPE_median_days)),
        hvac: capOutlier(toNumberOrNull(row.HVAC_GENERAL_median_days)),
        lighting: capOutlier(toNumberOrNull(row.LIGHTING_RETROFIT_median_days)),
        heat_pump_raw: toNumberOrNull(row.HEAT_PUMP_median_days),
        insulation_raw: toNumberOrNull(row.INSULATION_median_days),
        elec_upg_raw: toNumberOrNull(row.ELECTRICAL_UPGRADE_median_days),
        envelope_raw: toNumberOrNull(row.ENVELOPE_median_days),
        hvac_raw: toNumberOrNull(row.HVAC_GENERAL_median_days),
        lighting_raw: toNumberOrNull(row.LIGHTING_RETROFIT_median_days)
      };
    })
    .filter((row) => row.date)
    .sort((a, b) => a.date - b.date);

  return months;
}

export function computeProvenance(data, overviewStats) {
  const weeklyDates = data.retrofitWeekly.map((row) => parseDate(row.week_start)).filter(Boolean);
  const monthlyDates = data.processingMonthly.map((row) => parseDate(row.month)).filter(Boolean);

  const weeklyRange = weeklyDates.length
    ? { start: new Date(Math.min(...weeklyDates)), end: new Date(Math.max(...weeklyDates)) }
    : null;
  const monthlyRange = monthlyDates.length
    ? { start: new Date(Math.min(...monthlyDates)), end: new Date(Math.max(...monthlyDates)) }
    : null;

  return {
    totalPermits: overviewStats.totalPermits,
    wardCount: overviewStats.totalWards,
    communityCount: overviewStats.totalCommunities,
    weeklyCount: data.retrofitWeekly.length,
    monthlyCount: data.processingMonthly.length,
    weeklyRange,
    monthlyRange
  };
}

export function detectProcessingOutliers(monthlyRows) {
  const outliers = [];
  const categoryKeys = ['HEAT_PUMP_median_days', 'INSULATION_median_days', 'ELECTRICAL_UPGRADE_median_days',
    'ENVELOPE_median_days', 'HVAC_GENERAL_median_days', 'LIGHTING_RETROFIT_median_days'];
  const categoryLabels = {
    HEAT_PUMP_median_days: 'Heat Pump',
    INSULATION_median_days: 'Insulation',
    ELECTRICAL_UPGRADE_median_days: 'Electrical Upgrade',
    ENVELOPE_median_days: 'Envelope',
    HVAC_GENERAL_median_days: 'HVAC General',
    LIGHTING_RETROFIT_median_days: 'Lighting Retrofit'
  };

  monthlyRows.forEach((row) => {
    const month = row.month || 'Unknown';
    categoryKeys.forEach((key) => {
      const value = toNumberOrNull(row[key]);
      if (value !== null && value > OUTLIER_THRESHOLD_DAYS) {
        outliers.push({
          month,
          category: categoryLabels[key] || key,
          value: Math.round(value),
          threshold: OUTLIER_THRESHOLD_DAYS
        });
      }
    });
  });

  return outliers;
}

export function computeDataQualityMetrics(wardSummary, communitySummary) {
  const wardEntries = Array.from(wardSummary.entries());
  const emptyWards = wardEntries.filter(([key]) => !getValidKey(key));
  const emptyWardPermits = emptyWards.reduce((sum, [, row]) => sum + toNumber(row.permits), 0);

  const totalPermits = wardEntries.reduce((sum, [, row]) => sum + toNumber(row.permits), 0);
  const validWards = wardEntries.filter(([key]) => getValidKey(key));
  const maxWardPermits = validWards.reduce((max, [, row]) => Math.max(max, toNumber(row.permits)), 0);
  const maxWardKey = validWards.find(([, row]) => toNumber(row.permits) === maxWardPermits)?.[0] || 'N/A';
  const avgWardPermits = validWards.length > 0
    ? Math.round(validWards.reduce((sum, [, row]) => sum + toNumber(row.permits), 0) / validWards.length)
    : 0;
  const dominanceRatio = avgWardPermits > 0 ? (maxWardPermits / avgWardPermits).toFixed(1) : 'N/A';

  return {
    emptyWardCount: emptyWards.length,
    emptyWardPermits,
    totalPermits,
    maxWardKey,
    maxWardPermits,
    avgWardPermits,
    dominanceRatio
  };
}

export function runSanityChecks(data, analytics) {
  const warnings = [];

  if (!data.retrofitWeekly.length) {
    warnings.push('Retrofit activity weekly data is missing.');
  }

  if (!data.processingMonthly.length) {
    warnings.push('Monthly processing time data is missing.');
  }

  if (analytics.overview.totalPermits === 0) {
    warnings.push('Summary totals show zero permits.');
  }

  if (data.retrofitWeekly.length) {
    const mismatches = data.retrofitWeekly.reduce((count, row) => {
      const stacked = toNumberOrNull(row.stacked_total);
      if (stacked === null) {
        return count;
      }

      const sum = WEEKLY_CATEGORIES.reduce((acc, category) => acc + toNumber(row[category.key]), 0);
      return Math.abs(sum - stacked) > 0.5 ? count + 1 : count;
    }, 0);

    if (mismatches > 0) {
      warnings.push(`Weekly stacked totals mismatch for ${mismatches} week(s).`);
    }
  }

  if (analytics.processingLeaderboard.cityMedian !== null) {
    const medians = analytics.processingLeaderboard.wards.map((row) => row.median);
    if (medians.length) {
      const min = Math.min(...medians);
      const max = Math.max(...medians);
      if (analytics.processingLeaderboard.cityMedian < min || analytics.processingLeaderboard.cityMedian > max) {
        warnings.push('City median falls outside the ward median range.');
      }
    }
  }

  const outliers = detectProcessingOutliers(data.processingMonthly);
  if (outliers.length > 0) {
    warnings.push(`${outliers.length} category-month processing time outlier(s) exceed ${OUTLIER_THRESHOLD_DAYS} days and were capped in timeline charts.`);
  }

  const dq = analytics.dataQuality;
  if (dq && dq.emptyWardPermits > 0) {
    warnings.push(`${dq.emptyWardPermits} permits have no ward assignment.`);
  }
  if (dq && dq.dominanceRatio !== 'N/A' && parseFloat(dq.dominanceRatio) > 3) {
    warnings.push(`Ward ${dq.maxWardKey} has ${dq.dominanceRatio}x the average ward volume (${dq.maxWardPermits.toLocaleString()} vs ${dq.avgWardPermits.toLocaleString()} avg). Cross-ward comparisons should use rates, not counts.`);
  }

  return warnings;
}
