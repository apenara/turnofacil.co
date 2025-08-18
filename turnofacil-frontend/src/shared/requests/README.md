# Módulo Compartido de Requests

Este módulo centraliza toda la lógica de negocio para el sistema de solicitudes/requests, eliminando la duplicación de código entre los diferentes dashboards.

## 🏗️ Arquitectura

```
src/shared/requests/
├── core/                  # Tipos, constantes y permisos fundamentales
│   ├── types.ts          # Definiciones de tipos TypeScript
│   ├── constants.ts      # Configuración de tipos de requests y constantes
│   └── permissions.ts    # Sistema de permisos por rol
├── services/             # Servicios de negocio
│   ├── RequestService.ts # CRUD y operaciones principales
│   └── ApprovalService.ts # Flujo de aprobaciones
├── hooks/               # React hooks para estado y lógica
│   ├── useRequestCore.ts # Hook principal con variantes por rol
│   └── useRequestFilters.ts # Hook para filtros avanzados
├── components/          # Componentes React universales
│   ├── UniversalRequestList.tsx # Lista adaptable para todos los roles
│   ├── RequestModal.tsx # Modal para ver/crear/editar
│   ├── RequestForm.tsx  # Formulario paso a paso
│   └── index.ts
└── index.ts            # Punto de entrada principal
```

## 🚀 Uso Básico

### 1. Crear contexto de requests

```typescript
import { createSimpleRequestContext } from '@/shared/requests'

const context = createSimpleRequestContext({
  id: 'user123',
  name: 'Juan Pérez',
  email: 'juan@company.com',
  role: 'SUPERVISOR',
  locationId: 'location-001'
})
```

### 2. Usar hook según rol

```typescript
import { useRequestsForRole } from '@/shared/requests'

function Dashboard() {
  const {
    requests,
    isLoading,
    createRequest,
    approveRequest,
    // ... más acciones
  } = useRequestsForRole(context)
  
  // El hook se configura automáticamente según el rol del usuario
}
```

### 3. Componente universal

```typescript
import { UniversalRequestList } from '@/shared/requests'

function RequestsDashboard() {
  return (
    <UniversalRequestList
      context={context}
      mode="supervisor"  // 'employee' | 'supervisor' | 'business_admin' | 'custom'
      showFilters={true}
      showBulkActions={true}
      showMetrics={true}
      onRequestSelect={(request) => setSelectedRequest(request)}
    />
  )
}
```

## 🎛️ Configuración por Rol

### Employee (Empleado)
- ✅ Crear sus propias requests
- ✅ Ver solo sus requests
- ❌ Aprobar/rechazar requests
- ❌ Ver requests de otros
- ❌ Acciones en masa

### Supervisor
- ✅ Todo lo del empleado
- ✅ Ver requests de su equipo/ubicación
- ✅ Aprobar/rechazar (primera instancia)
- ✅ Escalar requests a Business Admin
- ✅ Acciones en masa en su equipo

### Business Admin
- ✅ Acceso completo
- ✅ Ver todas las requests de todas las ubicaciones
- ✅ Aprobar/rechazar en cualquier etapa
- ✅ Decisiones finales en escalaciones
- ✅ Analytics completo

## 📋 Tipos de Requests Soportados

| Tipo | Nombre | Aprobación Requerida | Urgente |
|------|--------|---------------------|---------|
| `shift_change` | Cambio de turno | Supervisor | ✅ |
| `vacation` | Vacaciones | Supervisor + Business Admin | ❌ |
| `sick_leave` | Incapacidad médica | Auto/Supervisor* | ✅ |
| `personal_leave` | Permiso personal | Supervisor | ✅ |
| `time_off` | Día libre | Supervisor | ✅ |
| `absence` | Reporte de ausencia | Solo informativo | ✅ |
| `overtime` | Horas extra | Supervisor + Business Admin | ❌ |
| `early_leave` | Salida temprana | Supervisor | ✅ |
| `late_arrival` | Llegada tardía | Solo informativo | ❌ |

*Con certificado médico

## 🎨 Componentes Disponibles

### UniversalRequestList
Lista completa con filtros, búsqueda, métricas y acciones.

