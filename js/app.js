// ========================================
// SISTEMA DE LOGIN
// ========================================

// Credenciales (puedes cambiarlas aquí o crear sistema de múltiples usuarios)
const VALID_CREDENTIALS = {
    'admin': 'Adm!n@2026',
    'brian': 'Br!an@2026',
    'oscar': '0sc4r@2026'
};

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

// Manejar login
function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    // Validar campos vacíos
    if (!username || !password) {
        showLoginError('Por favor completa todos los campos');
        return;
    }

    // Validar credenciales
    if (VALID_CREDENTIALS[username] && VALID_CREDENTIALS[username] === password) {
        // Login exitoso
        sessionStorage.setItem('pollaLoggedIn', 'true');
        sessionStorage.setItem('pollaUser', username);
        
        // Mostrar aplicación
        showMainApp();
    } else {
        showLoginError('❌ Usuario o contraseña incorrectos');
    }
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
function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'block';

    const username = sessionStorage.getItem('pollaUser');
    const savedName = localStorage.getItem(`pollaDisplayName:${username}`);

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
function confirmDisplayName() {
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
    const isAdmin = username === 'admin';
    const resultsTab = document.getElementById('resultsTab');
    if (resultsTab) resultsTab.style.display = isAdmin ? 'flex' : 'none';
}

