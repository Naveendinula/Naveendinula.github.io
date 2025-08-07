// Simple Chicago Buildings Retrofit Map
// Portfolio Project - Mapbox GL JS

// Configuration
const MAPBOX_TOKEN = 'MAPBOX_TOKEN_REMOVED';

// Initialize map
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-87.6298, 41.8781], // Chicago
    zoom: 10,
    pitch: 30
});

// Add controls
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

// Global data
let buildingsData = [];
let currentPopup = null;

// Color scheme for retrofit priorities (based on algorithm scoring)
const COLORS = {
    'Critical': '#dc2626',   // Red - Immediate action (80-100)
    'High': '#ea580c',       // Orange-Red - High priority (60-79)
    'Medium': '#d97706',     // Orange - Moderate priority (40-59)
    'Low': '#65a30d',        // Green - Low priority (20-39)
    'Minimal': '#059669',    // Dark Green - No immediate need (0-19)
    'default': '#9ca3af'     // Gray fallback
};

// Calculate bounds from building data
function calculateDataBounds(data) {
    if (!data || data.length === 0) return null;
    
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    data.forEach(building => {
        const lng = parseFloat(building.longitude);
        const lat = parseFloat(building.latitude);
        
        if (!isNaN(lng) && !isNaN(lat)) {
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
        }
    });
    
    // Add padding (about 5% on each side)
    const lngPadding = (maxLng - minLng) * 0.05;
    const latPadding = (maxLat - minLat) * 0.05;
    
    return [
        [minLng - lngPadding, minLat - latPadding], // Southwest
        [maxLng + lngPadding, maxLat + latPadding]  // Northeast
    ];
}

// Set map bounds to limit panning/zooming
function setMapBounds(bounds) {
    if (!bounds) return;
    
    console.log('Setting map bounds:', bounds);
    
    // Set max bounds to limit panning
    map.setMaxBounds(bounds);
    
    // Fit to bounds initially
    map.fitBounds(bounds, {
        padding: 20,
        maxZoom: 16
    });
}

// Initialize application
async function init() {
    try {
        showLoading('Loading building data...');
        await loadData();
        
        // Calculate and set map bounds based on data
        const bounds = calculateDataBounds(buildingsData);
        setMapBounds(bounds);
        
        // Add 3D buildings layer
        add3DBuildingsLayer();
        
        addMapLayers();
        setupControls();
        updateStats();
        hideLoading();
        console.log('App ready with', buildingsData.length, 'buildings');
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load data');
    }
}

// Add 3D buildings layer
function add3DBuildingsLayer() {
    // Check if the map style is already loaded
    if (map.isStyleLoaded()) {
        addBuildingLayer();
    } else {
        // Wait for the map style to load before adding 3D buildings
        map.on('style.load', addBuildingLayer);
    }
}

function addBuildingLayer() {
    // Find the first symbol layer in the map style
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
    )?.id;

    // Add the 3D building layer beneath any symbol layer
    map.addLayer(
        {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 12,
            paint: {
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'height'],
                    0, 'rgba(100, 100, 100, 0.8)',
                    50, 'rgba(130, 130, 130, 0.8)',
                    100, 'rgba(160, 160, 160, 0.8)',
                    200, 'rgba(190, 190, 190, 0.8)'
                ],
                'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    12, 0,
                    12.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    12, 0,
                    12.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.7
            }
        },
        labelLayerId
    );
    
    console.log('3D buildings layer added');
}

// Load building data
async function loadData() {
    try {
        const response = await fetch('assets/data/buildings.json');
        if (!response.ok) throw new Error('Failed to load buildings data');
        buildingsData = await response.json();
    } catch (error) {
        console.log('Using sample data');
        buildingsData = generateSampleData();
    }
}