```typescript
<UniversalRequestList
  context={context}
  mode="supervisor"           // Modo de operación
  showFilters={true}          // Mostrar filtros
  showBulkActions={true}      // Acciones en masa
  showMetrics={true}          // Métricas en la parte superior
  maxHeight="600px"           // Altura máxima
  onRequestSelect={handler}   // Callback selección
  onRequestAction={handler}   // Callback acciones personalizadas
  customFilters={{            // Filtros iniciales
    status: 'pending',
    priority: 'high'
  }}
/>
```

### RequestModal
Modal para ver/crear/editar requests con validación completa.

```typescript
<RequestModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  context={context}
  mode="create"               // 'create' | 'edit' | 'view'
  request={selectedRequest}   // Para edit/view
  onSave={handleSave}        // Callback guardar
  onDelete={handleDelete}    // Callback eliminar
/>
```

### RequestForm
Formulario paso a paso para crear/editar requests.

```typescript
<RequestForm
  context={context}
  mode="create"              // 'create' | 'edit'
  request={selectedRequest}  // Para edit
  onSubmit={handleSubmit}    // Callback envío
  onCancel={handleCancel}    // Callback cancelar
/>
```

## 🔐 Sistema de Permisos

```typescript
import { RequestPermissionManager } from '@/shared/requests'

const permissionManager = new RequestPermissionManager(context)

// Verificar permisos específicos
if (permissionManager.can('canApproveRequests')) {
  // Mostrar botón de aprobar
}

// Verificar permisos sobre request específica
if (permissionManager.canManageRequest(request, 'approve')) {
  // Mostrar acción aprobar para esta request
}

// Obtener configuración de UI según rol
const uiConfig = permissionManager.getUIConfig()
// {
//   showCreateButton: true,
//   showBulkActions: true,
//   showAnalytics: true,
//   compactMode: false,
//   ...
// }
```

## 📊 Hooks Disponibles

### useRequestCore
Hook principal con configuración completa.

```typescript
const {
  requests,            // Array de requests
  selectedRequest,     // Request seleccionada
  metrics,            // Métricas calculadas
  analytics,          // Analytics (si habilitado)
  isLoading,          // Estado de carga
  error,              // Error si existe
  
  // Acciones CRUD
  createRequest,
  updateRequest,
  deleteRequest,
  
  // Acciones de aprobación
  approveRequest,
  rejectRequest,
  escalateRequest,
  
  // Acciones en masa
  bulkApprove,
  bulkReject,
  
  // Utilidades
  canPerformAction,
  setSelectedRequest
} = useRequestCore({
  context,
  autoRefresh: true,
  refreshInterval: 30000,
  enableAnalytics: true,
  enableMetrics: true,
  initialFilters: { status: 'pending' }
})
```

### useRequestFilters
Hook especializado para filtros avanzados.

```typescript
const {
  filters,              // Filtros activos
  setFilter,           // Cambiar filtro específico
  clearFilters,        // Limpiar todos
  applyPreset,         // Aplicar preset ('pending_approval', 'urgent_requests', etc.)
  availableTypes,      // Tipos disponibles con conteos
  availableStatuses,   // Estados disponibles con conteos
  activeFiltersCount,  // Número de filtros activos
  quickSearch,         // Búsqueda rápida
  searchInFields       // Búsqueda en campos específicos
} = useRequestFilters(context, requests)
```

## 🎯 Presets de Filtros

```typescript
// Aplicar filtros predefinidos
applyPreset('pending_approval')    // Pendientes de aprobación
applyPreset('urgent_requests')     // Requests urgentes
applyPreset('recent_requests')     // Requests recientes
applyPreset('escalated_requests')  // Requests escaladas
applyPreset('my_requests')         // Mis requests (empleados)
```

## 🔄 Migración desde Código Existente

### Antes (código duplicado)
```typescript
// En cada dashboard diferentes implementaciones
const [requests, setRequests] = useState([])
const [isLoading, setIsLoading] = useState(false)
// ... lógica específica duplicada
```

### Después (módulo compartido)
```typescript
import { useRequestsForRole } from '@/shared/requests'

const { requests, isLoading, approveRequest } = useRequestsForRole(context)
// Toda la lógica centralizada y optimizada
```

## 🏆 Beneficios

- **DRY**: Elimina duplicación entre dashboards
- **Consistencia**: Misma lógica en toda la aplicación  
- **Mantenibilidad**: Un solo lugar para cambios
- **Performance**: Hooks optimizados con cache
- **TypeScript**: Tipado completo y seguro
- **Modular**: Componentes reutilizables
- **Flexible**: Adaptable a diferentes roles y casos de uso