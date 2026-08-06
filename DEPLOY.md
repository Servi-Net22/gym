# Despliegue: Supabase + Vercel + Resend + dominio Donweb

## Arquitectura

| Servicio | Rol |
|----------|-----|
| **Supabase** | PostgreSQL (datos) |
| **Vercel** | App Next.js (API, login, pagos, QR) |
| **Resend** | Emails (altas, pagos, anulaciones) |
| **Donweb** | Dominio / DNS apuntando a Vercel |

El hosting **estático** de Donweb no corre esta app. El dominio de Donweb sí se usa con Vercel.

### Si ya usás servi-net.com.ar

Recomendado: **proyecto nuevo** en cada servicio (no mezclar BD ni env vars con la web actual).

| Servicio | Acción sugerida |
|----------|-----------------|
| Supabase | Nuevo proyecto, ej. `gymflow` |
| Vercel | Nuevo proyecto desde este repo |
| Resend | Misma cuenta; from `GymFlow <noreply@servi-net.com.ar>` o un subdominio |
| Dominio | Subdominio, ej. `gym.servi-net.com.ar` → Vercel |

Así servi-net.com.ar sigue intacto y GymFlow vive en su propio espacio.

---

## 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. **Project Settings → Database**:
   - Copiá **Connection string → Transaction pooler** → `DATABASE_URL` (puerto `6543`, agregá `?pgbouncer=true` si no viene).
   - Copiá **Direct connection** → `DIRECT_URL` (puerto `5432`).
3. En tu PC, con el `.env` completo:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
```

---

## 2. Resend

1. Cuenta en [resend.com](https://resend.com).
2. Creá un API Key → `RESEND_API_KEY`.
3. Para producción: verificá tu dominio (el de Donweb) y usá  
   `RESEND_FROM="GymFlow <noreply@tudominio.com>"`.
4. Para pruebas: `RESEND_FROM="GymFlow <onboarding@resend.dev>"` (solo envía a tu email de Resend).

Emails que envía GymFlow:

- Alta de cliente (si tiene email)
- Credenciales de empleado nuevo
- Pago confirmado
- Transferencia pendiente (referencia)
- Link Mercado Pago
- Pago anulado

---

## 3. Vercel

1. Subí el repo a GitHub/GitLab.
2. Importá el proyecto en [vercel.com](https://vercel.com).
3. Framework: **Next.js** (detectado solo).
4. Variables de entorno (Production + Preview):

```
DATABASE_URL
DIRECT_URL
AUTH_SECRET
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_APP_NAME
RESEND_API_KEY
RESEND_FROM
TRANSFER_ALIAS
BARRIER_API_KEY
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_DEMO
```

5. El archivo `vercel.json` ya usa `npm run vercel-build`  
   (`prisma generate` + `migrate deploy` + `next build`).

6. Deploy. Anotá la URL `https://xxx.vercel.app`.

---

## 4. Dominio Donweb → Vercel

1. En Vercel: **Project → Settings → Domains** → agregá `tudominio.com` y `www.tudominio.com`.
2. Vercel te muestra registros DNS. En el panel DNS de **Donweb**:

| Tipo | Nombre | Valor |
|------|--------|--------|
| **A** | `@` | `76.76.21.21` (IP que indique Vercel) |
| **CNAME** | `www` | `cname.vercel-dns.com` (o el que indique Vercel) |

3. Esperá la propagación DNS (minutos a unas horas).
4. Actualizá en Vercel:

```
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

5. En Resend, verificá ese mismo dominio para mails desde `@tudominio.com`.

---

## 5. Post-deploy

1. Entrá a `https://tudominio.com/login`
2. `admin@gymflow.local` / `admin123` (cambiá la clave en producción)
3. Probá un cobro y revisá que llegue el mail.
4. Webhook Mercado Pago:  
   `https://tudominio.com/api/payments/mercadopago/webhook`

---

## Local con Supabase

```bash
cp .env.example .env
# completá DATABASE_URL, DIRECT_URL, RESEND_API_KEY, AUTH_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```
