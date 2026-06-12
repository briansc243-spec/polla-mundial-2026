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
    { id: 40, group: 'G', team1: '🇳🇿 Nueva Zelanda', team2: '🇪🇬 Egipto', dateTime: '2026-06-22T20:00:00-05:00', venue: 'BC Place, Vancouver' },
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
    { id: 61, group: 'K', team1: '🇺🇿 Uzbekistán', team2: '🇨🇴 Colombia', dateTime: '2026-06-18T21:00:00-05:00', venue: 'Estadio Banorte, Ciudad de México' },
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
        if (!res.ok) { renderMatches(); return; }
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

            if (newRank >= existRank) {
                liveScores[key] = { home_team: homeEs, away_team: awayEs, home_score: homeScore, away_score: awayScore, status: ourStatus, minute };
            }

            // Auto-guardar resultados finales con patrón individual (result:matchId)
            if (ourStatus === 'FINISHED') {
                const internalMatch = matches.find(m =>
                    stripFlag(m.team1) === homeEs && stripFlag(m.team2) === awayEs
                );
                if (internalMatch && !results.find(r => r.matchId === internalMatch.id)) {
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
    } catch (e) { console.warn('ESPN live scores error:', e); renderMatches(); }
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

// Deadline predicciones especiales: martes 16 jun 2026, fin del día PE
const SPECIAL_DEADLINE = new Date('2026-06-17T00:00:00-05:00');

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
                🔒 El plazo para predicciones especiales venció el martes 16 de junio.
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
                ✅ Predicciones especiales guardadas. Puedes editarlas hasta el <strong>martes 16 de junio</strong>.
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
                    ⏳ Tienes hasta el <strong>martes 16 de junio</strong> para guardar.
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
        showToast('🔒 El plazo venció el martes 16 de junio');
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
        // Los partidos siempre vienen del código (no se guardan en BD)
        matches = defaultMatches;

        // Cargar participantes
        try {
            const listResult = await storage.list('participant:');
            const keys = listResult ? listResult.keys : [];
            const loaded = [];
            for (const key of keys) {
                const data = await storage.get(key);
                if (data) loaded.push(data);
            }
            // Deduplicar por nombre y excluir al admin (no aparece en tabla/stats)
            const seen = new Set();
            participants = loaded.filter(p => {
                if (p.username === 'admin') return false;
                if (seen.has(p.name)) return false;
                seen.add(p.name);
                return true;
            });
        } catch (error) {
            participants = [];
        }
    } finally {
        _initLock = false;
    }

    // Cargar resultados — una clave por partido en polla_data (result:matchId)
    // Este patrón evita que guardar un resultado borre a los demás
    const resultList = await storage.list('result:');
    results = [];
    if (resultList && resultList.keys.length > 0) {
        for (const key of resultList.keys) {
            const r = await storage.get(key);
            if (r && r.matchId && r.score1 !== null && r.score2 !== null) results.push(r);
        }
    }
    // Fallback al array legacy si no hay claves individuales aún
    if (results.length === 0) {
        const savedResults = await storage.get('results');
        results = savedResults || [];
    }

    renderMatches();
    renderMyPredictions();
    renderResults();
    renderGroups();
    updateLeaderboard();
    updateStats();
    initSpecialPredictions();

    const username = sessionStorage.getItem('pollaUser');
    const shownKey = `todayMatchesShown:${username}`;
    if (!sessionStorage.getItem(shownKey)) {
        sessionStorage.setItem(shownKey, 'true');
        showTodayMatches();
    }
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

    const saved = new Date(me.timestamp).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    const myStats = calculatePoints(me.predictions, results);
    const pointsText = myStats.points > 0 ? ` · 🏆 ${myStats.points} pts (${myStats.exact} exactos, ${myStats.tendency} tendencias)` : '';
    subtitle.textContent = `Registradas el ${saved} · No se pueden modificar${pointsText}`;

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

    container.innerHTML = matches.map(match => {
        const result = results.find(r => r.matchId === match.id);
        const score1 = result ? result.score1 : '';
        const score2 = result ? result.score2 : '';

        if (isAdmin) {
            return `
                <div class="match-prediction">
                    <div class="team-name">${match.team1}</div>
                    <input type="number" class="score-input" id="result1-${match.id}" min="0" max="20" value="${score1}" placeholder="?">
                    <input type="number" class="score-input" id="result2-${match.id}" min="0" max="20" value="${score2}" placeholder="?">
                    <div class="team-name">${match.team2}</div>
                </div>
            `;
        }

        const s1 = score1 !== '' ? score1 : '-';
        const s2 = score2 !== '' ? score2 : '-';
        return `
            <div class="match-prediction">
                <div class="team-name">${match.team1}</div>
                <span class="score-display">${s1}</span>
                <span class="score-display">${s2}</span>
                <div class="team-name">${match.team2}</div>
            </div>
        `;
    }).join('');
}

// Guardar predicciones
async function submitPredictions() {
    const name = document.getElementById('participantName').value.trim();

    if (!name) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    // Solo guardar partidos donde el usuario ingresó ambos scores explícitamente
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
        timestamp: Date.now()
    };

    await storage.set(`participant:${name}`, participant);
    logAction(sessionStorage.getItem('pollaUser'), 'save_predictions', {
        display_name: name,
        count: newPredictions.length,
        matches: newPredictions.map(p => ({ matchId: p.matchId, score: `${p.score1}-${p.score2}` }))
    });

    // Recargar datos
    await init();

    showToast(`✅ ${newPredictions.length} predicción(es) guardadas para ${name}`);
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

// Pronósticos públicos: visibles 2 min después del inicio del partido
function renderAllPicks() {
    const container = document.getElementById('allPicksContainer');
    if (!container) return;

    try {
    const now = new Date();
    const eligible = matches
        .filter(m => new Date(m.dateTime).getTime() + 2 * 60 * 1000 < now.getTime())
        .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    if (eligible.length === 0) {
        container.innerHTML = `<p style="color:var(--text-dim);text-align:center;padding:24px;font-size:0.9rem;">
            Aún no hay partidos en curso. Los pronósticos se revelan al minuto 2 de cada partido.
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