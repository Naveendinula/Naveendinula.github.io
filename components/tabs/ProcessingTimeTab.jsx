import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  buildProcessingTimeAnalysis,
  buildProcessingTimeByCategoryAnalysis,
  buildProcessingTimeTrends,
  buildRetrofitProcessingCorrelation,
  buildWardProcessingTimeAnalysis
} from '../../utils/dataProcessing';

export default function ProcessingTimeTab({ features }) {
  const distributionRef = useRef(null);
  const categoryRef = useRef(null);
  const trendsRef = useRef(null);
  const correlationRef = useRef(null);
  
  const processingTimeData = useMemo(() => buildProcessingTimeAnalysis(features), [features]);
  const categoryData = useMemo(() => buildProcessingTimeByCategoryAnalysis(features), [features]);
  const trendsData = useMemo(() => buildProcessingTimeTrends(features), [features]);
  const correlationData = useMemo(() => buildRetrofitProcessingCorrelation(features), [features]);

  // Processing time distribution chart
  useEffect(() => {
    if (!distributionRef.current || processingTimeData.distribution.length === 0) return;

    const chart = echarts.init(distributionRef.current, 'dark');
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        formatter: (params) => {
          const data = params.data;
          return `${data.name}<br/>Count: ${data.value}<br/>Percentage: ${data.percentage.toFixed(1)}%`;
        }
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
        data: processingTimeData.distribution.map((item, index) => ({
          value: item.count,
          name: item.range,
          percentage: item.percentage,
          itemStyle: {
            color: getColorForTimeRange(item.range, index)
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
  }, [processingTimeData]);

  // Processing time by category chart
  useEffect(() => {
    if (!categoryRef.current || categoryData.length === 0) return;

    const chart = echarts.init(categoryRef.current, 'dark');
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const data = params[0];
          const categoryInfo = categoryData[data.dataIndex];
          return `
            <div>${data.name.replace(/_/g, ' ')}</div>
            <div>Count: ${categoryInfo.count}</div>
            <div>Median: ${categoryInfo.median.toFixed(1)} days</div>
            <div>Average: ${categoryInfo.average.toFixed(1)} days</div>
            <div>Range: ${categoryInfo.min}-${categoryInfo.max} days</div>
          `;
        }
      },
      grid: {
        left: '15%',
        right: '4%',
        bottom: '15%',
        top: '10%'
      },
      xAxis: {
        type: 'value',
        name: 'Days',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
      },
      yAxis: {
        type: 'category',
        data: categoryData.map(d => d.category.replace(/_/g, ' ')),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        }
      },
      series: [{
        data: categoryData.map((d, index) => ({
          value: d.median,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: getCategoryColor(d.category, index) },
              { offset: 1, color: getCategoryColorLight(d.category, index) }
            ])
          }
        })),
        type: 'bar',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
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
  }, [categoryData]);

  // Processing time trends chart
  useEffect(() => {
    if (!trendsRef.current || trendsData.length === 0) return;

    const chart = echarts.init(trendsRef.current, 'dark');
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        formatter: (params) => {
          const data = params[0];
          const monthInfo = trendsData[data.dataIndex];
          return `
            <div>${data.name}</div>
            <div>Count: ${monthInfo.count}</div>
            <div>Median: ${monthInfo.median.toFixed(1)} days</div>
            <div>Average: ${monthInfo.average.toFixed(1)} days</div>
          `;
        }
      },
      legend: {
        data: ['Median Processing Time', 'Average Processing Time'],
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
        data: trendsData.map(d => d.month),
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
        name: 'Days',
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
          name: 'Median Processing Time',
          type: 'line',
          data: trendsData.map(d => d.median),
          smooth: true,
          lineStyle: { color: '#60a5fa', width: 2 },
          itemStyle: { color: '#60a5fa' },
          symbol: 'circle',
          symbolSize: 6
        },
        {
          name: 'Average Processing Time',
          type: 'line',
          data: trendsData.map(d => d.average),
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
          symbol: 'circle',
          symbolSize: 6
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
  }, [trendsData]);

  // Retrofit likelihood vs processing time correlation
  useEffect(() => {
    if (!correlationRef.current) return;

    const chart = echarts.init(correlationRef.current, 'dark');
    
    const { retrofitLikely, notRetrofitLikely } = correlationData;
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const category = params[0].name;
          const data = category === 'Retrofit Likely' ? retrofitLikely : notRetrofitLikely;
          return `
            <div>${category}</div>
            <div>Count: ${data.count}</div>
            <div>Median: ${data.median.toFixed(1)} days</div>
            <div>Average: ${data.average.toFixed(1)} days</div>
          `;
        }
      },
      legend: {
        data: ['Median', 'Average'],
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
        data: ['Retrofit Likely', 'Not Retrofit Likely'],
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 11,
          fontFamily: 'JetBrains Mono'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Days',
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
          name: 'Median',
          type: 'bar',
          data: [retrofitLikely.median, notRetrofitLikely.median],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#059669' },
              { offset: 1, color: '#047857' }
            ])
          }
        },
        {
          name: 'Average',
          type: 'bar',
          data: [retrofitLikely.average, notRetrofitLikely.average],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#0891b2' },
              { offset: 1, color: '#0e7490' }
            ])
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
  }, [correlationData]);

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Permits</div>
          <div className="kpi-value">{processingTimeData.totalPermits.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Median Time</div>
          <div className="kpi-value">{processingTimeData.median.toFixed(1)}</div>
          <div className="kpi-unit">days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Time</div>
          <div className="kpi-value">{processingTimeData.average.toFixed(1)}</div>
          <div className="kpi-unit">days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">90th Percentile</div>
          <div className="kpi-value">{processingTimeData.percentile90.toFixed(1)}</div>
          <div className="kpi-unit">days</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Processing Time Distribution</div>
          <div className="chart-content" ref={distributionRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Median Processing Time by Category</div>
          <div className="chart-content" ref={categoryRef}></div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Processing Time Trends Over Time</div>
          <div className="chart-content" ref={trendsRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Processing Time: Retrofit Likely vs Not Likely</div>
          <div className="chart-content" ref={correlationRef}></div>
        </div>
      </div>
    </div>
  );
}

// Color mapping for time ranges
function getColorForTimeRange(range, index) {
  const colors = {
    '0 days': '#059669',
    '1-7 days': '#0891b2',
    '8-30 days': '#0284c7',
    '31-90 days': '#d97706',
    '91-180 days': '#dc2626',
    '181+ days': '#991b1b'
  };
  
  return colors[range] || `hsl(${index * 60}, 70%, 50%)`;
}

// Color mapping for categories
function getCategoryColor(category, index) {
  const colors = [
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669',
    '#0891b2', '#0284c7', '#2563eb', '#7c3aed', '#c026d3'
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

function getCategoryColorLight(category, index) {
  const colors = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
    '#22d3ee', '#60a5fa', '#818cf8', '#a78bfa', '#e879f9'
  ];
  
  const categoryColors = {
    'HEAT_PUMP': '#f87171',
    'INSULATION': '#fb923c',
    'ELECTRICAL_UPGRADE': '#fbbf24',
    'ENVELOPE': '#a3e635',
    'BLOWER_DOOR': '#34d399',
    'DUCTWORK': '#22d3ee',
    'LIGHTING_RETROFIT': '#60a5fa',
    'HVAC_GENERAL': '#818cf8'
  };
  
  return categoryColors[category] || colors[index % colors.length];
}
