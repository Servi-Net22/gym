# GymFlow — Gestión de gimnasio

Sistema para clientes, empleados, planes, pagos (efectivo / transferencia / Mercado Pago), QR y barrera.

## Stack de producción

| Pieza | Servicio |
|-------|----------|
| App | **Vercel** (Next.js) |
| Base de datos | **Supabase** (PostgreSQL) |
| Emails | **Resend** |
| Dominio | **Donweb** (DNS → Vercel) |

Guía completa: [DEPLOY.md](./DEPLOY.md)

## Desarrollo local

1. Copiá `.env.example` → `.env` y completá `DATABASE_URL` + `DIRECT_URL` de Supabase.
2. Instalación:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

3. Abrí [http://localhost:3000](http://localhost:3000)

### Usuarios demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Superadmin (plataforma) | `admin@gymflow.local` | `admin123` |
| Empleado | `sofia@gymflow.local` | `empleado123` |

El seed crea `admin@gymflow.local` como **SUPERADMIN**. Desde el panel → **Comercios** (`/organizaciones`) podés dar de alta nuevos gimnasios y su primer ADMIN. En deploys ya migrados sin re-seed, la migración `20260806194600_promote_platform_superadmin` promueve ese email si existe.

### Multi-tenant (comercios)

- Cada organización tiene `slug` único.
- Portal clientes: `/mi/{slug}/login` (ej. `/mi/gymflow/login`).
- Staff del comercio inicia sesión en `/login` (email global único).
- Solo SUPERADMIN ve y gestiona `/organizaciones`. El ADMIN de un comercio edita solo su tenant en **Configuración**.

### Permisos

| Acción | Superadmin | Admin | Empleado |
|--------|------------|-------|----------|
| Comercios (`/organizaciones`) | Sí | No | No |
| Empleados / sueldos | Sí* | Sí | No |
| Clientes, planes, pagos, barrera | Sí* | Sí | Sí |
| Anular pagos | Sí* | Sí | No |
| Configuración del propio comercio | Sí* | Sí | No |

\*El superadmin opera sobre la org a la que está anclado (por defecto la demo `gymflow`); no ve datos de otros tenants en esas pantallas.

## Módulos

- Panel, Clientes (formulario + QR), Empleados, Planes, Pagos, Acceso/Barrera
- **App cliente PWA** en `/mi` (DNI + PIN, QR, cuenta, novedades/rutinas/dietas)
- Contenidos PWA desde el panel (`/contenidos`)
- Pagos: registro manual o cobro automático
- Auditoría: quién registró / quién anuló + motivo
- Emails (Resend): altas, pagos, links MP, anulaciones

### App del cliente (demo)

- URL: `/mi/login`
- DNI `30111222` · PIN `1234`
- En el celular: menú del navegador → “Agregar a pantalla de inicio”

## Barrera QR

```http
POST /api/access/validate
x-api-key: <BARRIER_API_KEY>
{ "qrToken": "GYM-..." }
```
