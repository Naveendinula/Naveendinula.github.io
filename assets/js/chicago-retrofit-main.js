// Chicago Buildings Retrofit Map
// Local canvas renderer with no external map or tile API calls.

const mapContainer = document.getElementById('map');
const canvas = document.createElement('canvas');
canvas.className = 'local-geo-canvas';
mapContainer.appendChild(canvas);

const ctx = canvas.getContext('2d');

let buildingsData = [];
let visibleBuildings = [];
let boundaryData = null;
let currentBounds = null;
let currentPopup = null;
let lastMarkers = [];
let clusteringEnabled = true;

const COLORS = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#d97706',
    Low: '#65a30d',
    Minimal: '#059669',
    default: '#9ca3af'
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function getValidBuildings(data) {
    return data.filter((building) => (
        toNumber(building.longitude) !== null &&
        toNumber(building.latitude) !== null
    ));
}

function calculateDataBounds(data) {
    const valid = getValidBuildings(data);
    if (!valid.length) return null;

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    valid.forEach((building) => {
        const lng = toNumber(building.longitude);
        const lat = toNumber(building.latitude);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
    });

    const lngPadding = Math.max((maxLng - minLng) * 0.08, 0.01);
    const latPadding = Math.max((maxLat - minLat) * 0.08, 0.01);

    return {
        minLng: minLng - lngPadding,
        maxLng: maxLng + lngPadding,
        minLat: minLat - latPadding,
        maxLat: maxLat + latPadding
    };
}

function collectCoordinates(geometry, coordinates = []) {
    if (!geometry || !geometry.coordinates) return coordinates;

    const walk = (node) => {
        if (!Array.isArray(node)) return;
        if (typeof node[0] === 'number' && typeof node[1] === 'number') {
            coordinates.push(node);
            return;
        }
        node.forEach(walk);
    };

    walk(geometry.coordinates);
    return coordinates;
}

function projectCoordinate(lng, lat, bounds, width, height, padding = 56) {
    const plotWidth = Math.max(width - padding * 2, 1);
    const plotHeight = Math.max(height - padding * 2, 1);
    const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
    const scale = Math.min(plotWidth / lngSpan, plotHeight / latSpan);
    const offsetX = (width - lngSpan * scale) / 2;
    const offsetY = (height - latSpan * scale) / 2;

    return {
        x: offsetX + (lng - bounds.minLng) * scale,
        y: offsetY + (bounds.maxLat - lat) * scale
    };
}

function resizeCanvas() {
    const rect = mapContainer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(Math.floor(rect.width * dpr), 1);
    canvas.height = Math.max(Math.floor(rect.height * dpr), 1);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap();
}

function drawBackground(width, height) {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 44) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += 44) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
    ctx.font = '12px JetBrains Mono, Consolas, monospace';
    ctx.fillText('Chicago local coordinate view - no external map tiles', 24, height - 28);
    ctx.restore();
}

function drawBoundaryGeometry(geometry, bounds, width, height) {
    if (!geometry || !geometry.coordinates) return;

    const drawRing = (ring) => {
        if (!Array.isArray(ring) || !ring.length) return;
        ctx.beginPath();
        ring.forEach((coord, index) => {
            const point = projectCoordinate(coord[0], coord[1], bounds, width, height);
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach(drawRing);
    } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon) => polygon.forEach(drawRing));
    }
}

function drawBoundaries(bounds, width, height) {
    if (!boundaryData || !boundaryData.features) return;

    ctx.save();
    ctx.fillStyle = 'rgba(30, 64, 175, 0.08)';
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.32)';
    ctx.lineWidth = 1;
    boundaryData.features.forEach((feature) => {
        drawBoundaryGeometry(feature.geometry, bounds, width, height);
    });
    ctx.restore();
}

