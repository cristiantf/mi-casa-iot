
# MiCasaApp - Aplicación IoT Doméstica

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Capacitor](https://img.shields.io/badge/capacitor-374955?style=for-the-badge&logo=capacitor&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

Este proyecto es una aplicación móvil multiplataforma desarrollada con React y Capacitor, diseñada para la gestión y monitorización de dispositivos IoT en el hogar. La aplicación se comunica con un servidor backend simple construido con Express.js que gestiona los datos a través de una base de datos SQLite.

## ✨ Características Principales

- **Frontend Moderno:** Interfaz de usuario creada con React y componentes `lucide-react` para una experiencia limpia y moderna.
- **Multiplataforma:** Gracias a Capacitor, la misma base de código se puede ejecutar de forma nativa en Android e iOS.
- **Backend Ligero:** Servidor Express.js para gestionar la lógica de negocio y la comunicación con la base de datos.
- **Persistencia de Datos:** Uso de SQLite para un almacenamiento de datos local y eficiente en el servidor.

## folder_structure: Estructura del Proyecto

```
mi-casa-iot/
├── android/            # Archivos de configuración y proyecto nativo de Android.
├── build/              # Archivos de producción generados por React.
├── public/             # Archivos estáticos y el `index.html` principal.
├── src/                # Código fuente de la aplicación React.
│   ├── App.js          # Componente principal de la aplicación.
│   └── ...
├── capacitor.config.ts # Configuración principal de Capacitor.
├── package.json        # Dependencias y scripts del proyecto.
└── ...
```

## 🚀 Empezando

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 16 o superior recomendada)
- [Android Studio](https://developer.android.com/studio) (para ejecutar en Android)

### Instalación

1.  **Clona el repositorio (si aplica):**
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd mi-casa-iot
    ```

2.  **Instala las dependencias del proyecto:**
    Este comando instalará todas las dependencias necesarias tanto para el frontend de React como para el backend de Express.
    ```bash
    npm install
    ```

## 📜 Scripts Disponibles

En el directorio del proyecto, puedes ejecutar los siguientes comandos:

### `npm start`

Ejecuta la aplicación en modo de desarrollo.
Abre [http://localhost:3000](http://localhost:3000) para verla en tu navegador.

La página se recargará automáticamente si realizas cambios en el código.

### `npm test`

Inicia el corredor de pruebas en modo interactivo.

### `npm run build`

Compila la aplicación para producción en la carpeta `build`.
Prepara la aplicación React para ser desplegada o usada por Capacitor.

## 📱 Uso con Capacitor

Para ejecutar la aplicación en un dispositivo móvil o emulador.

1.  **Sincroniza tu web app con el proyecto nativo:**
    Cada vez que realices cambios significativos en la parte web (después de hacer `npm run build`), ejecuta:
    ```bash
    npx cap sync
    ```
    Este comando actualizará los assets de tu proyecto nativo.

2.  **Abre el proyecto en Android Studio:**
    ```bash
    npx cap open android
    ```
    Desde Android Studio, puedes ejecutar la aplicación en un emulador o en un dispositivo físico conectado.

##  backend: Servidor Express

El proyecto incluye un servidor simple para manejar las peticiones de la API. Para iniciarlo, necesitarás ejecutar el archivo principal del servidor (por ejemplo, `server.js` si existe) en un terminal separado.

*Nota: La configuración y el arranque del servidor pueden requerir pasos adicionales dependiendo de la implementación final.*
