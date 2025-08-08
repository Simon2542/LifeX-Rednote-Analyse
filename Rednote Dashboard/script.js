// Sample data - replace with your actual data source
const sampleData = {
    brokers: [
        { name: "John Smith", type: "internal", assignedLeads: 45, settledLeads: 38, settleRate: 84.4 },
        { name: "Sarah Johnson", type: "internal", assignedLeads: 52, settledLeads: 41, settleRate: 78.8 },
        { name: "Mike Chen", type: "internal", assignedLeads: 38, settledLeads: 35, settleRate: 92.1 },
        { name: "Emma Wilson", type: "internal", assignedLeads: 41, settledLeads: 33, settleRate: 80.5 },
        { name: "ABC Realty", type: "external", assignedLeads: 67, settledLeads: 48, settleRate: 71.6 },
        { name: "Prime Properties", type: "external", assignedLeads: 73, settledLeads: 59, settleRate: 80.8 },
        { name: "Elite Homes", type: "external", assignedLeads: 55, settledLeads: 42, settleRate: 76.4 },
        { name: "Metro Realty", type: "external", assignedLeads: 62, settledLeads: 51, settleRate: 82.3 }
    ]
};

// Store chart instances
let internalChart = null;
let externalChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    loadSavedData();
    
    // Check if we have data to show
    const savedData = localStorage.getItem('redNoteBrokerData');
    console.log('Saved data:', savedData);
    console.log('Sample data brokers:', sampleData.brokers);
    
    if (savedData && sampleData.brokers.length > 0) {
        // If we have saved data, show the dashboard directly
        document.querySelector('.upload-section').style.display = 'none';
        document.getElementById('dataSections').style.display = 'block';
        
        // Render components with a small delay to ensure DOM is ready
        setTimeout(() => {
            renderKPICards();
            renderInternalBrokersChart();
            renderExternalBrokersChart();
        }, 100);
    }
    // If no data, keep upload section visible and data sections hidden
});

function renderKPICards() {
    const kpiCardsContainer = document.getElementById('kpiCards');
    kpiCardsContainer.innerHTML = '';

    // Function to clean broker names
    function cleanBrokerName(name) {
        // Handle specific cases
        if (name.includes('Miao(Amy)')) {
            return 'Amy';
        }
        if (name.includes('Qianshuo(Jo)')) {
            return 'Jo';
        }
        // Extract English name from parentheses if exists
        const match = name.match(/\(([^)]+)\)/);
        if (match) {
            return match[1];
        }
        return name;
    }

    // Sort brokers: internal first, then external, then by settle rate within each group
    const sortedBrokers = [...sampleData.brokers].sort((a, b) => {
        // First sort by type (internal first)
        if (a.type === 'internal' && b.type === 'external') return -1;
        if (a.type === 'external' && b.type === 'internal') return 1;
        
        // Within same type, sort by settle rate (high to low)
        return b.settleRate - a.settleRate;
    });

    sortedBrokers.forEach((broker) => {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        
        const cleanName = cleanBrokerName(broker.name);
        
        // Set background color based on broker type and specific names
        if (broker.type === 'internal') {
            // Darker colors for Amy and Jo
            if (cleanName === 'Amy' || cleanName === 'Jo') {
                card.style.background = '#e58bb3'; // Darker pink for Amy and Jo
                card.style.color = '#333';
            } else {
                card.style.background = '#f3abd0'; // Original light pink for other internals
                card.style.color = '#333';
            }
        } else {
            card.style.background = '#f4d0e3'; // Light pink for externals
            card.style.color = '#333';
        }
        
        card.innerHTML = `
            <h3>${cleanName}</h3>
            <div class="kpi-value">${broker.settleRate.toFixed(1)}%</div>
            <div class="kpi-label">Settlement Rate</div>
            <div style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;">
                ${broker.settledLeads}/${broker.assignedLeads} leads settled
            </div>
        `;
        
        kpiCardsContainer.appendChild(card);
    });
}

