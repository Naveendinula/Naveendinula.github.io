import { WEEKLY_CATEGORIES } from './analytics.js';

const CHART_THEME = 'dark';

function getChartInstance(element) {
  if (!element) {
    return null;
  }

  const existing = echarts.getInstanceByDom(element);
  if (existing) {
    existing.dispose();
  }

  return echarts.init(element, CHART_THEME);
}

function bindResize(chart, element) {
  const handleResize = () => chart.resize();
  window.addEventListener('resize', handleResize);
  element._chartInstance = chart;
}

function showEmptyState(element, message) {
  if (!element) {
    return;
  }

  element.innerHTML = `<div class="chart-empty">${message}</div>`;
}

function formatValue(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }

  if (unit) {
    return `${value}${unit}`;
  }

  return value.toLocaleString();
}

export function initRetrofitPulseChart(element, pulseData) {
  if (!pulseData.length) {
    showEmptyState(element, 'No weekly retrofit data available.');
    return;
  }

  const chart = getChartInstance(element);
  if (!chart) {
    return;
  }

  const series = [
    ...WEEKLY_CATEGORIES.map((category) => ({
      name: category.label,
      type: 'line',
      stack: 'total',
      areaStyle: { color: category.color },
      lineStyle: { color: category.color, width: 0 },
      itemStyle: { color: category.color },
      emphasis: { focus: 'series' },
      data: pulseData.map((item) => item.categories[category.key] || 0),
      symbol: 'none'
    })),
    {
      name: '4-Week Rolling Avg',
      type: 'line',
      data: pulseData.map((item) => item.rollingAverage),
      lineStyle: { color: '#ffffff', width: 2, type: 'solid' },
      itemStyle: { color: '#ffffff' },
      symbol: 'circle',
      symbolSize: 3,
      z: 10
    }
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: [...WEEKLY_CATEGORIES.map((cat) => cat.label), '4-Week Rolling Avg'],
      textStyle: { color: '#cbd5e1', fontSize: 10, fontFamily: 'JetBrains Mono' },
      top: 5
    },
    dataZoom: [
      {
        type: 'slider',
        start: 75,
        end: 100,
        height: 20,
        bottom: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        fillerColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa'
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono',
          fontSize: 10
        }
      },
      {
        type: 'inside',
        start: 75,
        end: 100
      }
    ],
    grid: {
      left: '8%',
      right: '4%',
      bottom: '15%',
      top: '18%'
    },
    xAxis: {
      type: 'category',
      data: pulseData.map((item) => item.week),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        interval: Math.max(1, Math.floor(pulseData.length / 8))
      }
    },
    yAxis: {
      type: 'value',
      name: 'Count',
      nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
    },
    series
  };

  chart.setOption(option);
  bindResize(chart, element);
}

