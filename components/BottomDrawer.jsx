import React, { useState, useEffect } from 'react';
import './BottomDrawer.css';
import OverviewTab from './tabs/OverviewTab';
import TrendsTab from './tabs/TrendsTab';
import GeographyTab from './tabs/GeographyTab';
import CategoriesTab from './tabs/CategoriesTab';
import ElectrificationTab from './tabs/ElectrificationTab';
import CoverageTab from './tabs/CoverageTab';
import ProcessingTimeTab from './tabs/ProcessingTimeTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'geography', label: 'Geography', icon: '🗺️' },
  { id: 'categories', label: 'Categories', icon: '🏷️' },
  { id: 'electrification', label: 'Electrification', icon: '⚡' },
  { id: 'processing', label: 'Processing Time', icon: '⏱️' },
  { id: 'coverage', label: 'Coverage', icon: '📋' }
];

export default function BottomDrawer({ 
  isOpen, 
  onClose, 
  selectedFeatures, 
  allFeatures,
  onFeatureSelect 
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [features, setFeatures] = useState([]);

  // Use selectedFeatures if available, otherwise use viewport features
  useEffect(() => {
    if (selectedFeatures && selectedFeatures.length > 0) {
      setFeatures(selectedFeatures);
    } else {
      // Use all features or implement viewport filtering
      setFeatures(allFeatures || []);
    }
  }, [selectedFeatures, allFeatures]);

  const renderTabContent = () => {
    const commonProps = { features, onFeatureSelect };
    
    switch (activeTab) {
      case 'overview':
        return <OverviewTab {...commonProps} />;
      case 'trends':
        return <TrendsTab {...commonProps} />;
      case 'geography':
        return <GeographyTab {...commonProps} />;
      case 'categories':
        return <CategoriesTab {...commonProps} />;
      case 'electrification':
        return <ElectrificationTab {...commonProps} />;
      case 'processing':
        return <ProcessingTimeTab {...commonProps} />;
      case 'coverage':
        return <CoverageTab {...commonProps} />;
      default:
        return <OverviewTab {...commonProps} />;
    }
  };

  return (
    <div className={`bottom-drawer ${isOpen ? 'open' : 'closed'}`}>
      {/* Handle bar */}
      <div className="drawer-handle" onClick={onClose}>
        <div className="handle-bar"></div>
      </div>

      {/* Header */}
      <div className="drawer-header">
        <div className="drawer-title">
          <h2>Retrofit Analysis</h2>
          <span className="feature-count">
            {features.length.toLocaleString()} permits
          </span>
        </div>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      {/* Tab navigation */}
      <div className="tab-navigation">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
