/* =============================================
   1. SYSTEM CONFIGURATION (CORE)
   =============================================
*/
// ⚠️ PENTING: Ganti dengan Client ID & API Key milikmu
const CLIENT_ID = '1084207861418-qn4j1tj3fqbeaukqbsr1pm4iih92jtab.apps.googleusercontent.com'; 
const API_KEY = 'AIzaSyDlL9UXoyUTz7sGY9h27Xdnp_9Zrxv2ar4'; 

// SCOPE: drive.file (akses app data), metadata.readonly (baca folder), userinfo (profil)
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile';

let tokenClient;
let accessToken = '';
let gisInited = false;

// Keys untuk LocalStorage (Auto Login)
const TOKEN_KEY = 'drivesync_access_token';
const TOKEN_EXPIRY_KEY = 'drivesync_token_expiry';

/* =============================================
   2. AUTHENTICATION & BOOT SEQUENCE
   =============================================
*/

const authBtn = document.getElementById('authBtn');
const splash = document.getElementById('splash');
const startupSound = document.getElementById('startupSound');
const loginStatus = document.getElementById('loginStatus');

// --- A. Inisialisasi Google Identity Services (GIS) ---
function initGapiClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse) => {
            if (tokenResponse.error) {
                console.error("Login Error:", tokenResponse);
                updateLoginStatus("❌ ACCESS DENIED", "#ff4d4d");
                resetAuthBtn();
                return;
            }

            // Simpan Token & Masuk
            handleAuthSuccess(tokenResponse);
        }
    });
    gisInited = true;
    checkAuthReady();
}

// --- B. Handle Sukses Login ---
async function handleAuthSuccess(tokenResponse) {
    if(!tokenResponse || !tokenResponse.access_token) return;

    accessToken = tokenResponse.access_token;
    
    // Simpan ke Storage (Valid 1 jam biasanya)
    const expiresIn = (tokenResponse.expires_in || 3599) * 1000; 
    const expiryTime = Date.now() + expiresIn;
    
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime);

    updateLoginStatus("✅ ACCESS GRANTED // TOKEN VALID", "#00f0ff");

    // Masuk ke App
    await fetchUserProfile();
    await listFolders(); // Load folder setelah token siap
    runBootSequence();
}

// --- C. Cek Auto Login saat Reload ---
function checkAutoLogin() {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (savedToken && expiry && Date.now() < parseInt(expiry)) {
        console.log("♻️ Auto-login using saved token");
        accessToken = savedToken;
        updateLoginStatus("♻️ RESTORING SESSION...", "#00f0ff");
        
        // Delay dikit biar smooth
        setTimeout(async () => {
            await fetchUserProfile();
            await listFolders();
            runBootSequence();
        }, 500);
        return true;
    }
    return false;
}

// --- D. Load Libraries ---
window.onload = () => {
    // Kita load GIS manual disini untuk kontrol penuh
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
        initGapiClient();
        // Cek apakah bisa auto login
        if(!checkAutoLogin()) {
            console.log("🔒 No valid session, waiting for user login.");
            updateLoginStatus("🔒 SYSTEM LOCKED", "#666");
        }
    };
    script.onerror = () => console.error("Gagal load GIS Script");
    document.body.appendChild(script);
};

function checkAuthReady() {
    if (gisInited && authBtn) {
        authBtn.disabled = false;
        authBtn.innerHTML = '<i class="fab fa-google"></i> CONNECT DRIVE ACCOUNT';
    }
}

// --- E. Login Button Handler ---
if (authBtn) {
    authBtn.onclick = () => {
        if (!tokenClient) return;
        
        authBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AUTHENTICATING...';
        authBtn.disabled = true;
        updateLoginStatus("📡 CONTACTING SATELLITE...", "#888");
        
        // Force prompt agar user bisa setuju scope baru (Penting buat fix 403)
        tokenClient.requestAccessToken({prompt: 'consent'});
    };
}

function resetAuthBtn() {
    authBtn.innerHTML = '<i class="fab fa-google"></i> CONNECT DRIVE ACCOUNT';
    authBtn.disabled = false;
}

function updateLoginStatus(text, color) {
    if(loginStatus) {
        loginStatus.innerText = text;
        loginStatus.style.color = color;
    }
}

// --- F. Boot Animation ---
function runBootSequence() {
    if (startupSound) {
        startupSound.volume = 0.8; 
        startupSound.play().catch(() => {});
    }

    if(authBtn) {
        authBtn.innerHTML = '<i class="fas fa-check"></i> SYSTEM UNLOCKED';
        authBtn.style.borderColor = "#00ff88";
        authBtn.style.color = "#00ff88";
        authBtn.style.boxShadow = "0 0 30px #00ff88";
    }

    setTimeout(() => {
        if(splash) {
            splash.style.opacity = '0';
            splash.style.transform = 'scale(1.2) filter(blur(10px))';
            setTimeout(() => {
                splash.style.display = 'none';
                showToast('🚀 SYSTEM ONLINE: COMMANDER ON DECK', '#00f0ff');
            }, 800);
        }
    }, 1000);
}