export function initProcessingLeaderboardChart(element, leaderboardData) {
  const wardData = leaderboardData.wards.slice(0, 12);
  if (!wardData.length) {
    showEmptyState(element, 'No processing leaderboard data available.');
    return;
  }

  const chart = getChartInstance(element);
  if (!chart) {
    return;
  }

  const maxVolume = Math.max(...wardData.map((ward) => ward.volume || 0));
  const zoomEnd = Math.min(100, (12 / wardData.length) * 100);
  const cityMedian = leaderboardData.cityMedian;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const dataPoint = params[0];
        const wardInfo = wardData[dataPoint.dataIndex];
        const retrofitValue = wardInfo.retrofitLikely;
        const retrofitRate = wardInfo.retrofitRate;
        const rateLabel = retrofitRate === null ? 'N/A' : `${(retrofitRate * 100).toFixed(1)}%`;

        return `
          <div style="font-family: JetBrains Mono;">
            <div style="font-weight: bold; color: #60a5fa;">Ward ${dataPoint.name}</div>
            <div>Volume: ${wardInfo.volume.toLocaleString()} permits</div>
            <div>Retrofit Likely: ${formatValue(retrofitValue)}</div>
            <div>Retrofit Rate: ${rateLabel}</div>
            <div>Median: ${formatValue(wardInfo.median, ' days')}</div>
            <div>Range: ${formatValue(wardInfo.p25, ' days')} - ${formatValue(wardInfo.p75, ' days')}</div>
            <div style="color: ${cityMedian !== null && wardInfo.median < cityMedian ? '#16a34a' : '#dc2626'};">
              ${cityMedian !== null && wardInfo.median < cityMedian ? 'Faster' : 'Slower'} than city median (${formatValue(cityMedian, ' days')})
            </div>
          </div>
        `;
      }
    },
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: zoomEnd,
        height: 20,
        bottom: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        fillerColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa'
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono',
          fontSize: 10
        }
      },
      {
        type: 'inside',
        start: 0,
        end: zoomEnd
      }
    ],
    grid: {
      left: '8%',
      right: '4%',
      bottom: '15%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: wardData.map((ward) => `Ward ${ward.ward}`),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10,
        fontFamily: 'JetBrains Mono',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Median Processing Time (days)',
      nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 10,
        fontFamily: 'JetBrains Mono'
      },
      splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
    },
    series: [
      {
        type: 'bar',
        data: wardData.map((ward) => ({
          value: ward.median,
          itemStyle: {
            color: cityMedian !== null && ward.median < cityMedian ? '#16a34a' : '#dc2626'
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      },
      {
        type: 'scatter',
        data: wardData.map((ward, index) => [index, ward.median, ward.volume]),
        symbolSize: (data) => {
          const minSize = 6;
          const maxSize = 15;
          if (!maxVolume) {
            return minSize;
          }
          return minSize + ((data[2] / maxVolume) * (maxSize - minSize));
        },
        itemStyle: {
          color: '#ffffff',
          opacity: 0.8
        },
        emphasis: {
          itemStyle: {
            color: '#60a5fa',
            opacity: 1
          }
        }
      }
    ]
  };

  chart.setOption(option);
  bindResize(chart, element);
}

export function initCumulativeRetrofitsChart(element, cumulativeData) {
  if (!cumulativeData.length) {
    showEmptyState(element, 'No cumulative retrofit data available.');
    return;
  }

  const chart = getChartInstance(element);
  if (!chart) {
    return;
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        let result = `<div style="font-family: JetBrains Mono;"><strong>${params[0].name}</strong><br/>`;
        params.forEach((param) => {
          result += `<span style="color: ${param.color};">- ${param.seriesName}: ${param.value.toLocaleString()}</span><br/>`;
        });
        return `${result}</div>`;
      }
    },
    legend: {
      data: WEEKLY_CATEGORIES.map((cat) => cat.label),
      textStyle: { color: '#cbd5e1', fontSize: 10, fontFamily: 'JetBrains Mono' },
      top: 5
    },
    dataZoom: [
      {
        type: 'slider',
        start: 60,
        end: 100,
        height: 20,
        bottom: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        fillerColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa'
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono',
          fontSize: 10
        }
      },
      {
        type: 'inside',
        start: 60,
        end: 100
      }
    ],
    grid: {
      left: '8%',
      right: '4%',
      bottom: '15%',
      top: '18%'
    },
    xAxis: {
      type: 'category',
      data: cumulativeData.map((item) => item.week),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        interval: Math.max(1, Math.floor(cumulativeData.length / 8))
      }
    },
    yAxis: {
      type: 'value',
      name: 'Cumulative Count',
      nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
    },
    series: WEEKLY_CATEGORIES.map((category) => ({
      name: category.label,
      type: 'line',
      data: cumulativeData.map((item) => item.categories[category.key]),
      lineStyle: { color: category.color, width: 3 },
      itemStyle: { color: category.color },
      symbol: 'circle',
      symbolSize: 4,
      smooth: true
    }))
  };

  chart.setOption(option);
  bindResize(chart, element);
}