function renderInternalBrokersChart() {
    // Destroy existing chart if it exists
    if (internalChart) {
        internalChart.destroy();
    }
    
    const ctx = document.getElementById('internalBrokersChart').getContext('2d');
    // Sort internal brokers by settle rate (high to low) to match KPI card order
    const internalBrokers = sampleData.brokers
        .filter(broker => broker.type === 'internal')
        .sort((a, b) => b.settleRate - a.settleRate);
    
    // Check if we have internal brokers
    if (internalBrokers.length === 0) {
        console.log('No internal brokers found');
        return;
    }
    
    // Function to clean broker names (same as in renderKPICards)
    function cleanBrokerName(name) {
        if (name.includes('Miao(Amy)')) return 'Amy';
        if (name.includes('Qianshuo(Jo)')) return 'Jo';
        const match = name.match(/\(([^)]+)\)/);
        if (match) return match[1];
        return name;
    }
    
    console.log('Creating internal chart with brokers:', internalBrokers);
    
    internalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: internalBrokers.map(broker => cleanBrokerName(broker.name)),
            datasets: [
                {
                    type: 'line',
                    label: 'Settled Leads', 
                    data: internalBrokers.map(broker => broker.settledLeads),
                    borderColor: '#9DD9F3',
                    backgroundColor: 'rgba(157, 217, 243, 0.2)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#9DD9F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    yAxisID: 'y-right',  // Use right Y axis
                    order: 1  // Draw line first (on top)
                },
                {
                    type: 'bar',
                    label: 'Assigned Leads',
                    data: internalBrokers.map(broker => broker.assignedLeads),
                    backgroundColor: 'rgba(177, 156, 217, 0.8)',
                    borderColor: '#B19CD9',
                    borderWidth: 1,
                    yAxisID: 'y-left',
                    categoryPercentage: 0.8,  // Controls spacing between categories
                    barPercentage: 0.9,       // Controls bar width within category
                    order: 2  // Draw bar behind line
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false  // We have title in HTML now
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            },
            scales: {
                'y-left': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Assigned Leads'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: true,
                    }
                },
                'y-right': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Settled Leads'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false, // Only left axis shows grid lines
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

function renderExternalBrokersChart() {
    // Destroy existing chart if it exists
    if (externalChart) {
        externalChart.destroy();
    }
    
    const ctx = document.getElementById('externalBrokersChart').getContext('2d');
    // Sort external brokers by settle rate (high to low) to match KPI card order  
    const externalBrokers = sampleData.brokers
        .filter(broker => broker.type === 'external')
        .sort((a, b) => b.settleRate - a.settleRate);
    
    // Check if we have external brokers
    if (externalBrokers.length === 0) {
        console.log('No external brokers found');
        return;
    }
    
    // Function to clean broker names (same as in renderKPICards)
    function cleanBrokerName(name) {
        if (name.includes('Miao(Amy)')) return 'Amy';
        if (name.includes('Qianshuo(Jo)')) return 'Jo';
        const match = name.match(/\(([^)]+)\)/);
        if (match) return match[1];
        return name;
    }
    
    console.log('Creating external chart with brokers:', externalBrokers);
    
    externalChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: externalBrokers.map(broker => cleanBrokerName(broker.name)),
            datasets: [
                {
                    type: 'line',
                    label: 'Settled Leads',
                    data: externalBrokers.map(broker => broker.settledLeads),
                    borderColor: '#9DD9F3',
                    backgroundColor: 'rgba(157, 217, 243, 0.2)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#9DD9F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    yAxisID: 'y-right',  // Use right Y axis
                    order: 1  // Draw line first (on top)
                },
                {
                    type: 'bar',
                    label: 'Assigned Leads',
                    data: externalBrokers.map(broker => broker.assignedLeads),
                    backgroundColor: 'rgba(177, 156, 217, 0.8)',
                    borderColor: '#B19CD9',
                    borderWidth: 1,
                    yAxisID: 'y-left',
                    categoryPercentage: 0.8,  // Controls spacing between categories
                    barPercentage: 0.9,       // Controls bar width within category
                    order: 2  // Draw bar behind line
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false  // We have title in HTML now
                },
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center',
                    labels: {
                        boxWidth: 15,
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            },
            scales: {
                'y-left': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Assigned Leads'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: true,
                    }
                },
                'y-right': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Settled Leads'
                    },
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false, // Only left axis shows grid lines
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}