function buildMarkers(buildings, bounds, width, height) {
    const valid = getValidBuildings(buildings);

    if (!clusteringEnabled) {
        return valid.map((building) => {
            const point = projectCoordinate(
                toNumber(building.longitude),
                toNumber(building.latitude),
                bounds,
                width,
                height
            );
            return {
                type: 'building',
                x: point.x,
                y: point.y,
                radius: 5,
                buildings: [building]
            };
        });
    }

    const cellSize = 38;
    const clusters = new Map();

    valid.forEach((building) => {
        const point = projectCoordinate(
            toNumber(building.longitude),
            toNumber(building.latitude),
            bounds,
            width,
            height
        );
        const key = `${Math.floor(point.x / cellSize)}:${Math.floor(point.y / cellSize)}`;
        const cluster = clusters.get(key) || { x: 0, y: 0, buildings: [] };
        cluster.x += point.x;
        cluster.y += point.y;
        cluster.buildings.push(building);
        clusters.set(key, cluster);
    });

    return Array.from(clusters.values()).map((cluster) => {
        const count = cluster.buildings.length;
        return {
            type: count > 1 ? 'cluster' : 'building',
            x: cluster.x / count,
            y: cluster.y / count,
            radius: count > 1 ? Math.min(28, 12 + Math.log(count) * 4) : 5,
            buildings: cluster.buildings
        };
    });
}

function getPriorityColor(buildings) {
    const priorityOrder = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
    const counts = priorityOrder.map((priority) => ({
        priority,
        count: buildings.filter((building) => building.retrofit_priority === priority).length
    }));
    counts.sort((a, b) => b.count - a.count);
    return COLORS[counts[0]?.priority] || COLORS.default;
}

function drawMarkers(bounds, width, height) {
    lastMarkers = buildMarkers(visibleBuildings, bounds, width, height);

    lastMarkers
        .filter((marker) => marker.type === 'cluster')
        .forEach((marker) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
            ctx.fillStyle = getPriorityColor(marker.buildings);
            ctx.globalAlpha = 0.78;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 11px JetBrains Mono, Consolas, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(marker.buildings.length > 999 ? '999+' : String(marker.buildings.length), marker.x, marker.y);
            ctx.restore();
        });

    lastMarkers
        .filter((marker) => marker.type === 'building')
        .forEach((marker) => {
            const building = marker.buildings[0];
            ctx.save();
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
            ctx.fillStyle = COLORS[building.retrofit_priority] || COLORS.default;
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        });
}

function drawMap() {
    const rect = mapContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (!width || !height) return;

    const bounds = currentBounds || calculateDataBounds(visibleBuildings) || calculateDataBounds(buildingsData);
    drawBackground(width, height);

    if (!bounds) {
        return;
    }

    drawBoundaries(bounds, width, height);
    drawMarkers(bounds, width, height);
}

async function loadData() {
    try {
        const response = await fetch('assets/data/buildings.json');
        if (!response.ok) throw new Error('Failed to load buildings data');
        buildingsData = await response.json();
    } catch (error) {
        console.log('Using sample data');
        buildingsData = generateSampleData();
    }
    visibleBuildings = buildingsData;
    currentBounds = calculateDataBounds(buildingsData);
}

async function loadBoundaryData() {
    try {
        const response = await fetch('assets/data/retrofit-v2/community_boundaries.geojson');
        if (response.ok) {
            boundaryData = await response.json();
        }
    } catch (error) {
        boundaryData = null;
    }
}

function generateSampleData() {
    const data = [];
    const types = ['Office', 'Residential', 'School', 'Hospital', 'Retail'];
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];

    for (let i = 0; i < 300; i += 1) {
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

function setupControls() {
    document.getElementById('all-buildings').addEventListener('click', () => {
        setActiveView('all-buildings');
        showAllBuildings();
    });

    document.getElementById('retrofit-candidates').addEventListener('click', () => {
        setActiveView('retrofit-candidates');
        showRetrofitCandidates();
    });

    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    document.getElementById('fit-to-data').addEventListener('click', fitToData);
    document.getElementById('show-clusters').addEventListener('change', (event) => {
        toggleClustering(event.target.checked);
    });

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);
    canvas.addEventListener('mouseleave', () => {
        canvas.style.cursor = 'default';
    });
    window.addEventListener('resize', resizeCanvas);
}

function setActiveView(activeId) {
    document.querySelectorAll('.view-button').forEach((button) => {
        button.classList.remove('active');
        if (button.id === activeId) {
            button.style.background = '#2563eb';
            button.style.color = 'white';
            button.classList.add('active');
        } else {
            button.style.background = 'transparent';
            button.style.color = '#60a5fa';
        }
    });
}

