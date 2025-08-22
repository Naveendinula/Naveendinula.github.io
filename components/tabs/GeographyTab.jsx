import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { buildGeographyData, buildWardProcessingTimeAnalysis } from '../../utils/dataProcessing';

export default function GeographyTab({ features }) {
  const countsRef = useRef(null);
  const scoresRef = useRef(null);
  const processingRef = useRef(null);
  const [groupBy, setGroupBy] = useState('WARD');
  
  const geographyData = useMemo(() => 
    buildGeographyData(features, groupBy), [features, groupBy]
  );
  
  const wardProcessingData = useMemo(() => 
    buildWardProcessingTimeAnalysis(features), [features]
  );

  // Bar chart for permit counts by ward/community
  useEffect(() => {
    if (!countsRef.current || geographyData.length === 0) return;

    const chart = echarts.init(countsRef.current, 'dark');
    
    // Take top 20 for readability
    const topData = geographyData.slice(0, 20);
    
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
          const geoData = topData[data.dataIndex];
          return `
            <div>${groupBy} ${data.name}</div>
            <div>Total: ${geoData.count}</div>
            <div>Retrofit Likely: ${geoData.retrofitLikely} (${geoData.retrofitLikelyPercent.toFixed(1)}%)</div>
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
        data: topData.map(d => d.id),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          rotate: groupBy === 'COMMUNITY_AREA' ? 45 : 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Permit Count',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
      },
      series: [{
        data: topData.map(d => ({
          value: d.count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#60a5fa' },
              { offset: 1, color: '#3b82f6' }
            ])
          }
        })),
        type: 'bar',
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#93c5fd' },
              { offset: 1, color: '#60a5fa' }
            ])
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
  }, [geographyData, groupBy]);

  // Bar chart for median scores by ward/community
  useEffect(() => {
    if (!scoresRef.current || geographyData.length === 0) return;

    const chart = echarts.init(scoresRef.current, 'dark');
    
    // Filter out areas with no scores and take top 20
    const dataWithScores = geographyData
      .filter(d => d.medianScore > 0)
      .slice(0, 20);
    
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
          const geoData = dataWithScores[data.dataIndex];
          return `
            <div>${groupBy} ${data.name}</div>
            <div>Median Score: ${geoData.medianScore.toFixed(1)}</div>
            <div>Sample Size: ${geoData.scores.length}</div>
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
        data: dataWithScores.map(d => d.id),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          rotate: groupBy === 'COMMUNITY_AREA' ? 45 : 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Median Score',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
      },
      series: [{
        data: dataWithScores.map(d => ({
          value: d.medianScore,
          itemStyle: {
            color: d.medianScore > 50 ? '#dc2626' : d.medianScore > 25 ? '#ea580c' : '#059669'
          }
        })),
        type: 'bar',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
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
  }, [geographyData, groupBy]);

  // Ward processing time chart
  useEffect(() => {
    if (!processingRef.current || wardProcessingData.length === 0) return;

    const chart = echarts.init(processingRef.current, 'dark');
    
    // Take top 15 wards by median processing time for readability
    const topData = wardProcessingData.slice(0, 15);
    
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
          const wardInfo = topData[data.dataIndex];
          return `
            <div>Ward ${data.name}</div>
            <div>Permit Count: ${wardInfo.count}</div>
            <div>Median Processing: ${wardInfo.median.toFixed(1)} days</div>
            <div>Average Processing: ${wardInfo.average.toFixed(1)} days</div>
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
        data: topData.map(d => d.ward),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Processing Time (days)',
        nameTextStyle: { color: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono' },
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
        splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
      },
      series: [{
        data: topData.map(d => ({
          value: d.median,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#d97706' }
            ])
          }
        })),
        type: 'bar',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(245, 158, 11, 0.5)'
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
  }, [wardProcessingData]);

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#cbd5e1', fontSize: '14px', marginRight: '12px' }}>
          Group by:
        </label>
        <select 
          value={groupBy} 
          onChange={(e) => setGroupBy(e.target.value)}
          style={{
            background: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            padding: '6px 12px',
            fontFamily: 'inherit',
            fontSize: '13px'
          }}
        >
          <option value="WARD">Ward</option>
          <option value="COMMUNITY_AREA">Community Area</option>
        </select>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">
            Permit Counts by {groupBy === 'WARD' ? 'Ward' : 'Community Area'} (Top 20)
          </div>
          <div className="chart-content" ref={countsRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">
            Median Retrofit Score by {groupBy === 'WARD' ? 'Ward' : 'Community Area'} (Top 20)
          </div>
          <div className="chart-content" ref={scoresRef}></div>
        </div>
      </div>

      {/* Processing Time Chart - only show for WARD grouping */}
      {groupBy === 'WARD' && (
        <div className="charts-grid" style={{ marginTop: '24px' }}>
          <div className="chart-container">
            <div className="chart-title">
              Processing Time by Ward (Top 15 by Processing Time)
            </div>
            <div className="chart-content" ref={processingRef}></div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="kpi-grid" style={{ marginTop: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-label">Most Permits</div>
          <div className="kpi-value" style={{ fontSize: '18px' }}>
            {geographyData[0]?.id || 'N/A'}
          </div>
          <div className="kpi-unit">{geographyData[0]?.count || 0} permits</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Highest Score</div>
          <div className="kpi-value" style={{ fontSize: '18px' }}>
            {geographyData.filter(d => d.medianScore > 0).sort((a, b) => b.medianScore - a.medianScore)[0]?.id || 'N/A'}
          </div>
          <div className="kpi-unit">{geographyData.filter(d => d.medianScore > 0).sort((a, b) => b.medianScore - a.medianScore)[0]?.medianScore?.toFixed(1) || 0}</div>
        </div>
        {groupBy === 'WARD' && wardProcessingData.length > 0 && (
          <div className="kpi-card">
            <div className="kpi-label">Slowest Ward</div>
            <div className="kpi-value" style={{ fontSize: '18px' }}>
              {wardProcessingData[0]?.ward || 'N/A'}
            </div>
            <div className="kpi-unit">{wardProcessingData[0]?.median?.toFixed(1) || 0} days</div>
          </div>
        )}
        <div className="kpi-card">
          <div className="kpi-label">Total {groupBy === 'WARD' ? 'Wards' : 'Communities'}</div>
          <div className="kpi-value">{geographyData.length}</div>
          <div className="kpi-unit">{groupBy === 'WARD' ? 'wards' : 'areas'}</div>
        </div>
      </div>
    </div>
  );
}