export function initProcessingTimeTrendChart(element, trendData) {
  if (!trendData.length) {
    showEmptyState(element, 'No processing trend data available.');
    return;
  }

  const chart = getChartInstance(element);
  if (!chart) {
    return;
  }

  const zoomStart = Math.max(0, 100 - (12 / trendData.length) * 100);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        let result = `<div style="font-family: JetBrains Mono;"><strong>${params[0].name}</strong><br/>`;
        params.forEach((param) => {
          result += `<span style="color: ${param.color};">- ${param.seriesName}: ${formatValue(param.value, ' days')}</span><br/>`;
        });
        return `${result}</div>`;
      }
    },
    legend: {
      data: ['City Median', 'Fastest Wards', 'Slowest Wards'],
      textStyle: { color: '#cbd5e1', fontSize: 10, fontFamily: 'JetBrains Mono' },
      top: 5
    },
    dataZoom: [
      {
        type: 'slider',
        start: zoomStart,
        end: 100,
        height: 20,
        bottom: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        fillerColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa'
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono',
          fontSize: 10
        }
      },
      {
        type: 'inside',
        start: zoomStart,
        end: 100
      }
    ],
    grid: {
      left: '8%',
      right: '4%',
      bottom: '15%',
      top: '18%'
    },
    xAxis: {
      type: 'category',
      data: trendData.map((item) => item.monthLabel),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Processing Time (days)',
      nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
    },
    series: [
      {
        name: 'City Median',
        type: 'line',
        data: trendData.map((item) => item.cityMedian),
        lineStyle: { color: '#60a5fa', width: 3 },
        itemStyle: { color: '#60a5fa' },
        symbol: 'circle',
        symbolSize: 6,
        smooth: true
      },
      {
        name: 'Fastest Wards',
        type: 'line',
        data: trendData.map((item) => item.fastWards),
        lineStyle: { color: '#16a34a', width: 2, type: 'dashed' },
        itemStyle: { color: '#16a34a' },
        symbol: 'triangle',
        symbolSize: 5,
        smooth: true
      },
      {
        name: 'Slowest Wards',
        type: 'line',
        data: trendData.map((item) => item.slowWards),
        lineStyle: { color: '#dc2626', width: 2, type: 'dashed' },
        itemStyle: { color: '#dc2626' },
        symbol: 'diamond',
        symbolSize: 5,
        smooth: true
      }
    ]
  };

  chart.setOption(option);
  bindResize(chart, element);
}

export function initWardProcessingLeaderboardChart(element, leaderboardData) {
  const wardData = leaderboardData.wards;
  if (!wardData.length) {
    showEmptyState(element, 'No ward processing data available.');
    return;
  }

  const chart = getChartInstance(element);
  if (!chart) {
    return;
  }

  const zoomEnd = Math.min(100, (20 / wardData.length) * 100);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const dataPoint = params[0];
        const wardInfo = wardData[dataPoint.dataIndex];
        const isFast = leaderboardData.cityMedian !== null && wardInfo.median < leaderboardData.cityMedian;
        const rateLabel = wardInfo.retrofitRate === null ? 'N/A' : `${(wardInfo.retrofitRate * 100).toFixed(1)}%`;

        return `
          <div style="font-family: JetBrains Mono;">
            <div style="font-weight: bold; color: #60a5fa;">Ward ${wardInfo.ward}</div>
            <div>Median: ${formatValue(wardInfo.median, ' days')}</div>
            <div>Range: ${formatValue(wardInfo.p25, ' days')} - ${formatValue(wardInfo.p75, ' days')}</div>
            <div>Volume: ${wardInfo.volume.toLocaleString()} permits</div>
            <div>Retrofit Rate: ${rateLabel}</div>
            <div style="color: ${isFast ? '#16a34a' : '#dc2626'};">
              ${isFast ? 'Faster' : 'Slower'} than city median (${formatValue(leaderboardData.cityMedian, ' days')})
            </div>
          </div>
        `;
      }
    },
    dataZoom: [
      {
        type: 'slider',
        yAxisIndex: 0,
        start: 0,
        end: zoomEnd,
        width: 15,
        right: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        fillerColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa'
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono',
          fontSize: 10
        }
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        start: 0,
        end: zoomEnd
      }
    ],
    grid: {
      left: '25%',
      right: '8%',
      bottom: '8%',
      top: '8%'
    },
    xAxis: {
      type: 'value',
      name: 'Median Processing Time (days)',
      nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
    },
    yAxis: {
      type: 'category',
      data: wardData.map((ward) => `W${ward.ward}`),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
        fontFamily: 'JetBrains Mono'
      },
      inverse: true
    },
    series: [
      {
        type: 'bar',
        data: wardData.map((ward, index) => {
          const ratio = wardData.length > 1 ? index / (wardData.length - 1) : 0;
          const green = Math.round(22 + (220 - 22) * (1 - ratio));
          const red = Math.round(220 * ratio + 22 * (1 - ratio));
          const color = `rgb(${red}, ${green}, 38)`;

          return {
            value: ward.median,
            itemStyle: { color }
          };
        }),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        markLine: leaderboardData.cityMedian !== null ? {
          data: [
            {
              xAxis: leaderboardData.cityMedian,
              lineStyle: { color: '#60a5fa', width: 2, type: 'dashed' },
              label: {
                formatter: 'City Median: {c} days',
                color: '#60a5fa',
                fontFamily: 'JetBrains Mono',
                fontSize: 10
              }
            }
          ]
        } : undefined
      }
    ]
  };

  chart.setOption(option);
  bindResize(chart, element);
}

