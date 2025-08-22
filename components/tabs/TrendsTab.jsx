import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  buildWeeklySeries, 
  buildWeeklyStackedSeries,
  buildWeeklyProcessingTimeSeries,
  MAIN_CATEGORIES 
} from '../../utils/dataProcessing';

export default function TrendsTab({ features }) {
  const lineRef = useRef(null);
  const stackedRef = useRef(null);
  
  const weeklySeries = useMemo(() => buildWeeklySeries(features), [features]);
  const weeklyStacked = useMemo(() => buildWeeklyStackedSeries(features), [features]);
  const weeklyProcessing = useMemo(() => buildWeeklyProcessingTimeSeries(features), [features]);

  // Dual-axis chart for weekly retrofit likelihood and processing time
  useEffect(() => {
    if (!lineRef.current || weeklySeries.length === 0) return;

    const chart = echarts.init(lineRef.current, 'dark');
    
    // Merge weekly data by week
    const mergedData = weeklySeries.map(item => {
      const processingData = weeklyProcessing.find(p => p.week === item.week);
      return {
        ...item,
        medianProcessingTime: processingData?.medianProcessingTime || 0,
        averageProcessingTime: processingData?.averageProcessingTime || 0
      };
    });
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        formatter: (params) => {
          const weekData = mergedData[params[0].dataIndex];
          return `
            <div>Week: ${weekData.week}</div>
            <div>Total Permits: ${weekData.total}</div>
            <div>Retrofit Likely: ${weekData.retrofitLikely} (${weekData.percentage.toFixed(1)}%)</div>
            <div>Median Processing: ${weekData.medianProcessingTime.toFixed(1)} days</div>
            <div>Average Processing: ${weekData.averageProcessingTime.toFixed(1)} days</div>
          `;
        }
      },
      legend: {
        data: ['Retrofit Likely %', 'Median Processing Time'],
        textStyle: { color: '#cbd5e1', fontSize: 11, fontFamily: 'JetBrains Mono' },
        top: 10
      },
      grid: {
        left: '8%',
        right: '8%',
        bottom: '15%',
        top: '15%'
      },
      xAxis: {
        type: 'category',
        data: mergedData.map(d => d.week),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          interval: Math.floor(mergedData.length / 10),
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Retrofit Likely %',
          nameTextStyle: { color: '#60a5fa', fontSize: 11, fontFamily: 'JetBrains Mono' },
          position: 'left',
          axisLine: { lineStyle: { color: '#60a5fa' } },
          axisLabel: { 
            color: '#60a5fa', 
            fontSize: 10,
            fontFamily: 'JetBrains Mono',
            formatter: '{value}%'
          },
          splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
        },
        {
          type: 'value',
          name: 'Processing Time (days)',
          nameTextStyle: { color: '#f59e0b', fontSize: 11, fontFamily: 'JetBrains Mono' },
          position: 'right',
          axisLine: { lineStyle: { color: '#f59e0b' } },
          axisLabel: { 
            color: '#f59e0b', 
            fontSize: 10,
            fontFamily: 'JetBrains Mono'
          },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Retrofit Likely %',
          data: mergedData.map(d => d.percentage),
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          lineStyle: { color: '#60a5fa', width: 3 },
          itemStyle: { color: '#60a5fa' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(96, 165, 250, 0.4)' },
              { offset: 1, color: 'rgba(96, 165, 250, 0.05)' }
            ])
          },
          symbol: 'circle',
          symbolSize: 4
        },
        {
          name: 'Median Processing Time',
          data: mergedData.map(d => d.medianProcessingTime),
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          symbol: 'diamond',
          symbolSize: 5
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
  }, [weeklySeries, weeklyProcessing]);

  // Stacked area chart for weekly categories
  useEffect(() => {
    if (!stackedRef.current || weeklyStacked.length === 0) return;

    const chart = echarts.init(stackedRef.current, 'dark');
    
    const categoryColors = {
      'HEAT_PUMP': '#dc2626',
      'INSULATION': '#ea580c',
      'ELECTRICAL_UPGRADE': '#d97706',
      'ENVELOPE': '#65a30d'
    };

    const mainCategories = ['HEAT_PUMP', 'INSULATION', 'ELECTRICAL_UPGRADE', 'ENVELOPE'];
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: mainCategories.map(cat => cat.replace(/_/g, ' ')),
        textStyle: { color: '#cbd5e1', fontSize: 11, fontFamily: 'JetBrains Mono' },
        top: 10
      },
      grid: {
        left: '8%',
        right: '4%',
        bottom: '15%',
        top: '15%'
      },
      xAxis: {
        type: 'category',
        data: weeklyStacked.map(d => d.week),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          interval: Math.floor(weeklyStacked.length / 10),
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: 'Count',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
      },
      series: mainCategories.map(category => ({
        name: category.replace(/_/g, ' '),
        type: 'line',
        stack: 'total',
        areaStyle: {
          color: categoryColors[category] || '#666'
        },
        lineStyle: {
          color: categoryColors[category] || '#666',
          width: 0
        },
        itemStyle: {
          color: categoryColors[category] || '#666'
        },
        emphasis: {
          focus: 'series'
        },
        data: weeklyStacked.map(d => d[category] || 0),
        symbol: 'none'
      }))
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [weeklyStacked]);

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Weekly Retrofit Likelihood & Processing Time Trends</div>
          <div className="chart-content" ref={lineRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Weekly Category Counts (Stacked)</div>
          <div className="chart-content" ref={stackedRef}></div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="kpi-grid" style={{ marginTop: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-label">Peak Retrofit Week</div>
          <div className="kpi-value" style={{ fontSize: '16px' }}>
            {weeklySeries.reduce((max, curr) => curr.retrofitLikely > max.retrofitLikely ? curr : max, weeklySeries[0] || {}).week || 'N/A'}
          </div>
          <div className="kpi-unit">
            {weeklySeries.reduce((max, curr) => curr.retrofitLikely > max.retrofitLikely ? curr : max, weeklySeries[0] || {}).retrofitLikely || 0} permits
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Slowest Processing Week</div>
          <div className="kpi-value" style={{ fontSize: '16px' }}>
            {weeklyProcessing.reduce((max, curr) => curr.medianProcessingTime > max.medianProcessingTime ? curr : max, weeklyProcessing[0] || {}).week || 'N/A'}
          </div>
          <div className="kpi-unit">
            {weeklyProcessing.reduce((max, curr) => curr.medianProcessingTime > max.medianProcessingTime ? curr : max, weeklyProcessing[0] || {}).medianProcessingTime?.toFixed(1) || 0} days
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg Weekly Volume</div>
          <div className="kpi-value">
            {weeklySeries.length > 0 ? Math.round(weeklySeries.reduce((sum, w) => sum + w.total, 0) / weeklySeries.length) : 0}
          </div>
          <div className="kpi-unit">permits/week</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Weeks</div>
          <div className="kpi-value">{weeklySeries.length}</div>
          <div className="kpi-unit">tracked</div>
        </div>
      </div>
    </div>
  );
}
