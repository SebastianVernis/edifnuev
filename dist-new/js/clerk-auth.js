/**
 * Clerk Authentication Integration
 * 
 * Este módulo maneja la autenticación con Clerk en el frontend.
 * Proporciona funciones para login, registro y gestión de sesiones.
 */

// Configuración de Clerk
const CLERK_PUBLISHABLE_KEY = 'pk_test_cG9saXNoZWQtaGFnZmlzaC01OS5jbGVyay5hY2NvdW50cy5kZXYk';
const CLERK_FRONTEND_API = 'https://polished-hagfish-59.clerk.accounts.dev';

// Variable global para almacenar la instancia de Clerk
let clerkInstance = null;

/**
 * Inicializa Clerk
 * @returns {Promise<Object>} Instancia de Clerk
 */
async function initializeClerk() {
  if (clerkInstance) {
    return clerkInstance;
  }

  try {
    // Cargar el SDK de Clerk si no está cargado
    if (!window.Clerk) {
      await loadClerkScript();
    }

    // Inicializar Clerk
    clerkInstance = window.Clerk;
    await clerkInstance.load({
      publishableKey: CLERK_PUBLISHABLE_KEY
    });

    console.log('Clerk initialized successfully');
    return clerkInstance;
  } catch (error) {
    console.error('Error initializing Clerk:', error);
    throw error;
  }
}

/**
 * Carga el script de Clerk dinámicamente
 * @returns {Promise<void>}
 */
function loadClerkScript() {
  return new Promise((resolve, reject) => {
    if (window.Clerk) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      console.log('Clerk script loaded');
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Clerk script'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Obtiene el usuario actual de Clerk
 * @returns {Promise<Object|null>} Usuario actual o null
 */
async function getCurrentUser() {
  try {
    const clerk = await initializeClerk();
    return clerk.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Obtiene el token de sesión de Clerk
 * @returns {Promise<string|null>} Token de sesión o null
 */
async function getSessionToken() {
  try {
    const clerk = await initializeClerk();
    if (!clerk.session) {
      return null;
    }
    return await clerk.session.getToken();
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<boolean>} True si está autenticado
 */
async function isAuthenticated() {
  try {
    const clerk = await initializeClerk();
    return !!clerk.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Redirige al usuario a la página de login de Clerk
 * @param {string} redirectUrl - URL de redirección después del login
 */
async function redirectToLogin(redirectUrl = window.location.href) {
  try {
    const clerk = await initializeClerk();
    await clerk.redirectToSignIn({
      redirectUrl: redirectUrl
    });
  } catch (error) {
    console.error('Error redirecting to login:', error);
    // Fallback a login local
    window.location.href = '/login.html';
  }
}

/**
 * Redirige al usuario a la página de registro de Clerk
 * @param {string} redirectUrl - URL de redirección después del registro
 */
async function redirectToSignUp(redirectUrl = window.location.href) {
  try {
    const clerk = await initializeClerk();
    await clerk.redirectToSignUp({
      redirectUrl: redirectUrl
    });
  } catch (error) {
    console.error('Error redirecting to sign up:', error);
    // Fallback a registro local
    window.location.href = '/register.html';
  }
}

/**
 * Cierra la sesión del usuario
 */
async function signOut() {
  try {
    const clerk = await initializeClerk();
    await clerk.signOut();
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    // Redirigir a login
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Error signing out:', error);
    // Fallback: limpiar y redirigir
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

/**
 * Sincroniza el usuario de Clerk con el backend
 * @returns {Promise<Object>} Datos del usuario sincronizado
 */
async function syncUserWithBackend() {
  try {
    const token = await getSessionToken();
    if (!token) {
      throw new Error('No session token available');
    }

    const response = await fetch(`${API_URL}/api/auth/clerk-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to sync user with backend');
    }

    const data = await response.json();
    return data.usuario;
  } catch (error) {
    console.error('Error syncing user with backend:', error);
    throw error;
  }
}

/**
 * Actualiza los metadatos públicos del usuario en Clerk
 * @param {Object} metadata - Metadatos a actualizar
 * @returns {Promise<void>}
 */
async function updateUserMetadata(metadata) {
  try {
    const clerk = await initializeClerk();
    if (!clerk.user) {
      throw new Error('No user logged in');
    }

    await clerk.user.update({
      publicMetadata: {
        ...clerk.user.publicMetadata,
        ...metadata
      }
    });

    console.log('User metadata updated successfully');
  } catch (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
}

/**
 * Monta el componente de perfil de usuario de Clerk
 * @param {string} elementId - ID del elemento donde montar el componente
 */
async function mountUserProfile(elementId) {
  try {
    const clerk = await initializeClerk();
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    clerk.mountUserProfile(element);
  } catch (error) {
    console.error('Error mounting user profile:', error);
    throw error;
  }
}

/**
 * Monta el componente de botón de usuario de Clerk
 * @param {string} elementId - ID del elemento donde montar el componente
 */
async function mountUserButton(elementId) {
  try {
    const clerk = await initializeClerk();
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    clerk.mountUserButton(element);
  } catch (error) {
    console.error('Error mounting user button:', error);
    throw error;
  }
}

/**
 * Protege una página requiriendo autenticación
 * Redirige a login si el usuario no está autenticado
 */
async function requireAuth() {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log('User not authenticated, redirecting to login');
      await redirectToLogin();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in requireAuth:', error);
    await redirectToLogin();
    return false;
  }
}

/**
 * Obtiene los datos del usuario desde el backend usando el token de Clerk
 * @returns {Promise<Object>} Datos del usuario
 */
async function getUserFromBackend() {
  try {
    const token = await getSessionToken();
    if (!token) {
      throw new Error('No session token available');
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user from backend');
    }

    const data = await response.json();
    return data.usuario;
  } catch (error) {
    console.error('Error getting user from backend:', error);
    throw error;
  }
}

// Exportar funciones para uso global
window.ClerkAuth = {
  initialize: initializeClerk,
  getCurrentUser,
  getSessionToken,
  isAuthenticated,
  redirectToLogin,
  redirectToSignUp,
  signOut,
  syncUserWithBackend,
  updateUserMetadata,
  mountUserProfile,
  mountUserButton,
  requireAuth,
  getUserFromBackend
};

// Auto-inicializar Clerk cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeClerk().catch(console.error);
  });
} else {
  initializeClerk().catch(console.error);
}

console.log('Clerk Auth module loaded');
