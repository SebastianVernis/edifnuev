document.addEventListener('DOMContentLoaded', () => {
  const configuracionSection = document.getElementById('configuracion');

  if (configuracionSection) {
    console.log('Inicializando módulo de configuración del edificio...');
    initBuildingConfig();
  }
});

async function initBuildingConfig() {
  const token = localStorage.getItem('edificio_token');

  if (!token) {
    console.error('No se encontró token de autenticación.');
    return;
  }

  await loadBuildingInfo(token);
  await loadDocuments(token);
}

async function loadBuildingInfo(token) {
  try {
    const response = await fetch('/api/onboarding/building-info', {
      headers: { 'x-auth-token': token }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        displayBuildingInfo(data.buildingInfo);
      }
    } else {
      console.error('Error al cargar la información del edificio:', response.statusText);
    }
  } catch (error) {
    console.error('Error en la solicitud de información del edificio:', error);
  }
}

async function loadDocuments(token) {
  try {
    const response = await fetch('/api/onboarding/documents', {
      headers: { 'x-auth-token': token }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ok) {
        displayDocuments(data.documents);
      }
    } else {
      console.error('Error al cargar los documentos:', response.statusText);
    }
  } catch (error) {
    console.error('Error en la solicitud de documentos:', error);
  }
}

function displayBuildingInfo(info) {
  if (!info) return;

  const fields = {
    'building-name': info.name,
    'building-address': info.address,
    'building-type': info.type,
    'total-units': info.totalUnits,
    'monthly-fee': info.monthlyFee,
    'cutoff-day': info.cutoffDay,
    'payment-due-days': info.paymentDueDays,
    'late-fee-percent': info.lateFeePercent
  };

  for (const id in fields) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = fields[id];
    }
  }
}

function displayDocuments(documents) {
  const container = document.getElementById('documentos-container');
  if (!container) return;

  container.innerHTML = '';

  if (documents && documents.length > 0) {
    documents.forEach(doc => {
      const docElement = document.createElement('div');
      docElement.className = 'document-item';
      docElement.innerHTML = `
        <a href="${doc.url}" target="_blank" rel="noopener noreferrer">
          <i class="bi bi-file-earmark-pdf"></i>
          <span>${doc.name}</span>
        </a>
      `;
      container.appendChild(docElement);
    });
  } else {
    container.innerHTML = '<p>No hay documentos disponibles.</p>';
  }
}