// File upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileLabel = document.querySelector('.file-label');

    fileInput.addEventListener('change', handleFileSelect);
    uploadBtn.addEventListener('click', processUploadedFile);
    
    // Drag and drop functionality
    fileLabel.addEventListener('dragover', handleDragOver);
    fileLabel.addEventListener('drop', handleFileDrop);
    fileLabel.addEventListener('dragleave', handleDragLeave);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        displayFileInfo(file);
        document.getElementById('uploadBtn').disabled = false;
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files;
        displayFileInfo(files[0]);
        document.getElementById('uploadBtn').disabled = false;
    }
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function displayFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <strong>Selected File:</strong> ${file.name}<br>
            <strong>Size:</strong> ${fileSize} MB<br>
            <strong>Type:</strong> ${file.type || 'Unknown'}
        </div>
    `;
}

function processUploadedFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first.');
        return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = parseExcel(e.target.result);
                
                if (validateData(data)) {
                    updateDashboard(data);
                    showSuccessMessage();
                } else {
                    alert('Invalid data format. Please ensure your Excel file contains broker data with the required columns: name, type, assignedLeads, settledLeads, settleRate');
                }
            } catch (error) {
                alert('Error processing Excel file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data;
                
                if (fileExtension === 'json') {
                    data = JSON.parse(e.target.result);
                } else if (fileExtension === 'csv') {
                    data = parseCSV(e.target.result);
                } else {
                    alert('Unsupported file format. Please upload Excel (.xlsx/.xls), CSV, or JSON files.');
                    return;
                }
                
                if (validateData(data)) {
                    updateDashboard(data);
                    showSuccessMessage();
                } else {
                    alert('Invalid data format. Please ensure your file contains broker data with the required fields.');
                }
            } catch (error) {
                alert('Error processing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const brokers = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            const broker = {};
            
            headers.forEach((header, index) => {
                if (header === 'assignedLeads' || header === 'settledLeads') {
                    broker[header] = parseFloat(values[index]) || 0;
                } else if (header !== 'settleRate') {  // Skip settle rate column, we'll calculate it
                    broker[header] = values[index] || '';
                }
            });
            
            // Always calculate settle rate from settled leads / assigned leads
            if (broker.assignedLeads > 0) {
                broker.settleRate = (broker.settledLeads / broker.assignedLeads) * 100;
            } else {
                broker.settleRate = 0;
            }
            
            if (broker.name) {
                brokers.push(broker);
            }
        }
    }
    
    return { brokers };
}

function parseExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
    }
    
    const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
    const brokers = [];
    
    // Create column mapping
    const columnMap = {};
    headers.forEach((header, index) => {
        const cleanHeader = header.toLowerCase().trim();
        if (cleanHeader.includes('broker name') || cleanHeader === 'name') {
            columnMap.name = index;
        } else if (cleanHeader.includes('settled quantity') || cleanHeader.includes('settled leads')) {
            columnMap.settledLeads = index;
        } else if (cleanHeader.includes('allocated red leads') || cleanHeader.includes('assigned leads')) {
            columnMap.assignedLeads = index;
        } else if (cleanHeader.includes('settle rate') || cleanHeader.includes('settlement rate')) {
            columnMap.settleRate = index;
        } else if (cleanHeader.includes('internal') && cleanHeader.includes('external')) {
            columnMap.type = index;
        } else if (cleanHeader.includes('broker') && cleanHeader.includes('type')) {
            columnMap.type = index;
        }
    });
    
    // Check if we have the required columns
    if (columnMap.name === undefined || columnMap.settledLeads === undefined || columnMap.assignedLeads === undefined) {
        throw new Error('Excel file must contain columns for Broker Name, settled quantity, and allocated red leads');
    }
    
    for (let i = 1; i < jsonData.length; i++) {
        if (jsonData[i].length === 0 || !jsonData[i].some(cell => cell !== null && cell !== undefined && cell !== '')) {
            continue;
        }
        
        const row = jsonData[i];
        const broker = {};
        
        // Map the data using our column mapping
        broker.name = String(row[columnMap.name] || '').trim();
        broker.settledLeads = parseFloat(row[columnMap.settledLeads]) || 0;
        broker.assignedLeads = parseFloat(row[columnMap.assignedLeads]) || 0;
        
        // Always calculate settle rate from settled quantity / allocated red leads
        if (broker.assignedLeads > 0) {
            broker.settleRate = (broker.settledLeads / broker.assignedLeads) * 100;
        } else {
            broker.settleRate = 0;
        }
        
        // Handle broker type - default to 'external' if not specified
        if (columnMap.type !== undefined) {
            broker.type = String(row[columnMap.type] || '').trim().toLowerCase();
            if (broker.type !== 'internal' && broker.type !== 'external') {
                broker.type = 'external'; // Default to external
            }
        } else {
            broker.type = 'external'; // Default to external if no type column
        }
        
        if (broker.name && broker.name !== '') {
            brokers.push(broker);
        }
    }
    
    return { brokers };
}

function validateData(data) {
    if (!data || !data.brokers || !Array.isArray(data.brokers)) {
        return false;
    }
    
    return data.brokers.every(broker => 
        broker.name && 
        typeof broker.assignedLeads === 'number' && 
        typeof broker.settledLeads === 'number' &&
        (broker.type === 'internal' || broker.type === 'external')
    );
}

function showSuccessMessage() {
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = `
        <div class="success-message">
            ✅ File uploaded and processed successfully!<br>
            Dashboard has been updated with your data.
        </div>
    `;
    
    // Show data sections and hide upload section after successful upload
    setTimeout(() => {
        document.querySelector('.upload-section').style.display = 'none';
        document.getElementById('dataSections').style.display = 'block';
    }, 1500);
}

// Load saved data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('redNoteBrokerData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            if (validateData(data)) {
                sampleData.brokers = data.brokers;
                console.log('Loaded saved broker data:', data.brokers.length, 'brokers');
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Function to update data - call this when you have new data
function updateDashboard(newData) {
    console.log('Updating dashboard with new data:', newData);
    sampleData.brokers = newData.brokers;
    
    // Ensure data sections are visible
    document.querySelector('.upload-section').style.display = 'none';
    document.getElementById('dataSections').style.display = 'block';
    
    // Render with small delay to ensure DOM updates
    setTimeout(() => {
        renderKPICards();
        renderInternalBrokersChart();
        renderExternalBrokersChart();
    }, 100);
}