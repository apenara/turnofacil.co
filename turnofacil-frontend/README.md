# TurnoFacil CO - Frontend

Frontend de la plataforma TurnoFacil CO, una aplicación SaaS para la gestión de horarios laborales en Colombia.

## 🚀 Características

- **Landing Page completa** con secciones de beneficios, precios y contacto
- **Sistema de autenticación** unificado para 4 roles diferentes
- **Flujo de registro** de empresas en 4 pasos
- **Dashboards específicos** para cada rol:
  - Super Administrador (gestión de la plataforma)
  - Administrador de Negocio (gestión de empresa)
  - Supervisor (gestión de equipo)
  - Colaborador (vista personal)

## 🛠️ Stack Tecnológico

- **Next.js 15** con App Router
- **TypeScript** para tipado estático
- **Tailwind CSS** con design system personalizado
- **React Context** para manejo de estado de autenticación
- **Heroicons** para iconografía

## 🎨 Design System

El proyecto implementa el **Design System Andino** con:
- Paleta de colores primaria: `#0D9488` (Teal)
- Paleta secundaria: `#F59E0B` (Amber)
- Tipografía: `Inter`
- Componentes reutilizables: Button, Input, Card, Modal, Tag

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

1. **Clonar el repositorio** (si está en git)
   ```bash
   git clone <repository-url>
   cd turnofacil-frontend
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

## 🧪 Cuentas de Prueba

Para probar las diferentes funcionalidades, usa estas cuentas (contraseña: `password123`):

| Rol | Email | Descripción |
|-----|-------|-------------|
| **Super Admin** | `superadmin@turnofacil.co` | Gestión completa de la plataforma |
| **Admin Negocio** | `admin@empresa.com` | Administración de empresa |
| **Supervisor** | `supervisor@empresa.com` | Gestión de equipo |
| **Colaborador** | `empleado@empresa.com` | Portal del empleado |

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Rutas de Next.js (App Router)
│   ├── (public)/          # Páginas públicas
│   ├── admin/             # Dashboard Super Admin
│   ├── business/          # Dashboard Admin Negocio
│   ├── supervisor/        # Dashboard Supervisor
│   ├── employee/          # Portal Colaborador
│   ├── login/             # Autenticación
│   └── register/          # Registro de empresas
├── components/
│   ├── ui/                # Componentes del Design System
│   ├── shared/            # Componentes compartidos
│   └── calendar/          # Componentes de calendario
├── lib/
│   ├── auth/              # Lógica de autenticación
│   └── permissions/       # Sistema de permisos
└── styles/                # Estilos globales
```

## 🔐 Sistema de Roles y Permisos

### Roles Disponibles

1. **SUPER_ADMIN**: Gestión global de la plataforma
2. **BUSINESS_ADMIN**: Administrador de empresa
3. **SUPERVISOR**: Supervisor de equipo
4. **EMPLOYEE**: Colaborador/empleado

### Flujo de Autenticación

- Login unificado con redirección automática según rol
- Context API para manejo de estado global
- Guards de ruta para protección por permisos
- Persistencia en localStorage

## 🎯 User Stories Implementadas

### Super Administrador (SA)
- ✅ SA-01: Aprobar registro de empresas
- ✅ SA-02: Dashboard con métricas clave
- ✅ SA-03: Suspender/reactivar empresas

### Administrador de Negocio (BA)
- ✅ BA-01: Configurar perfil de empresa
- ✅ BA-02: Gestionar usuarios
- ✅ BA-03: Aprobar horarios
- ✅ BA-04: Ver reportes

### Supervisor (SP)
- ✅ SP-01: Crear horarios con calendario
- ✅ SP-02: Enviar para aprobación
- ✅ SP-03: Gestionar solicitudes del equipo

### Colaborador (EM)
- ✅ EM-01: Ver horario personal
- ✅ EM-02: Recibir notificaciones
- ✅ EM-03: Solicitar cambios de turno
- ✅ EM-04: Reportar ausencias

## 🚧 Funcionalidades Pendientes

- Planificador de calendario drag & drop
- Sistema de notificaciones en tiempo real
- Generación y exportación de reportes
- Configuración de tipos de trabajador
- Integración con APIs de backend

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Iniciar en producción
npm run start

# Linting
npm run lint
```

## 🎨 Customización del Design System

Los colores y estilos se pueden modificar en `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        main: '#0D9488',    // Teal principal
        light: '#5EEAD4',   // Teal claro
        dark: '#047857',    // Teal oscuro
      },
      secondary: {
        main: '#F59E0B',    // Amber principal
        // ...
      }
    }
  }
}
```

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 **Mobile**: 320px+
- 📱 **Tablet**: 768px+
- 💻 **Desktop**: 1024px+

## 🔧 Configuración de Desarrollo

### Variables de Entorno
Crear un archivo `.env.local`:

```bash
# API endpoints (cuando se implemente backend)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Configuración de autenticación
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### ESLint y Prettier
El proyecto incluye configuración para:
- ESLint para linting de código
- Prettier para formateo automático
- Husky para git hooks (opcional)

## 🚀 Deployment

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Otras Plataformas
- **Netlify**: Compatible con build estático
- **AWS S3 + CloudFront**: Para hosting estático
- **Docker**: Dockerfile incluido (opcional)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Contacto

- **Email**: dev@turnofacil.co
- **Website**: https://turnofacil.co
- **Documentación**: [Ver docs completos](./docs)

---

⚡ **Desarrollado con Next.js y ❤️ para optimizar la gestión de horarios en Colombia**