// Generate sample data for demo
function generateSampleData() {
    const data = [];
    const types = ['Office', 'Residential', 'School', 'Hospital', 'Retail'];
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
    
    for (let i = 0; i < 300; i++) {
        data.push({
            id: i,
            property_name: `Building ${i + 1}`,
            address: `${100 + i} Sample St`,
            primary_property_type: types[Math.floor(Math.random() * types.length)],
            retrofit_priority: priorities[Math.floor(Math.random() * priorities.length)],
            energy_star_score: Math.floor(Math.random() * 100) + 1,
            year_built: 1950 + Math.floor(Math.random() * 70),
            latitude: 41.8781 + (Math.random() - 0.5) * 0.4,
            longitude: -87.6298 + (Math.random() - 0.5) * 0.4,
            site_eui_kbtu_sq_ft: Math.floor(Math.random() * 200) + 50
        });
    }
    return data;
}

// Add map layers
function addMapLayers() {
    // Create GeoJSON from data
    const geojson = {
        type: 'FeatureCollection',
        features: buildingsData.map(building => ({
            type: 'Feature',
            properties: building,
            geometry: {
                type: 'Point',
                coordinates: [building.longitude, building.latitude]
            }
        }))
    };

    // Add source
    map.addSource('buildings', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
    });

    // Cluster circles
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'buildings',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': [
                'step', ['get', 'point_count'],
                '#51bbd6', 100, '#f1f075', 750, '#f28cb1'
            ],
            'circle-radius': [
                'step', ['get', 'point_count'],
                20, 100, 30, 750, 40
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
        }
    });

    // Cluster labels
    map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'buildings',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12
        },
        paint: { 'text-color': '#fff' }
    });

    // Individual points
    map.addLayer({
        id: 'buildings-points',
        type: 'circle',
        source: 'buildings',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': [
                'match', ['get', 'retrofit_priority'],
                'Critical', COLORS.Critical,
                'High', COLORS.High,
                'Medium', COLORS.Medium,
                'Low', COLORS.Low,
                'Minimal', COLORS.Minimal,
                COLORS.default
            ],
            'circle-radius': 8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    // Add click handlers
    map.on('click', 'clusters', expandCluster);
    map.on('click', 'buildings-points', showBuildingInfo);
    
    // Hover effects
    map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
    map.on('mouseenter', 'buildings-points', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'buildings-points', () => map.getCanvas().style.cursor = '');
}

// Expand cluster on click
function expandCluster(e) {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    
    map.getSource('buildings').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
        });
    });
}

