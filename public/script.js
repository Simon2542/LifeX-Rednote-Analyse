document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
    checkForExistingData();
});

function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
        }
    });
}

function uploadFile(file) {
    const uploadStatus = document.getElementById('uploadStatus');
    
    // Validate file type
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showUploadStatus('error', 'Please select a valid Excel file (.xlsx or .xls)');
        return;
    }

    // Show loading status
    showUploadStatus('loading', `Uploading ${file.name}...`);

    // Create FormData
    const formData = new FormData();
    formData.append('excelFile', file);

    // Upload file
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showUploadStatus('success', `File uploaded successfully! Found ${data.brokersCount} brokers.`);
            // Hide upload section and show data visualization
            setTimeout(() => {
                hideUploadSection();
                loadBrokerData();
            }, 2000);
        } else {
            showUploadStatus('error', data.error || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showUploadStatus('error', 'Upload failed. Please try again.');
    });
}

function showUploadStatus(type, message) {
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.className = `upload-status ${type}`;
    uploadStatus.textContent = message;
    uploadStatus.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 5000);
    }
}

function checkForExistingData() {
    // Check if broker data already exists
    fetch('/api/brokers')
        .then(response => response.json())
        .then(data => {
            if (data.brokers && data.brokers.length > 0) {
                // Data exists, hide upload and show visualization
                hideUploadSection();
                loadBrokerData();
            }
            // If no data, keep upload section visible
        })
        .catch(error => {
            // If error (no data file), keep upload section visible
            console.log('No existing data found, showing upload section');
        });
}

function hideUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    const dataVisualization = document.getElementById('data-visualization');
    
    uploadSection.style.display = 'none';
    dataVisualization.style.display = 'block';
}

function showUploadSection() {
    const uploadSection = document.getElementById('upload-section');
    const dataVisualization = document.getElementById('data-visualization');
    
    uploadSection.style.display = 'block';
    dataVisualization.style.display = 'none';
}

function clearBrokerData() {
    document.getElementById('internal-brokers').innerHTML = '';
    document.getElementById('external-brokers').innerHTML = '';
    
    // Clear existing charts
    if (window.internalChart) {
        window.internalChart.destroy();
    }
    if (window.externalChart) {
        window.externalChart.destroy();
    }
}

async function loadBrokerData() {
    try {
        const response = await fetch('/api/brokers');
        const data = await response.json();
        
        const internalBrokers = data.brokers
            .filter(broker => broker.type === 'internal')
            .sort((a, b) => b.settleRate - a.settleRate);
            
        const externalBrokers = data.brokers
            .filter(broker => broker.type === 'external')
            .sort((a, b) => b.settleRate - a.settleRate);
            
        renderBrokers('internal-brokers', internalBrokers);
        renderBrokers('external-brokers', externalBrokers);
        
        // Render charts
        renderCharts(internalBrokers, externalBrokers);
    } catch (error) {
        console.error('Error loading broker data:', error);
    }
}

function renderBrokers(containerId, brokers) {
    const container = document.getElementById(containerId);
    
    brokers.forEach(broker => {
        const kpiCard = createKpiCard(broker);
        container.appendChild(kpiCard);
    });
}

function createKpiCard(broker) {
    const settleRatePercent = (broker.settleRate * 100).toFixed(1);
    const performanceClass = getPerformanceClass(broker.settleRate);
    
    const card = document.createElement('div');
    card.className = `kpi-card ${performanceClass}`;
    
    card.innerHTML = `
        <div class="broker-name">${broker.name}</div>
        <div class="settle-rate ${performanceClass}">${settleRatePercent}%</div>
        <div class="settle-label">Settle Rate</div>
        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Settled</div>
                <div class="metric-value">${broker.settledQuantity.toLocaleString()}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Allocated</div>
                <div class="metric-value">${broker.allocatedRedLeads.toLocaleString()}</div>
            </div>
        </div>
    `;
    
    return card;
}

