// ═══════════════════════════════════════
//  API BASE URLs
// ═══════════════════════════════════════
const API_BASE = {
    kyc: '/api/kyc',
    credit: '/api/credit',
    upi: '/api/upi'
};

// ═══════════════════════════════════════
//  GLOBAL STATE
// ═══════════════════════════════════════
const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);
let mandates = [];
let currentDocumentId = null;

// ═══════════════════════════════════════
//  NAVIGATION — scroll spy + sticky bg
// ═══════════════════════════════════════
const mainNav = document.getElementById('mainNav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    // Hide scroll indicator
    const si = document.getElementById('scrollIndicator');
    if (si) {
        if (window.scrollY > 100) si.classList.add('hidden');
        else si.classList.remove('hidden');
    }

    // Active nav link
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 200) current = s.id;
    });
    navLinks.forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('href') === '#' + current) l.classList.add('active');
    });
});

function smoothNav(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

// ═══════════════════════════════════════
//  SCROLL REVEAL
// ═══════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ═══════════════════════════════════════
//  SCROLL-DRIVEN ORB ENGINE
// ═══════════════════════════════════════
const orbWrapper = document.getElementById('orbWrapper');
const orbVisual  = document.getElementById('orbVisual');
const orbLabel   = document.getElementById('orbLabel');

// Section color themes
const ORB_THEMES = {
    hero: {
        color:       '#c96e3a',
        colorBright: '#e8884a',
        glow:        'rgba(201,110,58,0.45)',
        glowFar:     'rgba(201,110,58,0.15)',
        ring:        'rgba(201,110,58,0.35)',
        ringDashed:  'rgba(201,110,58,0.12)',
        label:       '',
    },
    kyc: {
        color:       '#c96e3a',
        colorBright: '#e8994d',
        glow:        'rgba(201,110,58,0.50)',
        glowFar:     'rgba(201,110,58,0.18)',
        ring:        'rgba(201,110,58,0.40)',
        ringDashed:  'rgba(201,110,58,0.14)',
        label:       'IDENTITY',
    },
    credit: {
        color:       '#5a8a46',
        colorBright: '#78b05e',
        glow:        'rgba(90,138,70,0.50)',
        glowFar:     'rgba(90,138,70,0.18)',
        ring:        'rgba(90,138,70,0.40)',
        ringDashed:  'rgba(90,138,70,0.14)',
        label:       'CREDIT',
    },
    upi: {
        color:       '#7a5aaa',
        colorBright: '#9c7acc',
        glow:        'rgba(122,90,170,0.50)',
        glowFar:     'rgba(122,90,170,0.18)',
        ring:        'rgba(122,90,170,0.40)',
        ringDashed:  'rgba(122,90,170,0.14)',
        label:       'MANDATE',
    },
    dashboard: {
        color:       '#4a7aaa',
        colorBright: '#6a9acc',
        glow:        'rgba(74,122,170,0.50)',
        glowFar:     'rgba(74,122,170,0.18)',
        ring:        'rgba(74,122,170,0.40)',
        ringDashed:  'rgba(74,122,170,0.14)',
        label:       'STATUS',
    },
};

// Target state — where orb WANTS to be
const orbTarget = { x: 50, y: 50, scale: 1, opacity: 1 };
// Current interpolated state
const orbCurrent = { x: 50, y: 50, scale: 1, opacity: 1 };

let lastSection = 'hero';
let orbRafId = null;

function applyTheme(key) {
    if (key === lastSection) return;
    lastSection = key;
    const t = ORB_THEMES[key] || ORB_THEMES.hero;
    const el = orbWrapper;
    el.style.setProperty('--orb-color',       t.color);
    el.style.setProperty('--orb-color-bright', t.colorBright);
    el.style.setProperty('--orb-glow',         t.glow);
    el.style.setProperty('--orb-glow-far',     t.glowFar);
    el.style.setProperty('--orb-ring',         t.ring);
    el.style.setProperty('--orb-ring-dashed',  t.ringDashed);

    // Label
    if (orbLabel) {
        orbLabel.textContent = t.label;
        orbLabel.classList.toggle('visible', t.label !== '');
    }

    // Entry pulse
    if (orbVisual) {
        orbVisual.classList.remove('entering');
        void orbVisual.offsetWidth; // reflow
        orbVisual.classList.add('entering');
        setTimeout(() => orbVisual.classList.remove('entering'), 800);
    }
}

function lerp(a, b, t) { return a + (b - a) * t; }

function tickOrb() {
    const ease = 0.07; // lower = floatier, higher = snappier
    orbCurrent.x       = lerp(orbCurrent.x,       orbTarget.x,       ease);
    orbCurrent.y       = lerp(orbCurrent.y,        orbTarget.y,       ease);
    orbCurrent.scale   = lerp(orbCurrent.scale,    orbTarget.scale,   ease);
    orbCurrent.opacity = lerp(orbCurrent.opacity,  orbTarget.opacity, ease);

    if (orbWrapper) {
        orbWrapper.style.left    = orbCurrent.x + 'vw';
        orbWrapper.style.top     = orbCurrent.y + 'vh';
        orbWrapper.style.setProperty('--orb-scale',   orbCurrent.scale.toFixed(4));
        orbWrapper.style.setProperty('--orb-opacity',  orbCurrent.opacity.toFixed(4));
    }

    orbRafId = requestAnimationFrame(tickOrb);
}

function updateOrbFromScroll() {
    const scrollY = window.scrollY;
    const winH    = window.innerHeight;

    // Section offsets
    const secHero  = document.getElementById('hero');
    const secKyc   = document.getElementById('kyc');
    const secCredit= document.getElementById('credit');
    const secUpi   = document.getElementById('upi');
    const secDash  = document.getElementById('dashboard');

    if (!secHero) return;

    const heroH   = secHero.offsetHeight;
    const kycTop  = secKyc   ? secKyc.offsetTop   : heroH;
    const credTop = secCredit? secCredit.offsetTop : kycTop   + winH;
    const upiTop  = secUpi   ? secUpi.offsetTop    : credTop  + winH;
    const dashTop = secDash  ? secDash.offsetTop   : upiTop   + winH;
    const pageH   = document.body.scrollHeight;

    // ── HERO ──────────────────────────────────────
    if (scrollY < kycTop - winH * 0.3) {
        const heroProgress = Math.min(scrollY / (heroH * 0.6), 1); // 0→1 as hero scrolls out
        applyTheme('hero');

        // Orb stays centered in hero, slowly drifts up as hero scrolls
        orbTarget.x       = 50;
        orbTarget.y       = 50 - heroProgress * 8;   // drifts up slightly
        orbTarget.scale   = 1 - heroProgress * 0.15;  // gently shrinks
        orbTarget.opacity = 1;

    // ── KYC ───────────────────────────────────────
    } else if (scrollY < credTop - winH * 0.3) {
        const t = Math.min((scrollY - (kycTop - winH * 0.3)) / winH, 1);
        applyTheme('kyc');

        // Orb floats to left-center, slightly above middle
        orbTarget.x       = lerp(50, 18, smoothStep(t));
        orbTarget.y       = lerp(42, 35, smoothStep(t));
        orbTarget.scale   = lerp(0.85, 0.55, smoothStep(t));
        orbTarget.opacity = 1;

    // ── CREDIT ────────────────────────────────────
    } else if (scrollY < upiTop - winH * 0.3) {
        const t = Math.min((scrollY - (credTop - winH * 0.3)) / winH, 1);
        applyTheme('credit');

        // Orb floats to right side
        orbTarget.x       = lerp(18, 82, smoothStep(t));
        orbTarget.y       = lerp(35, 38, smoothStep(t));
        orbTarget.scale   = lerp(0.55, 0.50, smoothStep(t));
        orbTarget.opacity = 1;

    // ── UPI ───────────────────────────────────────
    } else if (scrollY < dashTop - winH * 0.3) {
        const t = Math.min((scrollY - (upiTop - winH * 0.3)) / winH, 1);
        applyTheme('upi');

        // Orb swings back to left, slightly lower
        orbTarget.x       = lerp(82, 20, smoothStep(t));
        orbTarget.y       = lerp(38, 42, smoothStep(t));
        orbTarget.scale   = lerp(0.50, 0.45, smoothStep(t));
        orbTarget.opacity = 1;

    // ── DASHBOARD ─────────────────────────────────
    } else if (scrollY < pageH - winH * 1.1) {
        const t = Math.min((scrollY - (dashTop - winH * 0.3)) / winH, 1);
        applyTheme('dashboard');

        // Orb retreats to top-right corner, small
        orbTarget.x       = lerp(20, 88, smoothStep(t));
        orbTarget.y       = lerp(42, 12, smoothStep(t));
        orbTarget.scale   = lerp(0.45, 0.22, smoothStep(t));
        orbTarget.opacity = lerp(1, 0.6, smoothStep(t));

    // ── FOOTER — fade out ─────────────────────────
    } else {
        orbTarget.opacity = 0;
    }
}

// Smooth easing (Ken Perlin's smoothstep)
function smoothStep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
}