// --- G. Fetch Profile ---
async function fetchUserProfile() {
    if (!accessToken) return;
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if(!res.ok) throw new Error("Profile fetch failed");
        
        const data = await res.json();
        
        const profileUI = document.getElementById('userProfile');
        const avatarUI = document.getElementById('userAvatar');
        const nameUI = document.getElementById('userName');

        if (profileUI) {
            profileUI.classList.remove('hidden'); // Munculkan UI
            profileUI.style.display = 'flex'; // Pastikan display flex
            if(avatarUI) avatarUI.src = data.picture;
            if(nameUI) nameUI.innerText = data.name;
        }
    } catch (error) {
        console.error("Profile Error:", error);
    }
}

// --- H. Logout System ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => {
        if(confirm("Are you sure you want to terminate the uplink?")) {
            // Hapus token
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_EXPIRY_KEY);
            accessToken = '';
            
            // Efek Visual
            showToast('🛑 TERMINATING UPLINK...', '#ff4d4d');
            const card = document.getElementById('tiltCard');
            if(card) {
                card.style.transition = "all 0.5s ease";
                card.style.transform = "scale(0.9) blur(10px)";
                card.style.opacity = "0";
            }

            // Reload Halaman
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    };
}


/* =============================================
   3. VISUAL INTERFACE & UTILS (MULTIVERSE & ZEN)
   =============================================
*/

// --- A. MULTIVERSE THEME ENGINE (10 VARIANTS) ---
const themes = [
    '', // Default (Cyberpunk)
    'theme-matrix', 'theme-crimson', 'theme-ocean', 'theme-gold', 
    'theme-neon', 'theme-sunset', 'theme-mono', 'theme-toxic', 'theme-pastel'
];
const themeNames = [
    'CYBERPUNK', 'THE MATRIX', 'RED ALERT', 'DEEP OCEAN', 
    'ROYAL GOLD', 'NEON CITY', 'SUNSET DRIVE', 'MONOCHROME', 'TOXIC WASTE', 'COTTON CANDY'
];

let currentThemeIndex = 0;
const toggleBtn = document.getElementById('toggleDark'); // Tombol Visual Mode

if (toggleBtn) {
    toggleBtn.onclick = () => {
        // Hapus tema sebelumnya
        if (themes[currentThemeIndex] !== '') {
            document.body.classList.remove(themes[currentThemeIndex]);
        }

        // Pindah ke tema berikutnya
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        
        // Pasang tema baru
        if (themes[currentThemeIndex] !== '') {
            document.body.classList.add(themes[currentThemeIndex]);
        }

        // Efek Suara
        const audio = document.getElementById('startupSound');
        if(audio) { 
            const clone = audio.cloneNode(); 
            clone.volume = 0.2; 
            clone.playbackRate = 2.0; 
            clone.play().catch(()=>{}); 
        }

        // Notifikasi Tema Baru
        const newColor = getComputedStyle(document.body).getPropertyValue('--primary').trim();
        showToast(`🎨 THEME: ${themeNames[currentThemeIndex]}`, newColor);
    };
}

// --- B. ULTIMATE ZEN MODE ---
const zenBtn = document.getElementById('zenToggle');
const exitZenBtn = document.getElementById('exitZenBtn');
const zenMusic = document.getElementById('zenMusic');

function toggleZenMode(active) {
    if (active) {
        document.body.classList.add('zen-active');
        if(zenMusic) {
            zenMusic.volume = 0.6;
            zenMusic.play().catch(() => showToast("⚠️ ALLOW AUDIO PERMISSION", "#ff4d4d"));
        }
        showToast('🧘 ENTERING THE VOID...', '#00f0ff');
    } else {
        document.body.classList.remove('zen-active');
        if(zenMusic) zenMusic.pause();
    }
}

if (zenBtn) zenBtn.onclick = () => toggleZenMode(true);
if (exitZenBtn) exitZenBtn.onclick = () => toggleZenMode(false);

// Shortcut ESC untuk keluar Zen
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && document.body.classList.contains('zen-active')) {
        toggleZenMode(false);
    }
});

