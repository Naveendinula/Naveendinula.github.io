import React, { useMemo } from 'react';
import { MAIN_CATEGORIES } from '../../utils/dataProcessing';

export default function CoverageTab({ features }) {
  const coverageStats = useMemo(() => {
    if (!features.length) return {};
    
    const total = features.length;
    const stats = {
      total,
      coverage: {},
      dataQuality: {}
    };
    
    // Calculate coverage for each category
    MAIN_CATEGORIES.forEach(category => {
      const count = features.filter(f => 
        f.properties[category] === 'True' || f.properties[category] === true
      ).length;
      stats.coverage[category] = {
        count,
        percentage: (count / total) * 100
      };
    });
    
    // Calculate data quality metrics
    const fieldsToCheck = [
      'ISSUE_DATE', 'WARD', 'COMMUNITY_AREA', 'LATITUDE', 'LONGITUDE',
      'PERMIT_TYPE', 'WORK_DESCRIPTION', 'RETROFIT_LIKELY'
    ];
    
    fieldsToCheck.forEach(field => {
      const nonEmptyCount = features.filter(f => {
        const val = f.properties[field];
        return val && val !== '' && val !== 'null' && val !== 'undefined';
      }).length;
      
      stats.dataQuality[field] = {
        nonEmpty: nonEmptyCount,
        percentage: (nonEmptyCount / total) * 100,
        missing: total - nonEmptyCount
      };
    });
    
    // Rollup calculations
    const electrificationCount = features.filter(f => 
      f.properties.ELECTRIFICATION === true || 
      f.properties.HEAT_PUMP === 'True' || 
      f.properties.ELECTRICAL_UPGRADE === 'True' ||
      f.properties.ELECTRIFICATION_APPLIANCES === 'True'
    ).length;
    
    const envelopeTestingCount = features.filter(f => 
      f.properties.ENVELOPE_TESTING === true ||
      f.properties.ENVELOPE === 'True' || 
      f.properties.BLOWER_DOOR === 'True' ||
      f.properties.DUCT_TESTING === 'True'
    ).length;
    
    stats.rollups = {
      ELECTRIFICATION: {
        count: electrificationCount,
        percentage: (electrificationCount / total) * 100
      },
      ENVELOPE_TESTING: {
        count: envelopeTestingCount,
        percentage: (envelopeTestingCount / total) * 100
      }
    };
    
    return stats;
  }, [features]);

  if (!features.length) {
    return (
      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
        No data available
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Records</div>
          <div className="kpi-value">{coverageStats.total?.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Electrification</div>
          <div className="kpi-value">{coverageStats.rollups?.ELECTRIFICATION?.percentage?.toFixed(1)}</div>
          <div className="kpi-unit">%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Envelope Testing</div>
          <div className="kpi-value">{coverageStats.rollups?.ENVELOPE_TESTING?.percentage?.toFixed(1)}</div>
          <div className="kpi-unit">%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Retrofit Likely</div>
          <div className="kpi-value">
            {((features.filter(f => f.properties.RETROFIT_LIKELY === 'True' || f.properties.RETROFIT_LIKELY === true).length / features.length) * 100).toFixed(1)}
          </div>
          <div className="kpi-unit">%</div>
        </div>
      </div>

      {/* Category Coverage */}
      <div className="chart-container">
        <div className="chart-title">Category Coverage</div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '12px',
          padding: '16px 0'
        }}>
          {MAIN_CATEGORIES.map(category => {
            const data = coverageStats.coverage?.[category];
            if (!data) return null;
            
            return (
              <div key={category} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '12px'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#cbd5e1', 
                  marginBottom: '6px',
                  fontWeight: '500'
                }}>
                  {category.replace(/_/g, ' ')}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '16px', color: '#f8fafc' }}>
                    {data.count.toLocaleString()}
                  </span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: data.percentage > 10 ? '#10b981' : data.percentage > 1 ? '#f59e0b' : '#ef4444'
                  }}>
                    {data.percentage.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  marginTop: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, data.percentage)}%`,
                    height: '100%',
                    background: data.percentage > 10 ? '#10b981' : data.percentage > 1 ? '#f59e0b' : '#ef4444',
                    borderRadius: '2px'
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Quality */}
      <div className="chart-container">
        <div className="chart-title">Data Quality</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '16px 0'
        }}>
          {Object.entries(coverageStats.dataQuality || {}).map(([field, data]) => (
            <div key={field} style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <div style={{ 
                fontSize: '13px', 
                color: '#cbd5e1', 
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                {field.replace(/_/g, ' ')}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '14px', color: '#f8fafc' }}>
                  {data.nonEmpty.toLocaleString()} / {coverageStats.total?.toLocaleString()}
                </span>
                <span style={{ 
                  fontSize: '14px', 
                  color: data.percentage > 95 ? '#10b981' : data.percentage > 80 ? '#f59e0b' : '#ef4444'
                }}>
                  {data.percentage.toFixed(1)}%
                </span>
              </div>
              {data.missing > 0 && (
                <div style={{ fontSize: '11px', color: '#ef4444' }}>
                  {data.missing.toLocaleString()} missing
                </div>
              )}
              <div style={{
                width: '100%',
                height: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                marginTop: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, data.percentage)}%`,
                  height: '100%',
                  background: data.percentage > 95 ? '#10b981' : data.percentage > 80 ? '#f59e0b' : '#ef4444',
                  borderRadius: '2px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rollups Summary */}
      <div className="chart-container">
        <div className="chart-title">Computed Rollups</div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px',
          padding: '16px 0'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '8px', fontWeight: '600' }}>
              ELECTRIFICATION
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
              HEAT_PUMP || ELECTRIFICATION_APPLIANCES || ELECTRICAL_UPGRADE
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#f8fafc' }}>
                {coverageStats.rollups?.ELECTRIFICATION?.count?.toLocaleString()} permits
              </span>
              <span style={{ color: '#10b981' }}>
                {coverageStats.rollups?.ELECTRIFICATION?.percentage?.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#60a5fa', marginBottom: '8px', fontWeight: '600' }}>
              ENVELOPE_TESTING
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
              ENVELOPE || BLOWER_DOOR || DUCT_TESTING
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#f8fafc' }}>
                {coverageStats.rollups?.ENVELOPE_TESTING?.count?.toLocaleString()} permits
              </span>
              <span style={{ color: '#10b981' }}>
                {coverageStats.rollups?.ENVELOPE_TESTING?.percentage?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
