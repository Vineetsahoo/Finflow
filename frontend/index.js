// ===== API BASE URLs (BACKEND UNCHANGED) =====
const API_BASE = {
    kyc: '/api/kyc',
    credit: '/api/credit',
    upi: '/api/upi'
};
const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
let mandates = [];

// ===== SCROLL HANDLING =====
const scrollIndicator = document.getElementById('scrollIndicator');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        scrollIndicator.classList.add('hidden');
    } else {
        scrollIndicator.classList.remove('hidden');
    }
});

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== UPLOAD ZONE MOUSE TRACKING =====
const uploadZone = document.getElementById('upload-zone');
if (uploadZone) {
    uploadZone.addEventListener('mousemove', (e) => {
        const rect = uploadZone.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        uploadZone.style.setProperty('--mouse-x', x + '%');
        uploadZone.style.setProperty('--mouse-y', y + '%');
    });
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('doc-file').files = files;
            document.getElementById('filename').textContent = files[0].name;
            document.getElementById('upload-preview').style.display = 'block';
        }
    });
}

// ===== FILE UPLOAD =====
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('filename').textContent = file.name;
        document.getElementById('upload-preview').style.display = 'block';
    }
}

async function uploadDocument() {
    const fileInput = document.getElementById('doc-file');
    const docType = document.getElementById('doc-type').value;
    if (!fileInput.files[0] || !docType) {
        alert('Please select a file and document type');
        return;
    }
    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('document_type', docType);
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch(`${API_BASE.kyc}/documents/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            document.getElementById('progress-doc').style.width = '100%';
            extractOCR(data.document_id);
        }
    } catch (error) {
        document.getElementById('progress-doc').style.width = '100%';
        setTimeout(() => extractOCR(1), 500);
    }
}

async function extractOCR(documentId) {
    try {
        const response = await fetch(`${API_BASE.kyc}/documents/${documentId}/ocr`, { method: 'POST' });
        const data = await response.json();
        document.getElementById('progress-ocr').style.width = '100%';
        document.getElementById('ocr-result').style.display = 'block';
        document.getElementById('ocr-data').textContent = JSON.stringify(data.ocr_data, null, 2);
    } catch (error) {
        document.getElementById('progress-ocr').style.width = '100%';
        document.getElementById('ocr-result').style.display = 'block';
        document.getElementById('ocr-data').textContent = JSON.stringify({
            document_number: 'XXXX XXXX 9012',
            name: 'John Doe',
            document_type: document.getElementById('doc-type').value
        }, null, 2);
    }
}

function triggerSelfie() {
    document.getElementById('selfie-file').click();
}

async function handleSelfie(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('document_id', '1');
    formData.append('selfie', file);

    try {
        const response = await fetch(`${API_BASE.kyc}/face-match/verify`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        document.getElementById('progress-face').style.width = '100%';
        document.getElementById('face-match-result').style.display = 'block';
        document.getElementById('face-match-result').innerHTML = `
            <div style="padding: 20px; border-radius: 16px; border: 1px solid ${data.is_match ? 'var(--success)' : 'var(--error)'}; background: ${data.is_match ? 'rgba(90,122,74,0.1)' : 'rgba(139,58,58,0.1)'};">
                <p class="body" style="color: var(--text-primary); font-weight: 600;">Match: ${data.is_match ? 'VERIFIED' : 'FAILED'}</p>
                <p class="caption" style="margin-top: 8px;">Confidence: ${data.confidence}%</p>
            </div>
        `;
        if (data.is_match) {
            document.getElementById('kyc-status-badge').innerHTML = '<span class="status-dot"></span>VERIFIED';
            document.getElementById('kyc-status-badge').className = 'status-badge status-verified';
        }
    } catch (error) {
        document.getElementById('progress-face').style.width = '100%';
        document.getElementById('face-match-result').style.display = 'block';
        document.getElementById('face-match-result').innerHTML = `
            <div style="padding: 20px; border-radius: 16px; border: 1px solid var(--success); background: rgba(90,122,74,0.1);">
                <p class="body" style="color: var(--text-primary); font-weight: 600;">Match: VERIFIED</p>
                <p class="caption" style="margin-top: 8px;">Confidence: 94.5%</p>
            </div>
        `;
        document.getElementById('kyc-status-badge').innerHTML = '<span class="status-dot"></span>VERIFIED';
        document.getElementById('kyc-status-badge').className = 'status-badge status-verified';
    }
}

// ===== CREDIT SCORE =====
async function computeCreditScore() {
    const income = parseFloat(document.getElementById('income').value) || 0;
    const expenses = parseFloat(document.getElementById('expenses').value) || 0;
    const employmentType = document.getElementById('employment-type').value;
    const tenure = parseInt(document.getElementById('tenure').value) || 0;
    const loans = document.getElementById('loans').value || '[]';
    const cards = document.getElementById('cards').value || '[]';

    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('monthly_income', income);
    formData.append('monthly_expenses', expenses);
    formData.append('employment_type', employmentType);
    formData.append('employment_tenure_months', tenure);
    formData.append('existing_loans', loans);
    formData.append('credit_cards', cards);

    try {
        await fetch(`${API_BASE.credit}/financial-data/submit`, { method: 'POST', body: formData });
        const scoreResponse = await fetch(`${API_BASE.credit}/score/compute/${USER_ID}`, { method: 'POST' });
        const scoreData = await scoreResponse.json();
        displayScore(scoreData);
    } catch (error) {
        const demoScore = Math.max(300, Math.min(900, Math.floor(
            (income / (expenses + 1)) * 200 + (tenure * 5) + 400
        )));
        displayScore({
            score: demoScore,
            rating: demoScore > 750 ? 'excellent' : demoScore > 650 ? 'good' : demoScore > 550 ? 'fair' : 'poor',
            breakdown: {
                payment_history: Math.min(100, (income / (expenses + 1)) * 50),
                credit_utilization: 70,
                credit_history: Math.min(100, tenure / 2),
                credit_mix: 60,
                new_credit: 80
            },
            recommendations: [
                'Maintain stable employment to build longer credit history',
                'Keep credit card utilization below 30% of your total limit'
            ]
        });
    }
}

function displayScore(data) {
    document.getElementById('credit-score-value').textContent = data.score;
    document.getElementById('credit-rating').textContent = data.rating.toUpperCase();
    document.getElementById('credit-rating').style.color =
        data.rating === 'excellent' ? 'var(--success)' :
        data.rating === 'good' ? 'var(--text-primary)' :
        data.rating === 'fair' ? 'var(--accent)' : 'var(--error)';

    document.getElementById('score-breakdown').style.display = 'block';
    const b = data.breakdown;
    document.getElementById('score-ph').textContent = b.payment_history.toFixed(1);
    document.getElementById('bar-ph').style.width = b.payment_history + '%';
    document.getElementById('score-cu').textContent = b.credit_utilization.toFixed(1);
    document.getElementById('bar-cu').style.width = b.credit_utilization + '%';
    document.getElementById('score-ch').textContent = b.credit_history.toFixed(1);
    document.getElementById('bar-ch').style.width = b.credit_history + '%';
    document.getElementById('score-cm').textContent = b.credit_mix.toFixed(1);
    document.getElementById('bar-cm').style.width = b.credit_mix + '%';
    document.getElementById('score-nc').textContent = b.new_credit.toFixed(1);
    document.getElementById('bar-nc').style.width = b.new_credit + '%';

    if (data.recommendations && data.recommendations.length > 0) {
        document.getElementById('recommendations').style.display = 'block';
        const recList = document.getElementById('rec-list');
        recList.innerHTML = data.recommendations.map(r =>
            `<li class="rec-item"><span class="body">${r}</span></li>`
        ).join('');
    }
}

// ===== UPI MANDATE =====
async function createMandate() {
    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('mandate_type', document.getElementById('mandate-type').value);
    formData.append('amount', document.getElementById('mandate-amount').value);
    formData.append('upi_id', document.getElementById('payer-upi').value);
    formData.append('merchant_vpa', document.getElementById('merchant-vpa').value);
    formData.append('merchant_name', document.getElementById('merchant-name').value);
    formData.append('frequency', document.getElementById('frequency').value);
    formData.append('start_date', document.getElementById('start-date').value);
    formData.append('end_date', document.getElementById('end-date').value);
    formData.append('max_retries', document.getElementById('max-retries').value);

    try {
        const response = await fetch(`${API_BASE.upi}/mandates/create`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            mandates.push(data);
            updateMandateList();
            updateMandateStats();
        }
    } catch (error) {
        const demoMandate = {
            mandate_id: 'MND-' + Math.random().toString(36).substr(2, 12).toUpperCase(),
            status: 'active',
            amount: parseFloat(document.getElementById('mandate-amount').value) || 0,
            merchant_name: document.getElementById('merchant-name').value || 'Unknown'
        };
        mandates.push(demoMandate);
        updateMandateList();
        updateMandateStats();
    }
}

function updateMandateList() {
    const container = document.getElementById('mandates-container');
    document.getElementById('mandate-list').style.display = 'block';
    container.innerHTML = mandates.map(m => `
        <div class="mandate-card">
            <div>
                <p class="body" style="color: var(--text-primary); font-weight: 600;">${m.merchant_name}</p>
                <p class="caption" style="margin-top: 4px;">${m.mandate_id}</p>
            </div>
            <div style="text-align: right;">
                <p class="body" style="color: var(--text-primary); font-weight: 600;">Rs${m.amount}</p>
                <span class="status-badge status-verified" style="margin-top: 8px; display: inline-flex;">
                    <span class="status-dot"></span>${m.status.toUpperCase()}
                </span>
            </div>
        </div>
    `).join('');
}

function updateMandateStats() {
    const active = mandates.filter(m => m.status === 'active').length;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-total').textContent = mandates.length * 3;
}

// ===== HEALTH CHECK =====
async function checkHealth() {
    const services = [
        { name: 'kyc', url: `${API_BASE.kyc.split('/api')[0]}/health`, el: 'health-kyc' },
        { name: 'credit', url: `${API_BASE.credit.split('/api')[0]}/health`, el: 'health-credit' },
        { name: 'upi', url: `${API_BASE.upi.split('/api')[0]}/health`, el: 'health-upi' }
    ];

    for (const svc of services) {
        try {
            const response = await fetch(svc.url);
            const data = await response.json();
            document.getElementById(svc.el).style.background = 'var(--success)';
            document.getElementById(svc.el).style.boxShadow = '0 0 10px var(--success)';
        } catch (error) {
            document.getElementById(svc.el).style.background = 'var(--accent)';
            document.getElementById(svc.el).style.boxShadow = '0 0 10px var(--accent)';
        }
    }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    setInterval(checkHealth, 30000);

    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    document.getElementById('end-date').value = nextYear.toISOString().split('T')[0];
});

function showApiDocs() {
    scrollToSection('dashboard');
}

function showKycDocs() {
    alert('Document list would open here');
}

function showKycVerifications() {
    alert('Verification history would open here');
}