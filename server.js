const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();

// Configure multer for file upload
const upload = multer({ 
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'), false);
        }
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/lifex_styles', express.static(path.join(__dirname, 'lifex_styles')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/internal-analyse', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'internal-analyse.html'));
});

app.get('/api/brokers', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading broker data:', error);
        res.status(500).json({ error: 'Failed to load broker data' });
    }
});

// Internal analyse data endpoint
app.get('/api/internal-analysis', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'internal-analysis-data.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading internal analysis data:', error);
        res.status(500).json({ error: 'Failed to load internal analysis data' });
    }
});

// Internal analyse upload endpoint
app.post('/api/upload-internal', upload.single('excelFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the uploaded Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process the Excel data for internal analysis
        const analysisData = processInternalAnalysisData(jsonData);
        
        // Save processed data to internal-analysis-data.json
        fs.writeFileSync(path.join(__dirname, 'internal-analysis-data.json'), JSON.stringify(analysisData, null, 2));

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({ 
            success: true, 
            message: 'Internal analysis file uploaded and processed successfully',
            recordsCount: analysisData.records ? analysisData.records.length : 0
        });

    } catch (error) {
        console.error('Error processing internal analysis file:', error);
        res.status(500).json({ error: 'Failed to process internal analysis Excel file' });
    }
});

// File upload endpoint
app.post('/api/upload', upload.single('excelFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read the uploaded Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process the Excel data to extract broker information
        const brokers = processExcelData(jsonData);
        
        // Save processed data to data.json
        const dataToSave = { brokers };
        fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(dataToSave, null, 2));

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({ 
            success: true, 
            message: 'File uploaded and processed successfully',
            brokersCount: brokers.length 
        });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Failed to process Excel file' });
    }
});

// Function to process Excel data and extract broker information
function processExcelData(jsonData) {
    const brokers = [];
    
    jsonData.forEach((row, index) => {
        // Skip header rows or empty rows
        if (!row || Object.keys(row).length === 0) return;
        
        // Try to identify broker data columns
        // This is a flexible approach that looks for common column patterns
        const brokerName = findColumnValue(row, ['broker', 'name', 'agent', 'company']);
        const settledQty = findColumnValue(row, ['settled', 'complete', 'closed', 'successful']);
        const allocatedQty = findColumnValue(row, ['allocated', 'total', 'assigned', 'leads']);
        const brokerType = findColumnValue(row, ['type', 'category', 'internal', 'external']);
        
        if (brokerName && settledQty !== null && allocatedQty !== null) {
            const settled = parseNumber(settledQty);
            const allocated = parseNumber(allocatedQty);
            
            if (settled !== null && allocated !== null && allocated > 0) {
                brokers.push({
                    name: String(brokerName),
                    type: determineBrokerType(brokerType, brokerName),
                    settledQuantity: settled,
                    allocatedRedLeads: allocated,
                    settleRate: settled / allocated
                });
            }
        }
    });
    
    return brokers;
}

// Helper function to find column value by multiple possible names
function findColumnValue(row, possibleNames) {
    const keys = Object.keys(row);
    
    for (const name of possibleNames) {
        const matchingKey = keys.find(key => 
            key.toLowerCase().includes(name.toLowerCase())
        );
        if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== '') {
            return row[matchingKey];
        }
    }
    return null;
}

// Helper function to parse number from various formats
function parseNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[,$%\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
}

// Helper function to determine broker type
function determineBrokerType(typeValue, brokerName) {
    if (typeValue) {
        const type = String(typeValue).toLowerCase();
        if (type.includes('internal') || type.includes('in-house')) return 'internal';
        if (type.includes('external') || type.includes('outside')) return 'external';
    }
    
    // If no type specified, try to guess from name
    const name = String(brokerName).toLowerCase();
    if (name.includes('internal') || name.includes('in-house') || name.includes('lifex')) {
        return 'internal';
    }
    
    // Default to external if unclear
    return 'external';
}

// Function to process internal analysis Excel data
function processInternalAnalysisData(jsonData) {
    const records = [];
    
    jsonData.forEach((row, index) => {
        // Skip header rows or empty rows
        if (!row || Object.keys(row).length === 0) return;
        
        // Extract relevant fields for internal analysis
        // This is flexible and will adapt to your specific Excel structure
        const record = {};
        
        // Try to find common columns in the troubleshooting data
        Object.keys(row).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('broker') || lowerKey.includes('agent')) {
                record.broker = row[key];
            } else if (lowerKey.includes('date') || lowerKey.includes('time')) {
                record.date = row[key];
            } else if (lowerKey.includes('status') || lowerKey.includes('result')) {
                record.status = row[key];
            } else if (lowerKey.includes('issue') || lowerKey.includes('problem')) {
                record.issue = row[key];
            } else if (lowerKey.includes('resolution') || lowerKey.includes('solution')) {
                record.resolution = row[key];
            } else {
                // Store other fields with their original keys
                record[key] = row[key];
            }
        });
        
        if (Object.keys(record).length > 0) {
            records.push(record);
        }
    });
    
    // Generate summary statistics
    const summary = {
        totalRecords: records.length,
        brokers: [...new Set(records.map(r => r.broker).filter(Boolean))],
        statuses: [...new Set(records.map(r => r.status).filter(Boolean))],
        lastUpdated: new Date().toISOString()
    };
    
    return {
        summary,
        records
    };
}

function findAvailablePort(startPort = 3000) {
    const server = app.listen(startPort, () => {
        const port = server.address().port;
        console.log(`LifeX Rednote Dashboard is running on http://localhost:${port}`);
        console.log('Press Ctrl+C to stop the server');
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${startPort} is in use, trying port ${startPort + 1}...`);
            findAvailablePort(startPort + 1);
        } else {
            console.error('Server error:', error);
        }
    });
}

findAvailablePort();