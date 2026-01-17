/**
 * Gestión de Fondos - SaaS Multi-tenant
 * Compatible con la nueva API de fondos que devuelve array
 */

class FondosSaaSManager {
  constructor() {
    this.fondos = [];
    this.init();
  }

  async init() {
    await this.loadFondos();
    this.renderFondos();
  }

  async loadFondos() {
    try {
      const response = await fetch('/api/onboarding/building-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.buildingInfo) {
          this.fondos = data.buildingInfo.funds || [];
          console.log('✓ Fondos cargados:', this.fondos.length);
        }
      }
    } catch (error) {
      console.error('Error loading fondos:', error);
      this.fondos = [];
    }
  }

  renderFondos() {
    const container = document.querySelector('.fondos-summary');
    if (!container) {
      console.warn('Container .fondos-summary no encontrado');
      return;
    }

    // Limpiar contenido actual
    container.innerHTML = '';

    // Si no hay fondos, mostrar mensaje
    if (this.fondos.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--gray);">
          <i class="fas fa-piggy-bank" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <p>No hay fondos registrados</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Los fondos se crean automáticamente durante el setup del edificio</p>
        </div>
      `;
      return;
    }

    // Calcular patrimonio total
    const patrimonioTotal = this.fondos.reduce((sum, fondo) => {
      return sum + (parseFloat(fondo.amount) || 0);
    }, 0);

    // Renderizar cada fondo
    this.fondos.forEach(fondo => {
      const card = document.createElement('div');
      card.className = 'fondo-card';
      card.innerHTML = `
        <h3>${fondo.name}</h3>
        <p class="amount">$${parseFloat(fondo.amount || 0).toLocaleString('es-MX')}</p>
        <p class="description">Fondo del edificio</p>
      `;
      container.appendChild(card);
    });

    // Agregar card de patrimonio total
    const totalCard = document.createElement('div');
    totalCard.className = 'fondo-card total';
    totalCard.innerHTML = `
      <h3>Patrimonio Total</h3>
      <p class="amount">$${patrimonioTotal.toLocaleString('es-MX')}</p>
      <p class="description">Actualizado: ${new Date().toLocaleDateString('es-MX')}</p>
    `;
    container.appendChild(totalCard);

    console.log('✓ Fondos renderizados:', this.fondos.length, '- Total:', patrimonioTotal);
  }
}

// Inicializar cuando la sección de fondos sea visible
document.addEventListener('DOMContentLoaded', () => {
  let fondosManager = null;

  // Función para inicializar fondos
  const initFondos = () => {
    if (!fondosManager) {
      fondosManager = new FondosSaaSManager();
    }
  };

  // Observer para detectar cuando se muestra la sección
  const observer = new MutationObserver((mutations) => {
    const fondosSection = document.getElementById('fondos-section');
    if (fondosSection && fondosSection.style.display !== 'none') {
      initFondos();
    }
  });

  const fondosSection = document.getElementById('fondos-section');
  if (fondosSection) {
    observer.observe(fondosSection, { 
      attributes: true, 
      attributeFilter: ['style'] 
    });

    // También inicializar si ya está visible
    if (fondosSection.style.display !== 'none') {
      initFondos();
    }
  }

  // Escuchar evento de navegación personalizado
  document.addEventListener('section-changed', (e) => {
    if (e.detail && e.detail.section === 'fondos') {
      initFondos();
    }
  });
});

// Exportar para uso global
window.FondosSaaSManager = FondosSaaSManager;