function showAllBuildings() {
    clearFilters();
}

function showRetrofitCandidates() {
    document.getElementById('priority-filter').value = '';
    document.getElementById('property-type').value = '';
    document.getElementById('energy-min').value = '';
    document.getElementById('energy-max').value = '';

    const retrofitCandidates = buildingsData.filter((building) => (
        building.retrofit_priority === 'Critical' || building.retrofit_priority === 'High'
    ));

    updateMapData(retrofitCandidates);
    showFilterInsights(retrofitCandidates, { view: 'Retrofit Candidates' });
}

function applyFilters() {
    const priorityFilter = document.getElementById('priority-filter').value;
    const propertyTypeFilter = document.getElementById('property-type').value;
    const energyMin = parseInt(document.getElementById('energy-min').value, 10) || 0;
    const energyMax = parseInt(document.getElementById('energy-max').value, 10) || 100;

    let filteredData = buildingsData;

    if (priorityFilter) {
        filteredData = filteredData.filter((building) => building.retrofit_priority === priorityFilter);
    }

    if (propertyTypeFilter) {
        filteredData = filteredData.filter((building) => building.primary_property_type === propertyTypeFilter);
    }

    if (energyMin > 0 || energyMax < 100) {
        filteredData = filteredData.filter((building) => {
            const score = toNumber(building.energy_star_score) || 0;
            return score >= energyMin && score <= energyMax;
        });
    }

    updateMapData(filteredData);
    showFilterInsights(filteredData, {
        priorityFilter,
        propertyTypeFilter,
        energyMin,
        energyMax
    });
}

function updateMapData(filteredBuildings) {
    visibleBuildings = filteredBuildings;
    currentBounds = calculateDataBounds(filteredBuildings) || calculateDataBounds(buildingsData);
    drawMap();
}

function removeCurrentPopup() {
    if (currentPopup && currentPopup.parentNode) {
        currentPopup.parentNode.removeChild(currentPopup);
    }
    currentPopup = null;
}

function positionPopup(popup, x, y) {
    const rect = mapContainer.getBoundingClientRect();
    const popupWidth = 300;
    const popupHeight = 400;
    const left = Math.min(Math.max(x + 12, 12), rect.width - popupWidth - 12);
    const top = Math.min(Math.max(y + 12, 12), rect.height - popupHeight - 12);
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
}

function formatMetric(value, fallback = 'N/A', digits = 0) {
    const number = toNumber(value);
    if (number === null) return fallback;
    return digits > 0 ? number.toFixed(digits) : Math.round(number).toLocaleString();
}

