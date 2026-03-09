const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// HubSpot portal timezone: EST (UTC-5)
const EST_OFFSET_MS = 5 * 60 * 60 * 1000;

/**
 * Retorna la fecha de hoy en EST como string YYYY-MM-DD.
 */
export function getTodayDateEST(): string {
  const nowEST = new Date(Date.now() - EST_OFFSET_MS);
  const y = nowEST.getUTCFullYear();
  const m = String(nowEST.getUTCMonth() + 1).padStart(2, '0');
  const d = String(nowEST.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convierte una fecha YYYY-MM-DD al rango UTC [start, end).
 * HubSpot guarda DATE como medianoche UTC del día indicado.
 */
export function getDateRangeForString(dateStr: string): { startMs: number; endMs: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const startMs = Date.UTC(y, m - 1, d);
  return { startMs, endMs: startMs + 24 * 60 * 60 * 1000 };
}

function getTodayRangeEST() {
  return getDateRangeForString(getTodayDateEST());
}

/**
 * Rango UTC para el mes actual en EST (medianoche UTC del 1º al 1º del siguiente).
 */
export function getMonthRangeEST(): { startMs: number; endMs: number } {
  const nowEST = new Date(Date.now() - EST_OFFSET_MS);
  const y = nowEST.getUTCFullYear();
  const m = nowEST.getUTCMonth();
  return { startMs: Date.UTC(y, m, 1), endMs: Date.UTC(y, m + 1, 1) };
}

const VALID_STATUSES = ['PR Agendada', 'PR Agendada FONO', 'PR Agendada WTSP', 'Pr RE-Agendada'];

/**
 * Búsqueda paginada de contactos con fecha_agendamiento en un rango y estado válido.
 * Devuelve TODOS los resultados (maneja el cursor de paginación de HubSpot).
 */
export async function getContactsByDateRange(
  startMs: number,
  endMs: number,
  extraProperties: string[] = [],
  filterByStatus = true,
  dateField: 'fecha_agendamiento' | 'proxima_reunion' = 'fecha_agendamiento',
): Promise<HubSpotContact[]> {
  if (!ACCESS_TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN no configurado');

  const properties = [
    'firstname', 'lastname', 'email', 'company', 'fax',
    'hubspot_owner_id', 'estado_prospeccion_vol2', 'fecha_agendamiento',
    ...extraProperties,
  ];

  const baseFilters: Record<string, unknown>[] = [
    { propertyName: dateField, operator: 'GTE', value: startMs.toString() },
    { propertyName: dateField, operator: 'LT',  value: endMs.toString() },
  ];
  if (filterByStatus) {
    baseFilters.push({ propertyName: 'estado_prospeccion_vol2', operator: 'IN', values: VALID_STATUSES });
  }

  const all: HubSpotContact[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{ filters: baseFilters }],
      properties,
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HubSpot search error: ${res.status} - ${txt}`);
    }

    const data = await res.json();
    all.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return all;
}

/**
 * Contactos modificados recientemente con estado de reunión válido.
 * Combina filtro de hs_lastmodifieddate (se indexa más rápido que propiedades custom)
 * con estado válido para mantener el resultado pequeño y la query rápida.
 */
export async function getRecentlyModifiedContacts(sinceMs: number): Promise<HubSpotContact[]> {
  if (!ACCESS_TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN no configurado');

  const properties = [
    'firstname', 'lastname', 'email', 'company', 'fax',
    'hubspot_owner_id', 'estado_prospeccion_vol2', 'fecha_agendamiento',
  ];

  const all: HubSpotContact[] = [];
  let after: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [
          { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: sinceMs.toString() },
          { propertyName: 'estado_prospeccion_vol2', operator: 'IN', values: VALID_STATUSES },
        ],
      }],
      properties,
      limit: 100,
    };
    if (after) body.after = after;

    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HubSpot search error: ${res.status} - ${txt}`);
    }

    const data = await res.json();
    all.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after);

  return all;
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname: string;
    lastname: string;
    email?: string;
    company?: string;
    hubspot_owner_id?: string;
    proxima_reunion?: string;  // Próxima Reunión (datetime)
    estado_prospeccion_vol2?: string;  // ESTADO PROSPECCIÓN (enumeration)
    ejecutivo_que_toma_la_reunion?: string;  // EJECUTIVO QUE TOMA LA REUNION
    fecha_agendamiento?: string;  // FECHA AGENDAMIENTO (datetime)
    fecha_reunion?: string;  // FECHA REUNION (date)
    presentada?: string;  // REUNION PRESENTADA (SI/NO)
    ocurrio_reunion?: string;  // Ocurrió Reunion (SI/NO)
    [key: string]: any;
  };
}

