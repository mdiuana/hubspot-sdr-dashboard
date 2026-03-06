const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

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
export async function getTodayMeetings() {
  if (!ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN no configurado en .env.local');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimestamp = tomorrow.getTime();

  const validStatuses = [
    'PR Agendada FONO',
    'PR Agendada WTSP',
    'Pr RE-Agendada'
  ];

  try {
    // Search contacts where proxima_reunion is today AND estado_prospeccion_vol2 is valid
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
              // Próxima Reunión = HOY
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
              // Estado válido (OR entre los 3)
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
          'fecha_reunion',
          'presentada',
          'ocurrio_reunion',
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

/**
 * Fetch owner (SDR) details by ID
 */
export async function getOwner(ownerId: string): Promise<HubSpotOwner | null> {
  if (!ACCESS_TOKEN) {
    throw new Error('HUBSPOT_ACCESS_TOKEN no configurado');
  }

  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/owners/${ownerId}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Error fetching owner ${ownerId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching owner ${ownerId}:`, error);
    return null;
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