// Show building info popup
function showBuildingInfo(e) {
    if (currentPopup) currentPopup.remove();
    
    const building = e.features[0].properties;
    
    // Calculate age for display
    const currentYear = new Date().getFullYear();
    const buildingAge = building.year_built ? currentYear - building.year_built : 'Unknown';
    
    // Get click position and map bounds for smart positioning
    const clickPoint = map.project(e.lngLat);
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();
    
    // Estimate popup dimensions
    const popupWidth = 300;
    const popupHeight = 400;
    
    // Determine best anchor position
    let anchor = 'bottom-left';
    let offset = [10, -10];
    
    // Check if popup would go off right edge
    if (clickPoint.x + popupWidth > mapRect.width) {
        anchor = anchor.replace('left', 'right');
        offset[0] = -10;
    }
    
    // Check if popup would go off bottom edge
    if (clickPoint.y + popupHeight > mapRect.height) {
        anchor = anchor.replace('bottom', 'top');
        offset[1] = 10;
    }
    
    currentPopup = new mapboxgl.Popup({ 
        closeButton: true,
        closeOnClick: true,
        closeOnMove: false,
        maxWidth: '300px',
        anchor: anchor,
        offset: offset
    })
        .setLngLat(e.lngLat)
        .setHTML(`
            <div style="font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace; color: white; background: rgba(8, 8, 12, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0; max-width: 280px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); overflow: hidden;">
                <div style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.02); position: relative;">
                    <button onclick="this.closest('.mapboxgl-popup').remove()" style="position: absolute; top: 12px; right: 12px; background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer; padding: 4px; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: normal; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#94a3b8'">×</button>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-right: 30px;">
                        <div style="width: 4px; height: 4px; background: #60a5fa; border-radius: 50%;"></div>
                        <div style="font-size: 14px; font-weight: 600; color: #f8fafc; line-height: 1.2; word-wrap: break-word;">
                            ${(building.property_name || 'Building').substring(0, 35)}${(building.property_name || '').length > 35 ? '...' : ''}
                        </div>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; word-wrap: break-word;">
                        ${(building.address || 'Address not available').substring(0, 40)}${(building.address || '').length > 40 ? '...' : ''}
                    </div>
                </div>
                
                <div style="padding: 16px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Energy Score</div>
                            <div style="font-size: 20px; font-weight: 700; color: ${building.energy_star_score < 50 ? '#ef4444' : building.energy_star_score > 75 ? '#10b981' : '#f59e0b'}">${building.energy_star_score || 'N/A'}</div>
                        </div>
                        <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                            <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Retrofit Score</div>
                            <div style="font-size: 20px; font-weight: 700; color: ${building.retrofit_score > 60 ? '#ef4444' : building.retrofit_score < 30 ? '#10b981' : '#f59e0b'}">${building.retrofit_score ? Math.round(building.retrofit_score) : 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05)); padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(96, 165, 250, 0.2);">
                        <div style="font-size: 11px; color: #e2e8f0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Priority Level</div>
                        <div style="font-size: 18px; font-weight: 700; color: ${COLORS[building.retrofit_priority] || COLORS.default}; text-transform: capitalize;">${building.retrofit_priority || 'Unknown'}</div>
                        ${building.needs_retrofit ? '<div style="margin-top: 6px; font-size: 10px; color: #fca5a5; background: rgba(220, 38, 38, 0.15); padding: 4px 8px; border-radius: 3px; text-align: center;">NEEDS RETROFIT</div>' : ''}
                    </div>
                    
                    <div style="display: grid; gap: 8px; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: #94a3b8;">Type:</span>
                            <span style="color: #e2e8f0; font-weight: 500;">${(building.primary_property_type || 'N/A').substring(0, 20)}${(building.primary_property_type || '').length > 20 ? '...' : ''}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: #94a3b8;">Age:</span>
                            <span style="color: #e2e8f0; font-weight: 500;">${buildingAge} years</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: #94a3b8;">Chicago Rating:</span>
                            <span style="color: #e2e8f0; font-weight: 500;">${building.chicago_energy_rating || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <span style="color: #94a3b8;">Site EUI:</span>
                            <span style="color: #e2e8f0; font-weight: 500;">${building.site_eui_kbtu_sq_ft ? Math.round(building.site_eui_kbtu_sq_ft) + ' kBtu/sq ft' : 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                            <span style="color: #94a3b8;">GHG Intensity:</span>
                            <span style="color: #e2e8f0; font-weight: 500;">${building.ghg_intensity_kg_co2e_sq_ft ? building.ghg_intensity_kg_co2e_sq_ft.toFixed(2) + ' kg/sq ft' : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `)
        .addTo(map);
        
    // Add event listener to close popup when clicking outside
    currentPopup.on('close', () => {
        currentPopup = null;
    });
}

// Setup simple controls
function setupControls() {
    // Building view buttons
    document.getElementById('all-buildings').addEventListener('click', () => {
        setActiveView('all-buildings');
        showAllBuildings();
    });
    
    document.getElementById('retrofit-candidates').addEventListener('click', () => {
        setActiveView('retrofit-candidates');
        showRetrofitCandidates();
    });
    
    // Filter controls
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    document.getElementById('fit-to-data').addEventListener('click', fitToData);
    
    // Clustering toggle
    document.getElementById('show-clusters').addEventListener('change', (e) => {
        toggleClustering(e.target.checked);
    });
}