function showBuildingPopup(building, x, y) {
    removeCurrentPopup();

    const currentYear = new Date().getFullYear();
    const yearBuilt = toNumber(building.year_built);
    const buildingAge = yearBuilt ? currentYear - yearBuilt : 'Unknown';
    const energyScore = toNumber(building.energy_star_score);
    const retrofitScore = toNumber(building.retrofit_score);

    const popup = document.createElement('div');
    popup.className = 'local-map-popup';
    popup.innerHTML = `
        <div style="font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace; color: white; background: rgba(8, 8, 12, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0; max-width: 280px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); overflow: hidden;">
            <div style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.02); position: relative;">
                <button type="button" data-popup-close style="position: absolute; top: 12px; right: 12px; background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer; padding: 4px; width: 24px; height: 24px; border-radius: 4px;">x</button>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-right: 30px;">
                    <div style="width: 4px; height: 4px; background: #60a5fa; border-radius: 50%;"></div>
                    <div style="font-size: 14px; font-weight: 600; color: #f8fafc; line-height: 1.2; word-wrap: break-word;">
                        ${escapeHtml((building.property_name || 'Building').substring(0, 35))}${(building.property_name || '').length > 35 ? '...' : ''}
                    </div>
                </div>
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; word-wrap: break-word;">
                    ${escapeHtml((building.address || 'Address not available').substring(0, 40))}${(building.address || '').length > 40 ? '...' : ''}
                </div>
            </div>
            <div style="padding: 16px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Energy Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${energyScore !== null && energyScore < 50 ? '#ef4444' : energyScore !== null && energyScore > 75 ? '#10b981' : '#f59e0b'}">${energyScore ?? 'N/A'}</div>
                    </div>
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Retrofit Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${retrofitScore !== null && retrofitScore > 60 ? '#ef4444' : retrofitScore !== null && retrofitScore < 30 ? '#10b981' : '#f59e0b'}">${retrofitScore !== null ? Math.round(retrofitScore) : 'N/A'}</div>
                    </div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05)); padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(96, 165, 250, 0.2);">
                    <div style="font-size: 11px; color: #e2e8f0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Priority Level</div>
                    <div style="font-size: 18px; font-weight: 700; color: ${COLORS[building.retrofit_priority] || COLORS.default}; text-transform: capitalize;">${escapeHtml(building.retrofit_priority || 'Unknown')}</div>
                    ${building.needs_retrofit ? '<div style="margin-top: 6px; font-size: 10px; color: #fca5a5; background: rgba(220, 38, 38, 0.15); padding: 4px 8px; border-radius: 3px; text-align: center;">NEEDS RETROFIT</div>' : ''}
                </div>
                <div style="display: grid; gap: 8px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Type:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${escapeHtml((building.primary_property_type || 'N/A').substring(0, 20))}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Age:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${escapeHtml(buildingAge)} years</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Chicago Rating:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${escapeHtml(building.chicago_energy_rating || 'N/A')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Site EUI:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${formatMetric(building.site_eui_kbtu_sq_ft)} kBtu/sq ft</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span style="color: #94a3b8;">GHG Intensity:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${formatMetric(building.ghg_intensity_kg_co2e_sq_ft, 'N/A', 2)} kg/sq ft</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    popup.querySelector('[data-popup-close]').addEventListener('click', removeCurrentPopup);
    mapContainer.appendChild(popup);
    positionPopup(popup, x, y);
    currentPopup = popup;
}

function showClusterPopup(marker, x, y) {
    removeCurrentPopup();

    const counts = {};
    marker.buildings.forEach((building) => {
        const priority = building.retrofit_priority || 'Unknown';
        counts[priority] = (counts[priority] || 0) + 1;
    });

    const rows = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([priority, count]) => `
            <div style="display:flex; justify-content:space-between; gap:16px; padding:4px 0;">
                <span style="color:${COLORS[priority] || COLORS.default};">${escapeHtml(priority)}</span>
                <strong>${count.toLocaleString()}</strong>
            </div>
        `)
        .join('');

    const popup = document.createElement('div');
    popup.className = 'local-map-popup';
    popup.innerHTML = `
        <div style="width: 260px; color: white; background: rgba(8, 8, 12, 0.96); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); overflow: hidden;">
            <div style="padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative;">
                <button type="button" data-popup-close style="position:absolute; top:10px; right:10px; background:transparent; color:#94a3b8; border:0; cursor:pointer;">x</button>
                <div style="font-weight: 700; color: #f8fafc;">Cluster Summary</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${marker.buildings.length.toLocaleString()} buildings in this area</div>
            </div>
            <div style="padding: 14px; font-size: 12px;">${rows}</div>
        </div>
    `;

    popup.querySelector('[data-popup-close]').addEventListener('click', removeCurrentPopup);
    mapContainer.appendChild(popup);
    positionPopup(popup, x, y);
    currentPopup = popup;
}

function findMarkerAtPoint(x, y) {
    let bestMarker = null;
    let bestDistance = Infinity;

    lastMarkers.forEach((marker) => {
        const distance = Math.hypot(marker.x - x, marker.y - y);
        const hitRadius = Math.max(marker.radius + 4, 9);
        if (distance <= hitRadius && distance < bestDistance) {
            bestMarker = marker;
            bestDistance = distance;
        }
    });

    return bestMarker;
}

function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function handleCanvasClick(event) {
    const point = getPointerPosition(event);
    const marker = findMarkerAtPoint(point.x, point.y);

    if (!marker) {
        removeCurrentPopup();
        return;
    }

    if (marker.type === 'cluster') {
        showClusterPopup(marker, point.x, point.y);
    } else {
        showBuildingPopup(marker.buildings[0], point.x, point.y);
    }
}

function handleCanvasMove(event) {
    const point = getPointerPosition(event);
    canvas.style.cursor = findMarkerAtPoint(point.x, point.y) ? 'pointer' : 'default';
}

function showFilterInsights(filteredData, filters) {
    const totalOriginal = buildingsData.length;
    const totalFiltered = filteredData.length;
    const percentage = totalOriginal > 0 ? ((totalFiltered / totalOriginal) * 100).toFixed(1) : '0.0';
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
    const priorityCount = Object.fromEntries(priorities.map((priority) => [priority, 0]));
    const typeCount = {};
    const energyScores = [];
    let totalRetrofitScore = 0;
    let retrofitCount = 0;

    filteredData.forEach((building) => {
        if (building.retrofit_priority && priorityCount[building.retrofit_priority] !== undefined) {
            priorityCount[building.retrofit_priority] += 1;
        }

        const type = building.primary_property_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;

        const energyScore = toNumber(building.energy_star_score);
        if (energyScore !== null && energyScore > 0) {
            energyScores.push(energyScore);
        }

        const retrofitScore = toNumber(building.retrofit_score);
        if (retrofitScore !== null && retrofitScore > 0) {
            totalRetrofitScore += retrofitScore;
            retrofitCount += 1;
        }
    });

    const avgEnergy = energyScores.length > 0
        ? (energyScores.reduce((a, b) => a + b, 0) / energyScores.length).toFixed(1)
        : 'N/A';
    const avgRetrofit = retrofitCount > 0 ? (totalRetrofitScore / retrofitCount).toFixed(1) : 'N/A';
    const topTypes = Object.entries(typeCount).sort(([, a], [, b]) => b - a).slice(0, 3);
    const appliedFilters = [];

    if (filters.priorityFilter) appliedFilters.push(`Priority: ${filters.priorityFilter}`);
    if (filters.propertyTypeFilter) appliedFilters.push(`Type: ${filters.propertyTypeFilter}`);
    if (filters.energyMin > 0 || filters.energyMax < 100) appliedFilters.push(`Energy: ${filters.energyMin}-${filters.energyMax}`);
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
                <button onclick="closeInsightsPopup()" style="background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer; padding: 4px; width: 24px; height: 24px; border-radius: 4px;">x</button>
            </div>
            <div style="padding: 16px;">
                <div style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05)); padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(96, 165, 250, 0.2);">
                    <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px;">Results Summary</div>
                    <div style="font-size: 24px; font-weight: 700; color: #60a5fa; margin-bottom: 4px;">${totalFiltered.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #94a3b8;">${percentage}% of ${totalOriginal.toLocaleString()} total buildings</div>
                    ${appliedFilters.length > 0 ? `<div style="font-size: 10px; margin-top: 8px; color: #64748b; padding: 4px 8px; background: rgba(0,0,0,0.3); border-radius: 3px;">${escapeHtml(appliedFilters.join(' | '))}</div>` : ''}
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
                        ${priorities.map((priority) => `
                            <div style="text-align: center; padding: 8px 4px; background: rgba(15, 23, 42, 0.4); border-radius: 4px; border: 1px solid ${COLORS[priority]}20;">
                                <div style="color: ${COLORS[priority]}; font-weight: 700; font-size: 14px; margin-bottom: 2px;">${priorityCount[priority]}</div>
                                <div style="color: #64748b; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">${priority.substring(0, 4)}</div>
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
                                    <span style="font-size: 11px; color: #e2e8f0;">${escapeHtml(type.length > 18 ? `${type.substring(0, 18)}...` : type)}</span>
                                    <span style="font-weight: 700; color: #60a5fa; font-size: 12px; background: rgba(96, 165, 250, 0.15); padding: 2px 6px; border-radius: 3px;">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    if (window.currentInsightsPopup) {
        window.currentInsightsPopup.remove();
        window.currentInsightsPopup = null;
    }

    const overlay = document.createElement('div');
    overlay.innerHTML = insightsHTML;
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.left = '30%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'auto';

    mapContainer.appendChild(overlay);

    window.currentInsightsPopup = {
        remove: () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        },
        isOpen: () => overlay && overlay.parentNode
    };

    setTimeout(makePopupDraggable, 200);
    setTimeout(() => {
        if (window.currentInsightsPopup && window.currentInsightsPopup.isOpen()) {
            window.currentInsightsPopup.remove();
        }
    }, 15000);
}

