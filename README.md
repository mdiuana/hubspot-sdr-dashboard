# HubSpot SDR Dashboard 📅

Dashboard de reuniones diarias para el equipo de SDRs de All In Agency.

## ✨ Features

- 📊 Vista de todas las reuniones agendadas para HOY
- 🔍 Filtros por SDR (Jose, Diego, Antonia, Pedro)
- 📈 Stats en tiempo real:
  - Total de reuniones del día
  - Por Teléfono (PR Agendada FONO)
  - Por WhatsApp (PR Agendada WTSP)
  - Re-agendadas (Pr RE-Agendada)
- 🔄 Auto-refresh cada 60 segundos
- 🎯 Integración directa con HubSpot API
- 💼 Muestra: contacto, empresa, SDR asignado, ejecutivo, fecha de agendamiento
- 🔴 Indicador "EN VIVO" para reuniones en curso

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **API:** HubSpot CRM API
- **Deploy:** Vercel
- **Language:** TypeScript

## 📋 Datos de HubSpot

El dashboard consulta contactos de HubSpot con estas propiedades:

| Propiedad HubSpot | Nombre Técnico | Uso |
|---|---|---|
| Próxima Reunión | `proxima_reunion` | Fecha/hora de la reunión |
| ESTADO PROSPECCIÓN | `estado_prospeccion_vol2` | Filtro (PR Agendada FONO, PR Agendada WTSP, Pr RE-Agendada) |
| Propietario del contacto | `hubspot_owner_id` | SDR asignado |
| Nombre | `firstname` | Nombre del lead |
| Apellidos | `lastname` | Apellidos del lead |
| EJECUTIVO QUE TOMA LA REUNION | `ejecutivo_que_toma_la_reunion` | Ejecutivo asignado |
| FECHA AGENDAMIENTO | `fecha_agendamiento` | Fecha en que se agendó |

## 🔧 Setup Local

### 1. Clonar repo
```bash
git clone <repo-url>
cd hubspot-dashboard
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar HubSpot API
Crear archivo `.env.local`:
```bash
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxxxxxxxxxxxxxxx
```

**Cómo obtener el token:**
1. HubSpot → Settings → Integrations → Private Apps
2. Create private app
3. **Scopes necesarios:**
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.objects.owners.read` (opcional, para nombres de SDRs)
4. Copy token

### 4. Correr desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy a Vercel

### Opción 1: GitHub → Vercel (Recomendado)

1. Push código a GitHub
2. Conecta repo en [vercel.com](https://vercel.com)
3. Agrega variable de entorno: `HUBSPOT_ACCESS_TOKEN`
4. Deploy automático ✅

### Opción 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

Sigue las instrucciones y agrega el `HUBSPOT_ACCESS_TOKEN` cuando te lo pida.

## 📊 Uso

### Filtros
- **Todos:** Muestra todas las reuniones del día
- **Por SDR:** Click en nombre del SDR para filtrar sus reuniones

### Auto-refresh
- El dashboard se actualiza automáticamente cada 60 segundos
- Botón de refresh manual disponible arriba a la derecha

### Indicadores
- 🔴 **EN VIVO:** Reunión en curso (±30 minutos de la hora agendada)
- Badges de colores por tipo de agendamiento (Fono/WhatsApp/Re-agendada)

## 🔐 Seguridad

- Token de HubSpot NUNCA se expone al cliente
- Todas las queries a HubSpot son server-side (Next.js API routes)
- Variable de entorno en Vercel con acceso restringido

## 🐛 Troubleshooting

### "Error fetching meetings"
- Verifica que el token de HubSpot sea válido
- Confirma que los scopes están configurados correctamente
- Revisa logs en Vercel o consola local

### "No hay reuniones para mostrar"
- Verifica que existan contactos con `proxima_reunion = HOY`
- Confirma que `estado_prospeccion_vol2` sea uno de los 3 válidos
- Revisa filtros de SDR

### Build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 📝 Notas

- Los nombres técnicos de propiedades de HubSpot se obtuvieron con `scripts/list-properties.js`
- Timezone: Ajustado a Chile (GMT-3/GMT-4)
- Auto-refresh configurado a 60seg (editable en `dashboard.tsx`)

## 🤝 Soporte

Creado por Kaiser para All In Agency.
Para cambios o mejoras, contacta al equipo de tecnología.

---

**Versión:** 1.0.0  
**Última actualización:** Marzo 2026
