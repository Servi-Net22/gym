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
| Admin | `admin@gymflow.local` | `admin123` |
| Empleado | `sofia@gymflow.local` | `empleado123` |

### Permisos

| Acción | Admin | Empleado |
|--------|-------|----------|
| Empleados / sueldos | Sí | No |
| Clientes, planes, pagos, barrera | Sí | Sí |
| Anular pagos | Sí | No |

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