// Set active view button
function setActiveView(activeId) {
    document.querySelectorAll('.view-button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === activeId) {
            btn.style.background = '#2563eb';
            btn.style.color = 'white';
            btn.classList.add('active');
        } else {
            btn.style.background = 'transparent';
            btn.style.color = '#60a5fa';
        }
    });
}

// Show all buildings
function showAllBuildings() {
    console.log('Showing all buildings');
    clearFilters();
}

// Show only retrofit candidates (Critical and High priority)
function showRetrofitCandidates() {
    console.log('Showing retrofit candidates only');
    // Clear form inputs first
    document.getElementById('priority-filter').value = '';
    document.getElementById('property-type').value = '';
    document.getElementById('energy-min').value = '';
    document.getElementById('energy-max').value = '';
    
    // Filter for Critical and High priority buildings
    const retrofitCandidates = buildingsData.filter(building => 
        building.retrofit_priority === 'Critical' || building.retrofit_priority === 'High'
    );
    
    console.log(`Showing ${retrofitCandidates.length} retrofit candidates out of ${buildingsData.length} total buildings`);
    
    // Update map with filtered data
    updateMapData(retrofitCandidates);
    
    // Show insights for retrofit candidates
    showFilterInsights(retrofitCandidates, { view: 'Retrofit Candidates' });
}

// Apply filters based on form inputs
function applyFilters() {
    console.log('Applying filters...');
    
    const priorityFilter = document.getElementById('priority-filter').value;
    const propertyTypeFilter = document.getElementById('property-type').value;
    const energyMin = parseInt(document.getElementById('energy-min').value) || 0;
    const energyMax = parseInt(document.getElementById('energy-max').value) || 100;
    
    console.log('Filter values:', { priorityFilter, propertyTypeFilter, energyMin, energyMax });
    
    // Filter the buildingsData array and update the source
    let filteredData = buildingsData;
    
    // Apply filters to the data array
    if (priorityFilter && priorityFilter !== '') {
        filteredData = filteredData.filter(building => building.retrofit_priority === priorityFilter);
        console.log('Applied priority filter:', priorityFilter);
    }
    
    if (propertyTypeFilter && propertyTypeFilter !== '') {
        filteredData = filteredData.filter(building => building.primary_property_type === propertyTypeFilter);
        console.log('Applied property type filter:', propertyTypeFilter);
    }
    
    if (energyMin > 0 || energyMax < 100) {
        filteredData = filteredData.filter(building => {
            const score = building.energy_star_score || 0;
            return score >= energyMin && score <= energyMax;
        });
        console.log('Applied energy score filter:', energyMin, 'to', energyMax);
    }
    
    console.log(`Filtered ${buildingsData.length} buildings down to ${filteredData.length}`);
    
    // Update the map source with filtered data
    updateMapData(filteredData);
    
    // Show insights popup with filter results
    showFilterInsights(filteredData, {
        priorityFilter,
        propertyTypeFilter,
        energyMin,
        energyMax
    });
}

// Update map data source with filtered buildings
function updateMapData(filteredBuildings) {
    // Create GeoJSON from filtered data
    const geojson = {
        type: 'FeatureCollection',
        features: filteredBuildings.map(building => ({
            type: 'Feature',
            properties: building,
            geometry: {
                type: 'Point',
                coordinates: [building.longitude, building.latitude]
            }
        }))
    };
    
    // Update the source data - this will automatically re-cluster
    map.getSource('buildings').setData(geojson);
}

