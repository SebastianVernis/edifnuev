/**
 * @jest-environment jsdom
 */

// Mock de la librería notie
const notie = {
  alert: jest.fn(),
};

// Simulación del DOM y la clase SolicitudesManager
document.body.innerHTML = `
  <div id="modalSolicitud"></div>
  <div id="solicitudId"></div>
  <div id="solicitudEstado"></div>
  <div id="solicitudRespuesta"></div>
  <div id="tablaSolicitudes"></div>
  <div id="totalSolicitudes"></div>
  <div id="solicitudesPendientes"></div>
  <div id="solicitudesEnProceso"></div>
  <div id="solicitudesCompletadas"></div>
`;

// Cargar la clase después de simular el DOM
const SolicitudesManager = require('../../public/js/modules/solicitudes/solicitudes.js');

describe('SolicitudesManager', () => {
  let solicitudesManager;

  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    notie.alert.mockClear();
    global.notie = notie;
    solicitudesManager = new SolicitudesManager();
  });

  test('mostrarExito debería llamar a notie.alert con el tipo "success"', () => {
    const mensaje = 'Operación exitosa';
    solicitudesManager.mostrarExito(mensaje);
    expect(notie.alert).toHaveBeenCalledWith({ type: 'success', text: mensaje });
  });

  test('mostrarError debería llamar a notie.alert con el tipo "error"', () => {
    const mensaje = 'Ocurrió un error';
    solicitudesManager.mostrarError(mensaje);
    expect(notie.alert).toHaveBeenCalledWith({ type: 'error', text: mensaje });
  });
});