function lockParticipantName(name) {
    const input = document.getElementById('participantName');
    input.value = name;
    input.readOnly = true;
    input.style.cssText += '; opacity:0.6; cursor:not-allowed; pointer-events:none;';
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        sessionStorage.removeItem('pollaLoggedIn');
        sessionStorage.removeItem('pollaUser');
        document.getElementById('logoutBtn').style.display = 'none';
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
// Sistema de almacenamiento persistente
const storage = {
    get: async (key) => {
        try {
            const val = localStorage.getItem(`polla_${key}`);
            return val ? JSON.parse(val) : null;
        } catch {
            return null;
        }
    },
    set: async (key, value) => {
        try {
            localStorage.setItem(`polla_${key}`, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    list: async (prefix) => {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(`polla_${prefix}`)) {
                    keys.push(k.replace('polla_', ''));
                }
            }
            return { keys };
        } catch {
            return { keys: [] };
        }
    }
};

                        // Partidos del Mundial 2026 - Fase de Grupos (dateTime en hora PE, UTC-5)
const defaultMatches = [
    // GRUPO A
    { id: 1, group: 'A', team1: '🇲🇽 México', team2: '🇿🇦 Sudáfrica', dateTime: '2026-06-11T14:00:00-05:00', venue: 'Estadio Ciudad de México' },
    { id: 2, group: 'A', team1: '🇰🇷 Corea del Sur', team2: '🏳️ DEN/MKD/CZE/IRL', dateTime: '2026-06-11T21:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 3, group: 'A', team1: '🇲🇽 México', team2: '🇰🇷 Corea del Sur', dateTime: '2026-06-18T20:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 4, group: 'A', team1: '🏳️ DEN/MKD/CZE/IRL', team2: '🇿🇦 Sudáfrica', dateTime: '2026-06-18T11:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 5, group: 'A', team1: '🇿🇦 Sudáfrica', team2: '🇰🇷 Corea del Sur', dateTime: '2026-06-24T20:00:00-05:00', venue: 'Estadio BBVA, Guadalupe' },
    { id: 6, group: 'A', team1: '🏳️ DEN/MKD/CZE/IRL', team2: '🇲🇽 México', dateTime: '2026-06-24T20:00:00-05:00', venue: 'Estadio Ciudad de México' },

    // GRUPO B
    { id: 7, group: 'B', team1: '🇶🇦 Qatar', team2: '🇨🇭 Suiza', dateTime: '2026-06-13T14:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 8, group: 'B', team1: '🇨🇦 Canadá', team2: '🏳️ ITA/NIR/WAL/BIH', dateTime: '2026-06-12T14:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 9, group: 'B', team1: '🇨🇭 Suiza', team2: '🏳️ ITA/NIR/WAL/BIH', dateTime: '2026-06-18T14:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 10, group: 'B', team1: '🇨🇦 Canadá', team2: '🇶🇦 Qatar', dateTime: '2026-06-18T17:00:00-05:00', venue: 'BC Place, Vancouver' },
    { id: 11, group: 'B', team1: '🏳️ ITA/NIR/WAL/BIH', team2: '🇶🇦 Qatar', dateTime: '2026-06-24T14:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 12, group: 'B', team1: '🇨🇭 Suiza', team2: '🇨🇦 Canadá', dateTime: '2026-06-24T14:00:00-05:00', venue: 'BC Place, Vancouver' },

    // GRUPO C
    { id: 13, group: 'C', team1: '🇧🇷 Brasil', team2: '🏳️ TUR/ROU/SVK/KOS', dateTime: '2026-06-13T17:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },
    { id: 14, group: 'C', team1: '🇲🇦 Marruecos', team2: '🇨🇴 Colombia', dateTime: '2026-06-13T20:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 15, group: 'C', team1: '🇧🇷 Brasil', team2: '🇲🇦 Marruecos', dateTime: '2026-06-19T19:30:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 16, group: 'C', team1: '🇨🇴 Colombia', team2: '🏳️ TUR/ROU/SVK/KOS', dateTime: '2026-06-19T17:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 17, group: 'C', team1: '🏳️ TUR/ROU/SVK/KOS', team2: '🇧🇷 Brasil', dateTime: '2026-06-24T17:00:00-05:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 18, group: 'C', team1: '🇨🇴 Colombia', team2: '🇲🇦 Marruecos', dateTime: '2026-06-24T17:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },

    // GRUPO D
    { id: 19, group: 'D', team1: '🇺🇸 USA', team2: '🇵🇾 Paraguay', dateTime: '2026-06-12T20:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 20, group: 'D', team1: '🇦🇺 Australia', team2: '🏳️ POL/ALB/UKR/SWE', dateTime: '2026-06-13T23:00:00-05:00', venue: 'BC Place, Vancouver' },
    { id: 21, group: 'D', team1: '🇺🇸 USA', team2: '🇦🇺 Australia', dateTime: '2026-06-19T14:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 22, group: 'D', team1: '🏳️ POL/ALB/UKR/SWE', team2: '🇵🇾 Paraguay', dateTime: '2026-06-19T22:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 23, group: 'D', team1: '🇵🇾 Paraguay', team2: '🇦🇺 Australia', dateTime: '2026-06-25T21:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 24, group: 'D', team1: '🏳️ POL/ALB/UKR/SWE', team2: '🇺🇸 USA', dateTime: '2026-06-25T21:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },

    // GRUPO E
    { id: 25, group: 'E', team1: '🇩🇪 Alemania', team2: '🇨🇼 Curazao', dateTime: '2026-06-14T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 26, group: 'E', team1: '🇨🇮 Costa de Marfil', team2: '🇪🇨 Ecuador', dateTime: '2026-06-14T18:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 27, group: 'E', team1: '🇪🇨 Ecuador', team2: '🇨🇼 Curazao', dateTime: '2026-06-20T19:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    { id: 28, group: 'E', team1: '🇩🇪 Alemania', team2: '🇨🇮 Costa de Marfil', dateTime: '2026-06-20T15:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 29, group: 'E', team1: '🇨🇼 Curazao', team2: '🇨🇮 Costa de Marfil', dateTime: '2026-06-25T15:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 30, group: 'E', team1: '🇪🇨 Ecuador', team2: '🇩🇪 Alemania', dateTime: '2026-06-25T15:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },

    // GRUPO F
    { id: 31, group: 'F', team1: '🇳🇱 Países Bajos', team2: '🇯🇵 Japón', dateTime: '2026-06-14T15:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 32, group: 'F', team1: '🇳🇿 Nueva Zelanda', team2: '🇹🇳 Túnez', dateTime: '2026-06-14T21:00:00-05:00', venue: 'Estadio BBVA, Guadalupe' },
    { id: 33, group: 'F', team1: '🇹🇳 Túnez', team2: '🇯🇵 Japón', dateTime: '2026-06-20T23:00:00-05:00', venue: 'Estadio BBVA, Guadalupe' },
    { id: 34, group: 'F', team1: '🇳🇱 Países Bajos', team2: '🇳🇿 Nueva Zelanda', dateTime: '2026-06-20T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 35, group: 'F', team1: '🇹🇳 Túnez', team2: '🇳🇱 Países Bajos', dateTime: '2026-06-25T18:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    { id: 36, group: 'F', team1: '🇯🇵 Japón', team2: '🇳🇿 Nueva Zelanda', dateTime: '2026-06-25T18:00:00-05:00', venue: 'AT&T Stadium, Arlington' },

    // GRUPO G
    { id: 37, group: 'G', team1: '🇧🇪 Bélgica', team2: '🇪🇬 Egipto', dateTime: '2026-06-15T14:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 38, group: 'G', team1: '🇮🇷 Irán', team2: '🇸🇦 Arabia Saudita', dateTime: '2026-06-15T17:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 39, group: 'G', team1: '🇧🇪 Bélgica', team2: '🇮🇷 Irán', dateTime: '2026-06-21T14:00:00-05:00', venue: 'SoFi Stadium, Los Ángeles' },
    { id: 40, group: 'G', team1: '🇸🇦 Arabia Saudita', team2: '🇪🇬 Egipto', dateTime: '2026-06-21T20:00:00-05:00', venue: 'BC Place, Vancouver' },
    { id: 41, group: 'G', team1: '🇮🇷 Irán', team2: '🇪🇬 Egipto', dateTime: '2026-06-26T22:00:00-05:00', venue: 'Lumen Field, Seattle' },
    { id: 42, group: 'G', team1: '🇸🇦 Arabia Saudita', team2: '🇧🇪 Bélgica', dateTime: '2026-06-26T22:00:00-05:00', venue: 'BC Place, Vancouver' },

    // GRUPO H
    { id: 43, group: 'H', team1: '🇪🇸 España', team2: '🇨🇻 Cabo Verde', dateTime: '2026-06-15T11:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 44, group: 'H', team1: '🇺🇾 Uruguay', team2: '🇭🇹 Haití', dateTime: '2026-06-15T17:00:00-05:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 45, group: 'H', team1: '🇪🇸 España', team2: '🇺🇾 Uruguay', dateTime: '2026-06-21T11:00:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { id: 46, group: 'H', team1: '🇭🇹 Haití', team2: '🇨🇻 Cabo Verde', dateTime: '2026-06-21T17:00:00-05:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 47, group: 'H', team1: '🇺🇾 Uruguay', team2: '🇪🇸 España', dateTime: '2026-06-26T19:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 48, group: 'H', team1: '🇨🇻 Cabo Verde', team2: '🇭🇹 Haití', dateTime: '2026-06-26T19:00:00-05:00', venue: 'NRG Stadium, Houston' },

    // GRUPO I
    { id: 49, group: 'I', team1: '🇫🇷 Francia', team2: '🏳️ THA/SGP/CHN/MAR', dateTime: '2026-06-15T20:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 50, group: 'I', team1: '🇸🇳 Senegal', team2: '🇳🇴 Noruega', dateTime: '2026-06-16T17:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 51, group: 'I', team1: '🇫🇷 Francia', team2: '🇸🇳 Senegal', dateTime: '2026-06-22T16:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 52, group: 'I', team1: '🇳🇴 Noruega', team2: '🏳️ THA/SGP/CHN/MAR', dateTime: '2026-06-22T19:00:00-05:00', venue: 'MetLife Stadium, East Rutherford' },
    { id: 53, group: 'I', team1: '🏳️ THA/SGP/CHN/MAR', team2: '🇳🇴 Noruega', dateTime: '2026-06-26T14:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 54, group: 'I', team1: '🇸🇳 Senegal', team2: '🇫🇷 Francia', dateTime: '2026-06-26T14:00:00-05:00', venue: 'BMO Field, Toronto' },

    // GRUPO J
    { id: 55, group: 'J', team1: '🇦🇷 Argentina', team2: '🇩🇿 Algeria', dateTime: '2026-06-16T20:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    { id: 56, group: 'J', team1: '🇦🇹 Austria', team2: '🇯🇴 Jordania', dateTime: '2026-06-16T23:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 57, group: 'J', team1: '🇦🇷 Argentina', team2: '🇦🇹 Austria', dateTime: '2026-06-22T12:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 58, group: 'J', team1: '🇯🇴 Jordania', team2: '🇩🇿 Algeria', dateTime: '2026-06-22T22:00:00-05:00', venue: 'Levi\'s Stadium, Santa Clara' },
    { id: 59, group: 'J', team1: '🇯🇴 Jordania', team2: '🇦🇷 Argentina', dateTime: '2026-06-27T21:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 60, group: 'J', team1: '🇩🇿 Algeria', team2: '🇦🇹 Austria', dateTime: '2026-06-27T21:00:00-05:00', venue: 'GEHA Field, Kansas City' },
    
    // GRUPO K
    { id: 61, group: 'K', team1: '🇺🇿 Uzbekistán', team2: '🇵🇦 Panamá', dateTime: '2026-06-17T18:00:00-05:00', venue: 'Estadio Ciudad de México' },
    { id: 62, group: 'K', team1: '🇵🇹 Portugal', team2: '🏳️ JAM/NCL/COD/IRQ', dateTime: '2026-06-17T12:00:00-05:00', venue: 'NRG Stadium, Houston' },
    { id: 63, group: 'K', team1: '🇵🇦 Panamá', team2: '🏳️ JAM/NCL/COD/IRQ', dateTime: '2026-06-23T18:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 64, group: 'K', team1: '🇵🇹 Portugal', team2: '🇺🇿 Uzbekistán', dateTime: '2026-06-23T12:00:00-05:00', venue: 'Estadio Akron, Guadalajara' },
    { id: 65, group: 'K', team1: '🇵🇦 Panamá', team2: '🇵🇹 Portugal', dateTime: '2026-06-27T18:30:00-05:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 66, group: 'K', team1: '🏳️ JAM/NCL/COD/IRQ', team2: '🇺🇿 Uzbekistán', dateTime: '2026-06-27T18:30:00-05:00', venue: 'Mercedes-Benz Stadium, Atlanta' },

    // GRUPO L
    { id: 67, group: 'L', team1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', team2: '🇭🇷 Croacia', dateTime: '2026-06-17T15:00:00-05:00', venue: 'AT&T Stadium, Arlington' },
    { id: 68, group: 'L', team1: '🇬🇭 Ghana', team2: '🇨🇷 Costa Rica', dateTime: '2026-06-17T18:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' },
    { id: 69, group: 'L', team1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', team2: '🇬🇭 Ghana', dateTime: '2026-06-23T15:00:00-05:00', venue: 'Gillette Stadium, Foxborough' },
    { id: 70, group: 'L', team1: '🇨🇷 Costa Rica', team2: '🇭🇷 Croacia', dateTime: '2026-06-23T18:00:00-05:00', venue: 'BMO Field, Toronto' },
    { id: 71, group: 'L', team1: '🇭🇷 Croacia', team2: '🇬🇭 Ghana', dateTime: '2026-06-27T16:00:00-05:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 72, group: 'L', team1: '🇨🇷 Costa Rica', team2: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', dateTime: '2026-06-27T16:00:00-05:00', venue: 'Lincoln Financial Field, Philadelphia' }
];

let matches = [];
let participants = [];
let results = [];

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
    const lockTime = new Date(matchTime.getTime() - 30 * 60 * 1000); // 30 minutos antes
    
    return now >= lockTime;
}

// Función para formatear tiempo restante
function getTimeUntilLock(match) {
    if (!match.dateTime) return null;
    
    const now = new Date();
    const matchTime = new Date(match.dateTime);
    const lockTime = new Date(matchTime.getTime() - 30 * 60 * 1000);
    
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

// Inicialización
async function init() {
    // SIEMPRE usar los partidos predeterminados actualizados
    matches = defaultMatches;
    await storage.set('matches', matches);

    // Cargar participantes
    try {
        const listResult = await storage.list('participant:');
        const keys = listResult ? listResult.keys : [];
        participants = [];
        for (const key of keys) {
            const data = await storage.get(key);
            if (data) participants.push(data);
        }
    } catch (error) {
        participants = [];
    }

    // Cargar resultados
    const savedResults = await storage.get('results');
    results = savedResults || [];

    renderMatches();
    renderMyPredictions();
    renderResults();
    updateLeaderboard();
    updateStats();

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
    subtitle.textContent = `Registradas el ${saved} · No se pueden modificar`;

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
                    <div><span style="color:#A0A8C0;">⚽ Goleador:</span> <strong>${sp.topScorer || '—'}</strong></div>
                    <div><span style="color:#A0A8C0;">🎯 Total goles:</span> <strong>${sp.totalGoals || '—'}</strong></div>
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
                if (isExact) pointsBadge = `<span style="background:rgba(0,255,136,0.15);color:#00FF88;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:700;">+3 pts ✓</span>`;
                else if (isTendency) pointsBadge = `<span style="background:rgba(255,215,0,0.15);color:#FFD700;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:700;">+1 pt</span>`;
                else pointsBadge = `<span style="background:rgba(255,51,102,0.15);color:#FF3366;padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:700;">0 pts</span>`;
            }

            html += `
                <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 14px; margin-bottom:6px; font-size:0.88rem;">
                    <span style="flex:1; color:#e0e0e0;">${match.team1}</span>
                    <span style="background:rgba(0,217,255,0.12); color:#00D9FF; padding:4px 14px; border-radius:8px; font-weight:700; font-size:1rem; margin:0 8px;">${pred.score1} - ${pred.score2}</span>
                    <span style="flex:1; text-align:right; color:#e0e0e0;">${match.team2}</span>
                    <span style="margin-left:10px;">${pointsBadge}</span>
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
    const alreadySaved = !!me;

    const container = document.getElementById('matchesContainer');
    const stickyWrapper = document.getElementById('saveBtnStickyWrapper');

    if (alreadySaved) {
        if (stickyWrapper) stickyWrapper.style.display = 'none';
        if (!document.getElementById('savedBanner')) {
            container.insertAdjacentHTML('beforebegin',
                `<div id="savedBanner" style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.3);border-radius:12px;padding:14px 18px;margin-bottom:20px;color:#00FF88;font-size:0.9rem;">
                    ✅ Ya registraste tus predicciones. Los marcadores que ingresaste se muestran bloqueados.
                </div>`
            );
        }
    } else {
        document.getElementById('savedBanner')?.remove();
        if (stickyWrapper) stickyWrapper.style.display = 'flex';
    }

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
                    const locked = isMatchLocked(match) || alreadySaved;
                    const timeInfo = !alreadySaved ? getTimeUntilLock(match) : null;
                    const lockedClass = locked ? 'match-locked' : '';
                    const disabledAttr = locked ? 'disabled' : '';

                    const savedPred = alreadySaved ? me.predictions.find(p => p.matchId === match.id) : null;
                    const val1 = savedPred ? savedPred.score1 : '0';
                    const val2 = savedPred ? savedPred.score2 : '0';

                    const statusBadge = alreadySaved
                        ? '<span class="match-status-locked">🔒 TU PICK</span>'
                        : isMatchLocked(match)
                            ? '<span class="match-status-locked">🔒 CERRADO</span>'
                            : timeInfo ? `<span class="match-status-open">⏰ ${timeInfo}</span>` : '';

                    return `
                    <div class="match-prediction ${lockedClass}">
                        <div>
                            <span class="match-info">${formatPETime(match.dateTime)}</span>
                            ${statusBadge}
                            <div class="team-name">${match.team1 || 'Equipo 1'}</div>
                        </div>
                        <input type="number" class="score-input" id="score1-${match.id}" min="0" max="20" value="${val1}" ${disabledAttr}>
                        <input type="number" class="score-input" id="score2-${match.id}" min="0" max="20" value="${val2}" ${disabledAttr}>
                        <div>
                            <span class="match-info">${match.venue || ''}</span>
                            <div class="team-name">${match.team2 || 'Equipo 2'}</div>
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

    // Verificar si el participante ya existe
    const existingParticipant = await storage.get(`participant:${name}`);
    if (existingParticipant) {
        alert(`❌ El participante "${name}" ya ha registrado sus predicciones. Por favor usa otro nombre o edita tus predicciones existentes.`);
        return;
    }

    // Verificar partidos bloqueados
    const lockedMatches = matches.filter(m => isMatchLocked(m));
    if (lockedMatches.length > 0) {
        const lockedCount = lockedMatches.length;
        const confirmMsg = `⚠️ ADVERTENCIA: Hay ${lockedCount} partido(s) que ya empezaron o están por empezar.\n\nEstos partidos ya no se pueden predecir y quedarán con marcador 0-0.\n\n¿Deseas continuar de todas formas?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
    }

    // Predicciones de partidos
    const predictions = matches.map(match => ({
        matchId: match.id,
        score1: parseInt(document.getElementById(`score1-${match.id}`)?.value) || 0,
        score2: parseInt(document.getElementById(`score2-${match.id}`)?.value) || 0,
        locked: isMatchLocked(match)
    }));

    // Predicciones especiales
    const specialPredictions = {
        champion: document.getElementById('predChampion')?.value.trim() || '',
        runnerUp: document.getElementById('predRunnerUp')?.value.trim() || '',
        topScorer: document.getElementById('predTopScorer')?.value.trim() || '',
        totalGoals: parseInt(document.getElementById('predTotalGoals')?.value) || 0
    };

    const participant = {
        name,
        predictions,
        specialPredictions,
        timestamp: Date.now()
    };

    await storage.set(`participant:${name}`, participant);

    // Recargar datos inmediatamente
    await init();

    showToast(`✅ Predicciones guardadas para ${name}`);
}

// Guardar resultados reales
async function saveResults() {
    results = matches.map(match => {
        const score1Input = document.getElementById(`result1-${match.id}`);
        const score2Input = document.getElementById(`result2-${match.id}`);
        const score1 = score1Input.value !== '' ? parseInt(score1Input.value) : null;
        const score2 = score2Input.value !== '' ? parseInt(score2Input.value) : null;
        
        return {
            matchId: match.id,
            score1,
            score2
        };
    }).filter(r => r.score1 !== null && r.score2 !== null);

    await storage.set('results', results);
    
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

    container.innerHTML = leaderboard.map((p, index) => `
        <div class="leaderboard-row">
            <span class="rank rank-${index + 1}">${index + 1}</span>
            <span>${p.name}</span>
            <span class="points">${p.points}</span>
            <span>${p.exact}</span>
            <span>${p.tendency}</span>
        </div>
    `).join('');
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
    }
    if (tabName === 'myPredictions') {
        renderMyPredictions();
    }
}

// Mostrar popup de partidos de hoy
function showTodayMatches() {
    const nowPE = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const todayStr = `${nowPE.getFullYear()}-${String(nowPE.getMonth()+1).padStart(2,'0')}-${String(nowPE.getDate()).padStart(2,'0')}`;

    const todayMatches = matches.filter(m => {
        if (!m.dateTime) return false;
        const matchPE = new Date(new Date(m.dateTime).toLocaleString('en-US', { timeZone: 'America/Lima' }));
        const matchStr = `${matchPE.getFullYear()}-${String(matchPE.getMonth()+1).padStart(2,'0')}-${String(matchPE.getDate()).padStart(2,'0')}`;
        return matchStr === todayStr;
    }).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    if (todayMatches.length === 0) return;

    const dateLabel = nowPE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
    document.getElementById('todayDateLabel').textContent = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    document.getElementById('todayMatchesList').innerHTML = todayMatches.map(match => {
        const locked = isMatchLocked(match);
        const timeInfo = getTimeUntilLock(match);
        const matchTimePE = new Date(match.dateTime).toLocaleString('es-PE', {
            timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true
        });

        const statusBadge = locked
            ? `<span style="background:rgba(255,51,102,0.15); color:#FF3366; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600;">🔒 CERRADO</span>`
            : timeInfo
                ? `<span style="background:rgba(0,217,255,0.1); color:#00D9FF; padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:600;">⏰ ${timeInfo}</span>`
                : '';

        return `
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 16px; margin-bottom:10px;">
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
            </div>
        `;
    }).join('');

    const modal = document.getElementById('todayMatchesModal');
    modal.style.display = 'flex';
}

function closeTodayModal() {
    document.getElementById('todayMatchesModal').style.display = 'none';
}

// Iniciar aplicación
init();