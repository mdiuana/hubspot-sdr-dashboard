# Tasa de Presentacion - Design Spec

## Overview

Nueva seccion en la vista SDR HOY que muestra cuantas reuniones se han presentado vs cuantas deberian haber ocurrido, con ratio global y desglose por cliente.

**Ubicacion**: Entre "Reuniones por Cliente" (ClientStats) y "Reuniones del Dia" (MeetingsTable).

## Definiciones

- **Fecha efectiva de reunion**: `fecha_reunion_reagendada` si tiene valor, sino `proxima_reunion`
- **Reunion agendada (denominador)**: Contacto con estado valido cuya fecha efectiva cae dentro del rango seleccionado Y es <= hoy
- **Reunion presentada (numerador)**: De las agendadas, las que tienen `nm_presentada_2 === 'Si'`
- **Cliente**: Campo `fax` del contacto (patron existente en el proyecto)

## Backend

### Endpoint: `GET /api/stats/presentadas`

**Query params**:
- `period`: `month` (default) | `day`
- `from`: `YYYY-MM-DD` (solo cuando `period=day`)
- `to`: `YYYY-MM-DD` (solo cuando `period=day`)

**Logica**:
1. Llama a `getAllWhitelistedBookedContacts` con `fecha_reunion_reagendada` como extra property
2. Para cada contacto:
   - Calcula fecha efectiva = `fecha_reunion_reagendada` || `proxima_reunion`
   - Parsea a timestamp (mismo patron que proxima_reunion: puede venir como ISO o ms)
3. Filtra: fecha efectiva dentro del rango Y <= ahora (Date.now())
4. Agrupa por cliente (`fax`), cuenta agendadas y presentadas
5. Calcula ratio por cliente y total global

**Response**:
```json
{
  "success": true,
  "period": "month",
  "total": { "agendadas": 22, "presentadas": 14, "ratio": 0.636 },
  "clients": [
    { "name": "GFIRMEX", "agendadas": 10, "presentadas": 7, "ratio": 0.7 },
    { "name": "CHILEXPR", "agendadas": 5, "presentadas": 3, "ratio": 0.6 }
  ]
}
```

### Cambio en `src/lib/hubspot.ts`

Agregar `fecha_reunion_reagendada` al array de properties en `getAllWhitelistedBookedContacts` y al type `HubSpotContact.properties`.

## Frontend

### Componente: `PresentationRate` (`src/components/presentation-rate.tsx`)

Self-contained (mismo patron que ClientStats): maneja su propio fetch, estado, loading y auto-refresh.

**Header**:
- Icono + titulo "Tasa de Presentacion"
- Subtitulo con total: "14/22 presentadas (64%)" o "Cargando..."
- Toggle Mes/Rango con DateRangePicker (reutiliza el componente existente)

**Body**:
- Grid de cards por cliente (mismo layout que ClientStats: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6`)
- Cada card muestra:
  - Numero grande: porcentaje (ej: "70%")
  - Nombre del cliente (texto pequeno)
  - Texto secundario: "7/10 presentadas"
- Barra de progreso visual del porcentaje
- Color de la barra segun porcentaje (verde >= 70%, azul >= 50%, ambar >= 30%, rojo < 30%)

**Auto-refresh**: Cada 5 minutos, escalonado respecto a los otros refreshes del dashboard.

**Skeleton loading**: Mismo patron que ClientStats.

### Integracion en `dashboard.tsx`

Importar `PresentationRate` e insertar entre `<ClientStats />` y el cierre de `</section>`, dentro del mismo flujo de la vista SDR HOY.

```tsx
{/* ClientStats */}
<ClientStats />

{/* Tasa de Presentacion - NUEVO */}
<PresentationRate />

</section>

{/* MeetingsTable */}
```

## Archivos

| Archivo | Accion |
|---|---|
| `src/lib/hubspot.ts` | Agregar `fecha_reunion_reagendada` a properties y tipo |
| `src/app/api/stats/presentadas/route.ts` | **Nuevo** - endpoint API |
| `src/components/presentation-rate.tsx` | **Nuevo** - componente UI |
| `src/components/dashboard.tsx` | Importar e insertar `<PresentationRate />` |

## Estilos

Reutiliza los patrones visuales existentes:
- `glass` / `glass-sm` para contenedores
- `card-lift` / `animate-fade-in-up` para animaciones
- Gradientes por cliente de `CLIENT_META` (misma paleta que ClientStats)
- `DateRangePicker` existente para seleccion de rango
- `useCountUp` hook para animacion de numeros (mismo patron que ClientStats)
