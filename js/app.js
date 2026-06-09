// ========================================
// SISTEMA DE LOGIN
// ========================================

// Credenciales (puedes cambiarlas aquí o crear sistema de múltiples usuarios)
const VALID_CREDENTIALS = {
    'admin': 'prontopaga2026',
    'usuario': 'mundial2026',
    'prontopaga': 'polla2026'
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
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
    init(); // Inicializar la aplicación
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
            const result = await window.storage.get(key, false);
            return result ? JSON.parse(result.value) : null;
        } catch {
            return null;
        }
    },
    set: async (key, value) => {
        try {
            await window.storage.set(key, JSON.stringify(value), false);
            return true;
        } catch {
            return false;
        }
    },
    list: async (prefix) => {
        try {
            const result = await window.storage.list(prefix, false);
            return result || { keys: [] };
        } catch {
            return { keys: [] };
        }
    }
};

                        // Partidos del Mundial 2026 - Fase de Grupos con fechas parseables
const defaultMatches = [
    // GRUPO A
    { id: 1, group: 'A', team1: '🇲🇽 México', team2: '🇿🇦 Sudáfrica', date: 'Jun 11 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-11T18:00:00-04:00', venue: 'Estadio Ciudad de México' },
    { id: 2, group: 'A', team1: '🇰🇷 Corea del Sur', team2: '🏳️ DEN/MKD/CZE/IRL', date: 'Jun 11 · 9:00 PM ET / 8:00 PM PE', dateTime: '2026-06-11T21:00:00-04:00', venue: 'Estadio Ciudad de México' },
    { id: 3, group: 'A', team1: '🇲🇽 México', team2: '🇰🇷 Corea del Sur', date: 'Jun 18 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-18T12:00:00-04:00', venue: 'Estadio Ciudad de México' },
    { id: 4, group: 'A', team1: '🏳️ DEN/MKD/CZE/IRL', team2: '🇿🇦 Sudáfrica', date: 'Jun 18 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-18T12:00:00-04:00', venue: 'Estadio Atlanta' },
    { id: 5, group: 'A', team1: '🇿🇦 Sudáfrica', team2: '🇰🇷 Corea del Sur', date: 'Jun 24 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-24T19:30:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 6, group: 'A', team1: '🏳️ DEN/MKD/CZE/IRL', team2: '🇲🇽 México', date: 'Jun 24 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-24T19:30:00-04:00', venue: 'Estadio Ciudad de México' },
    
    // GRUPO B  
    { id: 7, group: 'B', team1: '🇶🇦 Qatar', team2: '🇨🇭 Suiza', date: 'Jun 13 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-13T15:00:00-04:00', venue: 'Estadio Boston' },
    { id: 8, group: 'B', team1: '🇨🇦 Canadá', team2: '🏳️ ITA/NIR/WAL/BIH', date: 'Jun 12 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-12T15:00:00-04:00', venue: 'BMO Field, Toronto' },
    { id: 9, group: 'B', team1: '🇨🇭 Suiza', team2: '🏳️ ITA/NIR/WAL/BIH', date: 'Jun 18 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-18T12:00:00-04:00', venue: 'Estadio Los Ángeles' },
    { id: 10, group: 'B', team1: '🇨🇦 Canadá', team2: '🇶🇦 Qatar', date: 'Jun 18 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-18T15:00:00-04:00', venue: 'BC Place, Vancouver' },
    { id: 11, group: 'B', team1: '🏳️ ITA/NIR/WAL/BIH', team2: '🇶🇦 Qatar', date: 'Jun 23 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-23T19:30:00-04:00', venue: 'Estadio Boston' },
    { id: 12, group: 'B', team1: '🇨🇭 Suiza', team2: '🇨🇦 Canadá', date: 'Jun 23 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-23T19:30:00-04:00', venue: 'BC Place, Vancouver' },
    
    // GRUPO C
    { id: 13, group: 'C', team1: '🇧🇷 Brasil', team2: '🏳️ TUR/ROU/SVK/KOS', date: 'Jun 12 · 9:00 PM ET / 8:00 PM PE', dateTime: '2026-06-12T21:00:00-04:00', venue: 'Estadio Los Ángeles' },
    { id: 14, group: 'C', team1: '🇲🇦 Marruecos', team2: '🇨🇴 Colombia', date: 'Jun 13 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-13T15:00:00-04:00', venue: 'Estadio Seattle' },
    { id: 15, group: 'C', team1: '🇧🇷 Brasil', team2: '🇲🇦 Marruecos', date: 'Jun 19 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-19T15:00:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 16, group: 'C', team1: '🇨🇴 Colombia', team2: '🏳️ TUR/ROU/SVK/KOS', date: 'Jun 19 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-19T18:00:00-04:00', venue: 'Estadio Dallas' },
    { id: 17, group: 'C', team1: '🏳️ TUR/ROU/SVK/KOS', team2: '🇧🇷 Brasil', date: 'Jun 24 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-24T18:00:00-04:00', venue: 'Estadio Bahía de San Francisco' },
    { id: 18, group: 'C', team1: '🇨🇴 Colombia', team2: '🇲🇦 Marruecos', date: 'Jun 24 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-24T18:00:00-04:00', venue: 'Estadio Atlanta' },
    
    // GRUPO D
    { id: 19, group: 'D', team1: '🇺🇸 USA', team2: '🇵🇾 Paraguay', date: 'Jun 12 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-12T18:00:00-04:00', venue: 'Estadio Los Ángeles' },
    { id: 20, group: 'D', team1: '🇦🇺 Australia', team2: '🏳️ POL/ALB/UKR/SWE', date: 'Jun 13 · 9:00 PM ET / 8:00 PM PE', dateTime: '2026-06-13T21:00:00-04:00', venue: 'Estadio Boston' },
    { id: 21, group: 'D', team1: '🇺🇸 USA', team2: '🇦🇺 Australia', date: 'Jun 19 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-19T12:00:00-04:00', venue: 'Estadio Seattle' },
    { id: 22, group: 'D', team1: '🏳️ POL/ALB/UKR/SWE', team2: '🇵🇾 Paraguay', date: 'Jun 19 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-19T12:00:00-04:00', venue: 'Estadio Boston' },
    { id: 23, group: 'D', team1: '🇵🇾 Paraguay', team2: '🇦🇺 Australia', date: 'Jun 25 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-25T19:30:00-04:00', venue: 'Estadio Boston' },
    { id: 24, group: 'D', team1: '🏳️ POL/ALB/UKR/SWE', team2: '🇺🇸 USA', date: 'Jun 25 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-25T19:30:00-04:00', venue: 'Estadio Los Ángeles' },
    
    // GRUPO E
    { id: 25, group: 'E', team1: '🇩🇪 Alemania', team2: '🇨🇼 Curazao', date: 'Jun 14 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-14T12:00:00-04:00', venue: 'Estadio Seattle' },
    { id: 26, group: 'E', team1: '🇨🇮 Costa de Marfil', team2: '🇪🇨 Ecuador', date: 'Jun 14 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-14T15:00:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 27, group: 'E', team1: '🇪🇨 Ecuador', team2: '🇨🇼 Curazao', date: 'Jun 20 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-20T12:00:00-04:00', venue: 'GEHA Field, Kansas City' },
    { id: 28, group: 'E', team1: '🇩🇪 Alemania', team2: '🇨🇮 Costa de Marfil', date: 'Jun 20 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-20T15:00:00-04:00', venue: 'NRG Stadium, Houston' },
    { id: 29, group: 'E', team1: '🇨🇼 Curazao', team2: '🇨🇮 Costa de Marfil', date: 'Jun 25 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-25T19:30:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 30, group: 'E', team1: '🇪🇨 Ecuador', team2: '🇩🇪 Alemania', date: 'Jun 25 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-25T19:30:00-04:00', venue: 'Estadio Seattle' },
    
    // GRUPO F
    { id: 31, group: 'F', team1: '🇳🇱 Países Bajos', team2: '🇯🇵 Japón', date: 'Jun 14 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-14T12:00:00-04:00', venue: 'Estadio Atlanta' },
    { id: 32, group: 'F', team1: '🇳🇿 Nueva Zelanda', team2: '🇹🇳 Túnez', date: 'Jun 14 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-14T15:00:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 33, group: 'F', team1: '🇹🇳 Túnez', team2: '🇯🇵 Japón', date: 'Jun 20 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-20T12:00:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 34, group: 'F', team1: '🇳🇱 Países Bajos', team2: '🇳🇿 Nueva Zelanda', date: 'Jun 20 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-20T15:00:00-04:00', venue: 'Estadio Filadelfia' },
    { id: 35, group: 'F', team1: '🇹🇳 Túnez', team2: '🇳🇱 Países Bajos', date: 'Jun 25 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-25T19:30:00-04:00', venue: 'GEHA Field, Kansas City' },
    { id: 36, group: 'F', team1: '🇯🇵 Japón', team2: '🇳🇿 Nueva Zelanda', date: 'Jun 25 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-25T19:30:00-04:00', venue: 'Estadio Filadelfia' },
    
    // GRUPO G
    { id: 37, group: 'G', team1: '🇧🇪 Bélgica', team2: '🇪🇬 Egipto', date: 'Jun 15 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-15T12:00:00-04:00', venue: 'Estadio Los Ángeles' },
    { id: 38, group: 'G', team1: '🇮🇷 Irán', team2: '🇸🇦 Arabia Saudita', date: 'Jun 15 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-15T12:00:00-04:00', venue: 'Estadio Los Ángeles' },
    { id: 39, group: 'G', team1: '🇧🇪 Bélgica', team2: '🇮🇷 Irán', date: 'Jun 21 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-21T12:00:00-04:00', venue: 'Estadio Los Ángeles' },
    { id: 40, group: 'G', team1: '🇸🇦 Arabia Saudita', team2: '🇪🇬 Egipto', date: 'Jun 21 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-21T15:00:00-04:00', venue: 'Estadio Bahía de San Francisco' },
    { id: 41, group: 'G', team1: '🇮🇷 Irán', team2: '🇪🇬 Egipto', date: 'Jun 26 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-26T19:30:00-04:00', venue: 'Estadio Bahía de San Francisco' },
    { id: 42, group: 'G', team1: '🇸🇦 Arabia Saudita', team2: '🇧🇪 Bélgica', date: 'Jun 26 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-26T19:30:00-04:00', venue: 'Estadio Los Ángeles' },
    
    // GRUPO H
    { id: 43, group: 'H', team1: '🇪🇸 España', team2: '🇨🇻 Cabo Verde', date: 'Jun 15 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-15T12:00:00-04:00', venue: 'Estadio Atlanta' },
    { id: 44, group: 'H', team1: '🇺🇾 Uruguay', team2: '🇭🇹 Haití', date: 'Jun 15 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-15T15:00:00-04:00', venue: 'Miami Stadium' },
    { id: 45, group: 'H', team1: '🇪🇸 España', team2: '🇺🇾 Uruguay', date: 'Jun 21 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-21T12:00:00-04:00', venue: 'Estadio Atlanta' },
    { id: 46, group: 'H', team1: '🇭🇹 Haití', team2: '🇨🇻 Cabo Verde', date: 'Jun 21 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-21T15:00:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 47, group: 'H', team1: '🇺🇾 Uruguay', team2: '🇪🇸 España', date: 'Jun 26 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-26T19:30:00-04:00', venue: 'Estadio Monterrey' },
    { id: 48, group: 'H', team1: '🇨🇻 Cabo Verde', team2: '🇭🇹 Haití', date: 'Jun 26 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-26T19:30:00-04:00', venue: 'NRG Stadium, Houston' },
    
    // GRUPO I
    { id: 49, group: 'I', team1: '🇫🇷 Francia', team2: '🏳️ THA/SGP/CHN/MAR', date: 'Jun 15 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-15T18:00:00-04:00', venue: 'Estadio Dallas' },
    { id: 50, group: 'I', team1: '🇸🇳 Senegal', team2: '🇳🇴 Noruega', date: 'Jun 16 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-16T12:00:00-04:00', venue: 'Estadio Bahía de San Francisco' },
    { id: 51, group: 'I', team1: '🇫🇷 Francia', team2: '🇸🇳 Senegal', date: 'Jun 22 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-22T12:00:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 52, group: 'I', team1: '🇳🇴 Noruega', team2: '🏳️ THA/SGP/CHN/MAR', date: 'Jun 22 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-22T15:00:00-04:00', venue: 'MetLife Stadium, NY' },
    { id: 53, group: 'I', team1: '🏳️ THA/SGP/CHN/MAR', team2: '🇳🇴 Noruega', date: 'Jun 27 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-27T19:30:00-04:00', venue: 'Estadio Dallas' },
    { id: 54, group: 'I', team1: '🇸🇳 Senegal', team2: '🇫🇷 Francia', date: 'Jun 27 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-27T19:30:00-04:00', venue: 'MetLife Stadium, NY' },
    
    // GRUPO J
    { id: 55, group: 'J', team1: '🇦🇷 Argentina', team2: '🇩🇿 Algeria', date: 'Jun 16 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-16T15:00:00-04:00', venue: 'GEHA Field, Kansas City' },
    { id: 56, group: 'J', team1: '🇦🇹 Austria', team2: '🇯🇴 Jordania', date: 'Jun 16 · 6:00 PM ET / 5:00 PM PE', dateTime: '2026-06-16T18:00:00-04:00', venue: 'Estadio Boston' },
    { id: 57, group: 'J', team1: '🇦🇷 Argentina', team2: '🇦🇹 Austria', date: 'Jun 22 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-22T12:00:00-04:00', venue: 'Estadio Dallas' },
    { id: 58, group: 'J', team1: '🇯🇴 Jordania', team2: '🇩🇿 Algeria', date: 'Jun 22 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-22T12:00:00-04:00', venue: 'Estadio Boston' },
    { id: 59, group: 'J', team1: '🇯🇴 Jordania', team2: '🇦🇷 Argentina', date: 'Jun 27 · 10:00 PM ET / 9:00 PM PE', dateTime: '2026-06-27T22:00:00-04:00', venue: 'Estadio Dallas' },
    { id: 60, group: 'J', team1: '🇩🇿 Algeria', team2: '🇦🇹 Austria', date: 'Jun 27 · 10:00 PM ET / 9:00 PM PE', dateTime: '2026-06-27T22:00:00-04:00', venue: 'GEHA Field, Kansas City' },
    
    // GRUPO K
    { id: 61, group: 'K', team1: '🇺🇿 Uzbekistán', team2: '🇵🇦 Panamá', date: 'Jun 17 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-17T12:00:00-04:00', venue: 'Estadio Ciudad de México' },
    { id: 62, group: 'K', team1: '🇵🇹 Portugal', team2: '🏳️ JAM/NCL/COD/IRQ', date: 'Jun 17 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-17T15:00:00-04:00', venue: 'Estadio Bahía de San Francisco' },
    { id: 63, group: 'K', team1: '🇵🇦 Panamá', team2: '🏳️ JAM/NCL/COD/IRQ', date: 'Jun 23 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-23T12:00:00-04:00', venue: 'Estadio Atlanta' },
    { id: 64, group: 'K', team1: '🇵🇹 Portugal', team2: '🇺🇿 Uzbekistán', date: 'Jun 23 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-23T15:00:00-04:00', venue: 'Estadio Guadalajara' },
    { id: 65, group: 'K', team1: '🇵🇦 Panamá', team2: '🇵🇹 Portugal', date: 'Jun 27 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-27T19:30:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 66, group: 'K', team1: '🏳️ JAM/NCL/COD/IRQ', team2: '🇺🇿 Uzbekistán', date: 'Jun 27 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-27T19:30:00-04:00', venue: 'Estadio Atlanta' },
    
    // GRUPO L
    { id: 67, group: 'L', team1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', team2: '🇭🇷 Croacia', date: 'Jun 17 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-17T12:00:00-04:00', venue: 'Estadio Dallas' },
    { id: 68, group: 'L', team1: '🇬🇭 Ghana', team2: '🇨🇷 Costa Rica', date: 'Jun 17 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-17T15:00:00-04:00', venue: 'Estadio Filadelfia' },
    { id: 69, group: 'L', team1: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', team2: '🇬🇭 Ghana', date: 'Jun 23 · 12:00 PM ET / 11:00 AM PE', dateTime: '2026-06-23T12:00:00-04:00', venue: 'MetLife Stadium, NY' },
    { id: 70, group: 'L', team1: '🇨🇷 Costa Rica', team2: '🇭🇷 Croacia', date: 'Jun 23 · 3:00 PM ET / 2:00 PM PE', dateTime: '2026-06-23T15:00:00-04:00', venue: 'BMO Field, Toronto' },
    { id: 71, group: 'L', team1: '🇭🇷 Croacia', team2: '🇬🇭 Ghana', date: 'Jun 27 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-27T19:30:00-04:00', venue: 'Hard Rock Stadium, Miami' },
    { id: 72, group: 'L', team1: '🇨🇷 Costa Rica', team2: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra', date: 'Jun 27 · 7:30 PM ET / 6:30 PM PE', dateTime: '2026-06-27T19:30:00-04:00', venue: 'Estadio Filadelfia' }
];

let matches = [];
let participants = [];
let results = [];

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
        const listResult = await window.storage.list('participant:', false);
        const keys = listResult ? listResult.keys : [];
        participants = [];
        for (const key of keys) {
            const data = await storage.get(key);
            if (data) participants.push(data);
        }
    } catch (error) {
        console.log('No hay participantes guardados aún');
        participants = [];
    }

    // Cargar resultados
    const savedResults = await storage.get('results');
    results = savedResults || [];

    renderMatches();
    renderResults();
    updateLeaderboard();
    updateStats();
}

// Renderizar partidos para predicciones
function renderMatches() {
    const container = document.getElementById('matchesContainer');
    
    // Filtrar solo partidos válidos con grupo definido
    const validMatches = matches.filter(match => match.group !== undefined && match.group !== null);
    
    // Agrupar partidos por grupo
    const groupedMatches = {};
    validMatches.forEach(match => {
        if (!groupedMatches[match.group]) {
            groupedMatches[match.group] = [];
        }
        groupedMatches[match.group].push(match);
    });
    
    // Renderizar por grupos
    let html = '';
    Object.keys(groupedMatches).sort().forEach(group => {
        html += `
            <div class="group-predictions">
                <h4 class="group-predictions-title">Grupo ${group}</h4>
                ${groupedMatches[group].map(match => {
                    const locked = isMatchLocked(match);
                    const timeInfo = getTimeUntilLock(match);
                    const lockedClass = locked ? 'match-locked' : '';
                    const disabledAttr = locked ? 'disabled' : '';
                    
                    return `
                    <div class="match-prediction ${lockedClass}">
                        <div>
                            <span class="match-info">${match.date || ''}</span>
                            ${locked ? '<span class="match-status-locked">🔒 CERRADO</span>' : timeInfo ? `<span class="match-status-open">⏰ ${timeInfo}</span>` : ''}
                            <div class="team-name">${match.team1 || 'Equipo 1'}</div>
                        </div>
                        <input type="number" class="score-input" id="score1-${match.id}" min="0" max="20" value="0" placeholder="${locked ? '—' : '0'}" ${disabledAttr}>
                        <input type="number" class="score-input" id="score2-${match.id}" min="0" max="20" value="0" placeholder="${locked ? '—' : '0'}" ${disabledAttr}>
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
    const container = document.getElementById('resultsContainer');
    container.innerHTML = matches.map(match => {
        const result = results.find(r => r.matchId === match.id);
        const score1 = result ? result.score1 : '';
        const score2 = result ? result.score2 : '';
        
        return `
            <div class="match-prediction">
                <div class="team-name">${match.team1}</div>
                <input type="number" class="score-input" id="result1-${match.id}" min="0" max="20" value="${score1}" placeholder="?">
                <input type="number" class="score-input" id="result2-${match.id}" min="0" max="20" value="${score2}" placeholder="?">
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
    
    // Mostrar mensaje de éxito
    const container = document.getElementById('matchesContainer');
    container.insertAdjacentHTML('beforebegin', `
        <div class="success-message">
            ✅ Predicciones guardadas exitosamente para ${name}
        </div>
    `);

    // Limpiar formulario y mensaje después de 3 segundos
    setTimeout(() => {
        document.querySelector('.success-message')?.remove();
        document.getElementById('participantName').value = '';
        document.getElementById('predChampion').value = '';
        document.getElementById('predRunnerUp').value = '';
        document.getElementById('predTopScorer').value = '';
        document.getElementById('predTotalGoals').value = '';
        renderMatches();
    }, 3000);
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
    const totalParticipants = participants.length;
    const totalPredictions = participants.reduce((sum, p) => sum + p.predictions.length, 0);
    
    const scores = participants.map(p => calculatePoints(p.predictions, results).points);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;

    document.getElementById('totalParticipants').textContent = totalParticipants;
    document.getElementById('totalPredictions').textContent = totalPredictions;
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('topScore').textContent = topScore;

    renderCharts();
}

// Renderizar gráficos
function renderCharts() {
    const participantData = participants.map(p => ({
        name: p.name,
        ...calculatePoints(p.predictions, results)
    })).sort((a, b) => b.points - a.points);

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
                    backgroundColor: 'rgba(0, 217, 255, 0.6)',
                    borderColor: 'rgba(0, 217, 255, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: false 
                    }
                },
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
        
        window.accuracyChart = new Chart(accuracyCtx, {
            type: 'doughnut',
            data: {
                labels: participantData.map(p => p.name),
                datasets: [{
                    label: 'Resultados Exactos',
                    data: participantData.map(p => p.exact),
                    backgroundColor: [
                        'rgba(0, 217, 255, 0.8)',
                        'rgba(255, 51, 102, 0.8)',
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(0, 255, 136, 0.8)',
                        'rgba(102, 126, 234, 0.8)'
                    ],
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

    if (tabName === 'stats') {
        setTimeout(renderCharts, 100);
    }
}

// Iniciar aplicación
init();