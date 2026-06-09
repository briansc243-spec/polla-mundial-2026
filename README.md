# ⚽ Polla Mundial ProntoPaga 2026

Aplicación web para la polla del Mundial FIFA 2026, desarrollada para ProntoPaga.

---

## 📁 Estructura del Proyecto

```
polla-mundial/
├── index.html          ← Página principal
├── css/
│   └── styles.css      ← Todos los estilos
├── js/
│   └── app.js          ← Toda la lógica de la aplicación
├── assets/             ← Imágenes, íconos, etc.
└── README.md           ← Este archivo
```

---

## 🚀 Cómo usar

1. Abre `index.html` en tu navegador (o usa Live Server en VS Code)
2. Inicia sesión con alguna de las credenciales:

| Usuario     | Contraseña      |
|-------------|-----------------|
| admin       | prontopaga2026  |
| usuario     | mundial2026     |
| prontopaga  | polla2026       |

---

## 🔧 Cómo personalizar

### Cambiar o agregar usuarios
Edita el objeto `VALID_CREDENTIALS` en `js/app.js`:
```js
const VALID_CREDENTIALS = {
    'admin':      'prontopaga2026',
    'usuario':    'mundial2026',
    'prontopaga': 'polla2026',
    'nuevo':      'mipassword123'   // ← agregar aquí
};
```

### Cambiar colores
Edita las variables CSS en `css/styles.css`:
```css
:root {
    --primary:   #00D9FF;   /* Cyan */
    --secondary: #FF3366;   /* Rojo/Rosa */
    --accent:    #FFD700;   /* Dorado */
    --dark:      #0A0E27;   /* Fondo principal */
}
```

### Sistema de puntos
Definido en `js/app.js` en la función `calculatePoints()`:
- ✅ **3 puntos** → Resultado exacto (ej: predijiste 2-1 y fue 2-1)
- ✅ **1 punto**  → Tendencia correcta (predijiste ganador o empate)
- ❌ **0 puntos** → Resultado incorrecto

---

## 🔒 Sistema de bloqueo de predicciones
Los partidos se bloquean automáticamente **30 minutos antes** de su inicio.
- Los partidos abiertos muestran ⏰ con cuenta regresiva
- Los partidos bloqueados muestran 🔒 CERRADO y deshabilitan los inputs

---

## 📋 Funcionalidades

| Sección          | Descripción                                               |
|------------------|-----------------------------------------------------------|
| 📝 Predicciones  | Registro de marcadores + predicciones especiales          |
| 🌍 Grupos        | Tablas de posiciones y calendario completo con horarios   |
| 🏆 Tabla         | Ranking de participantes en tiempo real                   |
| ⚡ Resultados    | Ingreso de resultados reales para calcular puntos         |
| 📊 Estadísticas  | Gráficos de distribución de puntos y exactitud            |

---

## 🌐 Tecnologías

- HTML5 / CSS3 / JavaScript (Vanilla)
- [Chart.js](https://www.chartjs.org/) — Gráficos
- [Google Fonts](https://fonts.google.com/) — Bebas Neue + Archivo
- Storage API (persistencia de datos entre sesiones)

---

## ⚙️ Requisitos

Solo necesitas un navegador moderno. No requiere servidor, backend ni instalación de dependencias.

> **Tip VS Code:** Instala la extensión **Live Server** y abre `index.html` con click derecho → "Open with Live Server" para ver cambios en tiempo real.
