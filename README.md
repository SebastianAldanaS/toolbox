# 🛠️ ToolBox - Multi-Tool Web Application

Una aplicación web moderna construida con Next.js 14+ que proporciona múltiples herramientas útiles para procesamiento de archivos multimedia y documentos.

![ToolBox](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4)

## ✨ Características

### 🎵 Herramientas de Audio
- **MP3 Downloader**: Descarga audio desde URLs de YouTube
- **Audio Converter**: Convierte entre diferentes formatos de audio
- **Audio Editor**: Editor básico de audio con recorte y ajustes
- **Audio Downloader**: Descarga archivos de audio desde URLs

### 🖼️ Herramientas de Imagen
- **Background Remover**: Elimina fondos de imágenes automáticamente
- **Image Converter**: Convierte entre formatos de imagen (JPG, PNG, WebP)
- **Image Resizer**: Redimensiona imágenes manteniendo calidad

### 📄 Herramientas de Documentos
- **PDF to Word**: Convierte documentos PDF a Word
- **Word to PDF**: Convierte documentos Word a PDF

### � Características de UI/UX
- **Tema Dark/Light**: Sistema completo de temas con next-themes
- **Responsive Design**: Optimizado para todos los dispositivos
- **Interfaz Moderna**: Construida con shadcn/ui y Tailwind CSS
- **Footer Global**: Navegación y enlaces consistentes

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.3.4 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Iconos**: Lucide React
- **Temas**: next-themes

### Backend & APIs
- **API Routes**: Next.js API Routes
- **Procesamiento de Audio**: FFmpeg, @distube/ytdl-core
- **Procesamiento de Imagen**: Sharp
- **Procesamiento de PDF**: pdf-lib, mammoth

### Herramientas de Desarrollo
- **Linting**: ESLint
- **Build**: Next.js optimizado para producción

## � Inicio Rápido

### Prerequisitos
- Node.js 18+ 
- npm o yarn
- Git

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/toolbox.git
   cd toolbox
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción

# Calidad de código
npm run lint         # Ejecuta ESLint

# Testing (scripts personalizados)
node test-production-quick.js     # Test rápido de funcionalidad
node test-load-stress.js         # Tests de carga y rendimiento
node run-all-tests.js           # Suite completa de tests
```

## 🎯 Estado de Herramientas

| Herramienta | UI | API | Tema | Estado |
|-------------|:--:|:---:|:----:|:------:|
| MP3 Downloader | ✅ | ✅ | ✅ | Completo |
| Audio Converter | ✅ | ✅ | ✅ | Completo |
| Audio Editor | ✅ | ✅ | ✅ | Completo |
| Audio Downloader | ✅ | ⚠️ | ✅ | En desarrollo |
| Background Remover | ✅ | ✅ | ✅ | Completo |
| Image Converter | ✅ | ✅ | ✅ | Completo |
| Image Resizer | ✅ | ✅ | ✅ | Completo |
| PDF to Word | ✅ | ✅ | ✅ | Completo |
| Word to PDF | ✅ | ✅ | ✅ | Completo |

## 🧪 Testing y Calidad

El proyecto incluye una suite completa de tests de producción:

### Métricas de Rendimiento
- ⚡ Tiempo de respuesta: **~115ms**
- 🏗️ Tiempo de build: **~45s**
- 📦 Bundle size: **~295kB**
- 🎯 Tasa de éxito: **100%**
- 🚀 Puntuación general: **93/100**

### Tests Disponibles
```bash
node test-production-quick.js     # Funcionalidad básica
node test-load-stress.js         # Rendimiento y carga
node production-final-report.js  # Análisis completo
node run-all-tests.js           # Suite completa
```

## 🌐 Deployment

### Vercel (Recomendado)
1. Push tu código a GitHub
2. Conecta tu repositorio en [Vercel](https://vercel.com)
3. Deploy automático

### Manual
```bash
npm run build
npm start
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

---

<div align="center">

**⭐ ¡Si te gusta este proyecto, dale una estrella! ⭐**

Made with ❤️ and Next.js

</div>

1. Clona el repositorio:
\`\`\`bash
git clone <repo-url>
cd toolbox
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
# o
yarn install
# o
pnpm install
\`\`\`

3. Ejecuta el servidor de desarrollo:
\`\`\`bash
npm run dev
# o
yarn dev
# o
pnpm dev
\`\`\`

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

\`\`\`
src/
├── app/                    # App Router de Next.js
│   ├── tools/             # Páginas de herramientas individuales
│   ├── api/               # API routes para procesamiento
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   └── ui/               # Componentes base de UI
├── lib/                  # Utilidades y configuraciones
└── types/                # Definiciones de TypeScript
\`\`\`

## 🔧 Desarrollo

### Agregar Nueva Herramienta

1. Define la herramienta en \`src/lib/tools.ts\`
2. Crea la página en \`src/app/tools/[tool-name]/page.tsx\`
3. Implementa la API en \`src/app/api/tools/[tool-name]/route.ts\`
4. Agrega los tipos necesarios en \`src/types/index.ts\`

### Scripts Disponibles

- \`npm run dev\` - Servidor de desarrollo
- \`npm run build\` - Construir para producción
- \`npm run start\` - Ejecutar build de producción
- \`npm run lint\` - Ejecutar ESLint

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la [Licencia MIT](LICENSE).

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push a la branch (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes algún problema o pregunta, por favor abre un [issue](https://github.com/username/toolbox/issues).