export interface HubSpotOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain?: string;
  };
}

/**
 * Fetch contacts with meetings scheduled for today
 * Solo incluye contactos con estado válido: PR Agendada FONO, PR Agendada WTSP, Pr RE-Agendada
 */
export async function getTodayMeetings(dateStr?: string) {
  if (!ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN no configurado en .env.local');
  }

  const { startMs: todayTimestamp, endMs: tomorrowTimestamp } = dateStr
    ? getDateRangeForString(dateStr)
    : getTodayRangeEST();

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'proxima_reunion',
                operator: 'GTE',
                value: todayTimestamp.toString(),
              },
              {
                propertyName: 'proxima_reunion',
                operator: 'LT',
                value: tomorrowTimestamp.toString(),
              },
              {
                propertyName: 'estado_prospeccion_vol2',
                operator: 'IN',
                values: VALID_STATUSES,
              },
            ],
          },
        ],
        properties: [
          'firstname',
          'lastname',
          'email',
          'company',
          'fax',
          'hubspot_owner_id',
          'proxima_reunion',
          'estado_prospeccion_vol2',
          'ejecutivo_que_toma_la_reunion',
          'fecha_agendamiento',
        ],
        limit: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results as HubSpotContact[];
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error);
    throw error;
  }
}

// Cache global de owners con TTL de 5 minutos
let allOwnersCache: Map<string, HubSpotOwner> | null = null;
let allOwnersCacheTime = 0;
const OWNERS_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Carga todos los owners de HubSpot de una vez (más eficiente, un solo request)
 * Requiere scope crm.objects.owners.read
 */
export async function getAllOwners(): Promise<Map<string, HubSpotOwner>> {
  if (allOwnersCache && Date.now() - allOwnersCacheTime < OWNERS_CACHE_TTL_MS) return allOwnersCache;
  if (!ACCESS_TOKEN) throw new Error('HUBSPOT_ACCESS_TOKEN no configurado');

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/owners?limit=100`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Error fetching all owners: ${response.status}`);
      allOwnersCache = new Map();
      return allOwnersCache;
    }

    const data = await response.json();
    allOwnersCache = new Map<string, HubSpotOwner>(
      (data.results ?? []).map((o: HubSpotOwner) => [o.id, o])
    );
    allOwnersCacheTime = Date.now();
    return allOwnersCache;
  } catch (error) {
    console.error('Error fetching all owners:', error);
    allOwnersCache = new Map();
    return allOwnersCache;
  }
}

/**
 * Fetch owner (SDR) details by ID
 * Usa el cache global para no hacer un request por cada contacto
 */
export async function getOwner(ownerId: string): Promise<HubSpotOwner | null> {
  const owners = await getAllOwners();
  return owners.get(ownerId) ?? null;
}

/**
 * Fetch contacts where fecha_agendamiento = today (reuniones agendadas HOY por los SDRs)
 * Filtra por estado_prospeccion_vol2 IN los 3 estados válidos
 */
export async function getTodayBookedMeetings(dateStr?: string) {
  if (!ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN no configurado en .env.local');
  }

  const { startMs: todayTimestamp, endMs: tomorrowTimestamp } = dateStr
    ? getDateRangeForString(dateStr)
    : getTodayRangeEST();

  const validStatuses = [
    'PR Agendada',
    'PR Agendada FONO',
    'PR Agendada WTSP',
    'Pr RE-Agendada',
  ];

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'fecha_agendamiento',
                operator: 'GTE',
                value: todayTimestamp.toString(),
              },
              {
                propertyName: 'fecha_agendamiento',
                operator: 'LT',
                value: tomorrowTimestamp.toString(),
              },
              {
                propertyName: 'estado_prospeccion_vol2',
                operator: 'IN',
                values: validStatuses,
              },
            ],
          },
        ],
        properties: [
          'firstname',
          'lastname',
          'email',
          'company',
          'hubspot_owner_id',
          'proxima_reunion',
          'estado_prospeccion_vol2',
          'ejecutivo_que_toma_la_reunion',
          'fecha_agendamiento',
        ],
        limit: 100,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results as HubSpotContact[];
  } catch (error) {
    console.error('Error fetching today booked meetings:', error);
    throw error;
  }
}

/**
 * Fetch company details by ID
 */
export async function getCompany(companyId: string): Promise<HubSpotCompany | null> {
  if (!ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN no configurado');
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/companies/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Error fetching company ${companyId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching company ${companyId}:`, error);
    return null;
  }
}