function getPerformanceClass(settleRate) {
    if (settleRate >= 0.90) return 'excellent';
    if (settleRate >= 0.75) return 'good';
    if (settleRate >= 0.60) return 'needs-improvement';
    return 'poor';
}

function calculateSettleRate(settledQuantity, allocatedRedLeads) {
    if (allocatedRedLeads === 0) return 0;
    return settledQuantity / allocatedRedLeads;
}

function renderCharts(internalBrokers, externalBrokers) {
    // Render internal brokers chart
    if (internalBrokers.length > 0) {
        renderChart('internal-chart', internalBrokers, 'Internal Brokers');
    }
    
    // Render external brokers chart
    if (externalBrokers.length > 0) {
        renderChart('external-chart', externalBrokers, 'External Brokers');
    }
}

function renderChart(canvasId, brokers, title) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Prepare data
    const labels = brokers.map(broker => broker.name);
    const allocatedData = brokers.map(broker => broker.allocatedRedLeads);
    const settledData = brokers.map(broker => broker.settledQuantity);
    
    // Calculate bar width to match KPI cards
    const cardWidth = 180; // Matches min-width of KPI cards
    const cardGap = 16; // Gap between KPI cards
    const chartWidth = cardWidth * brokers.length + (brokers.length - 1) * cardGap;
    
    // Create chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Allocated Red Leads',
                    data: allocatedData,
                    backgroundColor: 'rgba(60, 189, 229, 0.7)',
                    borderColor: '#3CBDE5',
                    borderWidth: 2,
                    yAxisID: 'y-left',
                    order: 2,
                    datalabels: {
                        display: true,
                        anchor: 'center',
                        align: 'center',
                        color: '#3B0C5A',
                        font: {
                            family: 'Montserrat',
                            weight: '700',
                            size: 12
                        },
                        formatter: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                {
                    label: 'Settled Quantity',
                    data: settledData,
                    type: 'line',
                    backgroundColor: 'rgba(255, 112, 31, 0.2)',
                    borderColor: '#FF701F',
                    borderWidth: 2,
                    borderDash: [8, 4],
                    fill: false,
                    yAxisID: 'y-right',
                    order: 1,
                    pointRadius: 4,
                    pointBackgroundColor: '#FF701F',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    datalabels: {
                        display: true,
                        anchor: 'center',
                        align: function(context) {
                            const brokerName = labels[context.dataIndex];
                            if (brokerName.includes('Jo') || brokerName.includes('Ziv')) {
                                return 'bottom';
                            }
                            return 'top';
                        },
                        offset: function(context) {
                            const brokerName = labels[context.dataIndex];
                            if (brokerName.includes('Jo') || brokerName.includes('Ziv')) {
                                return 40;
                            }
                            return 25;
                        },
                        color: '#FF701F',
                        backgroundColor: '#FFFFFF',
                        borderColor: '#FF701F',
                        borderWidth: 1,
                        borderRadius: 3,
                        padding: {
                            top: 2,
                            bottom: 2,
                            left: 4,
                            right: 4
                        },
                        font: {
                            family: 'Montserrat',
                            weight: '700',
                            size: 11
                        },
                        formatter: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            ]
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 0,
                    right: 0
                }
            },
            plugins: {
                tooltip: {
                    enabled: false
                },
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Montserrat',
                            weight: '500'
                        },
                        color: '#3B0C5A',
                        usePointStyle: true,
                        padding: 15
                    }
                },
                datalabels: {
                    display: true
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Montserrat',
                            weight: '500'
                        },
                        color: '#666',
                        maxRotation: 45
                    },
                    grid: {
                        display: false
                    },
                    barPercentage: 1.0,
                    categoryPercentage: 0.9
                },
                'y-left': {
                    type: 'linear',
                    display: false,
                    position: 'left',
                    grid: {
                        display: false
                    }
                },
                'y-right': {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Store chart instance globally for cleanup
    if (canvasId === 'internal-chart') {
        window.internalChart = chart;
    } else {
        window.externalChart = chart;
    }
}