// Wire scroll → target update, rAF → render
window.addEventListener('scroll', updateOrbFromScroll, { passive: true });
updateOrbFromScroll(); // set initial targets
tickOrb();             // start render loop

// ═══════════════════════════════════════
//  UPLOAD ZONE
// ═══════════════════════════════════════
const uploadZone = document.getElementById('upload-zone');
if (uploadZone) {
    uploadZone.addEventListener('mousemove', (e) => {
        const rect = uploadZone.getBoundingClientRect();
        uploadZone.style.setProperty('--mouse-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
        uploadZone.style.setProperty('--mouse-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault(); uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            document.getElementById('doc-file').files = files;
            document.getElementById('filename').textContent = files[0].name;
            document.getElementById('upload-preview').style.display = 'block';
        }
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('filename').textContent = file.name;
        document.getElementById('upload-preview').style.display = 'block';
    }
}

// ═══════════════════════════════════════
//  PIPELINE STEP HELPERS
// ═══════════════════════════════════════
function setPipelineStep(stepId, pctId, pct, done = false) {
    const fill = document.getElementById(stepId);
    const pctEl = document.getElementById(pctId);
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (done) {
        const step = fill?.closest('.pipeline-step');
        if (step) step.classList.add('done');
    }
}

// ═══════════════════════════════════════
//  KYC — UPLOAD DOCUMENT
// ═══════════════════════════════════════
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
        const response = await fetch(`${API_BASE.kyc}/documents/upload`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        if (data.success) {
            currentDocumentId = data.document_id;
            setPipelineStep('progress-doc', 'pct-doc', 100, true);
            document.getElementById('kyc-status-badge').innerHTML = '<span class="status-dot"></span>Processing';
            extractOCR(data.document_id);
        } else throw new Error(data.message || 'Upload failed');
    } catch (error) { alert('Failed to upload document: ' + error.message); }
}

async function extractOCR(documentId) {
    try {
        const response = await fetch(`${API_BASE.kyc}/documents/${documentId}/ocr`, { method: 'POST' });
        if (!response.ok) throw new Error('OCR extraction failed');
        const data = await response.json();
        setPipelineStep('progress-ocr', 'pct-ocr', 100, true);
        document.getElementById('ocr-result').style.display = 'block';
        document.getElementById('ocr-data').textContent = JSON.stringify(data.ocr_data, null, 2);
    } catch (error) { alert('Failed to extract OCR: ' + error.message); }
}

function triggerSelfie() {
    if (!currentDocumentId) { alert('Please upload a document first.'); return; }
    document.getElementById('selfie-file').click();
}

async function handleSelfie(event) {
    if (!currentDocumentId) { alert('Please upload a document first.'); return; }
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('document_id', currentDocumentId);
    formData.append('selfie', file);

    try {
        const response = await fetch(`${API_BASE.kyc}/face-match/verify`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Face match failed');
        const data = await response.json();
        setPipelineStep('progress-face', 'pct-face', 100, true);

        const result = document.getElementById('face-match-result');
        result.style.display = 'block';
        const ok = data.is_match;
        result.innerHTML = `
            <div style="padding:20px; border-radius:16px; border:1px solid ${ok ? 'var(--success)' : 'var(--error)'}; background:${ok ? 'rgba(90,122,74,0.08)' : 'rgba(139,58,58,0.08)'}; display:flex; align-items:center; gap:16px;">
                <div style="width:40px;height:40px;border-radius:50%;background:${ok ? 'rgba(90,122,74,0.2)' : 'rgba(139,58,58,0.2)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        ${ok ? '<path d="M3 9l4 4 8-8" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M5 5l8 8M13 5l-8 8" stroke="var(--error)" stroke-width="2" stroke-linecap="round"/>'}
                    </svg>
                </div>
                <div>
                    <p style="font-size:13px;font-weight:600;color:var(--text-primary);">${ok ? 'Face Verified' : 'Verification Failed'}</p>
                    <p class="caption" style="margin-top:4px;">Confidence: ${data.confidence}% · Model: ${data.model}</p>
                </div>
            </div>`;

        const badge = document.getElementById('kyc-status-badge');
        if (ok) { badge.innerHTML = '<span class="status-dot"></span>VERIFIED'; badge.className = 'status-badge status-verified'; }
        else { badge.innerHTML = '<span class="status-dot"></span>FAILED'; badge.className = 'status-badge status-declined'; }
    } catch (error) { alert('Face match failed: ' + error.message); }
}

// ═══════════════════════════════════════
//  CREDIT SCORE
// ═══════════════════════════════════════
async function computeCreditScore() {
    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('monthly_income', document.getElementById('income').value || 0);
    formData.append('monthly_expenses', document.getElementById('expenses').value || 0);
    formData.append('employment_type', document.getElementById('employment-type').value);
    formData.append('employment_tenure_months', document.getElementById('tenure').value || 0);
    formData.append('existing_loans', document.getElementById('loans').value || '[]');
    formData.append('credit_cards', document.getElementById('cards').value || '[]');

    try {
        const submitRes = await fetch(`${API_BASE.credit}/financial-data/submit`, { method: 'POST', body: formData });
        if (!submitRes.ok) throw new Error('Failed to submit financial data');
        const scoreRes = await fetch(`${API_BASE.credit}/score/compute/${USER_ID}`, { method: 'POST' });
        if (!scoreRes.ok) throw new Error('Failed to compute score');
        const scoreData = await scoreRes.json();
        displayScore(scoreData);
    } catch (error) { alert('Failed to compute credit score: ' + error.message); }
}

function displayScore(data) {
    // Animate score value
    const scoreEl = document.getElementById('credit-score-value');
    const target = data.score;
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
        current = Math.min(current + step, target);
        scoreEl.textContent = current;
        if (current >= target) clearInterval(interval);
    }, 20);

    // Animate arc (628 = 2πr ≈ circumference of r=100)
    const offset = 628 - (628 * (data.score / 900));
    const arc = document.getElementById('score-arc-fill');
    if (arc) {
        setTimeout(() => { arc.style.strokeDashoffset = offset; }, 100);
        // Color by rating
        const colors = { excellent: '#5a7a4a', good: '#7a9a5a', fair: 'var(--accent)', poor: '#c96e3a', bad: '#8b3a3a' };
        arc.style.stroke = colors[data.rating] || 'var(--accent)';
    }

    document.getElementById('credit-rating').textContent = data.rating.toUpperCase();
    document.getElementById('credit-rating').style.color =
        data.rating === 'excellent' ? 'var(--success)' :
        data.rating === 'good' ? '#7a9a5a' :
        data.rating === 'fair' ? 'var(--accent)' : 'var(--error)';

    document.getElementById('score-breakdown').style.display = 'block';
    const b = data.breakdown;
    const pairs = [['ph',b.payment_history],['cu',b.credit_utilization],['ch',b.credit_history],['cm',b.credit_mix],['nc',b.new_credit]];
    pairs.forEach(([k, v]) => {
        const bar = document.getElementById('bar-'+k);
        const val = document.getElementById('score-'+k);
        if (bar) setTimeout(() => { bar.style.width = v + '%'; }, 200);
        if (val) val.textContent = v.toFixed(1);
    });

    if (data.recommendations?.length) {
        document.getElementById('recommendations').style.display = 'block';
        document.getElementById('rec-list').innerHTML =
            data.recommendations.map(r => `<li class="rec-item">${r}</li>`).join('');
    }
}