export function initProcessingTimelineChart(element, timelineData) {
  if (!timelineData.length) {
    showEmptyState(element, 'No processing timeline data available.');
    return;
  }

  const chart = getChartInstance(element);
  if (!chart) {
    return;
  }

  const zoomStart = Math.max(0, 100 - (18 / timelineData.length) * 100);
  const categoryColors = {
    cityMedian: '#60a5fa',
    heat_pump: '#dc2626',
    insulation: '#ea580c',
    elec_upg: '#d97706',
    envelope: '#65a30d',
    hvac: '#2563eb',
    lighting: '#0284c7'
  };

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        let result = `<div style="font-family: JetBrains Mono;"><strong>${params[0].name}</strong><br/>`;
        params.forEach((param) => {
          const label = param.seriesName === 'cityMedian'
            ? 'City Median'
            : param.seriesName.replace('_', ' ').toUpperCase();
          result += `<span style="color: ${param.color};">- ${label}: ${formatValue(param.value, ' days')}</span><br/>`;
        });
        return `${result}</div>`;
      }
    },
    legend: {
      data: ['City Median', 'Heat Pump', 'Insulation', 'Electrical Upgrade', 'Envelope', 'HVAC', 'Lighting'],
      textStyle: { color: '#cbd5e1', fontSize: 9, fontFamily: 'JetBrains Mono' },
      top: 5
    },
    dataZoom: [
      {
        type: 'slider',
        start: zoomStart,
        end: 100,
        height: 20,
        bottom: 5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        fillerColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        handleStyle: {
          color: '#3b82f6',
          borderColor: '#60a5fa'
        },
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'JetBrains Mono',
          fontSize: 10
        }
      },
      {
        type: 'inside',
        start: zoomStart,
        end: 100
      }
    ],
    grid: {
      left: '8%',
      right: '4%',
      bottom: '20%',
      top: '22%'
    },
    xAxis: {
      type: 'category',
      data: timelineData.map((item) => item.monthLabel),
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 9,
        fontFamily: 'JetBrains Mono',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: 'Processing Time (days)',
      nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' },
      splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
    },
    series: [
      {
        name: 'cityMedian',
        type: 'line',
        data: timelineData.map((item) => item.cityMedian),
        lineStyle: { color: categoryColors.cityMedian, width: 4 },
        itemStyle: { color: categoryColors.cityMedian },
        symbol: 'circle',
        symbolSize: 6,
        smooth: true,
        z: 10
      },
      {
        name: 'heat_pump',
        type: 'line',
        data: timelineData.map((item) => item.heat_pump),
        lineStyle: { color: categoryColors.heat_pump, width: 2, type: 'dashed' },
        itemStyle: { color: categoryColors.heat_pump },
        symbol: 'triangle',
        symbolSize: 4,
        smooth: true
      },
      {
        name: 'insulation',
        type: 'line',
        data: timelineData.map((item) => item.insulation),
        lineStyle: { color: categoryColors.insulation, width: 2, type: 'dashed' },
        itemStyle: { color: categoryColors.insulation },
        symbol: 'diamond',
        symbolSize: 4,
        smooth: true
      },
      {
        name: 'elec_upg',
        type: 'line',
        data: timelineData.map((item) => item.elec_upg),
        lineStyle: { color: categoryColors.elec_upg, width: 2, type: 'dashed' },
        itemStyle: { color: categoryColors.elec_upg },
        symbol: 'rect',
        symbolSize: 4,
        smooth: true
      },
      {
        name: 'envelope',
        type: 'line',
        data: timelineData.map((item) => item.envelope),
        lineStyle: { color: categoryColors.envelope, width: 2, type: 'dashed' },
        itemStyle: { color: categoryColors.envelope },
        symbol: 'roundRect',
        symbolSize: 4,
        smooth: true
      },
      {
        name: 'hvac',
        type: 'line',
        data: timelineData.map((item) => item.hvac),
        lineStyle: { color: categoryColors.hvac, width: 2, type: 'dashed' },
        itemStyle: { color: categoryColors.hvac },
        symbol: 'pin',
        symbolSize: 4,
        smooth: true
      },
      {
        name: 'lighting',
        type: 'line',
        data: timelineData.map((item) => item.lighting),
        lineStyle: { color: categoryColors.lighting, width: 2, type: 'dashed' },
        itemStyle: { color: categoryColors.lighting },
        symbol: 'arrow',
        symbolSize: 4,
        smooth: true
      }
    ]
  };

  chart.setOption(option);
  bindResize(chart, element);
}
