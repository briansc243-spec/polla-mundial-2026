// ========================================
// SISTEMA DE LOGIN — usuarios en Supabase
// ========================================

async function logAction(username, action, detail = {}) {
    try {
        await db().from('polla_logs').insert({ username, action, detail });
    } catch (e) {
        console.warn('Log error:', e);
    }
}



// Verificar si ya hay sesión activa
function checkSession() {
    const isLoggedIn = sessionStorage.getItem('pollaLoggedIn');
    const loggedUser = sessionStorage.getItem('pollaUser');
    if (isLoggedIn === 'true' && loggedUser) {
        showMainApp();
        return true;
    }
    return false;
}

// Manejar login (async — verifica contra Supabase)
async function handleLogin() {
    const username = document.getElementById('loginUser').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showLoginError('Por favor completa todos los campos');
        return;
    }

    const btn = document.getElementById('loginBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

    try {
        const { data, error } = await db()
            .from('polla_users')
            .select('username, password_hash, role')
            .eq('username', username)
            .maybeSingle();

        if (error || !data) {
            showLoginError('❌ Usuario o contraseña incorrectos');
            return;
        }

        if (password !== data.password_hash) {
            showLoginError('❌ Usuario o contraseña incorrectos');
            return;
        }

        sessionStorage.setItem('pollaLoggedIn', 'true');
        sessionStorage.setItem('pollaUser', data.username);
        sessionStorage.setItem('pollaRole', data.role);
        logAction(data.username, 'login');
        showMainApp();
    } catch (e) {
        showLoginError('⚠️ Error de conexión. Intenta de nuevo.');
        console.error(e);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Ingresar'; }
    }
}

// ── Cambiar contraseña (usuario actual) ────────────────────────────────────
function openPointsModal()  { document.getElementById('pointsModal').style.display = 'flex'; }
function closePointsModal() { document.getElementById('pointsModal').style.display = 'none'; }