// 3D Tilt Effect
const card = document.getElementById('tiltCard');
if (card) {
    document.addEventListener('mousemove', (e) => {
        if(window.innerWidth < 768) return; 
        const xAxis = (window.innerWidth / 2 - e.pageX) / 30;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 30;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
    document.addEventListener('mouseleave', () => {
        card.style.transform = `rotateY(0deg) rotateX(0deg)`;
    });
}

function showToast(message, color = null) {
    // Ambil warna tema aktif jika color null
    if(!color) color = getComputedStyle(document.body).getPropertyValue('--primary').trim();

    if (typeof Toastify !== 'undefined') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top", position: "center", stopOnFocus: true, 
            style: {
                background: `linear-gradient(135deg, rgba(0,0,0,0.9), ${color}22)`,
                borderBottom: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}44`,
                backdropFilter: "blur(10px)",
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "0.9rem",
                color: "#fff"
            },
        }).showToast();
    } else { console.log(message); }
}


/* =============================================
   4. FILE HANDLING (DRAG & DROP)
   =============================================
*/
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const preview = document.getElementById('preview');

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateFilePreview(file) {
    if (file) {
        preview.innerHTML = `
            <div style="margin-top:15px; padding:10px; background:rgba(0,240,255,0.1); border-radius:8px; border:1px solid rgba(0,240,255,0.3); animation: fadeIn 0.5s;">
                <i class="fas fa-file-code" style="color:var(--primary); margin-right:8px;"></i>
                <strong style="color:#fff;">${file.name}</strong> 
                <div style="font-size:0.8em; color:var(--primary); margin-top:4px;">SIZE: ${formatSize(file.size)}</div>
            </div>`;
        dropZone.style.borderColor = "var(--primary)";
        dropZone.style.background = "rgba(0, 240, 255, 0.05)";
    } else {
        preview.innerHTML = '';
        dropZone.style.borderColor = "var(--glass-border)";
        dropZone.style.background = "rgba(0, 0, 0, 0.2)";
    }
}

if (fileInput) fileInput.onchange = (e) => updateFilePreview(e.target.files[0]);

if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });
    dropZone.addEventListener('drop', (e) => {
        fileInput.files = e.dataTransfer.files; 
        updateFilePreview(e.dataTransfer.files[0]);
    }, false);
}


/* =============================================
   5. GOOGLE DRIVE FUNCTIONS (REST API DIRECT)
   =============================================
*/

// 📂 List Folders (FIX: Removed key param, added correct scope)
async function listFolders() {
    const btn = document.getElementById('refreshFolders');
    if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 

    if (!accessToken) {
        console.warn("Skipping listFolders: No Token");
        if(btn) btn.innerHTML = '<i class="fas fa-sync"></i>';
        return;
    }

    const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false");
    // URL tanpa API Key, hanya Bearer Token
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=100`;

    fetch(url, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
    })
    .then(data => {
        const folderSelect = document.getElementById('folderSelect');
        folderSelect.innerHTML = '<option value="">-- ROOT DIRECTORY --</option>';
        
        console.log("✅ Folders received:", data.files);
        
        if (data.files && data.files.length > 0) {
            // Sort A-Z
            data.files.sort((a, b) => a.name.localeCompare(b.name));
            
            data.files.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = `📂 ${folder.name}`;
                folderSelect.appendChild(option);
            });
            showToast(`📡 FOUND ${data.files.length} FOLDER(S)`, '#00f0ff');
        } else {
            folderSelect.innerHTML = '<option value="">-- NO FOLDERS FOUND --</option>';
            showToast('⚠️ NO FOLDERS DETECTED', '#ffaa00');
        }
    })
    .catch(err => {
        console.error("List Folders Error:", err);
        showToast('❌ FAILED TO LOAD FOLDERS (403/Net)', '#ff4d4d');
    })
    .finally(() => {
        if(btn) btn.innerHTML = '<i class="fas fa-sync"></i>';
    });
}

const refreshBtn = document.getElementById('refreshFolders');
if (refreshBtn) refreshBtn.onclick = listFolders;


// ➕ Create Folder (REST API)
const createFolderBtn = document.getElementById('createFolder');
if (createFolderBtn) {
    createFolderBtn.onclick = async () => {
        if (!accessToken) return showToast('⚠️ NO ACCESS TOKEN', '#ffaa00');
        
        const folderName = document.getElementById('newFolderName').value.trim();
        if (!folderName) return showToast('⚠️ NAME REQUIRED', '#ffaa00');
        
        const icon = createFolderBtn.querySelector('i');
        icon.className = "fas fa-spinner fa-spin";

        try {
            const metadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder'
            };

            const response = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });

            if (!response.ok) throw new Error("Create Failed");

            showToast(`✅ NODE CREATED: ${folderName.toUpperCase()}`);
            document.getElementById('newFolderName').value = ''; 
            listFolders(); // Refresh list

        } catch (error) {
            console.error(error);
            showToast('❌ CREATION FAILED', '#ff4d4d');
        } finally {
            icon.className = "fas fa-plus";
        }
    };
}


// 📤 Upload File (XHR - Progress Bar)
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