function closeInsightsPopup() {
    if (window.currentInsightsPopup) {
        window.currentInsightsPopup.remove();
        window.currentInsightsPopup = null;
    }
}

window.closeInsightsPopup = closeInsightsPopup;

function makePopupDraggable() {
    const popup = document.getElementById('insights-popup');
    const header = document.getElementById('insights-header');
    if (!popup || !header) return;

    const overlay = popup.parentElement;
    if (!overlay) return;

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;

    const handleDrag = (event) => {
        if (!isDragging) return;

        event.preventDefault();
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;
        const mapRect = mapContainer.getBoundingClientRect();
        const popupWidth = overlay.offsetWidth;
        const popupHeight = overlay.offsetHeight;
        const padding = 10;
        const newLeft = Math.max(mapRect.left + padding, Math.min(elementStartX + deltaX, mapRect.right - popupWidth - padding));
        const newTop = Math.max(mapRect.top + padding, Math.min(elementStartY + deltaY, mapRect.bottom - popupHeight - padding));

        overlay.style.left = `${newLeft}px`;
        overlay.style.top = `${newTop}px`;
    };

    const stopDrag = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
        header.style.cursor = 'move';
    };

    header.addEventListener('mousedown', (event) => {
        isDragging = true;
        const rect = overlay.getBoundingClientRect();
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        elementStartX = rect.left;
        elementStartY = rect.top;
        overlay.style.transform = 'none';
        overlay.style.left = `${elementStartX}px`;
        overlay.style.top = `${elementStartY}px`;
        header.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        event.preventDefault();
    });
}