// ═══════════════════════════════════════
//  UPI MANDATE
// ═══════════════════════════════════════
async function createMandate() {
    const formData = new FormData();
    formData.append('user_id', USER_ID);
    formData.append('mandate_type', document.getElementById('mandate-type').value);
    formData.append('amount', document.getElementById('mandate-amount').value);
    formData.append('upi_id', document.getElementById('payer-upi').value);
    formData.append('merchant_vpa', document.getElementById('merchant-vpa').value);
    formData.append('merchant_name', document.getElementById('merchant-name').value);
    formData.append('frequency', document.getElementById('frequency').value);
    formData.append('start_date', document.getElementById('start-date').value + 'T00:00:00+00:00');
    formData.append('end_date', document.getElementById('end-date').value + 'T00:00:00+00:00');
    formData.append('max_retries', document.getElementById('max-retries').value);

    try {
        const response = await fetch(`${API_BASE.upi}/mandates/create`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Failed to create mandate');
        const data = await response.json();
        if (data.success) {
            mandates.push(data);
            updateMandateList();
            updateMandateStats();
        } else throw new Error(data.message || 'Failed to create mandate');
    } catch (error) { alert('Failed to create mandate: ' + error.message); }
}

function updateMandateList() {
    const container = document.getElementById('mandates-container');
    document.getElementById('mandate-list').style.display = 'block';
    container.innerHTML = mandates.map(m => `
        <div class="mandate-card">
            <div>
                <p class="body" style="color:var(--text-primary);font-weight:600;">${m.merchant_name || '—'}</p>
                <p class="caption" style="margin-top:4px;">${m.mandate_id} · ${m.frequency || ''}</p>
            </div>
            <div style="text-align:right;">
                <p class="body" style="color:var(--text-primary);font-weight:700;">₹${Number(m.amount || 0).toLocaleString('en-IN')}</p>
                <span class="status-badge status-verified" style="margin-top:6px;display:inline-flex;">
                    <span class="status-dot"></span>${(m.status || 'active').toUpperCase()}
                </span>
            </div>
        </div>`).join('');
}

function updateMandateStats() {
    const active = mandates.filter(m => m.status === 'active').length;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-total').textContent = mandates.reduce((s, m) => s + (m.executions_scheduled || 0), 0);
}

// ═══════════════════════════════════════
//  HEALTH CHECK
// ═══════════════════════════════════════
async function checkHealth() {
    const services = [
        { key: 'kyc',    url: `${API_BASE.kyc}/health` },
        { key: 'credit', url: `${API_BASE.credit}/health` },
        { key: 'upi',    url: `${API_BASE.upi}/health` }
    ];

    for (const svc of services) {
        const dot   = document.getElementById('health-' + svc.key);
        const pulse = document.getElementById('pulse-' + svc.key);
        try {
            const r = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
            if (r.ok) {
                if (dot)   { dot.classList.remove('offline','unknown'); }
                if (pulse) { pulse.classList.remove('offline'); }
            } else throw new Error('not ok');
        } catch {
            if (dot)   dot.classList.add('offline');
            if (pulse) pulse.classList.add('offline');
        }
    }
}

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Set default mandate dates
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    const sd = document.getElementById('start-date');
    const ed = document.getElementById('end-date');
    if (sd) sd.value = today.toISOString().split('T')[0];
    if (ed) ed.value = nextYear.toISOString().split('T')[0];

    // Health checks
    checkHealth();
    setInterval(checkHealth, 30000);

    // Re-run reveal observer after DOM settles
    setTimeout(() => {
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }, 100);
});
