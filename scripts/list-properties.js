const HUBSPOT_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || 'YOUR_TOKEN_HERE';

async function listContactProperties() {
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/properties/contacts', {
      headers: {
        'Authorization': `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('\n📋 PROPIEDADES DE CONTACTOS EN HUBSPOT\n');
    console.log('Buscando las propiedades que necesitamos...\n');

    const keywords = [
      'reunion',
      'meeting', 
      'prospeccion',
      'prospecting',
      'estado',
      'status',
      'ejecutivo',
      'executive',
      'agendamiento',
      'appointment',
      'apellido',
      'lastname',
      'propietario',
      'owner'
    ];

    const relevant = data.results.filter(prop => {
      const label = (prop.label || '').toLowerCase();
      const name = (prop.name || '').toLowerCase();
      return keywords.some(kw => label.includes(kw) || name.includes(kw));
    });

    console.log('Propiedades relevantes encontradas:\n');
    
    relevant.forEach(prop => {
      console.log(`📌 "${prop.label}"`);
      console.log(`   Nombre técnico: ${prop.name}`);
      console.log(`   Tipo: ${prop.type}`);
      if (prop.options && prop.options.length > 0) {
        console.log(`   Opciones: ${prop.options.map(o => o.label).join(', ')}`);
      }
      console.log('');
    });

    console.log('\n✅ Listo! Copia los "nombres técnicos" que necesites.\n');

  } catch (error) {
    console.error('Error fetching properties:', error);
  }
}

listContactProperties();