function clearFilters() {
    document.getElementById('priority-filter').value = '';
    document.getElementById('property-type').value = '';
    document.getElementById('energy-min').value = '';
    document.getElementById('energy-max').value = '';
    updateMapData(buildingsData);
    setActiveView('all-buildings');
}

function fitToData() {
    currentBounds = calculateDataBounds(visibleBuildings) || calculateDataBounds(buildingsData);
    drawMap();
}

function toggleClustering(enabled) {
    clusteringEnabled = enabled;
    drawMap();
}

function updateStats() {
    const total = buildingsData.length;
    const critical = buildingsData.filter((building) => building.retrofit_priority === 'Critical').length;
    const high = buildingsData.filter((building) => building.retrofit_priority === 'High').length;
    const needsRetrofit = buildingsData.filter((building) => building.needs_retrofit === true || building.needs_retrofit === 'true').length;
    const energyScores = buildingsData.map((building) => toNumber(building.energy_star_score)).filter((score) => score !== null && score > 0);
    const retrofitScores = buildingsData.map((building) => toNumber(building.retrofit_score)).filter((score) => score !== null && score > 0);
    const avgEnergy = energyScores.length
        ? Math.round(energyScores.reduce((sum, score) => sum + score, 0) / energyScores.length)
        : 0;
    const avgRetrofitScore = retrofitScores.length
        ? Math.round(retrofitScores.reduce((sum, score) => sum + score, 0) / retrofitScores.length)
        : 0;

    document.getElementById('total-buildings').textContent = total.toLocaleString();
    document.getElementById('critical-count').textContent = `${critical.toLocaleString()} Critical + ${high.toLocaleString()} High`;
    document.getElementById('avg-energy-score').textContent = `${avgEnergy} (Retrofit: ${avgRetrofitScore}, Needs: ${needsRetrofit.toLocaleString()})`;
}

function showLoading(message) {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loading').innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
            <p>${escapeHtml(message)}</p>
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
            <p>${escapeHtml(message)}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #ff3e3e; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Reload
            </button>
        </div>
    `;
}

async function init() {
    try {
        showLoading('Loading building data...');
        await Promise.all([loadData(), loadBoundaryData()]);
        setupControls();
        updateStats();
        resizeCanvas();
        hideLoading();
        console.log('App ready with', buildingsData.length, 'buildings');
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to load data');
    }
}

init();
