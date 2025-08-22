import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { 
  buildCategoryCounts, 
  buildCoOccurrenceMatrix, 
  MAIN_CATEGORIES 
} from '../../utils/dataProcessing';

export default function CategoriesTab({ features }) {
  const barRef = useRef(null);
  const heatmapRef = useRef(null);
  
  const categoryCounts = useMemo(() => buildCategoryCounts(features), [features]);
  const coOccurrenceMatrix = useMemo(() => buildCoOccurrenceMatrix(features), [features]);

  // Bar chart for category counts
  useEffect(() => {
    if (!barRef.current || categoryCounts.length === 0) return;

    const chart = echarts.init(barRef.current, 'dark');
    
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
          const percentage = ((data.value / features.length) * 100).toFixed(1);
          return `
            <div>${data.name}</div>
            <div>Count: ${data.value}</div>
            <div>Percentage: ${percentage}%</div>
          `;
        }
      },
      grid: {
        left: '5%',
        right: '4%',
        bottom: '20%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: categoryCounts.map(d => d.category.replace(/_/g, ' ')),
        axisLine: { lineStyle: { color: '#374151' } },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          rotate: 45,
          interval: 0
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
      series: [{
        data: categoryCounts.map((d, index) => ({
          value: d.count,
          itemStyle: {
            color: getCategoryColor(d.category, index)
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
  }, [categoryCounts, features.length]);

  // Heatmap for co-occurrence matrix
  useEffect(() => {
    if (!heatmapRef.current || Object.keys(coOccurrenceMatrix).length === 0) return;

    const chart = echarts.init(heatmapRef.current, 'dark');
    
    // Prepare data for heatmap (upper triangle only)
    const heatmapData = [];
    const maxValue = Math.max(...Object.values(coOccurrenceMatrix).flatMap(row => Object.values(row)));
    
    MAIN_CATEGORIES.forEach((cat1, i) => {
      MAIN_CATEGORIES.forEach((cat2, j) => {
        if (j >= i) { // Upper triangle including diagonal
          const value = coOccurrenceMatrix[cat1]?.[cat2] || 0;
          heatmapData.push([i, j, value]);
        }
      });
    });
    
    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#ffffff', fontFamily: 'JetBrains Mono' },
        formatter: (params) => {
          const [i, j, value] = params.data;
          const cat1 = MAIN_CATEGORIES[i].replace(/_/g, ' ');
          const cat2 = MAIN_CATEGORIES[j].replace(/_/g, ' ');
          return `${cat1} × ${cat2}<br/>Co-occurrences: ${value}`;
        }
      },
      grid: {
        height: '80%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: MAIN_CATEGORIES.map(cat => cat.replace(/_/g, ' ')),
        splitArea: {
          show: true
        },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 9,
          fontFamily: 'JetBrains Mono',
          rotate: 45
        }
      },
      yAxis: {
        type: 'category',
        data: MAIN_CATEGORIES.map(cat => cat.replace(/_/g, ' ')),
        splitArea: {
          show: true
        },
        axisLabel: { 
          color: '#9ca3af', 
          fontSize: 9,
          fontFamily: 'JetBrains Mono'
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
        },
        textStyle: {
          color: '#9ca3af',
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        }
      },
      series: [{
        name: 'Co-occurrence',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'JetBrains Mono'
        },
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
  }, [coOccurrenceMatrix]);

  return (
    <div>
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-title">Category Counts (Ranked)</div>
          <div className="chart-content" ref={barRef}></div>
        </div>
        <div className="chart-container">
          <div className="chart-title">Category Co-occurrence Matrix</div>
          <div className="chart-content" ref={heatmapRef}></div>
        </div>
      </div>
    </div>
  );
}

// Color mapping for categories
function getCategoryColor(category, index) {
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
  
  const fallbackColors = [
    '#7c3aed', '#c026d3', '#db2777', '#be185d'
  ];
  
  return categoryColors[category] || fallbackColors[index % fallbackColors.length];
}