// Show insights popup for filtered results
function showFilterInsights(filteredData, filters) {
    // Calculate insights
    const totalOriginal = buildingsData.length;
    const totalFiltered = filteredData.length;
    const percentage = ((totalFiltered / totalOriginal) * 100).toFixed(1);
    
    // Priority distribution
    const priorityCount = {};
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
    priorities.forEach(p => priorityCount[p] = 0);
    
    // Property type distribution
    const typeCount = {};
    
    // Energy score statistics
    let energyScores = [];
    let totalRetrofitScore = 0;
    let retrofitCount = 0;
    
    filteredData.forEach(building => {
        // Count priorities
        if (building.retrofit_priority) {
            priorityCount[building.retrofit_priority]++;
        }
        
        // Count property types
        const type = building.primary_property_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
        
        // Collect energy scores
        if (building.energy_star_score && building.energy_star_score > 0) {
            energyScores.push(building.energy_star_score);
        }
        
        // Collect retrofit scores
        if (building.retrofit_score && building.retrofit_score > 0) {
            totalRetrofitScore += building.retrofit_score;
            retrofitCount++;
        }
    });
    
    // Calculate averages
    const avgEnergy = energyScores.length > 0 ? 
        (energyScores.reduce((a, b) => a + b, 0) / energyScores.length).toFixed(1) : 'N/A';
    const avgRetrofit = retrofitCount > 0 ? 
        (totalRetrofitScore / retrofitCount).toFixed(1) : 'N/A';
    
    // Get top property types
    const topTypes = Object.entries(typeCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
    
    // Create insights content
    const appliedFilters = [];
    if (filters.priorityFilter) appliedFilters.push(`Priority: ${filters.priorityFilter}`);
    if (filters.propertyTypeFilter) appliedFilters.push(`Type: ${filters.propertyTypeFilter}`);
    if (filters.energyMin > 0 || filters.energyMax < 100) {
        appliedFilters.push(`Energy: ${filters.energyMin}-${filters.energyMax}`);
    }
    if (filters.view) appliedFilters.push(`View: ${filters.view}`);
    
    const insightsHTML = `
        <div id="insights-popup" style="font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace; color: white; width: 280px; background: rgba(8, 8, 12, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; position: relative; cursor: move; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);">
            <div id="insights-header" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); cursor: move; user-select: none; background: rgba(255, 255, 255, 0.02);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 6px; height: 6px; background: #60a5fa; border-radius: 50%;"></div>
                    <div style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></div>
                    <div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%;"></div>
                    <h3 style="margin: 0 0 0 8px; color: #f8fafc; font-size: 14px; font-weight: 600;">Filter Analysis</h3>
                </div>
                <button onclick="closeInsightsPopup()" style="background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer; padding: 4px; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: normal; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#94a3b8'">×</button>
            </div>
            
            <div style="padding: 16px;">
                <div style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05)); padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(96, 165, 250, 0.2);">
                    <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px;">Results Summary</div>
                    <div style="font-size: 24px; font-weight: 700; color: #60a5fa; margin-bottom: 4px;">${totalFiltered.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #94a3b8;">
                        ${percentage}% of ${totalOriginal.toLocaleString()} total buildings
                    </div>
                    ${appliedFilters.length > 0 ? `<div style="font-size: 10px; margin-top: 8px; color: #64748b; padding: 4px 8px; background: rgba(0,0,0,0.3); border-radius: 3px;">${appliedFilters.join(' • ')}</div>` : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Energy Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${avgEnergy !== 'N/A' && avgEnergy < 50 ? '#ef4444' : avgEnergy !== 'N/A' && avgEnergy > 75 ? '#10b981' : '#f59e0b'}">${avgEnergy}</div>
                        <div style="font-size: 9px; color: #64748b;">average</div>
                    </div>
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Retrofit Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${avgRetrofit !== 'N/A' && avgRetrofit > 60 ? '#ef4444' : avgRetrofit !== 'N/A' && avgRetrofit < 30 ? '#10b981' : '#f59e0b'}">${avgRetrofit}</div>
                        <div style="font-size: 9px; color: #64748b;">average</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Priority Distribution</div>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                        ${priorities.map(priority => `
                            <div style="text-align: center; padding: 8px 4px; background: rgba(15, 23, 42, 0.4); border-radius: 4px; border: 1px solid ${COLORS[priority]}20;">
                                <div style="color: ${COLORS[priority]}; font-weight: 700; font-size: 14px; margin-bottom: 2px;">${priorityCount[priority]}</div>
                                <div style="color: #64748b; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">${priority.substring(0,4)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${topTypes.length > 0 ? `
                    <div>
                        <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Top Property Types</div>
                        <div style="background: rgba(15, 23, 42, 0.4); border-radius: 6px; padding: 8px;">
                            ${topTypes.map(([type, count], index) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; ${index < topTypes.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.05);' : ''}">
                                    <span style="font-size: 11px; color: #e2e8f0;">${type.length > 18 ? type.substring(0, 18) + '...' : type}</span>
                                    <span style="font-weight: 700; color: #60a5fa; font-size: 12px; background: rgba(96, 165, 250, 0.15); padding: 2px 6px; border-radius: 3px;">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Remove any existing insights popup
    if (window.currentInsightsPopup) {
        window.currentInsightsPopup.remove();
        window.currentInsightsPopup = null;
    }
    
    // Create custom overlay instead of Mapbox popup
    const mapContainer = document.getElementById('map');
    const overlay = document.createElement('div');
    overlay.innerHTML = insightsHTML;
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.left = '30%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'auto';
    
    mapContainer.appendChild(overlay);
    
    // Store reference for closing
    window.currentInsightsPopup = {
        remove: () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        },
        isOpen: () => {
            return overlay && overlay.parentNode;
        }
    };
    
    // Make popup draggable after it's added to DOM
    setTimeout(() => {
        makePopupDraggable();
    }, 500);
    
    // Auto-close after 15 seconds (increased since it's now draggable)
    setTimeout(() => {
        if (window.currentInsightsPopup && window.currentInsightsPopup.isOpen()) {
            window.currentInsightsPopup.remove();
        }
    }, 15000);
}

// Close insights popup function
function closeInsightsPopup() {
    if (window.currentInsightsPopup) {
        window.currentInsightsPopup.remove();
        window.currentInsightsPopup = null;
    }
}

// Make popup draggable
function makePopupDraggable() {
    // Wait for the popup to be fully rendered in the DOM
    setTimeout(() => {
        const popup = document.getElementById('insights-popup');
        const header = document.getElementById('insights-header');
        
        if (!popup || !header) {
            console.log('Popup elements not found for dragging');
            return;
        }
        
        // Find the overlay container (parent of popup)
        const overlay = popup.parentElement;
        if (!overlay) {
            console.log('Overlay container not found');
            return;
        }
        
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let elementStartX = 0;
        let elementStartY = 0;
        
        const startDrag = (e) => {
            isDragging = true;
            
            // Prevent any default behavior
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Get current position
            const rect = overlay.getBoundingClientRect();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            elementStartX = rect.left;
            elementStartY = rect.top;
            
            // Remove transform and set absolute positioning
            overlay.style.transform = 'none';
            overlay.style.left = elementStartX + 'px';
            overlay.style.top = elementStartY + 'px';
            
            // Visual feedback
            header.style.cursor = 'grabbing';
            overlay.style.zIndex = '1001';
            
            // Add temporary event listeners to document
            document.addEventListener('mousemove', handleDrag, { passive: false, capture: true });
            document.addEventListener('mouseup', stopDrag, { passive: false, capture: true });
        };
        
        const handleDrag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Calculate new position
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;
            
            let newLeft = elementStartX + deltaX;
            let newTop = elementStartY + deltaY;
            
            // Get map container bounds
            const mapContainer = document.getElementById('map');
            const mapRect = mapContainer.getBoundingClientRect();
            const popupWidth = overlay.offsetWidth;
            const popupHeight = overlay.offsetHeight;
            
            // Constrain to map bounds with padding
            const padding = 10;
            newLeft = Math.max(mapRect.left + padding, Math.min(newLeft, mapRect.right - popupWidth - padding));
            newTop = Math.max(mapRect.top + padding, Math.min(newTop, mapRect.bottom - popupHeight - padding));
            
            // Apply new position
            overlay.style.left = newLeft + 'px';
            overlay.style.top = newTop + 'px';
        };
        
        const stopDrag = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Reset cursor
            header.style.cursor = 'move';
            
            // Remove temporary event listeners
            document.removeEventListener('mousemove', handleDrag, { capture: true });
            document.removeEventListener('mouseup', stopDrag, { capture: true });
        };
        
        // Add mousedown listener to header only
        header.addEventListener('mousedown', startDrag, { passive: false });
        
        // Prevent context menu on header
        header.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        console.log('Popup made draggable');
    }, 200);
}

// Clear all filters
function clearFilters() {
    console.log('Clearing all filters...');
    
    // Reset form inputs
    document.getElementById('priority-filter').value = '';
    document.getElementById('property-type').value = '';
    document.getElementById('energy-min').value = '';
    document.getElementById('energy-max').value = '';
    
    // Reset map data to show all buildings
    updateMapData(buildingsData);
    
    // Reset to "All Buildings" view
    setActiveView('all-buildings');
    
    console.log('Filters cleared - showing all', buildingsData.length, 'buildings');
}

// Fit map to visible data
function fitToData() {
    const features = map.queryRenderedFeatures({ layers: ['buildings-points', 'clusters'] });
    
    if (features.length === 0) {
        // If no features visible, fit to all data bounds
        const bounds = calculateDataBounds(buildingsData);
        if (bounds) {
            map.fitBounds(bounds, { padding: 20, maxZoom: 16 });
        }
        return;
    }
    
    const bounds = new mapboxgl.LngLatBounds();
    features.forEach(feature => {
        if (feature.geometry.type === 'Point') {
            bounds.extend(feature.geometry.coordinates);
        }
    });
    
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
}

// Toggle clustering
function toggleClustering(enabled) {
    if (enabled) {
        map.setLayoutProperty('clusters', 'visibility', 'visible');
        map.setLayoutProperty('cluster-count', 'visibility', 'visible');
        map.setFilter('buildings-points', ['!', ['has', 'point_count']]);
    } else {
        map.setLayoutProperty('clusters', 'visibility', 'none');
        map.setLayoutProperty('cluster-count', 'visibility', 'none');
        map.setFilter('buildings-points', null);
    }
}

// Update statistics
function updateStats() {
    const total = buildingsData.length;
    const critical = buildingsData.filter(b => b.retrofit_priority === 'Critical').length;
    const high = buildingsData.filter(b => b.retrofit_priority === 'High').length;
    const needsRetrofit = buildingsData.filter(b => b.needs_retrofit === true || b.needs_retrofit === 'true').length;
    
    // Calculate average scores
    const avgEnergy = Math.round(
        buildingsData
            .filter(b => b.energy_star_score && b.energy_star_score > 0)
            .reduce((sum, b) => sum + parseFloat(b.energy_star_score), 0) / 
        buildingsData.filter(b => b.energy_star_score && b.energy_star_score > 0).length
    ) || 0;
    
    const avgRetrofitScore = Math.round(
        buildingsData
            .filter(b => b.retrofit_score && b.retrofit_score > 0)
            .reduce((sum, b) => sum + parseFloat(b.retrofit_score), 0) / 
        buildingsData.filter(b => b.retrofit_score && b.retrofit_score > 0).length
    ) || 0;
    
    document.getElementById('total-buildings').textContent = total.toLocaleString();
    document.getElementById('critical-count').textContent = `${critical.toLocaleString()} Critical + ${high.toLocaleString()} High`;
    document.getElementById('avg-energy-score').textContent = `${avgEnergy} (Retrofit: ${avgRetrofitScore})`;
}

// Utility functions
function showLoading(message) {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loading').innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <p>${message}</p>
        </div>
    `;
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    document.getElementById('loading').innerHTML = `
        <div style="color: #ff3e3e; text-align: center;">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #ff3e3e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Reload
            </button>
        </div>
    `;
}

// Start the app
map.on('load', init);
