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
//  SCROLL REVEAL — animation on entry
// ═══════════════════════════════════════
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0, rootMargin: '0px 0px -20px 0px' });

function observeRevealElements() {
    document.querySelectorAll('.reveal:not(.animated)').forEach(el => revealObserver.observe(el));
}
observeRevealElements();

// ═══════════════════════════════════════
//  THREE.JS 3D SCENE — scroll-driven
// ═══════════════════════════════════════
(function initThreeScene() {
    const canvas = document.getElementById('threeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Scene & Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Color themes per section
    const THEMES = {
        hero:      { color: 0xc96e3a, emissive: 0x6b2f10, wire: 0xe8884a, ambient: 0x2a1506 },
        kyc:       { color: 0xd4813a, emissive: 0x7a3a10, wire: 0xf0a060, ambient: 0x2a1506 },
        credit:    { color: 0x4a9a3a, emissive: 0x1a4a10, wire: 0x70cc50, ambient: 0x061a06 },
        upi:       { color: 0x7a4ab0, emissive: 0x3a1a70, wire: 0xaa70e0, ambient: 0x0a0620 },
        dashboard: { color: 0x3a7ab0, emissive: 0x103a70, wire: 0x60a8e0, ambient: 0x060e20 },
    };

    // Materials
    const mainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(THEMES.hero.color),
        emissive: new THREE.Color(THEMES.hero.emissive),
        metalness: 0.7, roughness: 0.15,
    });
    const wireMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(THEMES.hero.wire),
        wireframe: true, transparent: true, opacity: 0.12,
    });

    // Geometries for morphing
    const sphereGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const icoGeo    = new THREE.IcosahedronGeometry(1.5, 1);
    const torusGeo  = new THREE.TorusGeometry(1.1, 0.38, 32, 80);
    const octaGeo   = new THREE.OctahedronGeometry(1.5, 2);
    const dodecaGeo = new THREE.DodecahedronGeometry(1.3, 0);

    function geoPositions(geo) { return Array.from(geo.attributes.position.array); }

    const mesh     = new THREE.Mesh(sphereGeo.clone(), mainMat);
    const wireMesh = new THREE.Mesh(sphereGeo.clone(), wireMat);
    wireMesh.scale.setScalar(1.04);
    scene.add(mesh);
    scene.add(wireMesh);

    // Particles
    const N = 220;
    const pPos   = new Float32Array(N * 3);
    const pPhase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        const r = 2.6 + Math.random() * 2.8;
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pPos[i*3+2] = r * Math.cos(phi);
        pPhase[i]   = Math.random() * Math.PI * 2;
    }
    const pBasePos = pPos.slice();
    const pGeo  = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos.slice(), 3));
    const pMat  = new THREE.PointsMaterial({ color: 0xe8884a, size: 0.025, transparent: true, opacity: 0.7, sizeAttenuation: true });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);


    // Orbiting rings
    const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.008, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0xe8884a, transparent: true, opacity: 0.25 })
    );
    ring1.rotation.x = Math.PI / 2.4;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(2.5, 0.005, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0xe8884a, transparent: true, opacity: 0.12 })
    );
    ring2.rotation.x = Math.PI / 3.5;
    ring2.rotation.z = Math.PI / 5;
    scene.add(ring2);

    // Lighting
    const ambientLight = new THREE.AmbientLight(THEMES.hero.ambient, 3);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0xff9966, 4, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x3366ff, 2, 10);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.8)).position.set(0, 5, -3);

    // Geometry morph state
    let currentPositions = geoPositions(sphereGeo);
    let targetPositions  = currentPositions.slice();
    let morphT = 1;

    function triggerMorph(key) {
        const src = { hero: sphereGeo, kyc: icoGeo, credit: torusGeo, upi: octaGeo, dashboard: dodecaGeo };
        const target = geoPositions(src[key] || sphereGeo);
        const curLen = currentPositions.length;
        targetPositions = Array.from({ length: curLen }, (_, i) => target[i % target.length] ?? 0);
        morphT = 0;
    }

    function updateMorphGeometry(dt) {
        if (morphT >= 1) return;
        morphT = Math.min(morphT + dt * 1.2, 1);
        const e = morphT < 0.5 ? 4*morphT*morphT*morphT : 1 - Math.pow(-2*morphT+2,3)/2;
        const pos  = mesh.geometry.attributes.position.array;
        const wpos = wireMesh.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i++) {
            const v = currentPositions[i] + (targetPositions[i] - currentPositions[i]) * e;
            pos[i] = v; wpos[i] = v;
        }
        mesh.geometry.attributes.position.needsUpdate = true;
        wireMesh.geometry.attributes.position.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
        if (morphT >= 1) currentPositions = Array.from(pos);
    }

    // Scroll-driven state
    const S = {
        section: 'hero',
        tX: 0, tY: 0, cX: 0, cY: 0,
        tSc: 1, cSc: 1,
        tOp: 1, cOp: 1,
        tColor:   new THREE.Color(THEMES.hero.color),
        tEmissive: new THREE.Color(THEMES.hero.emissive),
        tWire:    new THREE.Color(THEMES.hero.wire),
    };
    let lastSec = '';

    function setSection(key) {
        if (key === lastSec) return;
        lastSec = key; S.section = key;
        const t = THEMES[key] || THEMES.hero;
        S.tColor.set(t.color); S.tEmissive.set(t.emissive); S.tWire.set(t.wire);
        ambientLight.color.set(t.ambient);
        triggerMorph(key);
    }

    function lp(a, b, t) { return a + (b - a) * t; }
    function ss(t) { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); }

    // Convert screen % (0=left/top, 100=right/bottom) to Three.js world coords
    // Camera at z=5, FOV 60 → visible height = 2*5*tan(30°) ≈ 5.774
    function screenToWorld(xPct, yPct) {
        const h = 2 * 5 * Math.tan(THREE.MathUtils.degToRad(30));
        const w = h * camera.aspect;
        // xPct 50 = center, yPct 50 = center
        // Three.js Y+ is up, so invert: yPct 0 = top = +h/2
        const wx = (xPct / 100 - 0.5) * w;
        const wy = -(yPct / 100 - 0.5) * h;
        return { x: wx, y: wy };
    }

    function updateScroll() {
        const sy = window.scrollY, wH = window.innerHeight;
        const g  = id => document.getElementById(id)?.offsetTop ?? 99999;
        const kT = g('kyc'), crT = g('credit'), uT = g('upi'), dT = g('dashboard');

        let xPct, yPct, sc, op;

        if (sy < kT - wH * 0.4) {
            // HERO — dead center
            setSection('hero');
            xPct = 50; yPct = 50; sc = 1.0; op = 1;

        } else if (sy < crT - wH * 0.4) {
            // KYC — slides to left-center
            const t = Math.min((sy - (kT - wH*0.4)) / wH, 1);
            setSection('kyc');
            xPct = lp(50, 22, ss(t));
            yPct = lp(50, 42, ss(t));
            sc   = lp(1.0, 0.60, ss(t)); op = 1;

        } else if (sy < uT - wH * 0.4) {
            // CREDIT — swings to right-center
            const t = Math.min((sy - (crT - wH*0.4)) / wH, 1);
            setSection('credit');
            xPct = lp(22, 78, ss(t));
            yPct = lp(42, 45, ss(t));
            sc   = lp(0.60, 0.55, ss(t)); op = 1;

        } else if (sy < dT - wH * 0.4) {
            // UPI — swings back left
            const t = Math.min((sy - (uT - wH*0.4)) / wH, 1);
            setSection('upi');
            xPct = lp(78, 20, ss(t));
            yPct = lp(45, 48, ss(t));
            sc   = lp(0.55, 0.50, ss(t)); op = 1;

        } else {
            // DASHBOARD — retreats to top-right corner
            const t = Math.min((sy - (dT - wH*0.4)) / wH, 1);
            setSection('dashboard');
            xPct = lp(20, 85, ss(t));
            yPct = lp(48, 15, ss(t));
            sc   = lp(0.50, 0.22, ss(t));
            op   = lp(1, 0.55, ss(t));
        }

        const wp = screenToWorld(xPct, yPct);
        S.tX = wp.x; S.tY = wp.y; S.tSc = sc; S.tOp = op;
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    // Mouse parallax
    let mX = 0, mY = 0;
    window.addEventListener('mousemove', e => {
        mX = (e.clientX/window.innerWidth  - 0.5) * 0.4;
        mY = (e.clientY/window.innerHeight - 0.5) * 0.4;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Render loop
    const clock = new THREE.Clock();
    const rotSpeeds = { hero:0.18, kyc:0.42, credit:0.22, upi:0.30, dashboard:0.12 };

    function animate() {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        const et = clock.getElapsedTime();
        const ef = 1 - Math.pow(0.001, dt);

        S.cX  += (S.tX  - S.cX)  * ef * 3.5;
        S.cY  += (S.tY  - S.cY)  * ef * 3.5;
        S.cSc += (S.tSc - S.cSc) * ef * 3.5;
        S.cOp += (S.tOp - S.cOp) * ef * 4;

        const px = S.cX + mX*0.6, py = S.cY - mY*0.6;
        [mesh, wireMesh, particles, ring1, ring2].forEach(o => o.position.set(px, py, 0));

        mesh.scale.setScalar(S.cSc);
        wireMesh.scale.setScalar(S.cSc * 1.04);
        ring1.scale.setScalar(S.cSc * 0.95);
        ring2.scale.setScalar(S.cSc * 0.90);
        particles.scale.setScalar(S.cSc);

        mainMat.color.lerp(S.tColor, ef*2);
        mainMat.emissive.lerp(S.tEmissive, ef*2);
        wireMat.color.lerp(S.tWire, ef*2);
        pMat.color.lerp(S.tWire, ef*2);
        ring1.material.color.lerp(S.tWire, ef*2);
        ring2.material.color.lerp(S.tWire, ef*2);

        mainMat.opacity = S.cOp; mainMat.transparent = S.cOp < 1;
        wireMat.opacity = 0.12 * S.cOp;
        pMat.opacity    = 0.7  * S.cOp;
        ring1.material.opacity = 0.25 * S.cOp;
        ring2.material.opacity = 0.12 * S.cOp;

        updateMorphGeometry(dt);

        const spd = rotSpeeds[S.section] || 0.18;
        mesh.rotation.y += dt * spd;
        mesh.rotation.x  = Math.sin(et * 0.3) * 0.15;
        wireMesh.rotation.copy(mesh.rotation);
        ring1.rotation.z += dt * 0.35; ring1.rotation.y += dt * 0.15;
        ring2.rotation.z -= dt * 0.22; ring2.rotation.x += dt * 0.10;

        // Breathe particles
        const pa = pGeo.attributes.position.array;
        for (let i = 0; i < N; i++) {
            const breathe = 1 + Math.sin(pPhase[i] + et * 0.5) * 0.06;
            pa[i*3]   = pBasePos[i*3]   * breathe;
            pa[i*3+1] = pBasePos[i*3+1] * breathe;
            pa[i*3+2] = pBasePos[i*3+2] * breathe;
        }
        pGeo.attributes.position.needsUpdate = true;

        // Orbit lights
        pointLight1.position.set(Math.cos(et*0.7)*4, 2, Math.sin(et*0.7)*4);
        pointLight2.position.set(Math.cos(et*0.5+Math.PI)*3, Math.sin(et*0.4)*2, 2);

        renderer.render(scene, camera);
    }
    animate();
})();

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

    // Re-observe any reveals added after initial parse
    setTimeout(observeRevealElements, 50);
});