if (uploadBtn) {
    uploadBtn.onclick = () => {
        const file = fileInput.files[0];
        const customName = document.getElementById('customName').value.trim();
        const folderId = document.getElementById('folderSelect').value;

        if (!file) return showToast('⚠️ NO DATA SOURCE', '#ffaa00');
        if (!accessToken) return showToast('⚠️ AUTH TOKEN MISSING', '#ff4d4d');

        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-cog fa-spin"></i> UPLOADING...';
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';

        const metadata = {
            name: customName || file.name,
            mimeType: file.type || 'application/octet-stream'
        };
        if (folderId) metadata.parents = [folderId];

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const xhr = new XMLHttpRequest();
        // Remove key param here as well
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + '%';
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                showToast('🚀 UPLOAD SUCCESSFUL!');
                fileInput.value = '';
                preview.innerHTML = '';
                document.getElementById('customName').value = '';
                progressBar.style.width = '100%';
                setTimeout(() => { progressContainer.style.display = 'none'; }, 2000);
            } else {
                showToast('❌ ERROR: ' + xhr.status, '#ff4d4d');
                console.error(xhr.responseText);
            }
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> INITIATE UPLOAD';
        };

        xhr.onerror = () => {
            showToast('❌ NETWORK FAILURE', '#ff4d4d');
            uploadBtn.disabled = false;
            progressContainer.style.display = 'none';
        };

        xhr.send(form);
    };
}


/* =============================================
   6. ANIMATION: DIGITAL PLASMA FLOW (LUXURY & FUTURISTIC)
   =============================================
*/
const canvas = document.getElementById('stars'); // Kita gunakan canvas yang sama
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Konfigurasi Partikel
    const particleCount = 180; // Jumlah partikel (seimbang performa & visual)
    let particles = [];
    let time = 0;

    // Fungsi Resize agar responsif
    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles(); // Reset partikel saat resize
    }
    window.addEventListener('resize', resize);
    

    class Particle {
        constructor() {
            this.reset();
            // Mulai di posisi random saat init pertama kali
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }

        reset() {
            // Reset posisi ke luar layar secara random untuk masuk kembali
            this.x = Math.random() * width;
            this.y = Math.random() > 0.5 ? -50 : height + 50;
            
            // Kecepatan & ukuran random
            this.speed = Math.random() * 0.5 + 0.2;
            this.size = Math.random() * 3 + 1;
            this.vx = 0;
            this.vy = 0;
            // Variasi warna sedikit (antara primary dan secondary nanti)
            this.colorVariant = Math.random(); 
        }

        update() {
            // INTI ANIMASI FUTURISTIK: Flow Field
            // Partikel bergerak mengikuti gelombang sinus/cosinus
            const flowAngle = (Math.cos(this.x * 0.005 + time) + Math.sin(this.y * 0.002 + time)) * Math.PI;
            
            // Akselerasi ke arah flow
            this.vx += Math.cos(flowAngle) * 0.05 * this.speed;
            this.vy += Math.sin(flowAngle) * 0.05 * this.speed;

            // Friksi agar gerakan smooth
            this.vx *= 0.96;
            this.vy *= 0.96;

            this.x += this.vx;
            this.y += this.vy;

            // Reset jika keluar layar terlalu jauh
            if (this.x < -100 || this.x > width + 100 || this.y < -100 || this.y > height + 100) {
                this.reset();
            }
        }

        draw(primary, secondary) {
            // Efek "Glow Mewah" dengan Radial Gradient
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
            
            // Campur warna primary dan secondary berdasarkan varian partikel
            const color = this.colorVariant > 0.5 ? primary : secondary;
            
            // Inti terang -> Pinggiran transparan
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Helper: Hex to RGBA
    function hexToRgba(hex, alpha) {
        hex = hex.trim().replace('#', '');
        var r = parseInt(hex.length === 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
        var g = parseInt(hex.length === 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
        var b = parseInt(hex.length === 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);
        if (isNaN(r) || isNaN(g) || isNaN(b)) return 'rgba(0, 0, 0, ' + alpha + ')';
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function animate() {
        // Ambil warna TEMA AKTIF secara real-time
        const styles = getComputedStyle(document.body);
        const primaryHex = styles.getPropertyValue('--primary').trim();
        const secondaryHex = styles.getPropertyValue('--secondary').trim();
        const bgDark = styles.getPropertyValue('--bg-dark-1').trim();

        // 1. Efek Trail (Jejak Mewah)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = hexToRgba(bgDark, 0.15); // Warna background dengan transparansi
        ctx.fillRect(0, 0, width, height);

        // 2. Efek "Lighter" (Kunci Glowing)
        ctx.globalCompositeOperation = 'lighter';

        time += 0.005; // Waktu berjalan

        particles.forEach(p => {
            p.update();
            p.draw(primaryHex, secondaryHex);
        });

        requestAnimationFrame(animate);
    }

    // Start System
    resize();
    animate();
}