function togglePasswordVisibility() {
    const input = document.getElementById('loginPassword');
    const btn   = document.getElementById('eyeBtn');
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function toggleChangePwd(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn   = document.getElementById(btnId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

function openChangePwdModal() {
    document.getElementById('changePwdCurrent').value = '';
    document.getElementById('changePwdNew').value = '';
    document.getElementById('changePwdConfirm').value = '';
    document.getElementById('changePwdError').textContent = '';
    document.getElementById('changePwdModal').style.display = 'flex';
}
function closeChangePwdModal() {
    document.getElementById('changePwdModal').style.display = 'none';
}

async function changePassword() {
    const username   = sessionStorage.getItem('pollaUser');
    const currentPwd = document.getElementById('changePwdCurrent').value;
    const newPwd     = document.getElementById('changePwdNew').value;
    const confirmPwd = document.getElementById('changePwdConfirm').value;
    const errDiv     = document.getElementById('changePwdError');

    if (!currentPwd || !newPwd || !confirmPwd) { errDiv.textContent = 'Completa todos los campos'; return; }
    if (newPwd !== confirmPwd)                  { errDiv.textContent = 'Las contraseñas nuevas no coinciden'; return; }
    if (newPwd.length < 6)                      { errDiv.textContent = 'Mínimo 6 caracteres'; return; }

    const { data } = await db().from('polla_users').select('password_hash').eq('username', username).maybeSingle();
    if (!data || data.password_hash !== currentPwd) { errDiv.textContent = '❌ Contraseña actual incorrecta'; return; }

    await db().from('polla_users').update({ password_hash: newPwd }).eq('username', username);
    logAction(username, 'change_password');
    closeChangePwdModal();
    showToast('✅ Contraseña actualizada');
}

// ── Gestión de usuarios (solo admin) ───────────────────────────────────────
function openAdminUsersModal() {
    document.getElementById('adminUsersModal').style.display = 'flex';
    renderAdminUsers();
}
function closeAdminUsersModal() {
    document.getElementById('adminUsersModal').style.display = 'none';
}

async function renderAdminUsers() {
    const container = document.getElementById('adminUsersContainer');
    container.innerHTML = '<p style="color:#A0A8C0; font-size:0.85rem;">Cargando...</p>';
    const { data } = await db().from('polla_users').select('username, role').order('username');
    if (!data || data.length === 0) { container.innerHTML = '<p style="color:#A0A8C0;">Sin usuarios.</p>'; return; }
    container.innerHTML = data.map(u => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,0.04); border-radius:8px; margin-bottom:8px;">
            <div>
                <span style="font-weight:600; color:#E0E6F8;">${u.username}</span>
                <span style="margin-left:8px; font-size:0.78rem; color:${u.role === 'admin' ? '#FFD700' : '#A0A8C0'};">${u.role === 'admin' ? '👑 admin' : '👤 usuario'}</span>
            </div>
            ${u.username !== 'admin'
                ? `<button onclick="adminDeleteUser('${u.username}')" style="background:rgba(255,50,50,0.12); border:1px solid rgba(255,80,80,0.35); color:#FF6B6B; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">🗑️ Eliminar</button>`
                : '<span style="color:#A0A8C0; font-size:0.78rem;">protegido</span>'}
        </div>
    `).join('');
}

async function adminCreateUser() {
    const username = document.getElementById('newUserName').value.trim().toLowerCase();
    const password = document.getElementById('newUserPassword').value;
    const role     = document.getElementById('newUserRole').value;
    const errDiv   = document.getElementById('adminUserError');

    if (!username || !password) { errDiv.textContent = 'Completa usuario y contraseña'; return; }
    if (!/^[a-z0-9_]+$/.test(username)) { errDiv.textContent = 'Solo letras, números y guión bajo'; return; }
    if (password.length < 6) { errDiv.textContent = 'Mínimo 6 caracteres'; return; }

    const { data: exists } = await db().from('polla_users').select('username').eq('username', username).maybeSingle();
    if (exists) { errDiv.textContent = '❌ Ese usuario ya existe'; return; }

    const { error } = await db().from('polla_users').insert({ username, password_hash: password, role });
    if (error) { errDiv.textContent = '❌ Error al crear usuario'; return; }

    logAction(sessionStorage.getItem('pollaUser'), 'create_user', { created: username, role });
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserPassword').value = '';
    errDiv.textContent = '';
    showToast(`✅ Usuario "${username}" creado`);
    renderAdminUsers();
}

async function adminDeleteUser(username) {
    if (!confirm(`¿Eliminar al usuario "${username}"?`)) return;
    await db().from('polla_users').delete().eq('username', username);
    logAction(sessionStorage.getItem('pollaUser'), 'delete_user', { deleted: username });
    showToast(`🗑️ "${username}" eliminado`);
    renderAdminUsers();
}

async function loadLogs() {
    const container = document.getElementById('adminLogsContainer');
    const filterUser = document.getElementById('logFilterUser').value.trim().toLowerCase();
    container.innerHTML = '<p style="color:#A0A8C0; font-size:0.82rem;">Cargando...</p>';

    let query = db().from('polla_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (filterUser) query = query.ilike('username', `%${filterUser}%`);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
        container.innerHTML = '<p style="color:#A0A8C0; font-size:0.82rem;">Sin registros.</p>';
        return;
    }

    const actionLabels = {
        login:           '🔑 Login',
        change_password: '🔒 Cambió contraseña',
        create_user:     '➕ Creó usuario',
        delete_user:     '🗑️ Eliminó usuario',
        reset_password:  '🔄 Restableció contraseña',
        save_predictions:'💾 Guardó predicciones',
        save_special:    '🏆 Guardó predicciones especiales',
        save_results:    '⚡ Guardó resultados',
    };

    container.innerHTML = data.map(log => {
        const date = new Date(log.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' });
        const label = actionLabels[log.action] || log.action;
        let detail = '';
        if (log.detail) {
            if (log.action === 'save_predictions') detail = `· ${log.detail.count} partido(s)`;
            else if (log.action === 'create_user')  detail = `· creó: ${log.detail.created}`;
            else if (log.action === 'delete_user')  detail = `· eliminó: ${log.detail.deleted}`;
            else if (log.action === 'reset_password') detail = `· para: ${log.detail.target}`;
            else if (log.action === 'save_results') detail = `· ${log.detail.count} resultado(s)`;
        }
        return `
            <div style="padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:6px; font-size:0.82rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="color:#E0E6F8; font-weight:600;">${log.username}</span>
                    <span style="color:#A0A8C0; font-size:0.75rem;">${date}</span>
                </div>
                <div style="color:#00D9FF; margin-top:2px;">${label} <span style="color:#A0A8C0;">${detail}</span></div>
            </div>`;
    }).join('');
}

async function adminResetPassword() {
    const username = document.getElementById('resetUserName').value.trim().toLowerCase();
    const password = document.getElementById('resetUserPassword').value;
    const errDiv   = document.getElementById('adminResetError');

    if (!username || !password) { errDiv.textContent = 'Completa usuario y nueva contraseña'; return; }
    if (password.length < 6)    { errDiv.textContent = 'Mínimo 6 caracteres'; return; }

    const { data: exists } = await db().from('polla_users').select('username').eq('username', username).maybeSingle();
    if (!exists) { errDiv.textContent = '❌ Usuario no encontrado'; return; }

    await db().from('polla_users').update({ password_hash: password }).eq('username', username);
    logAction(sessionStorage.getItem('pollaUser'), 'reset_password', { target: username });
    document.getElementById('resetUserName').value = '';
    document.getElementById('resetUserPassword').value = '';
    errDiv.textContent = '';
    showToast(`✅ Contraseña de "${username}" restablecida`);
}

// Mostrar error de login
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Ocultar después de 4 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 4000);
}

// Mostrar aplicación principal
async function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'block';
    startLivePolling();

    // Ocultar logo al hacer scroll, mostrar al volver arriba
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > 60 && currentScrollY > lastScrollY) {
                brandLogo.classList.add('logo-hidden');
            } else if (currentScrollY < 30) {
                brandLogo.classList.remove('logo-hidden');
            }
            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    const username = sessionStorage.getItem('pollaUser');

    // Intentar cache local → polla_users.display_name → polla_data (fallback)
    let savedName = localStorage.getItem(`pollaDisplayName:${username}`);
    if (!savedName) {
        const { data: userRow } = await db()
            .from('polla_users')
            .select('display_name')
            .eq('username', username)
            .maybeSingle();
        savedName = userRow?.display_name || null;
        if (!savedName) {
            savedName = await storage.get(`displayName:${username}`);
        }
        if (savedName) localStorage.setItem(`pollaDisplayName:${username}`, savedName);
    }

    if (!savedName) {
        showDisplayNameModal();
    } else {
        lockParticipantName(savedName);
        applyRoleUI(username);
        document.getElementById('mainApp').style.display = 'block';

        // Mostrar modal de partidos de hoy/mañana ANTES de init()
        // Solo necesita matches (ya en memoria) y el pick del usuario (1 query)
        const shownKey = `todayMatchesShown:${username}`;
        if (!sessionStorage.getItem(shownKey)) {
            sessionStorage.setItem(shownKey, 'true');
            matches = defaultMatches;
            const myData = await storage.get(`participant:${savedName}`);
            if (myData) participants = [myData];
            showTodayMatches();
        }

        init();
    }
}

// Mostrar modal de nombre
function showDisplayNameModal() {
    const modal = document.getElementById('displayNameModal');
    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('displayNameInput').focus(), 100);

    document.getElementById('displayNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmDisplayName();
    }, { once: true });
}

// Confirmar nombre de participante
async function confirmDisplayName() {
    const input = document.getElementById('displayNameInput');
    const name = input.value.trim();
    const errorDiv = document.getElementById('displayNameError');

    if (!name) {
        errorDiv.textContent = 'Por favor ingresa tu nombre';
        return;
    }
    if (name.length < 2) {
        errorDiv.textContent = 'El nombre debe tener al menos 2 caracteres';
        return;
    }

    const username = sessionStorage.getItem('pollaUser');
    localStorage.setItem(`pollaDisplayName:${username}`, name);
    // Guardar en polla_users.display_name (fuente principal) y polla_data (fallback)
    await Promise.all([
        db().from('polla_users').update({ display_name: name }).eq('username', username),
        storage.set(`displayName:${username}`, name)
    ]);

    document.getElementById('displayNameModal').style.display = 'none';
    lockParticipantName(name);
    applyRoleUI(username);
    document.getElementById('mainApp').style.display = 'block';
    init();
}

function showToast(msg, duration = 3000) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('hide');
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
    }, duration);
}

function applyRoleUI(username) {
    const isAdmin = sessionStorage.getItem('pollaRole') === 'admin' || username === 'admin';
    const isMobile = window.innerWidth <= 600;

    const resultsTab = document.getElementById('resultsTab');
    if (resultsTab) resultsTab.style.display = isAdmin ? 'flex' : 'none';

    const headerBtns = document.getElementById('headerBtns');
    if (headerBtns) headerBtns.style.display = 'flex';

    if (isMobile) {
        // Mobile: mostrar solo el botón ⋮
        document.getElementById('loggedUserChip').style.display  = 'none';
        document.getElementById('changePwdBtn').style.display    = 'none';
        document.getElementById('adminUsersBtn').style.display   = 'none';
        document.getElementById('logoutBtn').style.display       = 'none';
        document.getElementById('mobileMenu').style.display      = 'block';
        document.getElementById('mobileLoggedUserName').textContent = username;
        const mobileAdminBtn = document.getElementById('mobileAdminBtn');
        if (mobileAdminBtn) mobileAdminBtn.style.display = isAdmin ? 'block' : 'none';
    } else {
        // Desktop: botones individuales
        document.getElementById('mobileMenu').style.display      = 'none';
        document.getElementById('changePwdBtn').style.display    = 'block';
        document.getElementById('logoutBtn').style.display       = 'block';
        document.getElementById('adminUsersBtn').style.display   = isAdmin ? 'block' : 'none';
        const chip = document.getElementById('loggedUserChip');
        const nameSpan = document.getElementById('loggedUserName');
        if (chip && nameSpan) { nameSpan.textContent = username; chip.style.display = 'block'; }
    }
}

function toggleMobileMenu() {
    const dd = document.getElementById('mobileMenuDropdown');
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('click', e => {
    const menu = document.getElementById('mobileMenu');
    if (menu && !menu.contains(e.target)) {
        const dd = document.getElementById('mobileMenuDropdown');
        if (dd) dd.style.display = 'none';
    }
});

function lockParticipantName(name) {
    const input = document.getElementById('participantName');
    input.value = name;
    input.readOnly = true;
    input.style.cssText += '; opacity:0.6; cursor:not-allowed; pointer-events:none;';
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        stopLivePolling();
        sessionStorage.clear();
        document.getElementById('headerBtns').style.display = 'none';
        location.reload();
    }
}

// Permitir login con Enter
document.addEventListener('DOMContentLoaded', () => {
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    // Verificar sesión al cargar
    checkSession();
});

// ========================================
// Sistema de almacenamiento — Supabase
let _sb = null;
function db() {
    if (!_sb) _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _sb;
}

const storage = {
    get: async (key) => {
        try {
            const { data, error } = await db()
                .from('polla_data')
                .select('value')
                .eq('key', key)
                .maybeSingle();
            if (error) throw error;
            return data?.value ?? null;
        } catch (e) {
            console.error('storage.get', key, e);
            return null;
        }
    },
    set: async (key, value) => {
        try {
            const { error } = await db()
                .from('polla_data')
                .upsert({ key, value }, { onConflict: 'key' });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('storage.set', key, e);
            return false;
        }
    },
    list: async (prefix) => {
        try {
            const { data, error } = await db()
                .from('polla_data')
                .select('key')
                .like('key', `${prefix}%`);
            if (error) throw error;
            return { keys: (data ?? []).map(r => r.key) };
        } catch (e) {
            console.error('storage.list', prefix, e);
            return { keys: [] };
        }
    },
    getAll: async (prefix) => {
        try {
            const { data, error } = await db()
                .from('polla_data')
                .select('key, value')
                .like('key', `${prefix}%`);
            if (error) throw error;
            return (data ?? []).map(r => r.value);
        } catch (e) {
            console.error('storage.getAll', prefix, e);
            return [];
        }
    }
};

                        // Partidos del Mundial 2026 - Fase de Grupos (dateTime en hora PE, UTC-5)
const defaultMatches = [
    // GRUPO A — México, Sudáfrica, Corea del Sur, Chequia
    { id: 1, group: 'A', team1: '🇲🇽 México', team2: '🇿🇦 Sudáfrica', dateTime: '2026-06-11T14:00:00-05:00', venue: 'Estadio Banorte, Ciudad de México' },
    { id: 2, group: 'A', team1: '🇰🇷 Corea del Sur', team2: '🇨🇿 Chequia', dateTime: '2026-06-11T21:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 3, group: 'A', team1: '🇲🇽 México', team2: '🇰🇷 Corea del Sur', dateTime: '2026-06-18T20:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 4, group: 'A', team1: '🇨🇿 Chequia', team2: '🇿🇦 Sudáfrica', dateTime: '2026-06-18T11:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 5, group: 'A', team1: '🇿🇦 Sudáfrica', team2: '🇰🇷 Corea del Sur', dateTime: '2026-06-24T20:00:00-05:00', venue: 'Estadio BBVA, Guadalupe' },
    { id: 6, group: 'A', team1: '🇨🇿 Chequia', team2: '🇲🇽 México', dateTime: '2026-06-24T20:00:00-05:00', venue: 'Estadio Banorte, Ciudad de México' },

    // GRUPO B — Canadá, Qatar, Suiza, Bosnia y Herzegovina
    { id: 7, group: 'B', team1: '🇶🇦 Qatar', team2: '🇨🇭 Suiza', dateTime: '2026-06-13T14:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 8, group: 'B', team1: '🇨🇦 Canadá', team2: '🇧🇦 Bosnia y Herzegovina', dateTime: '2026-06-12T14:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 9, group: 'B', team1: '🇨🇭 Suiza', team2: '🇧🇦 Bosnia y Herzegovina', dateTime: '2026-06-18T14:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 10, group: 'B', team1: '🇨🇦 Canadá', team2: '🇶🇦 Qatar', dateTime: '2026-06-18T17:00:00-05:00', venue: 'BC Place, Vancouver' },
    { id: 11, group: 'B', team1: '🇧🇦 Bosnia y Herzegovina', team2: '🇶🇦 Qatar', dateTime: '2026-06-24T14:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 12, group: 'B', team1: '🇨🇭 Suiza', team2: '🇨🇦 Canadá', dateTime: '2026-06-24T14:00:00-05:00', venue: 'BC Place, Vancouver' },

    // GRUPO C — Brasil, Marruecos, Haití, Escocia
    { id: 13, group: 'C', team1: '🇧🇷 Brasil', team2: '🇲🇦 Marruecos', dateTime: '2026-06-13T17:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },
    { id: 14, group: 'C', team1: '🇭🇹 Haití', team2: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', dateTime: '2026-06-13T20:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 15, group: 'C', team1: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', team2: '🇲🇦 Marruecos', dateTime: '2026-06-19T17:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 16, group: 'C', team1: '🇧🇷 Brasil', team2: '🇭🇹 Haití', dateTime: '2026-06-19T19:30:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 17, group: 'C', team1: '🇲🇦 Marruecos', team2: '🇭🇹 Haití', dateTime: '2026-06-24T17:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 18, group: 'C', team1: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escocia', team2: '🇧🇷 Brasil', dateTime: '2026-06-24T17:00:00-05:00', venue: 'Hard Rock Stadium, Miami Gardens' },

    // GRUPO D — USA, Paraguay, Australia, Turquía
    { id: 19, group: 'D', team1: '🇺🇸 USA', team2: '🇵🇾 Paraguay', dateTime: '2026-06-12T20:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 20, group: 'D', team1: '🇦🇺 Australia', team2: '🇹🇷 Turquía', dateTime: '2026-06-13T23:00:00-05:00', venue: 'BC Place, Vancouver' },
    { id: 21, group: 'D', team1: '🇺🇸 USA', team2: '🇦🇺 Australia', dateTime: '2026-06-19T14:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 22, group: 'D', team1: '🇹🇷 Turquía', team2: '🇵🇾 Paraguay', dateTime: '2026-06-19T22:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 23, group: 'D', team1: '🇵🇾 Paraguay', team2: '🇦🇺 Australia', dateTime: '2026-06-25T21:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 24, group: 'D', team1: '🇹🇷 Turquía', team2: '🇺🇸 USA', dateTime: '2026-06-25T21:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },

    // GRUPO E — Alemania, Curazao, Costa de Marfil, Ecuador
    { id: 25, group: 'E', team1: '🇩🇪 Alemania', team2: '🇨🇼 Curazao', dateTime: '2026-06-14T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 26, group: 'E', team1: '🇨🇮 Costa de Marfil', team2: '🇪🇨 Ecuador', dateTime: '2026-06-14T18:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 27, group: 'E', team1: '🇪🇨 Ecuador', team2: '🇨🇼 Curazao', dateTime: '2026-06-20T19:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    { id: 28, group: 'E', team1: '🇩🇪 Alemania', team2: '🇨🇮 Costa de Marfil', dateTime: '2026-06-20T15:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 29, group: 'E', team1: '🇨🇼 Curazao', team2: '🇨🇮 Costa de Marfil', dateTime: '2026-06-25T15:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 30, group: 'E', team1: '🇪🇨 Ecuador', team2: '🇩🇪 Alemania', dateTime: '2026-06-25T15:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },

    // GRUPO F — Países Bajos, Japón, Suecia, Túnez
    { id: 31, group: 'F', team1: '🇳🇱 Países Bajos', team2: '🇯🇵 Japón', dateTime: '2026-06-14T15:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 32, group: 'F', team1: '🇸🇪 Suecia', team2: '🇹🇳 Túnez', dateTime: '2026-06-14T21:00:00-05:00', venue: 'Estadio BBVA, Guadalupe' },
    { id: 33, group: 'F', team1: '🇹🇳 Túnez', team2: '🇯🇵 Japón', dateTime: '2026-06-20T23:00:00-05:00', venue: 'Estadio BBVA, Guadalupe' },
    { id: 34, group: 'F', team1: '🇳🇱 Países Bajos', team2: '🇸🇪 Suecia', dateTime: '2026-06-20T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 35, group: 'F', team1: '🇹🇳 Túnez', team2: '🇳🇱 Países Bajos', dateTime: '2026-06-25T18:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    { id: 36, group: 'F', team1: '🇯🇵 Japón', team2: '🇸🇪 Suecia', dateTime: '2026-06-25T18:00:00-05:00', venue: 'AT&T Stadium, Arlington' },

    // GRUPO G — Bélgica, Egipto, Irán, Nueva Zelanda
    { id: 37, group: 'G', team1: '🇧🇪 Bélgica', team2: '🇪🇬 Egipto', dateTime: '2026-06-15T14:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 38, group: 'G', team1: '🇮🇷 Irán', team2: '🇳🇿 Nueva Zelanda', dateTime: '2026-06-15T20:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 39, group: 'G', team1: '🇧🇪 Bélgica', team2: '🇮🇷 Irán', dateTime: '2026-06-21T14:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 40, group: 'G', team1: '🇳🇿 Nueva Zelanda', team2: '🇪🇬 Egipto', dateTime: '2026-06-21T20:00:00-05:00', venue: 'BC Place, Vancouver' },
    { id: 41, group: 'G', team1: '🇪🇬 Egipto', team2: '🇮🇷 Irán', dateTime: '2026-06-26T22:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 42, group: 'G', team1: '🇳🇿 Nueva Zelanda', team2: '🇧🇪 Bélgica', dateTime: '2026-06-26T22:00:00-05:00', venue: 'BC Place, Vancouver' },

    // GRUPO H — España, Cabo Verde, Arabia Saudita, Uruguay
    { id: 43, group: 'H', team1: '🇪🇸 España', team2: '🇨🇻 Cabo Verde', dateTime: '2026-06-15T11:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 44, group: 'H', team1: '🇸🇦 Arabia Saudita', team2: '🇺🇾 Uruguay', dateTime: '2026-06-15T17:00:00-05:00', venue: 'Hard Rock Stadium, Miami Gardens' },
    { id: 45, group: 'H', team1: '🇪🇸 España', team2: '🇸🇦 Arabia Saudita', dateTime: '2026-06-21T11:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 46, group: 'H', team1: '🇺🇾 Uruguay', team2: '🇨🇻 Cabo Verde', dateTime: '2026-06-21T17:00:00-05:00', venue: 'Hard Rock Stadium, Miami Gardens' },
    { id: 47, group: 'H', team1: '🇺🇾 Uruguay', team2: '🇪🇸 España', dateTime: '2026-06-26T19:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 48, group: 'H', team1: '🇨🇻 Cabo Verde', team2: '🇸🇦 Arabia Saudita', dateTime: '2026-06-26T19:00:00-05:00', venue: 'NRG Stadium, Houston' },

    // GRUPO I — Francia, Senegal, Iraq, Noruega
    { id: 49, group: 'I', team1: '🇫🇷 Francia', team2: '🇸🇳 Senegal', dateTime: '2026-06-16T14:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },
    { id: 50, group: 'I', team1: '🇮🇶 Iraq', team2: '🇳🇴 Noruega', dateTime: '2026-06-16T17:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 51, group: 'I', team1: '🇫🇷 Francia', team2: '🇮🇶 Iraq', dateTime: '2026-06-22T16:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 52, group: 'I', team1: '🇳🇴 Noruega', team2: '🇸🇳 Senegal', dateTime: '2026-06-22T19:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },
    { id: 53, group: 'I', team1: '🇳🇴 Noruega', team2: '🇫🇷 Francia', dateTime: '2026-06-26T14:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 54, group: 'I', team1: '🇸🇳 Senegal', team2: '🇮🇶 Iraq', dateTime: '2026-06-26T14:00:00-05:00', venue: 'BMO Field, Toronto' },

    // GRUPO J — Argentina, Algeria, Austria, Jordania
    { id: 55, group: 'J', team1: '🇦🇷 Argentina', team2: '🇩🇿 Algeria', dateTime: '2026-06-16T20:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    { id: 56, group: 'J', team1: '🇦🇹 Austria', team2: '🇯🇴 Jordania', dateTime: '2026-06-16T23:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 57, group: 'J', team1: '🇦🇷 Argentina', team2: '🇦🇹 Austria', dateTime: '2026-06-22T12:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 58, group: 'J', team1: '🇯🇴 Jordania', team2: '🇩🇿 Algeria', dateTime: '2026-06-22T22:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 59, group: 'J', team1: '🇯🇴 Jordania', team2: '🇦🇷 Argentina', dateTime: '2026-06-27T21:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 60, group: 'J', team1: '🇩🇿 Algeria', team2: '🇦🇹 Austria', dateTime: '2026-06-27T21:00:00-05:00', venue: 'GEHA Field, Kansas City' },

    // GRUPO K — Portugal, Congo DR, Colombia, Uzbekistán
    { id: 61, group: 'K', team1: '🇺🇿 Uzbekistán', team2: '🇨🇴 Colombia', dateTime: '2026-06-17T21:00:00-05:00', venue: 'Estadio Banorte, Ciudad de México' },
    { id: 62, group: 'K', team1: '🇵🇹 Portugal', team2: '🇨🇩 Congo DR', dateTime: '2026-06-17T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 63, group: 'K', team1: '🇨🇴 Colombia', team2: '🇨🇩 Congo DR', dateTime: '2026-06-23T21:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 64, group: 'K', team1: '🇵🇹 Portugal', team2: '🇺🇿 Uzbekistán', dateTime: '2026-06-23T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 65, group: 'K', team1: '🇨🇴 Colombia', team2: '🇵🇹 Portugal', dateTime: '2026-06-27T18:30:00-05:00', venue: 'Hard Rock Stadium, Miami Gardens' },
    { id: 66, group: 'K', team1: '🇨🇩 Congo DR', team2: '🇺🇿 Uzbekistán', dateTime: '2026-06-27T18:30:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },

    // GRUPO L — Inglaterra, Croacia, Ghana, Panamá
    { id: 67, group: 'L', team1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', team2: '🇭🇷 Croacia', dateTime: '2026-06-17T15:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 68, group: 'L', team1: '🇬🇭 Ghana', team2: '🇵🇦 Panamá', dateTime: '2026-06-17T18:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 69, group: 'L', team1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', team2: '🇬🇭 Ghana', dateTime: '2026-06-23T15:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 70, group: 'L', team1: '🇵🇦 Panamá', team2: '🇭🇷 Croacia', dateTime: '2026-06-23T18:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 71, group: 'L', team1: '🇭🇷 Croacia', team2: '🇬🇭 Ghana', dateTime: '2026-06-27T16:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 72, group: 'L', team1: '🇵🇦 Panamá', team2: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', dateTime: '2026-06-27T16:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },
];

let matches = [];
let participants = [];
let results = [];
let liveScores = {};
let _livePollingInterval = null;

function stripFlag(name) {
    return name.replace(/^[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+/, '').trim();
}

async function fetchLiveScores() {
    const ESPN_TO_ES = {
        'Mexico': 'México', 'South Africa': 'Sudáfrica',
        'South Korea': 'Corea del Sur', 'Czechia': 'Chequia',
        'Canada': 'Canadá', 'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
        'Switzerland': 'Suiza', 'Qatar': 'Qatar',
        'United States': 'USA', 'Paraguay': 'Paraguay',
        'Australia': 'Australia', 'Sweden': 'Suecia',
        'Germany': 'Alemania', 'Curaçao': 'Curazao',
        'Ivory Coast': 'Costa de Marfil', 'Ecuador': 'Ecuador',
        'Netherlands': 'Países Bajos', 'Japan': 'Japón',
        'New Zealand': 'Nueva Zelanda', 'Tunisia': 'Túnez',
        'Belgium': 'Bélgica', 'Egypt': 'Egipto',
        'Iran': 'Irán', 'Saudi Arabia': 'Arabia Saudita',
        'Spain': 'España', 'Cape Verde': 'Cabo Verde',
        'Uruguay': 'Uruguay', 'Haiti': 'Haití',
        'France': 'Francia', 'Iraq': 'Iraq',
        'Senegal': 'Senegal', 'Norway': 'Noruega',
        'Argentina': 'Argentina', 'Algeria': 'Algeria',
        'Austria': 'Austria', 'Jordan': 'Jordania',
        'Uzbekistan': 'Uzbekistán', 'Panama': 'Panamá',
        'Portugal': 'Portugal', 'Congo DR': 'Congo DR',
        'England': 'Inglaterra', 'Croatia': 'Croacia',
        'Ghana': 'Ghana', 'Panama': 'Panamá',
        'Morocco': 'Marruecos', 'Colombia': 'Colombia',
        'Brazil': 'Brasil', 'Türkiye': 'Turquía',
        'Scotland': 'Escocia',
    };

    try {
        const res = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719'
        );
        if (!res.ok) { renderMatches(); renderLiveBar(); return; }
        const data = await res.json();
        const events = data.events || [];

        const STATUS_RANK = { 'FINISHED': 4, 'IN_PLAY': 3, 'PAUSED': 2, 'TIMED': 0, 'SCHEDULED': 0 };
        let changed = false;

        for (const event of events) {
            const comp = event.competitions?.[0];
            if (!comp) continue;
            const home = comp.competitors?.find(c => c.homeAway === 'home');
            const away = comp.competitors?.find(c => c.homeAway === 'away');
            if (!home || !away) continue;

            const homeEs = ESPN_TO_ES[home.team.displayName];
            const awayEs = ESPN_TO_ES[away.team.displayName];
            if (!homeEs || !awayEs) continue; // skip placeholders de fase eliminatoria

            const statusType = event.status?.type || {};
            const state = statusType.state;
            let ourStatus;
            if (state === 'post') ourStatus = 'FINISHED';
            else if (statusType.name === 'STATUS_HALFTIME') ourStatus = 'PAUSED';
            else if (state === 'in') ourStatus = 'IN_PLAY';
            else ourStatus = 'TIMED';

            const homeScore = parseInt(home.score) || 0;
            const awayScore = parseInt(away.score) || 0;
            const minute = event.status?.displayClock || '';

            const key = `${homeEs}|${awayEs}`;
            const existing = liveScores[key];
            const newRank = STATUS_RANK[ourStatus] ?? 0;
            const existRank = existing ? (STATUS_RANK[existing.status] ?? 0) : 0;

            // Si ESPN dice SCHEDULED (pre), limpiar cualquier dato incorrecto que pueda estar en memoria
            if (state === 'pre') {
                delete liveScores[key];
            } else {
                // Solo actualizar liveScores si el partido ya comenzó (evita datos falsos de ESPN en partidos futuros)
                const internalMatchForDisplay = matches.find(m =>
                    stripFlag(m.team1) === homeEs && stripFlag(m.team2) === awayEs
                );
                const kickoffPassedForDisplay = !internalMatchForDisplay || new Date(internalMatchForDisplay.dateTime) <= new Date();

                if (newRank >= existRank && kickoffPassedForDisplay) {
                    liveScores[key] = { home_team: homeEs, away_team: awayEs, home_score: homeScore, away_score: awayScore, status: ourStatus, minute };
                }
            }

            // Auto-guardar resultados finales con patrón individual (result:matchId)
            // Doble guard: ESPN STATUS_FULL_TIME + kickoff ya pasó (ESPN a veces pre-carga STATUS_FULL_TIME en partidos futuros)
            if (statusType.name === 'STATUS_FULL_TIME') {
                const internalMatch = matches.find(m =>
                    stripFlag(m.team1) === homeEs && stripFlag(m.team2) === awayEs
                );
                const kickoffPassed = internalMatch && new Date(internalMatch.dateTime) <= new Date();
                if (internalMatch && kickoffPassed && !results.find(r => r.matchId === internalMatch.id)) {
                    results.push({ matchId: internalMatch.id, score1: homeScore, score2: awayScore });
                    await storage.set(`result:${internalMatch.id}`, { matchId: internalMatch.id, score1: homeScore, score2: awayScore });
                    changed = true;
                    logAction(sessionStorage.getItem('pollaUser'), 'auto_save_result', {
                        matchId: internalMatch.id, home: homeEs, away: awayEs,
                        score: `${homeScore}-${awayScore}`
                    });
                }
            }
        }

        if (changed) {
            await init();
            showToast('✅ Resultados actualizados automáticamente');
        } else {
            renderMatches();
        }
        renderLiveBar();
    } catch (e) { console.warn('ESPN live scores error:', e); renderMatches(); renderLiveBar(); }
}

function renderLiveBar() {
    const bar = document.getElementById('liveBar');
    if (!bar) return;

    const now = new Date();
    const todayPE = now.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });

    const todayMatches = matches
        .filter(m => m.dateTime && new Date(m.dateTime).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }) === todayPE)
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if (todayMatches.length === 0) { bar.style.display = 'none'; return; }

    function teamLocal(full) {
        const name = stripFlag(full);
        const flag = full.slice(0, full.indexOf(name)).trim();
        return `${flag} ${name}`.trim();
    }
    function teamVisit(full) {
        const name = stripFlag(full);
        const flag = full.slice(0, full.indexOf(name)).trim();
        return `${name} ${flag}`.trim();
    }

    const sep = `<span class="live-bar-sep"> | </span>`;
    const items = todayMatches.map(m => {
        const key = `${stripFlag(m.team1)}|${stripFlag(m.team2)}`;
        const live = liveScores[key];
        const result = results.find(r => r.matchId === m.id);
        const t1 = teamLocal(m.team1);
        const t2 = teamVisit(m.team2);

        if (result) {
            return `<span style="color:#00D9FF;">${t1} vs ${t2} · ${result.score1}-${result.score2} FINAL</span>`;
        } else if (live && live.status === 'IN_PLAY') {
            return `<span style="color:#00FF88;"><span class="live-bar-label">🔴 En Vivo</span> ${t1} vs ${t2} · ⚽ ${live.home_score}-${live.away_score} · ${live.minute}</span>`;
        } else if (live && live.status === 'PAUSED') {
            return `<span style="color:#00FF88;">⏸ Descanso · ${t1} vs ${t2} · ${live.home_score}-${live.away_score}</span>`;
        } else {
            const timePE = new Date(m.dateTime).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' });
            return `<span class="live-bar-dim">${t1} vs ${t2} · ${timePE}</span>`;
        }
    });

    const content = items.join(sep);
    bar.innerHTML = `<div class="live-bar-track"><div class="live-bar-copy">${content}</div><div class="live-bar-copy" aria-hidden="true">${content}</div></div>`;
    bar.style.display = 'block';
}

function startLivePolling() {
    if (_livePollingInterval) clearInterval(_livePollingInterval);
    fetchLiveScores();
    _livePollingInterval = setInterval(fetchLiveScores, 60000);
}

function stopLivePolling() {
    if (_livePollingInterval) { clearInterval(_livePollingInterval); _livePollingInterval = null; }
}

// Convierte un dateTime ISO a hora Peru (America/Lima)
function formatPETime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }) + ' (PE)';
}

// Función para verificar si un partido está bloqueado (30 min antes del inicio)
function isMatchLocked(match) {
    if (!match.dateTime) return false;
    
    const now = new Date();
    const matchTime = new Date(match.dateTime);
    const lockTime = new Date(matchTime.getTime() - 1 * 60 * 1000); // 1 minuto antes
    
    return now >= lockTime;
}

// Función para formatear tiempo restante
function getTimeUntilLock(match) {
    if (!match.dateTime) return null;
    
    const now = new Date();
    const matchTime = new Date(match.dateTime);
    const lockTime = new Date(matchTime.getTime() - 1 * 60 * 1000);
    
    if (now >= lockTime) {
        return 'CERRADO';
    }
    
    const diff = lockTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
        return `Cierra en ${days}d ${hours}h`;
    } else if (hours > 0) {
        return `Cierra en ${hours}h ${minutes}m`;
    } else {
        return `Cierra en ${minutes}m`;
    }
}

// Deadline predicciones especiales: viernes 19 jun 2026, fin del día PE
const SPECIAL_DEADLINE = new Date('2026-06-20T00:00:00-05:00');

function isSpecialDeadlinePassed() {
    return new Date() >= SPECIAL_DEADLINE;
}

function initSpecialPredictions() {
    const username = sessionStorage.getItem('pollaUser');
    const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
    const me = participants.find(p => p.name === displayName);
    const sp = me?.specialPredictions;
    const alreadySaved = sp && (sp.champion || sp.runnerUp || sp.thirdPlace || sp.topScorer);
    const deadlinePassed = isSpecialDeadlinePassed();

    const btn = document.getElementById('saveSpecialBtn');
    const banner = document.getElementById('specialDeadlineBanner');
    const fields = ['predChampion', 'predRunnerUp', 'predThirdPlace', 'predTopScorer'];

    // Pre-llenar campos con datos guardados
    if (sp) {
        document.getElementById('predChampion').value = sp.champion || '';
        document.getElementById('predRunnerUp').value = sp.runnerUp || '';
        document.getElementById('predThirdPlace').value = sp.thirdPlace || '';
        document.getElementById('predTopScorer').value = sp.topScorer || '';
    }

    if (deadlinePassed) {
        // Bloquear todo, sin importar si guardó o no
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.disabled = true; el.style.opacity = '0.6'; }
        });
        if (btn) btn.style.display = 'none';
        if (banner) banner.innerHTML = `
            <div style="background:rgba(255,50,50,0.1);border:1px solid rgba(255,80,80,0.4);border-radius:10px;padding:12px 16px;margin-bottom:16px;color:#FF6B6B;font-size:0.88rem;">
                🔒 El plazo para predicciones especiales venció el viernes 19 de junio.
            </div>`;
    } else if (alreadySaved) {
        // Ya guardó — mostrar bloqueado con opción de editar hasta el deadline
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.disabled = true; el.style.opacity = '0.7'; }
        });
        if (btn) {
            btn.textContent = '✏️ Editar Predicciones Especiales';
            btn.onclick = () => unlockSpecialPredictions();
        }
        if (banner) banner.innerHTML = `
            <div style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.3);border-radius:10px;padding:12px 16px;margin-bottom:16px;color:#00FF88;font-size:0.88rem;">
                ✅ Predicciones especiales guardadas. Puedes editarlas hasta el <strong>viernes 19 de junio</strong>.
            </div>`;
    } else {
        // Nunca guardó — mostrar deadline
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.disabled = false; el.style.opacity = '1'; }
        });
        if (btn) {
            btn.textContent = '🏆 Guardar Predicciones Especiales';
            btn.onclick = saveSpecialPredictions;
            btn.disabled = false;
        }
        if (banner) {
            const msLeft = SPECIAL_DEADLINE - new Date();
            const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            banner.innerHTML = `
                <div style="background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.35);border-radius:10px;padding:12px 16px;margin-bottom:16px;color:#FFD700;font-size:0.88rem;">
                    ⏳ Tienes hasta el <strong>viernes 19 de junio</strong> para guardar.
                    Faltan <strong>${daysLeft > 0 ? daysLeft + 'd ' : ''}${hoursLeft}h</strong>.
                </div>`;
        }
    }
}

function unlockSpecialPredictions() {
    const fields = ['predChampion', 'predRunnerUp', 'predThirdPlace', 'predTopScorer'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.style.opacity = '1'; }
    });
    const btn = document.getElementById('saveSpecialBtn');
    if (btn) {
        btn.textContent = '🏆 Guardar Predicciones Especiales';
        btn.onclick = saveSpecialPredictions;
    }
}

async function saveSpecialPredictions() {
    if (isSpecialDeadlinePassed()) {
        showToast('🔒 El plazo venció el viernes 19 de junio');
        return;
    }

    const username = sessionStorage.getItem('pollaUser');
    const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
    if (!displayName) {
        showToast('⚠️ Registra tu nombre primero');
        return;
    }

    const champVal = document.getElementById('predChampion')?.value.trim();
    const runnerVal = document.getElementById('predRunnerUp')?.value.trim();
    const thirdVal  = document.getElementById('predThirdPlace')?.value.trim();
    const scorerVal = document.getElementById('predTopScorer')?.value.trim();

    if (!champVal && !runnerVal && !thirdVal && !scorerVal) {
        showToast('⚠️ Completa al menos un campo antes de guardar');
        return;
    }

    const existing = await storage.get(`participant:${displayName}`);
    const prevSpecial = existing?.specialPredictions || {};
    const specialPredictions = {
        champion:   champVal  || prevSpecial.champion   || '',
        runnerUp:   runnerVal || prevSpecial.runnerUp   || '',
        thirdPlace: thirdVal  || prevSpecial.thirdPlace || '',
        topScorer:  scorerVal || prevSpecial.topScorer  || ''
    };

    const participant = {
        ...(existing || { name: displayName, predictions: [] }),
        specialPredictions,
        username: sessionStorage.getItem('pollaUser'),
        timestamp: Date.now()
    };

    await storage.set(`participant:${displayName}`, participant);
    logAction(username, 'save_special', { display_name: displayName, specialPredictions });
    await init();
    showToast('✅ Predicciones especiales guardadas');
}

function renderGroups() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;

    const groupLetters = [...new Set(matches.filter(m => m.group && m.group.length === 1).map(m => m.group))].sort();
    let html = '';

    for (const groupLetter of groupLetters) {
        const groupMatches = matches.filter(m => m.group === groupLetter);
        const teamSet = new Set();
        groupMatches.forEach(m => { teamSet.add(m.team1); teamSet.add(m.team2); });

        const stats = {};
        for (const team of teamSet) {
            stats[team] = { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, form: [] };
        }

        const sortedMatches = [...groupMatches].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        for (const match of sortedMatches) {
            const result = results.find(r => r.matchId === match.id);
            if (!result) continue;
            const s1 = result.score1, s2 = result.score2;
            const t1 = match.team1, t2 = match.team2;
            stats[t1].pj++; stats[t2].pj++;
            stats[t1].gf += s1; stats[t1].gc += s2;
            stats[t2].gf += s2; stats[t2].gc += s1;
            if (s1 > s2) {
                stats[t1].g++; stats[t2].p++;
                stats[t1].form.push('G'); stats[t2].form.push('P');
            } else if (s1 < s2) {
                stats[t2].g++; stats[t1].p++;
                stats[t1].form.push('P'); stats[t2].form.push('G');
            } else {
                stats[t1].e++; stats[t2].e++;
                stats[t1].form.push('E'); stats[t2].form.push('E');
            }
        }

        const teams = Object.values(stats).map(s => ({
            ...s, pts: s.g * 3 + s.e, dg: s.gf - s.gc
        })).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);

        let rows = '';
        teams.forEach((t, idx) => {
            const dgStr = t.dg > 0 ? `+${t.dg}` : `${t.dg}`;
            const formCells = t.form.map(f => {
                if (f === 'G') return `<span style="background:#00FF88;color:#000;border-radius:4px;padding:1px 6px;font-weight:700;font-size:0.8rem;">G</span>`;
                if (f === 'E') return `<span style="background:#FFD700;color:#000;border-radius:4px;padding:1px 6px;font-weight:700;font-size:0.8rem;">E</span>`;
                return `<span style="background:#FF4444;color:#fff;border-radius:4px;padding:1px 6px;font-weight:700;font-size:0.8rem;">P</span>`;
            });
            while (formCells.length < 3) formCells.push('-');
            const name = stripFlag(t.team);
            const flag = t.team.replace(name, '').trim();
            rows += `<tr>
                <td><div class="team-name-cell">
                    <span class="team-position">${idx + 1}</span>
                    <span class="team-flag">${flag}</span>
                    <span>${name}</span>
                </div></td>
                <td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td>
                <td>${t.gf}</td><td>${t.gc}</td><td>${dgStr}</td>
                <td class="pts-cell">${t.pts}</td>
                <td class="results-cell">${formCells.join(' ')}</td>
            </tr>`;
        });

        html += `<div class="group-table-container">
            <div class="group-table-header">Grupo ${groupLetter}</div>
            <table class="group-standings-table">
                <thead><tr>
                    <th></th><th>PJ</th><th>G</th><th>E</th><th>P</th>
                    <th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>RESULTADOS</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    container.innerHTML = html;
}

// Evitar llamadas concurrentes a init()
let _initLock = false;

// Inicialización
async function init() {
    if (_initLock) return;
    _initLock = true;

    try {
        matches = defaultMatches;

        // Cargar participantes y resultados en paralelo — 2 queries simultáneas
        const [rawParticipants, rawResults] = await Promise.all([
            storage.getAll('participant:'),
            storage.getAll('result:')
        ]);

        // Deduplicar participantes y excluir admin
        const seen = new Set();
        participants = rawParticipants.filter(p => {
            if (!p || p.username === 'admin') return false;
            if (seen.has(p.name)) return false;
            seen.add(p.name);
            return true;
        });

        // Filtrar resultados válidos
        results = rawResults.filter(r => r && r.matchId !== undefined && r.score1 !== null && r.score2 !== null);

        // Fallback al array legacy si no hay claves individuales
        if (results.length === 0) {
            const savedResults = await storage.get('results');
            results = savedResults || [];
        }
    } finally {
        _initLock = false;
    }

    renderMatches();
    renderLiveBar();
    renderMyPredictions();
    renderResults();
    renderGroups();
    renderKnockoutBracket();
    renderKnockoutPredictions();
    updateLeaderboard();
    updateStats();
    initSpecialPredictions();
}

// Renderizar "Mis Predicciones" (solo lectura)
function renderMyPredictions() {
    const username = sessionStorage.getItem('pollaUser');
    const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
    const me = participants.find(p => p.name === displayName);
    const subtitle = document.getElementById('myPredictionsSubtitle');
    const container = document.getElementById('myPredictionsContainer');

    if (!me) {
        subtitle.textContent = 'Aún no has guardado predicciones.';
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>Ve a la pestaña Predicciones para registrar tus picks.</p></div>`;
        return;
    }

    const fmtDateTime = ts => new Date(ts).toLocaleString('es-PE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });
    const registeredAt = me.createdAt ? fmtDateTime(me.createdAt) : fmtDateTime(me.timestamp);
    const updatedAt = me.timestamp && me.createdAt && me.timestamp !== me.createdAt ? ` · Actualizado: ${fmtDateTime(me.timestamp)}` : '';
    const myStats = calculatePoints(me.predictions, results);
    const pointsText = myStats.points > 0 ? ` · 🏆 ${myStats.points} pts (${myStats.exact} exactos, ${myStats.tendency} tendencias)` : '';
    subtitle.textContent = `Registrado: ${registeredAt}${updatedAt}${pointsText}`;

    // Agrupar predicciones por grupo
    const grouped = {};
    matches.forEach(match => {
        const pred = me.predictions.find(p => p.matchId === match.id);
        if (!pred) return;
        if (!grouped[match.group]) grouped[match.group] = [];
        grouped[match.group].push({ match, pred });
    });

    let html = '';

    // Predicciones especiales
    if (me.specialPredictions) {
        const sp = me.specialPredictions;
        html += `
            <div style="background:rgba(0,217,255,0.05); border:1px solid rgba(0,217,255,0.2); border-radius:12px; padding:16px; margin-bottom:20px;">
                <h4 style="color:var(--primary); margin:0 0 12px; font-size:1rem;">🏆 Predicciones Especiales</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.88rem;">
                    <div><span style="color:#A0A8C0;">🥇 Campeón:</span> <strong>${sp.champion || '—'}</strong></div>
                    <div><span style="color:#A0A8C0;">🥈 Subcampeón:</span> <strong>${sp.runnerUp || '—'}</strong></div>
                    <div><span style="color:#A0A8C0;">🥉 Tercer puesto:</span> <strong>${sp.thirdPlace || '—'}</strong></div>
                    <div><span style="color:#A0A8C0;">⚽ Goleador:</span> <strong>${sp.topScorer || '—'}</strong></div>
                </div>
            </div>`;
    }

    Object.keys(grouped).sort().forEach(group => {
        html += `<h4 style="color:var(--primary); margin:16px 0 8px; font-size:0.95rem; letter-spacing:1px;">GRUPO ${group}</h4>`;
        grouped[group].forEach(({ match, pred }) => {
            const result = results.find(r => r.matchId === match.id);
            let pointsBadge = '';
            if (result && result.score1 !== null && result.score2 !== null) {
                const isExact = pred.score1 === result.score1 && pred.score2 === result.score2;
                const predOutcome = Math.sign(pred.score1 - pred.score2);
                const resOutcome = Math.sign(result.score1 - result.score2);
                const isTendency = !isExact && predOutcome === resOutcome;
                if (isExact) pointsBadge = `<span style="background:rgba(0,255,136,0.15);color:#00FF88;padding:3px 10px;border-radius:10px;font-size:0.8rem;font-weight:700;">+3 pts ✓</span>`;
                else if (isTendency) pointsBadge = `<span style="background:rgba(255,215,0,0.15);color:#FFD700;padding:3px 10px;border-radius:10px;font-size:0.8rem;font-weight:700;">+1 pt</span>`;
                else pointsBadge = `<span style="background:rgba(255,51,102,0.15);color:#FF3366;padding:3px 10px;border-radius:10px;font-size:0.8rem;font-weight:700;">0 pts</span>`;
            }

            const scoreBlock = result
                ? `<div style="text-align:center; min-width:80px;">
                       <div style="background:rgba(0,217,255,0.12);color:#00D9FF;padding:4px 12px;border-radius:8px;font-weight:700;font-size:1rem;">${result.score1} - ${result.score2}</div>
                       <div style="font-size:0.72rem;color:#A0A8C0;margin-top:3px;">tu pick: ${pred.score1}–${pred.score2}</div>
                   </div>`
                : `<div style="text-align:center; min-width:80px;">
                       <span style="background:rgba(0,217,255,0.08);color:#5A8FA8;padding:4px 12px;border-radius:8px;font-weight:700;font-size:1rem;border:1px dashed rgba(0,217,255,0.2);">${pred.score1} - ${pred.score2}</span>
                   </div>`;

            html += `
                <div class="pick-card">
                    <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:6px;">${formatPETime(match.dateTime)}</div>
                    <div class="pick-card-teams">
                        <span class="pick-team pick-team-left">${match.team1}</span>
                        ${scoreBlock}
                        <span class="pick-team pick-team-right">${match.team2}</span>
                    </div>
                    ${pointsBadge ? `<div class="pick-card-points">${pointsBadge}</div>` : ''}
                </div>`;
        });
    });

    container.innerHTML = html;
}

// Renderizar partidos para predicciones
function renderMatches() {
    const username = sessionStorage.getItem('pollaUser');
    const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
    const me = participants.find(p => p.name === displayName);
    const savedCount = me ? me.predictions.length : 0;

    const container = document.getElementById('matchesContainer');
    const stickyWrapper = document.getElementById('saveBtnStickyWrapper');

    document.getElementById('savedBanner')?.remove();
    if (savedCount > 0) {
        container.insertAdjacentHTML('beforebegin',
            `<div id="savedBanner" style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.3);border-radius:12px;padding:14px 18px;margin-bottom:20px;color:#00FF88;font-size:0.9rem;">
                ✅ Tienes <strong>${savedCount}</strong> predicciones guardadas. Puedes seguir completando las demás.
            </div>`
        );
    }

    document.getElementById('pendingBanner')?.remove();
    if (me) {
        const now = new Date();
        const nowPE = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
        const tomorrowPE = new Date(nowPE); tomorrowPE.setDate(tomorrowPE.getDate() + 1);
        const toDS = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const todayStr = toDS(nowPE);
        const tomorrowStr = toDS(tomorrowPE);

        const upcomingMatches = matches
            .filter(m => {
                if (!m.dateTime || isMatchLocked(m)) return false;
                const mPE = new Date(new Date(m.dateTime).toLocaleString('en-US', { timeZone: 'America/Lima' }));
                const mStr = toDS(mPE);
                return mStr === todayStr || mStr === tomorrowStr;
            })
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        if (upcomingMatches.length > 0) {
            const unpredicted = upcomingMatches.filter(m => !me.predictions.find(p => p.matchId === m.id));
            const capB = s => s.charAt(0).toUpperCase() + s.slice(1);
            const todayLabelB = capB(nowPE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' }));
            const tomorrowLabelB = capB(tomorrowPE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' }));
            let lastDayBanner = null;
            const items = upcomingMatches.map(m => {
                const hasPick = !!me.predictions.find(p => p.matchId === m.id);
                const mPE = new Date(new Date(m.dateTime).toLocaleString('en-US', { timeZone: 'America/Lima' }));
                const mDayStr = toDS(mPE);
                const isToday = mDayStr === todayStr;
                const rightSide = hasPick
                    ? `<span style="color:#00FF88;font-weight:700;white-space:nowrap;">✅ PICK</span>`
                    : `<span style="font-weight:700;white-space:nowrap;">⏰ ${getTimeUntilLock(m)}</span>`;

                let separator = '';
                if (mDayStr !== lastDayBanner) {
                    lastDayBanner = mDayStr;
                    const sepLabel = isToday ? 'HOY' : 'MAÑANA';
                    const sepDate = isToday ? todayLabelB : tomorrowLabelB;
                    separator = `<div style="display:flex;align-items:center;gap:6px;margin:${isToday ? '2px' : '10px'} 0 6px;padding-top:${isToday ? '0' : '6px'};">
                        <span style="font-weight:700;font-size:0.78rem;color:#FFA500;">${sepLabel}</span>
                        <span style="opacity:0.6;font-size:0.78rem;">· ${sepDate}</span>
                    </div>`;
                }

                return `${separator}
                    <div onclick="document.getElementById('match-card-${m.id}')?.scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('match-card-${m.id}')?.classList.add('match-highlight');setTimeout(()=>document.getElementById('match-card-${m.id}')?.classList.remove('match-highlight'),1500);"
                         style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 0 6px 8px;border-bottom:1px solid rgba(255,165,0,0.12);cursor:pointer;opacity:${hasPick ? '0.7' : '1'};">
                        <span>
                            ${m.team1} vs ${m.team2}
                            <span style="opacity:0.55;font-size:0.8rem;">· Grupo ${m.group}</span>
                        </span>
                        ${rightSide}
                    </div>`;
            }).join('');

            const totalGroupMatches = matches.filter(m => m.group !== undefined && m.group !== null).length;
            const isOpen = sessionStorage.getItem('pendingBannerOpen') !== 'false';
            const headerText = unpredicted.length > 0
                ? `⚠️ <strong>${unpredicted.length} partido${unpredicted.length > 1 ? 's' : ''} sin predecir hoy y mañana</strong>`
                : `✅ <strong>Todos los partidos de hoy y mañana predichos</strong>`;
            const progress = `<span style="opacity:0.6;font-size:0.82rem;">${savedCount}/${totalGroupMatches} completadas</span>`;

            container.insertAdjacentHTML('beforebegin',
                `<div id="pendingBanner" style="background:rgba(255,165,0,0.08);border:1px solid rgba(255,165,0,0.35);border-radius:12px;padding:12px 18px;margin-bottom:20px;color:#FFA500;font-size:0.9rem;">
                    <div onclick="(function(){const open=sessionStorage.getItem('pendingBannerOpen')!=='false';sessionStorage.setItem('pendingBannerOpen',open?'false':'true');const body=document.getElementById('pendingBannerBody');const arrow=document.getElementById('pendingBannerArrow');if(body)body.style.display=open?'none':'block';if(arrow)arrow.textContent=open?'▸':'▾';})()"
                         style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;gap:10px;">
                        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                            <span class="${unpredicted.length > 0 ? 'pending-banner-pulse' : ''}">${headerText}</span>
                            ${progress}
                        </div>
                        <span id="pendingBannerArrow" style="font-size:0.9rem;flex-shrink:0;">${isOpen ? '▾' : '▸'}</span>
                    </div>
                    <div id="pendingBannerBody" style="display:${isOpen ? 'block' : 'none'};margin-top:10px;">
                        ${items}
                    </div>
                </div>`
            );
        }
    }
    const predictionsActive = document.getElementById('predictions')?.classList.contains('active');
    if (stickyWrapper) stickyWrapper.style.display = predictionsActive ? 'flex' : 'none';

    const validMatches = matches.filter(m => m.group !== undefined && m.group !== null);
    const groupedMatches = {};
    validMatches.forEach(match => {
        if (!groupedMatches[match.group]) groupedMatches[match.group] = [];
        groupedMatches[match.group].push(match);
    });

    let html = '';
    Object.keys(groupedMatches).sort().forEach(group => {
        html += `
            <div class="group-predictions">
                <h4 class="group-predictions-title">Grupo ${group}</h4>
                ${groupedMatches[group].map(match => {
                    const savedPred = me ? me.predictions.find(p => p.matchId === match.id) : null;
                    const lockedByUser = !!savedPred;
                    const lockedByTime = isMatchLocked(match);
                    const locked = lockedByTime || lockedByUser;
                    const timeInfo = !locked ? getTimeUntilLock(match) : null;
                    const lockedClass = locked ? 'match-locked' : '';
                    const disabledAttr = locked ? 'disabled' : '';
                    const savedResult = results.find(r => r.matchId === match.id);
                    const msLeft = new Date(match.dateTime) - new Date();
                    const closingSoon = !locked && !savedResult && msLeft > 0 && msLeft < 48 * 60 * 60 * 1000;

                    const val1 = savedPred ? savedPred.score1 : '';
                    const val2 = savedPred ? savedPred.score2 : '';

                    const statusBadge = lockedByUser
                        ? '<span class="match-status-locked">🔒 TU PICK</span>'
                        : lockedByTime
                            ? '<span class="match-status-locked">🔒 CERRADO</span>'
                            : timeInfo
                                ? `<span class="match-status-open${closingSoon ? ' match-closing-soon' : ''}">⏰ ${timeInfo}</span>`
                                : '';

                    // Live score badge
                    const liveKey = `${stripFlag(match.team1)}|${stripFlag(match.team2)}`;
                    const live = liveScores[liveKey];
                    const matchStart = new Date(match.dateTime);
                    const now = new Date();
                    const minsSinceStart = (now - matchStart) / 60000;
                    const isInTimeWindow = minsSinceStart >= 0 && minsSinceStart < 130;
                    let liveBadge = '';
                    if (savedResult) {
                        liveBadge = `<span style="background:rgba(0,217,255,0.1); border:1px solid #00D9FF; color:#00D9FF; padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:700;">✅ ${savedResult.score1}-${savedResult.score2} · FINAL</span>`;
                    } else if (live && live.status === 'IN_PLAY') {
                        liveBadge = `<span style="background:rgba(0,255,136,0.15); border:1px solid #00FF88; color:#00FF88; padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:700; animation:pulse 1.5s infinite;">⚽ ${live.home_score}-${live.away_score} · ${live.minute || ''}' EN VIVO</span>`;
                    } else if (live && live.status === 'PAUSED') {
                        liveBadge = `<span style="background:rgba(255,215,0,0.15); border:1px solid #FFD700; color:#FFD700; padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:700;">⏸ ${live.home_score}-${live.away_score} · DESCANSO</span>`;
                    } else if (isInTimeWindow) {
                        const knownScore = (live && live.home_score !== null && live.away_score !== null)
                            ? ` ${live.home_score}-${live.away_score} ·` : '';
                        liveBadge = `<span style="background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.4); color:#00FF88; padding:4px 12px; border-radius:12px; font-size:0.8rem; font-weight:700; animation:pulse 1.5s infinite;">⚽${knownScore} EN CURSO</span>`;
                    }

                    return `
                    <div class="match-prediction ${lockedClass}" id="match-card-${match.id}">
                        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:4px;">
                            <span class="match-info" style="margin:0;">${formatPETime(match.dateTime)}</span>
                            ${statusBadge}
                            ${liveBadge}
                            <span class="match-info" style="margin:0 0 0 auto; white-space:nowrap;">📍 ${match.venue || ''}</span>
                        </div>
                        <div class="match-teams-row">
                            <div class="team-name team-name-left">${match.team1 || 'Equipo 1'}</div>
                            <input type="number" class="score-input" id="score1-${match.id}" min="0" max="20" value="${val1}" placeholder="-" ${disabledAttr}>
                            <input type="number" class="score-input" id="score2-${match.id}" min="0" max="20" value="${val2}" placeholder="-" ${disabledAttr}>
                            <div class="team-name team-name-right">${match.team2 || 'Equipo 2'}</div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    });

    container.innerHTML = html;
}

// Renderizar partidos para ingresar resultados
function renderResults() {
    const isAdmin = sessionStorage.getItem('pollaUser') === 'admin';
    const container = document.getElementById('resultsContainer');
    const saveBtn = document.getElementById('saveResultsBtn');
    if (saveBtn) saveBtn.style.display = isAdmin ? 'block' : 'none';

    const groupStandings = getGroupStandings();
    const bestThirds = computeBestThirds(groupStandings);

    function matchRow(id, name1, name2) {
        const result = results.find(r => r.matchId === id);
        const score1 = result ? result.score1 : '';
        const score2 = result ? result.score2 : '';
        if (isAdmin) {
            return `
                <div class="match-prediction">
                    <div class="team-name">${name1}</div>
                    <input type="number" class="score-input" id="result1-${id}" min="0" max="20" value="${score1}" placeholder="?">
                    <input type="number" class="score-input" id="result2-${id}" min="0" max="20" value="${score2}" placeholder="?">
                    <div class="team-name">${name2}</div>
                </div>`;
        }
        const s1 = score1 !== '' ? score1 : '-';
        const s2 = score2 !== '' ? score2 : '-';
        return `
            <div class="match-prediction">
                <div class="team-name">${name1}</div>
                <span class="score-display">${s1}</span>
                <span class="score-display">${s2}</span>
                <div class="team-name">${name2}</div>
            </div>`;
    }

    // Fase de grupos
    let html = matches.map(m => matchRow(m.id, m.team1, m.team2)).join('');

    // Fase eliminatoria — mostrar rondas que ya comenzaron o empiezan en las próximas 48h
    const now = new Date();
    for (const key of GROUPS_TAB_ROUNDS) {
        const round = BRACKET[key];
        const roundMatches = round.matches.filter(m => {
            const kickoff = new Date(m.dateTime);
            return (kickoff - now) / 3600000 <= 48;
        });
        if (roundMatches.length === 0) continue;

        html += `<h4 style="color:#00D9FF;font-family:'Bebas Neue',sans-serif;font-size:1.2rem;margin:20px 0 8px;letter-spacing:1px;">${round.emoji} ${round.title}</h4>`;
        html += roundMatches.map(m => {
            const r1 = resolveSlot(m.slot1, groupStandings, bestThirds);
            const r2 = resolveSlot(m.slot2, groupStandings, bestThirds);
            const name1 = (r1.team && r1.team !== m.slot1) ? r1.team : m.slot1;
            const name2 = (r2.team && r2.team !== m.slot2) ? r2.team : m.slot2;
            return matchRow(m.id, name1, name2);
        }).join('');
    }

    container.innerHTML = html;
}

// Guardar predicciones
async function submitPredictions() {
    const name = document.getElementById('participantName').value.trim();

    if (!name) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    // Fase de grupos: solo partidos con ambos scores ingresados y no bloqueados
    const newPredictions = matches
        .filter(match => {
            if (isMatchLocked(match)) return false;
            const s1 = document.getElementById(`score1-${match.id}`)?.value;
            const s2 = document.getElementById(`score2-${match.id}`)?.value;
            return s1 !== '' && s1 !== undefined && s2 !== '' && s2 !== undefined;
        })
        .map(match => ({
            matchId: match.id,
            score1: parseInt(document.getElementById(`score1-${match.id}`)?.value),
            score2: parseInt(document.getElementById(`score2-${match.id}`)?.value)
        }));

    // Fase eliminatoria: rondas desbloqueadas, partidos no bloqueados
    const groupStandings = getGroupStandings();
    const bestThirds = computeBestThirds(groupStandings);
    for (const key of PREDICTIONS_TAB_ROUNDS) {
        if (!_isRoundOpen(key, bestThirds)) continue;
        for (const match of BRACKET[key].matches) {
            const kicked = match.dateTime && new Date() >= new Date(match.dateTime) - 60000;
            if (kicked) continue;
            const s1 = document.getElementById(`ko-s1-${match.id}`)?.value;
            const s2 = document.getElementById(`ko-s2-${match.id}`)?.value;
            if (s1 !== '' && s1 !== undefined && s2 !== '' && s2 !== undefined) {
                newPredictions.push({ matchId: match.id, score1: parseInt(s1), score2: parseInt(s2) });
            }
        }
    }

    if (newPredictions.length === 0) {
        showToast('⚠️ Ingresa al menos 1 predicción antes de guardar');
        return;
    }

    // Cargar participante existente y hacer merge (no reemplazar picks ya guardados)
    const existingParticipant = await storage.get(`participant:${name}`);
    const existingPredictions = existingParticipant ? existingParticipant.predictions : [];

    const mergedPredictions = [...existingPredictions];
    newPredictions.forEach(np => {
        if (!mergedPredictions.find(p => p.matchId === np.matchId)) {
            mergedPredictions.push(np);
        }
    });

    // Preservar special predictions existentes sin tocarlas (tienen su propio botón)
    const participant = {
        name,
        username: sessionStorage.getItem('pollaUser'),
        predictions: mergedPredictions,
        specialPredictions: existingParticipant?.specialPredictions || {},
        createdAt: existingParticipant?.createdAt || Date.now(),
        timestamp: Date.now()
    };

    await storage.set(`participant:${name}`, participant);

    // Actualizar estado local sin recargar todo desde BD
    const idx = participants.findIndex(p => p.name === name);
    if (idx >= 0) participants[idx] = participant;
    else participants.push(participant);

    renderMatches();
    renderKnockoutPredictions();
    renderMyPredictions();
    updateLeaderboard();
    updateStats();

    showToast(`✅ ${newPredictions.length} predicción(es) guardadas para ${name}`);

    try {
        await db().from('polla_saves').insert({
            display_name: name,
            username: sessionStorage.getItem('pollaUser'),
            predictions: newPredictions,
            match_count: newPredictions.length
        });
    } catch (e) {
        console.warn('polla_saves insert error:', e);
    }

    logAction(sessionStorage.getItem('pollaUser'), 'save_predictions', {
        display_name: name,
        count: newPredictions.length,
        matches: newPredictions.map(p => ({ matchId: p.matchId, score: `${p.score1}-${p.score2}` }))
    });
}

// Guardar resultados reales → una clave por partido en polla_data (result:matchId)
// Nunca se puede borrar un resultado de otro partido accidentalmente
async function saveResults() {
    const inputResults = matches.map(match => {
        const score1Input = document.getElementById(`result1-${match.id}`);
        const score2Input = document.getElementById(`result2-${match.id}`);
        const score1 = score1Input?.value !== '' ? parseInt(score1Input.value) : null;
        const score2 = score2Input?.value !== '' ? parseInt(score2Input.value) : null;
        return { match, score1, score2 };
    }).filter(r => r.score1 !== null && r.score2 !== null);

    // También guardar resultados de fase eliminatoria
    for (const key of GROUPS_TAB_ROUNDS) {
        for (const match of BRACKET[key].matches) {
            const s1Input = document.getElementById(`result1-${match.id}`);
            const s2Input = document.getElementById(`result2-${match.id}`);
            if (!s1Input || !s2Input) continue;
            const score1 = s1Input.value !== '' ? parseInt(s1Input.value) : null;
            const score2 = s2Input.value !== '' ? parseInt(s2Input.value) : null;
            if (score1 !== null && score2 !== null) inputResults.push({ match, score1, score2 });
        }
    }

    if (inputResults.length === 0) {
        alert('No hay resultados para guardar.');
        return;
    }

    // Guardar cada resultado de forma independiente
    for (const { match, score1, score2 } of inputResults) {
        await storage.set(`result:${match.id}`, { matchId: match.id, score1, score2 });
    }

    logAction(sessionStorage.getItem('pollaUser'), 'save_results', {
        count: inputResults.length,
        results: inputResults.map(r => ({ matchId: r.match.id, score: `${r.score1}-${r.score2}` }))
    });

    alert('✅ Resultados guardados correctamente');
    await init();
}

// Calcular puntos
function calculatePoints(predictions, results) {
    let points = 0;
    let exact = 0;
    let tendency = 0;

    predictions.forEach(pred => {
        const result = results.find(r => r.matchId === pred.matchId);
        if (!result || result.score1 === null || result.score2 === null) return;

        // Resultado exacto: 3 puntos
        if (pred.score1 === result.score1 && pred.score2 === result.score2) {
            points += 3;
            exact++;
        }
        // Tendencia correcta (ganador o empate): 1 punto
        else {
            const predOutcome = Math.sign(pred.score1 - pred.score2);
            const resultOutcome = Math.sign(result.score1 - result.score2);
            
            if (predOutcome === resultOutcome) {
                points += 1;
                tendency++;
            }
        }
    });

    return { points, exact, tendency };
}

// Actualizar tabla de posiciones
function updateLeaderboard() {
    // Siempre mostrar todos los participantes, aunque no haya resultados
    const leaderboard = participants.map(p => {
        const stats = calculatePoints(p.predictions, results);
        return {
            name: p.name,
            ...stats
        };
    }).sort((a, b) => {
        // Ordenar por puntos, luego por exactos, luego por tendencia
        if (b.points !== a.points) return b.points - a.points;
        if (b.exact !== a.exact) return b.exact - a.exact;
        return b.tendency - a.tendency;
    });

    const container = document.getElementById('leaderboardBody');
    
    if (leaderboard.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <p>Aún no hay participantes registrados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = leaderboard.map((p, index) => {
        const participant = participants.find(pt => pt.name === p.name);
        const sp = participant?.specialPredictions || {};
        const specialCount = [sp.champion, sp.runnerUp, sp.thirdPlace, sp.topScorer].filter(v => v && v.trim()).length;
        return `
        <div class="leaderboard-row">
            <span class="rank rank-${index + 1}">${index + 1}</span>
            <span>${p.name}</span>
            <span class="points">${p.points}</span>
            <span>${p.exact}</span>
            <span>${p.tendency}</span>
            <span style="color:#FFD700; font-weight:600;">${specialCount}/4</span>
        </div>`;
    }).join('');
}

// Pronósticos públicos: visibles desde el inicio del partido
function renderAllPicks() {
    const container = document.getElementById('allPicksContainer');
    if (!container) return;

    try {
    const now = new Date();
    const groupStandingsAP = getGroupStandings();
    const bestThirdsAP = computeBestThirds(groupStandingsAP);

    // Incluir partidos de eliminatoria con nombres de equipo resueltos
    const knockoutMatchesAP = PREDICTIONS_TAB_ROUNDS.flatMap(key =>
        BRACKET[key].matches.map(m => {
            const r1 = resolveSlot(m.slot1, groupStandingsAP, bestThirdsAP);
            const r2 = resolveSlot(m.slot2, groupStandingsAP, bestThirdsAP);
            return {
                ...m,
                team1: (r1.team && r1.team !== m.slot1) ? r1.team : m.slot1,
                team2: (r2.team && r2.team !== m.slot2) ? r2.team : m.slot2,
            };
        })
    );

    const eligible = [...matches, ...knockoutMatchesAP]
        .filter(m => new Date(m.dateTime).getTime() < now.getTime())
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    if (eligible.length === 0) {
        container.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:24px;font-size:0.9rem;">
            Aún no hay partidos en curso. Los pronósticos se revelan al inicio de cada partido.
        </p>`;
        return;
    }

    // Bloque de especiales: se muestra solo cuando ya cerró el plazo
    let specialsHtml = '';
    if (now >= SPECIAL_DEADLINE) {
        const specialRows = participants.map(p => {
            const sp = p.specialPredictions || {};
            const fields = [
                { label: '🥇 Campeón',     value: sp.champion   },
                { label: '🥈 Subcampeón',  value: sp.runnerUp   },
                { label: '🥉 Tercer puesto', value: sp.thirdPlace },
                { label: '⚽ Goleador',    value: sp.topScorer  },
            ];
            const cells = fields.map(f =>
                `<td style="padding:8px 10px;text-align:center;font-size:0.85rem;">${f.value && f.value.trim() ? f.value : '<span style="color:var(--text-dim);">—</span>'}</td>`
            ).join('');
            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:8px 14px;">${p.name}</td>
                ${cells}
            </tr>`;
        }).join('');

        specialsHtml = `
        <details style="margin-bottom:10px;border:1px solid rgba(255,215,0,0.3);border-radius:12px;overflow:hidden;">
            <summary style="padding:13px 18px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;background:rgba(255,215,0,0.05);user-select:none;">
                <span style="font-size:0.95rem;font-weight:600;color:#FFD700;">⭐ Predicciones Especiales</span>
                <span style="margin-left:auto;color:var(--text-dim);font-size:0.8rem;">Plazo cerrado</span>
            </summary>
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;min-width:420px;">
                <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08);color:var(--text-dim);font-size:0.82rem;">
                    <th style="padding:8px 14px;text-align:left;font-weight:500;">Participante</th>
                    <th style="padding:8px 10px;text-align:center;font-weight:500;">🥇 Campeón</th>
                    <th style="padding:8px 10px;text-align:center;font-weight:500;">🥈 Subcampeón</th>
                    <th style="padding:8px 10px;text-align:center;font-weight:500;">🥉 3er puesto</th>
                    <th style="padding:8px 10px;text-align:center;font-weight:500;">⚽ Goleador</th>
                </tr></thead>
                <tbody>${specialRows}</tbody>
            </table>
            </div>
        </details>`;
    } else {
        const msLeft = SPECIAL_DEADLINE - now;
        const daysLeft  = Math.floor(msLeft / 86400000);
        const hoursLeft = Math.floor((msLeft % 86400000) / 3600000);
        specialsHtml = `
        <div style="border:1px solid rgba(255,215,0,0.2);border-radius:12px;padding:14px 18px;background:rgba(255,215,0,0.04);color:var(--text-dim);font-size:0.88rem;margin-bottom:10px;">
            ⭐ <strong style="color:#FFD700;">Predicciones Especiales</strong> — se revelan cuando cierre el plazo
            <span style="margin-left:8px;">⏳ ${daysLeft}d ${hoursLeft}h restantes</span>
        </div>`;
    }

    container.innerHTML = specialsHtml + eligible.map(match => {
        const result = results.find(r => r.matchId === match.id);

        const rows = participants.map(p => {
            const pred = p.predictions.find(pr => pr.matchId === match.id);
            let badge = '<span style="color:var(--text-dim);">—</span>';
            let rowBg = '';
            if (pred && result) {
                if (pred.score1 === result.score1 && pred.score2 === result.score2) {
                    badge = '<span style="color:#00FF88;font-weight:700;">✅ Exacto</span>';
                    rowBg = 'background:rgba(0,255,136,0.06);';
                } else if (Math.sign(pred.score1 - pred.score2) === Math.sign(result.score1 - result.score2)) {
                    badge = '<span style="color:#FFD700;font-weight:700;">↗ Tendencia</span>';
                    rowBg = 'background:rgba(255,215,0,0.05);';
                } else {
                    badge = '<span style="color:#FF6B6B;">✗ Fallido</span>';
                }
            } else if (pred) {
                badge = '<span style="color:var(--text-dim);font-size:0.8rem;">en juego</span>';
            }
            return `<tr style="${rowBg}border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:9px 14px;">${p.name}</td>
                <td style="padding:9px 14px;text-align:center;font-weight:700;font-size:1.05rem;letter-spacing:1px;">
                    ${pred ? `${pred.score1} - ${pred.score2}` : '<span style="color:var(--text-dim);">sin pick</span>'}
                </td>
                <td style="padding:9px 14px;text-align:center;">${badge}</td>
            </tr>`;
        }).join('');

        const resultTag = result
            ? `<span style="color:#00D9FF;font-weight:700;margin-left:8px;">· ${result.score1}-${result.score2} FINAL</span>`
            : '';

        return `<details style="margin-bottom:10px;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;">
            <summary style="padding:13px 18px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.03);user-select:none;">
                <span style="font-size:0.95rem;font-weight:600;">${match.team1} <span style="color:var(--text-dim);">vs</span> ${match.team2}</span>
                ${resultTag}
                <span style="margin-left:auto;color:var(--text-dim);font-size:0.8rem;white-space:nowrap;">${formatPETime(match.dateTime)}</span>
            </summary>
            <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08);color:var(--text-dim);font-size:0.82rem;">
                    <th style="padding:8px 14px;text-align:left;font-weight:500;">Participante</th>
                    <th style="padding:8px 14px;text-align:center;font-weight:500;">Pronóstico</th>
                    <th style="padding:8px 14px;text-align:center;font-weight:500;">Resultado</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </details>`;
    }).join('');
    } catch (e) {
        container.innerHTML = `<p style="color:#FF6B6B;padding:16px;">Error al cargar pronósticos: ${e.message}</p>`;
        console.error('renderAllPicks error:', e);
    }
}

// Actualizar estadísticas
function updateStats() {
    const username = sessionStorage.getItem('pollaUser');
    const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
    const me = participants.find(p => p.name === displayName);
    const myStats = me ? calculatePoints(me.predictions, results) : { points: 0, exact: 0, tendency: 0 };

    const allScores = participants.map(p => calculatePoints(p.predictions, results).points);
    const myRank = [...allScores].sort((a, b) => b - a).indexOf(myStats.points) + 1;

    document.getElementById('totalParticipants').textContent = participants.length;
    document.getElementById('totalPredictions').textContent = me ? me.predictions.filter(p => !p.locked).length : 0;
    document.getElementById('avgScore').textContent = myStats.points;
    document.getElementById('topScore').textContent = myStats.exact;

    const rankEl = document.getElementById('myRank');
    if (rankEl) rankEl.textContent = me ? `#${myRank}` : '-';

    renderCharts(displayName);
    renderAllPicks();
}

// Renderizar gráficos
function renderCharts(myDisplayName) {
    const participantData = participants.map(p => ({
        name: p.name,
        ...calculatePoints(p.predictions, results)
    })).sort((a, b) => b.points - a.points);

    // Colores: resaltar al usuario actual
    const barColors = participantData.map(p =>
        p.name === myDisplayName ? 'rgba(0, 217, 255, 1)' : 'rgba(0, 217, 255, 0.3)'
    );
    const borderColors = participantData.map(p =>
        p.name === myDisplayName ? 'rgba(0, 217, 255, 1)' : 'rgba(0, 217, 255, 0.5)'
    );

    // Gráfico de distribución de puntos
    const pointsCtx = document.getElementById('pointsChart');
    if (pointsCtx) {
        if (window.pointsChart && typeof window.pointsChart.destroy === 'function') {
            window.pointsChart.destroy();
        }
        window.pointsChart = new Chart(pointsCtx, {
            type: 'bar',
            data: {
                labels: participantData.map(p => p.name),
                datasets: [{
                    label: 'Puntos Totales',
                    data: participantData.map(p => p.points),
                    backgroundColor: barColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#A0A8C0' },
                        grid: { color: 'rgba(160, 168, 192, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#A0A8C0' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Gráfico de exactitud
    const accuracyCtx = document.getElementById('accuracyChart');
    if (accuracyCtx) {
        if (window.accuracyChart && typeof window.accuracyChart.destroy === 'function') {
            window.accuracyChart.destroy();
        }
        const donutColors = [
            'rgba(0, 217, 255, 0.9)',
            'rgba(255, 51, 102, 0.8)',
            'rgba(255, 215, 0, 0.8)',
            'rgba(0, 255, 136, 0.8)',
            'rgba(102, 126, 234, 0.8)'
        ];
        window.accuracyChart = new Chart(accuracyCtx, {
            type: 'doughnut',
            data: {
                labels: participantData.map(p => p.name),
                datasets: [{
                    label: 'Resultados Exactos',
                    data: participantData.map(p => p.exact),
                    backgroundColor: donutColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#A0A8C0', padding: 20 }
                    }
                }
            }
        });
    }
}

// Cambiar de pestaña
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    event.target.closest('.tab-btn').classList.add('active');

    const stickyWrapper = document.getElementById('saveBtnStickyWrapper');
    if (tabName === 'predictions') {
        renderMatches();
    } else {
        if (stickyWrapper) stickyWrapper.style.display = 'none';
    }

    if (tabName === 'stats') {
        const username = sessionStorage.getItem('pollaUser');
        const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
        setTimeout(() => renderCharts(displayName), 100);
        renderAllPicks();
    }
    if (tabName === 'myPredictions') {
        renderMyPredictions();
    }
    if (tabName === 'groups') {
        renderKnockoutBracket();
    }
    if (tabName === 'predictions') {
        renderKnockoutPredictions();
    }
}

// Mostrar popup de partidos de hoy y mañana
function showTodayMatches() {
    const nowPE = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const tomorrowPE = new Date(nowPE);
    tomorrowPE.setDate(tomorrowPE.getDate() + 1);

    const toDateStr = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const todayStr = toDateStr(nowPE);
    const tomorrowStr = toDateStr(tomorrowPE);

    const todayMatches = matches.filter(m => {
        if (!m.dateTime) return false;
        const matchPE = new Date(new Date(m.dateTime).toLocaleString('en-US', { timeZone: 'America/Lima' }));
        const matchStr = toDateStr(matchPE);
        return matchStr === todayStr || matchStr === tomorrowStr;
    }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if (todayMatches.length === 0) return;

    const dateLabel = nowPE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
    document.getElementById('todayDateLabel').textContent = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    const username = sessionStorage.getItem('pollaUser');
    const displayName = localStorage.getItem(`pollaDisplayName:${username}`);
    const me = participants.find(p => p.name === displayName);

    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const todayLabel = cap(nowPE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' }));
    const tomorrowLabel = cap(tomorrowPE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' }));

    let lastDayModal = null;
    document.getElementById('todayMatchesList').innerHTML = todayMatches.map(match => {
        const locked = isMatchLocked(match);
        const hasPick = me?.predictions?.find(p => p.matchId === match.id);
        const timeInfo = getTimeUntilLock(match);
        const matchTimePE = new Date(match.dateTime).toLocaleString('es-PE', {
            timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true
        });
        const matchDayStr = toDateStr(new Date(new Date(match.dateTime).toLocaleString('en-US', { timeZone: 'America/Lima' })));
        const isToday = matchDayStr === todayStr;

        const statusBadge = locked
            ? `<span style="background:rgba(255,51,102,0.15); color:#FF3366; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600;">🔒 CERRADO</span>`
            : hasPick
                ? `<span style="background:rgba(0,255,136,0.12); color:#00FF88; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600;">✅ PICK</span>`
                : timeInfo
                    ? `<span style="background:rgba(0,217,255,0.1); color:#00D9FF; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600;">⏰ ${timeInfo}</span>`
                    : '';

        let separator = '';
        if (matchDayStr !== lastDayModal) {
            lastDayModal = matchDayStr;
            const sepColor = isToday ? '#00D9FF' : '#A0A8C0';
            const sepLabel = isToday ? 'HOY' : 'MAÑANA';
            const sepDate = isToday ? todayLabel : tomorrowLabel;
            separator = `<div style="display:flex;align-items:center;gap:8px;margin:${isToday ? '0' : '16px'} 0 10px;">
                <span style="color:${sepColor};font-weight:700;font-size:0.78rem;">${sepLabel}</span>
                <span style="color:${sepColor};opacity:0.7;font-size:0.78rem;">· ${sepDate}</span>
                <div style="flex:1;height:1px;background:rgba(${isToday ? '0,217,255' : '160,168,192'},0.2);"></div>
            </div>`;
        }

        return `${separator}
            <div style="background:rgba(255,255,255,0.04); border:1px solid ${hasPick ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.07)'}; border-radius:12px; padding:14px 16px; margin-bottom:10px; opacity:${hasPick ? '0.75' : '1'};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="color:#A0A8C0; font-size:0.8rem;">🕐 ${matchTimePE} PE · Grupo ${match.group}</span>
                    ${statusBadge}
                </div>
                <div style="display:flex; align-items:center; justify-content:center; gap:12px; font-size:0.95rem; font-weight:600; color:#fff;">
                    <span>${match.team1}</span>
                    <span style="color:#A0A8C0; font-size:0.8rem;">vs</span>
                    <span>${match.team2}</span>
                </div>
                <div style="color:#A0A8C0; font-size:0.78rem; text-align:center; margin-top:6px;">📍 ${match.venue}</div>
            </div>`;
    }).join('');

    const modal = document.getElementById('todayMatchesModal');
    modal.style.display = 'flex';
}

function closeTodayModal() {
    document.getElementById('todayMatchesModal').style.display = 'none';
}

// Iniciar aplicación
init();
// ==========================================
// BRACKET ELIMINATORIO — datos y lógica
// ==========================================

const BRACKET = {
    r32: {
        key: 'r32',
        emoji: '⚔️',
        title: 'Dieciseisavos de Final',
        subtitle: '16 partidos · 28 jun – 3 jul',
        startDate: '28 JUN',
        accentBorder: 'rgba(0,217,255,0.35)',
        matches: [
            // 28 junio
            { id: 'P73',  dateTime: '2026-06-28T19:00:00Z', slot1: '2° Grupo A', slot2: '2° Grupo B',             time: '28 jun · 2:00 PM PE',  venue: 'SoFi Stadium, Los Ángeles' },
            // 29 junio
            { id: 'P76',  dateTime: '2026-06-29T17:00:00Z', slot1: '1° Grupo C', slot2: '2° Grupo F',             time: '29 jun · 12:00 PM PE', venue: 'NRG Stadium, Houston' },
            { id: 'P74',  dateTime: '2026-06-29T20:30:00Z', slot1: '1° Grupo E', slot2: 'Mejor 3° (A/B/C/D/F)',   time: '29 jun · 3:30 PM PE',  venue: 'Gillette Stadium, Boston' },
            { id: 'P75',  dateTime: '2026-06-30T01:00:00Z', slot1: '1° Grupo F', slot2: '2° Grupo C',             time: '29 jun · 8:00 PM PE',  venue: 'Estadio BBVA, Guadalupe' },
            // 30 junio
            { id: 'P78',  dateTime: '2026-06-30T17:00:00Z', slot1: '2° Grupo E', slot2: '2° Grupo I',             time: '30 jun · 12:00 PM PE', venue: 'AT&T Stadium, Arlington' },
            { id: 'P77',  dateTime: '2026-06-30T21:00:00Z', slot1: '1° Grupo I', slot2: 'Mejor 3° (C/D/F/G/H)',   time: '30 jun · 4:00 PM PE',  venue: 'MetLife Stadium, Nueva Jersey' },
            { id: 'P79',  dateTime: '2026-07-01T01:00:00Z', slot1: '1° Grupo A', slot2: 'Mejor 3° (C/E/F/H/I)',   time: '30 jun · 8:00 PM PE',  venue: 'Estadio Azteca, Ciudad de México' },
            // 1 julio
            { id: 'P80',  dateTime: '2026-07-01T16:00:00Z', slot1: '1° Grupo L', slot2: 'Mejor 3° (E/H/I/J/K)',   time: '1 jul · 11:00 AM PE',  venue: 'Mercedes-Benz Stadium, Atlanta' },
            { id: 'P82',  dateTime: '2026-07-01T20:00:00Z', slot1: '1° Grupo G', slot2: 'Mejor 3° (A/E/H/I/J)',   time: '1 jul · 3:00 PM PE',   venue: 'Lumen Field, Seattle' },
            { id: 'P81',  dateTime: '2026-07-02T00:00:00Z', slot1: '1° Grupo D', slot2: 'Mejor 3° (B/E/I)',       time: '1 jul · 7:00 PM PE',   venue: "Levi's Stadium, Santa Clara" },
            // 2 julio
            { id: 'P84',  dateTime: '2026-07-02T19:00:00Z', slot1: '1° Grupo H', slot2: '2° Grupo J',             time: '2 jul · 2:00 PM PE',   venue: 'SoFi Stadium, Los Ángeles' },
            { id: 'P83',  dateTime: '2026-07-02T23:00:00Z', slot1: '2° Grupo K', slot2: '2° Grupo L',             time: '2 jul · 6:00 PM PE',   venue: 'BMO Field, Toronto' },
            { id: 'P85',  dateTime: '2026-07-03T03:00:00Z', slot1: '1° Grupo B', slot2: 'Mejor 3° (E/F/G/I/J)',   time: '2 jul · 10:00 PM PE',  venue: 'BC Place, Vancouver' },
            // 3 julio
            { id: 'P88',  dateTime: '2026-07-03T18:00:00Z', slot1: '2° Grupo D', slot2: '2° Grupo G',             time: '3 jul · 1:00 PM PE',   venue: 'AT&T Stadium, Arlington' },
            { id: 'P86',  dateTime: '2026-07-03T22:00:00Z', slot1: '1° Grupo J', slot2: '2° Grupo H',             time: '3 jul · 5:00 PM PE',   venue: 'Hard Rock Stadium, Miami' },
            { id: 'P87',  dateTime: '2026-07-04T01:30:00Z', slot1: '1° Grupo K', slot2: 'Mejor 3° (D/E/I/J/L)',   time: '3 jul · 8:30 PM PE',   venue: 'Arrowhead Stadium, Kansas City' },
        ]
    },
    r16: {
        key: 'r16',
        emoji: '⚔️',
        title: 'Octavos de Final',
        subtitle: '8 partidos · 4 – 7 jul',
        startDate: '4 JUL',
        accentBorder: 'rgba(0,217,255,0.55)',
        matches: [
            { id: 'P90',  dateTime: '2026-07-04T17:00:00Z', slot1: 'Gan. P73', slot2: 'Gan. P75', time: '4 jul · 12:00 PM PE', venue: 'NRG Stadium, Houston' },
            { id: 'P89',  dateTime: '2026-07-04T21:00:00Z', slot1: 'Gan. P74', slot2: 'Gan. P77', time: '4 jul · 4:00 PM PE',  venue: 'Lincoln Financial Field, Filadelfia' },
            { id: 'P91',  dateTime: '2026-07-05T20:00:00Z', slot1: 'Gan. P76', slot2: 'Gan. P78', time: '5 jul · 3:00 PM PE',  venue: 'MetLife Stadium, Nueva Jersey' },
            { id: 'P92',  dateTime: '2026-07-06T00:00:00Z', slot1: 'Gan. P79', slot2: 'Gan. P80', time: '5 jul · 7:00 PM PE',  venue: 'Estadio Azteca, Ciudad de México' },
            { id: 'P93',  dateTime: '2026-07-06T19:00:00Z', slot1: 'Gan. P83', slot2: 'Gan. P84', time: '6 jul · 2:00 PM PE',  venue: 'AT&T Stadium, Arlington' },
            { id: 'P94',  dateTime: '2026-07-07T00:00:00Z', slot1: 'Gan. P81', slot2: 'Gan. P82', time: '6 jul · 7:00 PM PE',  venue: 'Lumen Field, Seattle' },
            { id: 'P95',  dateTime: '2026-07-07T16:00:00Z', slot1: 'Gan. P86', slot2: 'Gan. P88', time: '7 jul · 11:00 AM PE', venue: 'Mercedes-Benz Stadium, Atlanta' },
            { id: 'P96',  dateTime: '2026-07-07T20:00:00Z', slot1: 'Gan. P85', slot2: 'Gan. P87', time: '7 jul · 3:00 PM PE',  venue: 'BC Place, Vancouver' },
        ]
    },
    qf: {
        key: 'qf',
        emoji: '🛡️',
        title: 'Cuartos de Final',
        subtitle: '4 partidos · 9 – 11 jul',
        startDate: '9 JUL',
        accentBorder: 'rgba(0,255,136,0.5)',
        matches: [
            { id: 'P97',  dateTime: '2026-07-09T20:00:00Z', slot1: 'Gan. P89', slot2: 'Gan. P90', time: '9 jul · 3:00 PM PE',   venue: 'Gillette Stadium, Boston' },
            { id: 'P98',  dateTime: '2026-07-10T19:00:00Z', slot1: 'Gan. P93', slot2: 'Gan. P94', time: '10 jul · 2:00 PM PE',  venue: 'SoFi Stadium, Los Ángeles' },
            { id: 'P99',  dateTime: '2026-07-11T21:00:00Z', slot1: 'Gan. P91', slot2: 'Gan. P92', time: '11 jul · 4:00 PM PE',  venue: 'Hard Rock Stadium, Miami' },
            { id: 'P100', dateTime: '2026-07-12T01:00:00Z', slot1: 'Gan. P95', slot2: 'Gan. P96', time: '11 jul · 8:00 PM PE',  venue: 'Arrowhead Stadium, Kansas City' },
        ]
    },
    sf: {
        key: 'sf',
        emoji: '🔥',
        title: 'Semifinales',
        subtitle: '2 partidos · 14 – 15 jul',
        startDate: '14 JUL',
        accentBorder: 'rgba(255,51,102,0.55)',
        matches: [
            { id: 'P101', dateTime: '2026-07-14T19:00:00Z', slot1: 'Gan. P97',  slot2: 'Gan. P98',  time: '14 jul · 2:00 PM PE', venue: 'AT&T Stadium, Arlington' },
            { id: 'P102', dateTime: '2026-07-15T19:00:00Z', slot1: 'Gan. P99',  slot2: 'Gan. P100', time: '15 jul · 2:00 PM PE', venue: 'Mercedes-Benz Stadium, Atlanta' },
        ]
    },
    third: {
        key: 'third',
        emoji: '🥉',
        title: 'Tercer Puesto',
        subtitle: '1 partido · 18 jul',
        startDate: '18 JUL',
        accentBorder: 'rgba(180,140,80,0.6)',
        matches: [
            { id: 'P103', dateTime: '2026-07-18T21:00:00Z', slot1: 'Perd. P101', slot2: 'Perd. P102', time: '18 jul · 4:00 PM PE', venue: 'Hard Rock Stadium, Miami' },
        ]
    },
    final: {
        key: 'final',
        emoji: '🏆',
        title: 'Gran Final',
        subtitle: '1 partido · 19 jul · MetLife Stadium',
        startDate: '19 JUL',
        accentBorder: 'rgba(255,215,0,0.7)',
        isFinal: true,
        matches: [
            { id: 'P104', dateTime: '2026-07-19T19:00:00Z', slot1: 'Gan. P101', slot2: 'Gan. P102', time: '19 jul · 2:00 PM PE', venue: 'MetLife Stadium, Nueva Jersey' },
        ]
    }
};

const GROUPS_TAB_ROUNDS     = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];
const PREDICTIONS_TAB_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'third', 'final'];

// Calcula standings de cada grupo desde results[] globales
function getGroupStandings() {
    const groupLetters = [...new Set(
        matches.filter(m => m.group && m.group.length === 1).map(m => m.group)
    )].sort();

    const standings = {};
    for (const g of groupLetters) {
        const gMatches = matches.filter(m => m.group === g);
        const stats = {};
        gMatches.forEach(m => {
            [m.team1, m.team2].forEach(t => {
                if (!stats[t]) stats[t] = { team: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0 };
            });
        });
        gMatches.forEach(m => {
            const r = results.find(r => r.matchId === m.id);
            if (!r) return;
            stats[m.team1].pj++; stats[m.team2].pj++;
            stats[m.team1].gf += r.score1; stats[m.team1].gc += r.score2;
            stats[m.team2].gf += r.score2; stats[m.team2].gc += r.score1;
            if (r.score1 > r.score2) { stats[m.team1].g++; stats[m.team2].p++; }
            else if (r.score1 < r.score2) { stats[m.team2].g++; stats[m.team1].p++; }
            else { stats[m.team1].e++; stats[m.team2].e++; }
        });
        standings[g] = Object.values(stats).map(s => ({
            ...s, pts: s.g * 3 + s.e, dg: s.gf - s.gc
        })).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.gc - b.gc);
    }
    return standings;
}

// Selecciona y asigna los 8 mejores terceros con greedy
function computeBestThirds(groupStandings) {
    const thirds = [];
    for (const [g, teams] of Object.entries(groupStandings)) {
        const third = teams[2];
        if (third && third.pj > 0) thirds.push({ ...third, group: g });
    }
    // Sort: pts desc → DG desc → GF desc → GC asc (menos goles concedidos es mejor)
    thirds.sort((a, b) =>
        b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.gc - b.gc
    );
    const best8 = thirds.slice(0, 8);

    // Todos los grupos terminados (6 partidos c/u)
    const allDone = Object.keys(groupStandings).length === 12 &&
        Object.entries(groupStandings).every(([g, teams]) => {
            const gMatches = matches.filter(m => m.group === g);
            return gMatches.every(m => results.find(r => r.matchId === m.id));
        });

    // Obtener todos los slots "Mejor 3°" en orden de bracket
    const mejorSlots = [];
    for (const match of BRACKET.r32.matches) {
        [match.slot1, match.slot2].forEach(s => {
            if (s.startsWith('Mejor 3°') && !mejorSlots.includes(s)) mejorSlots.push(s);
        });
    }

    // Asignación greedy
    const slotMap = {};
    const used = new Set();
    for (const slot of mejorSlots) {
        const m = slot.match(/\(([^)]+)\)/);
        if (!m) continue;
        const groups = m[1].split('/');
        const best = best8.find(t => !used.has(t.group) && groups.includes(t.group));
        if (best) { slotMap[slot] = best; used.add(best.group); }
    }

    return { best8, allDone, slotMap };
}

// Resuelve un slot a { team, badge }
function resolveSlot(slot, groupStandings, bestThirds) {
    // "Mejor 3° (A/B/C/D)"
    if (slot.startsWith('Mejor 3°')) {
        const assigned = bestThirds?.slotMap?.[slot];
        if (assigned) {
            const badge = bestThirds.allDone
                ? '<span class="ko-badge-clasif">✓ CLASIF.</span>'
                : '<span class="ko-badge-probable">~ PROBABLE</span>';
            return { team: assigned.team, badge };
        }
        return { team: slot, badge: '' };
    }

    // "1° Grupo A" / "2° Grupo A"
    const gm = slot.match(/^(\d+)°\s*Grupo\s*([A-L])$/);
    if (gm && groupStandings) {
        const rank  = parseInt(gm[1]) - 1;
        const group = gm[2];
        const teams = groupStandings[group];
        if (teams && teams[rank] && teams[rank].pj > 0) {
            const t = teams[rank];
            const gMatches = matches.filter(m => m.group === group);
            const played   = gMatches.filter(m => results.find(r => r.matchId === m.id)).length;
            const done     = played === gMatches.length;
            const badge = done
                ? '<span class="ko-badge-clasif">✓ CLASIF.</span>'
                : '<span class="ko-badge-probable">~ PROBABLE</span>';
            return { team: t.team, badge };
        }
    }

    // "Gan. P73" / "Perd. P101" — pasa como texto
    return { team: slot, badge: '' };
}

// ── Toggle colapsable ──────────────────────────────────────────────────────
function toggleKnockoutRound(key) {
    const body  = document.getElementById(`kp-body-${key}`);
    const arrow = document.getElementById(`kp-arrow-${key}`);
    if (!body) return;
    const isOpen = body.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open', isOpen);
}

// Helpers para render bracket/predicciones
function _koTeamCell(slot, groupStandings, bestThirds, alignRight) {
    const r = resolveSlot(slot, groupStandings, bestThirds);
    const shortSlot = slot.replace('Mejor 3° ', '3° ');
    const alignClass = alignRight ? ' kp-right' : '';
    if (r && r.team && !r.team.startsWith('Gan.') && !r.team.startsWith('Perd.') && r.team !== slot) {
        const icon  = r.badge.includes('CLASIF') ? '✓' : '~';
        const color = r.badge.includes('CLASIF') ? '#00FF88' : '#FFD700';
        return `<div class="kp-team-cell${alignClass}">
            <span class="kp-slot-tag" style="color:${color};">${icon} ${shortSlot}</span>
            <span class="kp-team-display">${r.team}</span>
        </div>`;
    }
    return `<div class="kp-team-cell${alignClass}">
        <span class="kp-slot-tag">${shortSlot}</span>
        <span class="kp-team-display kp-tbd">Por definir</span>
    </div>`;
}

// ── Render bracket (tab Grupos — 5 rondas desde Octavos) ──────────────────
function renderKnockoutBracket() {
    const container = document.getElementById('knockoutBracketSection');
    if (!container) return;

    const groupStandings = getGroupStandings();
    const bestThirds     = computeBestThirds(groupStandings);

    const ROUND_MOD = { r16: '--r16', qf: '--qf', sf: '--sf', third: '--3rd', final: '--final', r32: '' };
    const START_LABELS = { r16: '5 JUL', qf: '9 JUL', sf: '14 JUL', third: '18 JUL', final: '19 JUL', r32: '28 JUN' };

    const cardsHtml = GROUPS_TAB_ROUNDS.map(key => {
        const round = BRACKET[key];
        const mod   = ROUND_MOD[key] || '';
        const label = START_LABELS[key] || round.startDate.toUpperCase();

        const matchRows = round.matches.map(match => {
            const s1 = resolveSlot(match.slot1, groupStandings, bestThirds);
            const s2 = resolveSlot(match.slot2, groupStandings, bestThirds);
            return `
            <div class="match-prediction kp-pending" style="pointer-events:none;">
                <div class="kp-match-top">
                    <span class="match-info">${match.id} · ${match.time}</span>
                </div>
                <div class="match-teams-row">
                    ${_koTeamCell(match.slot1, groupStandings, bestThirds, false)}
                    <div></div><div></div>
                    ${_koTeamCell(match.slot2, groupStandings, bestThirds, true)}
                </div>
                <div class="match-info kp-venue">📍 ${match.venue}</div>
            </div>`;
        }).join('');

        return `
        <div class="r32-section r32-section${mod}">
            <div class="r32-header kp-toggle-header" onclick="toggleKnockoutRound('bracket_${key}')" role="button">
                <div>
                    <h4 class="kp-round-title">${round.emoji} ${round.title}</h4>
                    <p class="r32-subtitle">${round.subtitle}</p>
                </div>
                <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                    <div class="r32-start-badge r32-start-badge${mod}">
                        <span class="r32-start-label">INICIO</span>
                        <span class="r32-start-date">${label}</span>
                    </div>
                    <span class="special-toggle-arrow" id="kp-arrow-bracket_${key}">▼</span>
                </div>
            </div>
            <div class="kp-body" id="kp-body-bracket_${key}">
                ${matchRows}
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `
        <div class="ko-section-header">
            <h3>⚔️ Bracket Eliminatorio</h3>
            <p>Equipos probables basados en los standings actuales · se actualiza automáticamente</p>
        </div>
        ${cardsHtml}`;
}

// ── Render predicciones knockouts (tab Predicciones — 6 rondas, bloqueadas) ─
function _isRoundOpen(key, bestThirds) {
    switch (key) {
        case 'r32':   return bestThirds.allDone;
        case 'r16':   return BRACKET.r32.matches.every(m => results.find(r => r.matchId === m.id));
        case 'qf':    return BRACKET.r16.matches.every(m => results.find(r => r.matchId === m.id));
        case 'sf':    return BRACKET.qf.matches.every(m => results.find(r => r.matchId === m.id));
        case 'third':
        case 'final': return BRACKET.sf.matches.every(m => results.find(r => r.matchId === m.id));
        default:      return false;
    }
}

function renderKnockoutPredictions() {
    const container = document.getElementById('knockoutPredictionsSection');
    if (!container) return;

    const groupStandings = getGroupStandings();
    const bestThirds     = computeBestThirds(groupStandings);

    const myName = document.getElementById('participantName')?.value.trim() || '';
    const myPart = participants.find(p => p.name === myName);
    const myPicks = myPart?.predictions || [];

    const ROUND_MOD    = { r32: '', r16: '--r16', qf: '--qf', sf: '--sf', third: '--3rd', final: '--final' };
    const START_LABELS = { r32: '28 JUN', r16: '4 JUL', qf: '9 JUL', sf: '14 JUL', third: '18 JUL', final: '19 JUL' };

    let anyOpen = false;

    const cardsHtml = PREDICTIONS_TAB_ROUNDS.map(key => {
        const round  = BRACKET[key];
        const mod    = ROUND_MOD[key] || '';
        const label  = START_LABELS[key] || round.startDate.toUpperCase();
        const isOpen = _isRoundOpen(key, bestThirds);
        if (isOpen) anyOpen = true;

        const matchRows = round.matches.map(match => {
            if (!isOpen) {
                return `
                <div class="match-prediction kp-pending">
                    <div class="kp-match-top">
                        <span class="match-info">${match.id} · ${match.time}</span>
                        <span class="kp-locked-chip">🔒 Sin abrir</span>
                    </div>
                    <div class="match-teams-row">
                        ${_koTeamCell(match.slot1, groupStandings, bestThirds, false)}
                        <input type="number" class="score-input" disabled min="0" max="20" placeholder="-">
                        <input type="number" class="score-input" disabled min="0" max="20" placeholder="-">
                        ${_koTeamCell(match.slot2, groupStandings, bestThirds, true)}
                    </div>
                    <div class="match-info kp-venue">📍 ${match.venue}</div>
                </div>`;
            }

            const existingPick = myPicks.find(p => p.matchId === match.id);
            const hasResult    = !!results.find(r => r.matchId === match.id);
            const kicked       = match.dateTime && new Date() >= new Date(match.dateTime) - 60000;
            const inputLocked  = hasResult || kicked || !!existingPick;

            let statusChip;
            if (hasResult)               statusChip = `<span class="kp-final-chip">✅ FINAL</span>`;
            else if (inputLocked)        statusChip = `<span class="kp-locked-chip">🔒 Cerrado</span>`;
            else if (existingPick)       statusChip = `<span class="kp-locked-chip">🔒 TU PICK</span>`;
            else                         statusChip = `<span class="kp-open-chip">📝 Abierto</span>`;

            const v1 = existingPick?.score1 ?? '';
            const v2 = existingPick?.score2 ?? '';

            return `
            <div class="match-prediction${inputLocked ? ' kp-locked-match' : ''}">
                <div class="kp-match-top">
                    <span class="match-info">${match.id} · ${match.time}</span>
                    ${statusChip}
                </div>
                <div class="match-teams-row">
                    ${_koTeamCell(match.slot1, groupStandings, bestThirds, false)}
                    <input id="ko-s1-${match.id}" type="number" class="score-input" ${inputLocked ? 'disabled' : ''} min="0" max="20" placeholder="-" value="${v1}">
                    <input id="ko-s2-${match.id}" type="number" class="score-input" ${inputLocked ? 'disabled' : ''} min="0" max="20" placeholder="-" value="${v2}">
                    ${_koTeamCell(match.slot2, groupStandings, bestThirds, true)}
                </div>
                <div class="match-info kp-venue">📍 ${match.venue}</div>
            </div>`;
        }).join('');

        return `
        <div class="r32-section r32-section${mod}">
            <div class="r32-header kp-toggle-header" onclick="toggleKnockoutRound('pred_${key}')" role="button">
                <div>
                    <h4 class="kp-round-title">${round.emoji} ${round.title}</h4>
                    <p class="r32-subtitle">${round.subtitle}</p>
                </div>
                <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                    <div class="r32-start-badge r32-start-badge${mod}">
                        <span class="r32-start-label">INICIO</span>
                        <span class="r32-start-date">${label}</span>
                    </div>
                    <span class="special-toggle-arrow" id="kp-arrow-pred_${key}">▼</span>
                </div>
            </div>
            <div class="kp-body" id="kp-body-pred_${key}">
                ${matchRows}
            </div>
        </div>`;
    }).join('');

    const noticeHtml = anyOpen
        ? `<div class="kp-locked-notice" style="border-color:rgba(0,255,136,0.4);background:rgba(0,255,136,0.05);">
            <span style="font-size:1.6rem;flex-shrink:0;line-height:1;margin-top:2px;">✅</span>
            <div>
                <p class="kp-lock-title" style="color:#00FF88;">Fase Eliminatoria desbloqueada</p>
                <p class="kp-lock-body">Los clasificados están definidos. Ingresa tus predicciones. Cada ronda se abre automáticamente cuando termina la anterior.</p>
            </div>
           </div>`
        : `<div class="kp-locked-notice">
            <span style="font-size:1.6rem;flex-shrink:0;line-height:1;margin-top:2px;">🔒</span>
            <div>
                <p class="kp-lock-title">Predicciones Fase Eliminatoria — Sin abrir</p>
                <p class="kp-lock-body">Se habilitarán automáticamente cuando terminen todos los partidos de grupos. Puedes ver el bracket tentativo abajo.</p>
            </div>
           </div>`;

    container.innerHTML = `${noticeHtml}${cardsHtml}`;

    // Auto-open first unlocked round
    if (anyOpen) {
        const firstOpenKey = PREDICTIONS_TAB_ROUNDS.find(k => _isRoundOpen(k, bestThirds));
        if (firstOpenKey) {
            const body = document.getElementById(`kp-body-pred_${firstOpenKey}`);
            const arrow = document.getElementById(`kp-arrow-pred_${firstOpenKey}`);
            if (body && !body.classList.contains('open')) {
                body.classList.add('open');
                if (arrow) arrow.classList.add('open');
            }
        }
    }
}

async function submitKnockoutPredictions(roundKey) {
    const name = document.getElementById('participantName')?.value.trim() || '';
    if (!name) { showToast('⚠️ Ingresa tu nombre primero'); return; }

    const round = BRACKET[roundKey];
    if (!round) return;

    const newPicks = round.matches
        .filter(match => {
            const kicked = match.dateTime && new Date() >= new Date(new Date(match.dateTime) - 60000);
            if (kicked) return false;
            const s1 = document.getElementById(`ko-s1-${match.id}`)?.value;
            const s2 = document.getElementById(`ko-s2-${match.id}`)?.value;
            return s1 !== '' && s1 !== undefined && s2 !== '' && s2 !== undefined;
        })
        .map(match => ({
            matchId: match.id,
            score1: parseInt(document.getElementById(`ko-s1-${match.id}`)?.value),
            score2: parseInt(document.getElementById(`ko-s2-${match.id}`)?.value)
        }));

    if (newPicks.length === 0) {
        showToast('⚠️ Ingresa al menos 1 predicción antes de guardar');
        return;
    }

    const existingParticipant = await storage.get(`participant:${name}`);
    const existingPredictions = existingParticipant?.predictions || [];

    const mergedPredictions = [...existingPredictions];
    newPicks.forEach(np => {
        const idx = mergedPredictions.findIndex(p => p.matchId === np.matchId);
        if (idx >= 0) mergedPredictions[idx] = np;
        else mergedPredictions.push(np);
    });

    const participant = {
        ...(existingParticipant || {}),
        name,
        username: sessionStorage.getItem('pollaUser'),
        predictions: mergedPredictions,
        specialPredictions: existingParticipant?.specialPredictions || {},
        createdAt: existingParticipant?.createdAt || Date.now(),
        timestamp: Date.now()
    };

    await storage.set(`participant:${name}`, participant);

    const idx = participants.findIndex(p => p.name === name);
    if (idx >= 0) participants[idx] = participant;
    else participants.push(participant);

    renderKnockoutPredictions();
    showToast(`✅ ${newPicks.length} predicción(es) guardadas para ${round.title}`);
}
