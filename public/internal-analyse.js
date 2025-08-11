document.addEventListener('DOMContentLoaded', function() {
    initializeInternalUpload();
    loadInternalAnalysisData();
});

function initializeInternalUpload() {
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
            uploadInternalFile(e.target.files[0]);
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
            uploadInternalFile(e.dataTransfer.files[0]);
        }
    });
}

function uploadInternalFile(file) {
    const uploadStatus = document.getElementById('uploadStatus');
    
    // Validate file type
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showUploadStatus('error', 'Please select a valid Excel file (.xlsx or .xls)');
        return;
    }

    // Show loading status
    showUploadStatus('loading', `Processing ${file.name}...`);

    // Create FormData
    const formData = new FormData();
    formData.append('excelFile', file);

    // Upload file
    fetch('/api/upload-internal', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showUploadStatus('success', `File processed successfully! Found ${data.recordsCount} records.`);
            // Reload analysis data
            setTimeout(() => {
                loadInternalAnalysisData();
            }, 1000);
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

async function loadInternalAnalysisData() {
    try {
        const response = await fetch('/api/internal-analysis');
        const data = await response.json();
        
        renderInternalAnalysis(data);
    } catch (error) {
        console.error('Error loading internal analysis data:', error);
        // Keep placeholder if no data
    }
}

function renderInternalAnalysis(data) {
    const analysisContent = document.getElementById('analysis-content');
    
    if (!data || !data.summary) {
        return; // Keep placeholder
    }

    analysisContent.innerHTML = `
        <div class="analysis-card">
            <h3>Data Summary</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${data.summary.totalRecords}</span>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${data.summary.brokers ? data.summary.brokers.length : 0}</span>
                    <div class="stat-label">Unique Brokers</div>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${data.summary.statuses ? data.summary.statuses.length : 0}</span>
                    <div class="stat-label">Status Types</div>
                </div>
            </div>
        </div>
        
        <div class="analysis-card">
            <h3>Recent Records</h3>
            <div class="records-table">
                ${renderRecordsTable(data.records ? data.records.slice(0, 10) : [])}
            </div>
        </div>
        
        <div class="analysis-card">
            <h3>Broker Analysis</h3>
            <div class="broker-analysis">
                ${renderBrokerAnalysis(data.summary.brokers || [])}
            </div>
        </div>
    `;
}

function renderRecordsTable(records) {
    if (!records.length) {
        return '<p>No records available</p>';
    }

    const headers = Object.keys(records[0]).slice(0, 5); // Show first 5 columns
    
    let table = '<table style="width: 100%; border-collapse: collapse;">';
    table += '<thead><tr>';
    headers.forEach(header => {
        table += `<th style="padding: 0.5rem; border-bottom: 2px solid #3CBDE5; text-align: left;">${header}</th>`;
    });
    table += '</tr></thead><tbody>';
    
    records.forEach(record => {
        table += '<tr>';
        headers.forEach(header => {
            const value = record[header] || '';
            table += `<td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${value}</td>`;
        });
        table += '</tr>';
    });
    
    table += '</tbody></table>';
    return table;
}

function renderBrokerAnalysis(brokers) {
    if (!brokers.length) {
        return '<p>No broker data available</p>';
    }

    let analysis = '<div class="broker-list" style="display: grid; gap: 0.5rem;">';
    brokers.forEach(broker => {
        analysis += `
            <div style="padding: 0.5rem; background: #f8f9fa; border-radius: 4px; color: #3B0C5A; font-weight: 500;">
                ${broker}
            </div>
        `;
    });
    analysis += '</div>';
    
    return analysis;
}