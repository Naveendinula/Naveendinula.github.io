import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  buildElectrificationAnalysis, 
  buildHeatPumpByCommunity 
} from '../../utils/dataProcessing';

export default function ElectrificationTab({ features }) {
  const beforeAfterRef = useRef(null);
  const communityRef = useRef(null);
  
  const electrificationData = useMemo(() => buildElectrificationAnalysis(features), [features]);
  const heatPumpByCommunity = useMemo(() => buildHeatPumpByCommunity(features), [features]);

  // Before/After comparison chart
  useEffect(() => {
    if (!beforeAfterRef.current) return;

    const chart = echarts.init(beforeAfterRef.current, 'dark');
    
    const { before, after } = electrificationData;
    
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
          const period = params[0].name;
          const data = period === 'Before Nov 2022' ? before : after;
          return `
            <div>${period}</div>
            <div>Total Permits: ${data.total}</div>
            <div>Heat Pump: ${data.HEAT_PUMP} (${data.HEAT_PUMP_percent.toFixed(1)}%)</div>
            <div>Electrical Upgrade: ${data.ELECTRICAL_UPGRADE} (${data.ELECTRICAL_UPGRADE_percent.toFixed(1)}%)</div>
          `;
        }
      },
      legend: {
        data: ['Heat Pump', 'Electrical Upgrade'],
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
        data: ['Before Nov 2022', 'After Nov 2022'],
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 11,
          fontFamily: 'JetBrains Mono'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Percentage (%)',
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
      series: [
        {
          name: 'Heat Pump',
          type: 'bar',
          data: [before.HEAT_PUMP_percent, after.HEAT_PUMP_percent],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#dc2626' },
              { offset: 1, color: '#b91c1c' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#ef4444' },
                { offset: 1, color: '#dc2626' }
              ])
            }
          }
        },
        {
          name: 'Electrical Upgrade',
          type: 'bar',
          data: [before.ELECTRICAL_UPGRADE_percent, after.ELECTRICAL_UPGRADE_percent],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#d97706' },
              { offset: 1, color: '#b45309' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#f59e0b' },
                { offset: 1, color: '#d97706' }
              ])
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
  }, [electrificationData]);

  // Heat pump share by community
  useEffect(() => {
    if (!communityRef.current || heatPumpByCommunity.length === 0) return;

    const chart = echarts.init(communityRef.current, 'dark');
    
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
          const communityData = heatPumpByCommunity[data.dataIndex];
          return `
            <div>Community ${data.name}</div>
            <div>Heat Pump: ${communityData.heatPump}/${communityData.total}</div>
            <div>Percentage: ${communityData.percentage.toFixed(1)}%</div>
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
        data: heatPumpByCommunity.map(d => d.community),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        }
      },
      yAxis: {
        type: 'value',
        name: 'Heat Pump Share (%)',
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
        data: heatPumpByCommunity.map(d => ({
          value: d.percentage,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#dc2626' },
              { offset: 1, color: '#991b1b' }
            ])
          }
        })),
        type: 'bar',
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f87171' },
              { offset: 1, color: '#dc2626' }
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
  }, [heatPumpByCommunity]);

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Electrification Before/After November 2022</div>
          <div className="chart-content" ref={beforeAfterRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Heat Pump Share by Community (Top 10)</div>
          <div className="chart-content" ref={communityRef}></div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="kpi-grid" style={{ marginTop: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-label">Before Nov 2022</div>
          <div className="kpi-value">{electrificationData.before.total.toLocaleString()}</div>
          <div className="kpi-unit">permits</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">After Nov 2022</div>
          <div className="kpi-value">{electrificationData.after.total.toLocaleString()}</div>
          <div className="kpi-unit">permits</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Heat Pump Growth</div>
          <div className="kpi-value">
            {(electrificationData.after.HEAT_PUMP_percent - electrificationData.before.HEAT_PUMP_percent).toFixed(1)}
          </div>
          <div className="kpi-unit">pp</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Electrical Growth</div>
          <div className="kpi-value">
            {(electrificationData.after.ELECTRICAL_UPGRADE_percent - electrificationData.before.ELECTRICAL_UPGRADE_percent).toFixed(1)}
          </div>
          <div className="kpi-unit">pp</div>
        </div>
      </div>
    </div>
  );
}
