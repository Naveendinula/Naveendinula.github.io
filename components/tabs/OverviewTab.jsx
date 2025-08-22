import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  computeKPIs, 
  buildCategoryCounts, 
  buildWeeklySeries,
  buildProcessingTimeAnalysis,
  buildRetrofitActivityPulse,
  buildWardProcessingLeaderboard
} from '../../utils/dataProcessing';

export default function OverviewTab({ features }) {
  const donutRef = useRef(null);
  const lineRef = useRef(null);
  const pulseRef = useRef(null);
  const leaderboardRef = useRef(null);
  
  const kpis = useMemo(() => computeKPIs(features), [features]);
  const categoryCounts = useMemo(() => buildCategoryCounts(features), [features]);
  const weeklySeries = useMemo(() => buildWeeklySeries(features), [features]);
  const processingTimeData = useMemo(() => buildProcessingTimeAnalysis(features), [features]);
  const retrofitPulse = useMemo(() => buildRetrofitActivityPulse(features), [features]);
  const wardLeaderboard = useMemo(() => buildWardProcessingLeaderboard(features), [features]);

  // Donut chart for category shares
  useEffect(() => {
    if (!donutRef.current || categoryCounts.length === 0) return;

    const chart = echarts.init(donutRef.current, 'dark');
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' }
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#cbd5e1', fontSize: 11, fontFamily: 'JetBrains Mono' }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        data: categoryCounts.map((item, index) => ({
          value: item.count,
          name: item.category.replace(/_/g, ' '),
          itemStyle: {
            color: getColorForCategory(item.category, index)
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: false
        }
      }]
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [categoryCounts]);

  // Line chart for weekly retrofit likely trend
  useEffect(() => {
    if (!lineRef.current || weeklySeries.length === 0) return;

    const chart = echarts.init(lineRef.current, 'dark');
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        formatter: (params) => {
          const data = params[0];
          return `Week: ${data.name}<br/>Retrofit Likely: ${data.value}%`;
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: weeklySeries.map(d => d.week),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          interval: Math.floor(weeklySeries.length / 8) // Show ~8 labels
        }
      },
      yAxis: {
        type: 'value',
        name: 'Retrofit Likely %',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          formatter: '{value}%'
        },
        splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
      },
      series: [{
        data: weeklySeries.map(d => d.percentage),
        type: 'line',
        smooth: true,
        lineStyle: { color: '#60a5fa', width: 2 },
        itemStyle: { color: '#60a5fa' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(96, 165, 250, 0.3)' },
            { offset: 1, color: 'rgba(96, 165, 250, 0.05)' }
          ])
        }
      }]
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [weeklySeries]);

  // Retrofit Activity Pulse Chart
  useEffect(() => {
    if (!pulseRef.current || retrofitPulse.length === 0) return;

    const chart = echarts.init(pulseRef.current, 'dark');
    
    const actionableCategories = ['HEAT_PUMP', 'INSULATION', 'ELECTRICAL_UPGRADE', 'ENVELOPE', 'HVAC_GENERAL', 'LIGHTING_RETROFIT'];
    const categoryColors = {
      'HEAT_PUMP': '#dc2626',
      'INSULATION': '#ea580c', 
      'ELECTRICAL_UPGRADE': '#d97706',
      'ENVELOPE': '#65a30d',
      'HVAC_GENERAL': '#2563eb',
      'LIGHTING_RETROFIT': '#0284c7'
    };
    
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
        data: [...actionableCategories.map(cat => cat.replace(/_/g, ' ')), '4-Week Rolling Avg'],
        textStyle: { color: '#cbd5e1', fontSize: 10, fontFamily: 'JetBrains Mono' },
        top: 5
      },
      grid: {
        left: '8%',
        right: '4%',
        bottom: '15%',
        top: '18%'
      },
      xAxis: {
        type: 'category',
        data: retrofitPulse.map(d => d.week),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 9,
          fontFamily: 'JetBrains Mono',
          interval: Math.floor(retrofitPulse.length / 8)
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Count',
          nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
          axisLine: { lineStyle: { color: '#374151' } },
          axisLabel: { color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' },
          splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
        }
      ],
      series: [
        ...actionableCategories.map(category => ({
          name: category.replace(/_/g, ' '),
          type: 'line',
          stack: 'total',
          areaStyle: { color: categoryColors[category] || '#666' },
          lineStyle: { color: categoryColors[category] || '#666', width: 0 },
          itemStyle: { color: categoryColors[category] || '#666' },
          emphasis: { focus: 'series' },
          data: retrofitPulse.map(d => d[category] || 0),
          symbol: 'none'
        })),
        {
          name: '4-Week Rolling Avg',
          type: 'line',
          data: retrofitPulse.map(d => d.rollingAverage),
          lineStyle: { color: '#ffffff', width: 2, type: 'solid' },
          itemStyle: { color: '#ffffff' },
          symbol: 'circle',
          symbolSize: 3,
          z: 10
        }
      ]
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [retrofitPulse]);

  // Ward Processing Leaderboard Chart
  useEffect(() => {
    if (!leaderboardRef.current || wardLeaderboard.wards.length === 0) return;

    const chart = echarts.init(leaderboardRef.current, 'dark');
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const data = params[0];
          const wardInfo = wardLeaderboard.wards[data.dataIndex];
          return `
            <div>Ward ${data.name}</div>
            <div>Volume: ${wardInfo.volume} permits</div>
            <div>Median: ${wardInfo.median.toFixed(1)} days</div>
            <div>Range: ${wardInfo.p25.toFixed(1)} - ${wardInfo.p75.toFixed(1)} days</div>
            <div>Status: ${wardInfo.isFasterThanCity ? 'Faster' : 'Slower'} than city median</div>
          `;
        }
      },
      grid: {
        left: '8%',
        right: '4%',
        bottom: '15%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: wardLeaderboard.wards.map(d => `Ward ${d.ward}`),
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
          data: wardLeaderboard.wards.map(d => ({
            value: d.median,
            itemStyle: {
              color: d.isFasterThanCity ? '#16a34a' : '#dc2626' // Green for faster, red for slower
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
          data: wardLeaderboard.wards.map((d, index) => [index, d.median, d.volume]),
          symbolSize: function(data) {
            // Scale volume to reasonable dot size
            return Math.min(20, Math.max(5, data[2] / 10));
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

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [wardLeaderboard]);

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Permits</div>
          <div className="kpi-value">{kpis.totalPermits.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Retrofit Likely</div>
          <div className="kpi-value">{kpis.retrofitLikelyPercent.toFixed(1)}</div>
          <div className="kpi-unit">%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Score</div>
          <div className="kpi-value">{kpis.averageScore.toFixed(1)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Top Category</div>
          <div className="kpi-value" style={{ fontSize: '16px' }}>
            {kpis.topCategory.replace(/_/g, ' ')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Median Processing</div>
          <div className="kpi-value">{processingTimeData.median.toFixed(1)}</div>
          <div className="kpi-unit">days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">90th Percentile</div>
          <div className="kpi-value">{processingTimeData.percentile90.toFixed(1)}</div>
          <div className="kpi-unit">days</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid two-column">
        <div className="chart-container">
          <div className="chart-title">Category Distribution</div>
          <div className="chart-content" ref={donutRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Weekly Retrofit Likelihood Trend</div>
          <div className="chart-content" ref={lineRef}></div>
        </div>
      </div>

      {/* New Analytics Charts */}
      <div className="charts-grid two-column" style={{ marginTop: '24px' }}>
        <div className="chart-container">
          <div className="chart-title">Retrofit Activity Pulse (Last 12 Months)</div>
          <div className="chart-content" ref={pulseRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Permit Processing Time – Leaderboard by Ward</div>
          <div className="chart-content" ref={leaderboardRef}></div>
        </div>
      </div>
    </div>
  );
}

// Color mapping for categories
function getColorForCategory(category, index) {
  const colors = [
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669',
    '#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#c026d3',
    '#db2777', '#be185d'
  ];
  
  const categoryColors = {
    'HEAT_PUMP': '#dc2626',
    'INSULATION': '#ea580c',
    'ELECTRICAL_UPGRADE': '#d97706',
    'ENVELOPE': '#65a30d',
    'BLOWER_DOOR': '#059669',
    'DUCTWORK': '#0891b2',
    'LIGHTING_RETROFIT': '#0284c7',
    'HVAC_GENERAL': '#2563eb'
  };
  
  return categoryColors[category] || colors[index % colors.length];
}
