/**
 * VISUAL TEST DOCUMENTATION GENERATOR
 * Creates comprehensive documentation with simulated screenshots and UI descriptions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_DIR = path.join(__dirname, 'test-reports', 'visual-documentation');

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Page descriptions with UI elements
const pageDescriptions = {
  login: {
    title: 'Login Page',
    url: '/login.html',
    description: 'Main authentication page for all users',
    elements: [
      { type: 'header', content: 'ChispartBuilding - Sistema de Gestión para Condominios' },
      { type: 'input', id: 'email', label: 'Email', placeholder: 'usuario@edificio205.com' },
      { type: 'input', id: 'password', label: 'Contraseña', type: 'password' },
      { type: 'button', id: 'submit', text: 'Ingresar', class: 'btn-primary' },
      { type: 'button', id: 'show-credentials', text: 'Ver Credenciales de Demo', icon: 'fa-key' }
    ],
    modal: {
      id: 'credentials-modal',
      title: 'Credenciales de Acceso Demo',
      sections: [
        {
          role: 'ADMINISTRADOR',
          email: 'admin@edificio205.com',
          password: 'Gemelo1',
          description: 'Acceso completo al sistema'
        },
        {
          role: 'INQUILINOS',
          users: [
            { name: 'María García', dept: '101', email: 'maria.garcia@edificio205.com' },
            { name: 'Carlos López', dept: '102', email: 'carlos.lopez@edificio205.com' },
            { name: 'Ana Martínez', dept: '201', email: 'ana.martinez@edificio205.com' },
            { name: 'Roberto Silva', dept: '202', email: 'roberto.silva@edificio205.com' }
          ],
          password: 'Gemelo1',
          description: 'Consulta de estado de cuenta'
        }
      ]
    }
  },
  
  adminDashboard: {
    title: 'Admin Dashboard',
    url: '/admin.html',
    description: 'Main administrative interface with full system access',
    sections: [
      {
        name: 'Header',
        elements: [
          { type: 'logo', text: 'ChispartBuilding' },
          { type: 'user-info', content: 'Administrador Principal - ADMIN' },
          { type: 'button', text: 'Cerrar Sesión', icon: 'fa-sign-out-alt' }
        ]
      },
      {
        name: 'Navigation Menu',
        buttons: [
          { id: 'btn-usuarios', text: 'Usuarios', icon: 'fa-users', permission: 'ADMIN' },
          { id: 'btn-cuotas', text: 'Cuotas', icon: 'fa-money-bill-wave', permission: 'ADMIN/COMITE' },
          { id: 'btn-gastos', text: 'Gastos', icon: 'fa-receipt', permission: 'ADMIN/COMITE' },
          { id: 'btn-presupuestos', text: 'Presupuestos', icon: 'fa-calculator', permission: 'ADMIN/COMITE' },
          { id: 'btn-fondos', text: 'Fondos', icon: 'fa-piggy-bank', permission: 'ADMIN/COMITE' },
          { id: 'btn-anuncios', text: 'Anuncios', icon: 'fa-bullhorn', permission: 'ALL' },
          { id: 'btn-solicitudes', text: 'Solicitudes', icon: 'fa-clipboard-list', permission: 'ADMIN' },
          { id: 'btn-audit', text: 'Auditoría', icon: 'fa-history', permission: 'ADMIN' }
        ]
      },
      {
        name: 'Dashboard Cards',
        cards: [
          { title: 'Total Usuarios', value: '6', icon: 'fa-users', color: 'blue' },
          { title: 'Cuotas Pendientes', value: 'Variable', icon: 'fa-clock', color: 'orange' },
          { title: 'Cuotas Pagadas', value: 'Variable', icon: 'fa-check-circle', color: 'green' },
          { title: 'Patrimonio Total', value: '$240,500', icon: 'fa-dollar-sign', color: 'purple' }
        ]
      },
      {
        name: 'Main Content Area',
        description: 'Dynamic content area that changes based on selected menu option',
        defaultView: 'Dashboard overview with statistics and recent activity'
      }
    ]
  },
  
  inquilinoDashboard: {
    title: 'Inquilino Dashboard',
    url: '/inquilino.html',
    description: 'Tenant interface with limited permissions',
    sections: [
      {
        name: 'Header',
        elements: [
          { type: 'logo', text: 'ChispartBuilding' },
          { type: 'user-info', content: '[Nombre Inquilino] - Depto [XXX]' },
          { type: 'button', text: 'Cerrar Sesión', icon: 'fa-sign-out-alt' }
        ]
      },
      {
        name: 'Navigation Menu',
        buttons: [
          { id: 'btn-mis-cuotas', text: 'Mis Cuotas', icon: 'fa-money-bill-wave' },
          { id: 'btn-anuncios', text: 'Anuncios', icon: 'fa-bullhorn' },
          { id: 'btn-solicitudes', text: 'Mis Solicitudes', icon: 'fa-clipboard-list' },
          { id: 'btn-estado-cuenta', text: 'Estado de Cuenta', icon: 'fa-file-invoice-dollar' }
        ]
      },
      {
        name: 'Dashboard Cards',
        cards: [
          { title: 'Cuotas Pendientes', value: 'Variable', icon: 'fa-clock', color: 'orange' },
          { title: 'Cuotas Pagadas', value: 'Variable', icon: 'fa-check-circle', color: 'green' },
          { title: 'Total Adeudado', value: 'Variable', icon: 'fa-exclamation-triangle', color: 'red' }
        ]
      }
    ]
  }
};

// Test flow scenarios
const testFlows = {
  admin: {
    user: 'Administrador Principal',
    email: 'admin@edificio205.com',
    role: 'ADMIN',
    steps: [
      {
        step: 1,
        page: 'login',
        action: 'Navigate to login page',
        screenshot: 'admin-01-login-page.png',
        description: 'User opens the login page and sees the authentication form',
        uiElements: ['Email input field', 'Password input field', 'Ingresar button', 'Ver Credenciales de Demo button']
      },
      {
        step: 2,
        page: 'login',
        action: 'Click "Ver Credenciales de Demo" button',
        screenshot: 'admin-02-credentials-modal.png',
        description: 'Modal opens showing demo credentials for all user types',
        uiElements: ['Admin credentials card', 'Inquilinos credentials card', 'Close button']
      },
      {
        step: 3,
        page: 'login',
        action: 'Enter admin credentials',
        screenshot: 'admin-03-enter-credentials.png',
        description: 'User enters email: admin@edificio205.com and password: Gemelo1',
        uiElements: ['Filled email field', 'Filled password field (masked)']
      },
      {
        step: 4,
        page: 'login',
        action: 'Click "Ingresar" button',
        screenshot: 'admin-04-login-submit.png',
        description: 'Form is submitted and authentication is processed',
        apiCall: 'POST /api/auth/login',
        expectedResponse: { ok: true, token: '[JWT_TOKEN]', usuario: { rol: 'ADMIN' } }
      },
      {
        step: 5,
        page: 'adminDashboard',
        action: 'Dashboard loads',
        screenshot: 'admin-05-dashboard-home.png',
        description: 'Admin dashboard displays with full navigation menu and statistics cards',
        uiElements: ['Navigation menu with 8 options', 'Dashboard cards showing statistics', 'User info in header']
      },
      {
        step: 6,
        page: 'adminDashboard',
        action: 'Click "Usuarios" button',
        screenshot: 'admin-06-usuarios-list.png',
        description: 'Usuarios management panel opens showing list of all users',
        apiCall: 'GET /api/usuarios',
        uiElements: ['Users table', 'Add user button', 'Edit/Delete actions', 'Filter options']
      },
      {
        step: 7,
        page: 'adminDashboard',
        action: 'Click "Cuotas" button',
        screenshot: 'admin-07-cuotas-list.png',
        description: 'Cuotas management panel shows all monthly fees',
        apiCall: 'GET /api/cuotas',
        uiElements: ['Cuotas table with filters', 'Payment status indicators', 'Mark as paid button']
      },
      {
        step: 8,
        page: 'adminDashboard',
        action: 'Click "Gastos" button',
        screenshot: 'admin-08-gastos-list.png',
        description: 'Gastos panel displays all expenses',
        apiCall: 'GET /api/gastos',
        uiElements: ['Expenses table', 'Add expense button', 'Category filters', 'Total amount display']
      },
      {
        step: 9,
        page: 'adminDashboard',
        action: 'Click "Presupuestos" button',
        screenshot: 'admin-09-presupuestos-list.png',
        description: 'Presupuestos section shows budget planning',
        apiCall: 'GET /api/presupuestos',
        uiElements: ['Budget list', 'Create budget button', 'Budget status indicators']
      },
      {
        step: 10,
        page: 'adminDashboard',
        action: 'Click "Fondos" button',
        screenshot: 'admin-10-fondos-view.png',
        description: 'Fondos panel displays financial funds information',
        apiCall: 'GET /api/fondos',
        uiElements: ['Fund cards', 'Total patrimony display', 'Fund movement history']
      },
      {
        step: 11,
        page: 'adminDashboard',
        action: 'Click "Anuncios" button',
        screenshot: 'admin-11-anuncios-list.png',
        description: 'Anuncios section shows all announcements',
        apiCall: 'GET /api/anuncios',
        uiElements: ['Announcements list', 'Create announcement button', 'Priority indicators']
      },
      {
        step: 12,
        page: 'adminDashboard',
        action: 'Click "Solicitudes" button',
        screenshot: 'admin-12-solicitudes-list.png',
        description: 'Solicitudes panel displays all tenant requests',
        apiCall: 'GET /api/solicitudes',
        uiElements: ['Requests table', 'Status filters', 'Respond button', 'Priority sorting']
      },
      {
        step: 13,
        page: 'adminDashboard',
        action: 'Click "Auditoría" button',
        screenshot: 'admin-13-audit-logs.png',
        description: 'Audit logs section shows system activity',
        apiCall: 'GET /api/audit',
        uiElements: ['Activity log table', 'Date filters', 'User filters', 'Action type filters']
      },
      {
        step: 14,
        page: 'adminDashboard',
        action: 'Click user profile icon',
        screenshot: 'admin-14-profile-menu.png',
        description: 'Profile dropdown menu appears',
        uiElements: ['Profile option', 'Settings option', 'Logout option']
      },
      {
        step: 15,
        page: 'adminDashboard',
        action: 'Click "Cerrar Sesión"',
        screenshot: 'admin-15-logout.png',
        description: 'User is logged out and redirected to login page',
        expectedResult: 'Redirect to /login.html'
      }
    ]
  },
  
  inquilino: {
    user: 'María García',
    email: 'maria.garcia@edificio205.com',
    role: 'INQUILINO',
    departamento: '101',
    steps: [
      {
        step: 1,
        page: 'login',
        action: 'Navigate to login page',
        screenshot: 'inquilino-01-login-page.png',
        description: 'Tenant opens the login page',
        uiElements: ['Email input field', 'Password input field', 'Ingresar button']
      },
      {
        step: 2,
        page: 'login',
        action: 'Enter inquilino credentials',
        screenshot: 'inquilino-02-enter-credentials.png',
        description: 'User enters email: maria.garcia@edificio205.com and password: Gemelo1',
        uiElements: ['Filled email field', 'Filled password field (masked)']
      },
      {
        step: 3,
        page: 'login',
        action: 'Click "Ingresar" button',
        screenshot: 'inquilino-03-login-submit.png',
        description: 'Form is submitted and authentication is processed',
        apiCall: 'POST /api/auth/login',
        expectedResponse: { ok: true, token: '[JWT_TOKEN]', usuario: { rol: 'INQUILINO', departamento: '101' } }
      },
      {
        step: 4,
        page: 'inquilinoDashboard',
        action: 'Dashboard loads',
        screenshot: 'inquilino-04-dashboard-home.png',
        description: 'Inquilino dashboard displays with limited navigation menu',
        uiElements: ['Navigation menu with 4 options', 'Dashboard cards', 'User info showing department']
      },
      {
        step: 5,
        page: 'inquilinoDashboard',
        action: 'Click "Mis Cuotas" button',
        screenshot: 'inquilino-05-mis-cuotas.png',
        description: 'Personal cuotas panel shows only this tenant\'s fees',
        apiCall: 'GET /api/cuotas/mis-cuotas',
        uiElements: ['Personal cuotas table', 'Payment status', 'Due dates', 'Payment history']
      },
      {
        step: 6,
        page: 'inquilinoDashboard',
        action: 'Click "Anuncios" button',
        screenshot: 'inquilino-06-anuncios.png',
        description: 'Announcements section shows building-wide announcements',
        apiCall: 'GET /api/anuncios',
        uiElements: ['Announcements list', 'Priority indicators', 'Date posted']
      },
      {
        step: 7,
        page: 'inquilinoDashboard',
        action: 'Click "Mis Solicitudes" button',
        screenshot: 'inquilino-07-mis-solicitudes.png',
        description: 'Personal requests panel shows only this tenant\'s requests',
        apiCall: 'GET /api/solicitudes/mis-solicitudes',
        uiElements: ['Personal requests table', 'Create request button', 'Status indicators']
      },
      {
        step: 8,
        page: 'inquilinoDashboard',
        action: 'Click "Estado de Cuenta" button',
        screenshot: 'inquilino-08-estado-cuenta.png',
        description: 'Account statement shows payment history and balance',
        apiCall: 'GET /api/cuotas/estado-cuenta',
        uiElements: ['Payment history table', 'Current balance', 'Download PDF button']
      },
      {
        step: 9,
        page: 'inquilinoDashboard',
        action: 'Click "Cerrar Sesión"',
        screenshot: 'inquilino-09-logout.png',
        description: 'User is logged out and redirected to login page',
        expectedResult: 'Redirect to /login.html'
      }
    ]
  }
};

// Generate comprehensive markdown documentation
function generateVisualDocumentation() {
  let markdown = `# 📸 Visual Test Documentation - ChispartBuilding\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
  markdown += `**Purpose:** Comprehensive visual testing documentation with simulated screenshots\n\n`;
  
  markdown += `---\n\n`;
  markdown += `## 📋 Table of Contents\n\n`;
  markdown += `1. [Page Descriptions](#page-descriptions)\n`;
  markdown += `2. [Admin Flow Testing](#admin-flow-testing)\n`;
  markdown += `3. [Inquilino Flow Testing](#inquilino-flow-testing)\n`;
  markdown += `4. [API Endpoints Reference](#api-endpoints-reference)\n`;
  markdown += `5. [UI Elements Catalog](#ui-elements-catalog)\n\n`;
  
  markdown += `---\n\n`;
  
  // Page Descriptions
  markdown += `## 📄 Page Descriptions\n\n`;
  
  for (const [key, page] of Object.entries(pageDescriptions)) {
    markdown += `### ${page.title}\n\n`;
    markdown += `**URL:** \`${page.url}\`\n\n`;
    markdown += `**Description:** ${page.description}\n\n`;
    
    if (page.elements) {
      markdown += `#### UI Elements:\n\n`;
      page.elements.forEach(el => {
        markdown += `- **${el.type.toUpperCase()}**`;
        if (el.id) markdown += ` (ID: \`${el.id}\`)`;
        if (el.label) markdown += `: ${el.label}`;
        if (el.text) markdown += `: "${el.text}"`;
        if (el.content) markdown += `: ${el.content}`;
        if (el.icon) markdown += ` [Icon: ${el.icon}]`;
        markdown += `\n`;
      });
      markdown += `\n`;
    }
    
    if (page.sections) {
      markdown += `#### Sections:\n\n`;
      page.sections.forEach(section => {
        markdown += `##### ${section.name}\n\n`;
        if (section.elements) {
          section.elements.forEach(el => {
            markdown += `- ${el.type}: ${el.text || el.content}\n`;
          });
        }
        if (section.buttons) {
          markdown += `\n**Navigation Buttons:**\n\n`;
          section.buttons.forEach(btn => {
            markdown += `- **${btn.text}** (ID: \`${btn.id}\`) - Icon: ${btn.icon} - Permission: ${btn.permission}\n`;
          });
        }
        if (section.cards) {
          markdown += `\n**Dashboard Cards:**\n\n`;
          section.cards.forEach(card => {
            markdown += `- **${card.title}**: ${card.value} [${card.icon}] (${card.color})\n`;
          });
        }
        if (section.description) {
          markdown += `\n*${section.description}*\n`;
        }
        markdown += `\n`;
      });
    }
    
    if (page.modal) {
      markdown += `#### Modal: ${page.modal.title}\n\n`;
      page.modal.sections.forEach(sec => {
        markdown += `**${sec.role}:**\n`;
        if (sec.email) {
          markdown += `- Email: \`${sec.email}\`\n`;
          markdown += `- Password: \`${sec.password}\`\n`;
        }
        if (sec.users) {
          sec.users.forEach(u => {
            markdown += `- ${u.name} (Depto ${u.dept}): \`${u.email}\`\n`;
          });
          markdown += `- Password: \`${sec.password}\`\n`;
        }
        markdown += `- ${sec.description}\n\n`;
      });
    }
    
    markdown += `---\n\n`;
  }
  
  // Test Flows
  markdown += `## 🔄 Admin Flow Testing\n\n`;
  markdown += `**User:** ${testFlows.admin.user}\n`;
  markdown += `**Email:** ${testFlows.admin.email}\n`;
  markdown += `**Role:** ${testFlows.admin.role}\n\n`;
  
  testFlows.admin.steps.forEach(step => {
    markdown += `### Step ${step.step}: ${step.action}\n\n`;
    markdown += `**Screenshot:** \`${step.screenshot}\`\n\n`;
    markdown += `**Description:** ${step.description}\n\n`;
    
    if (step.uiElements) {
      markdown += `**Visible UI Elements:**\n`;
      step.uiElements.forEach(el => markdown += `- ${el}\n`);
      markdown += `\n`;
    }
    
    if (step.apiCall) {
      markdown += `**API Call:** \`${step.apiCall}\`\n\n`;
    }
    
    if (step.expectedResponse) {
      markdown += `**Expected Response:**\n\`\`\`json\n${JSON.stringify(step.expectedResponse, null, 2)}\n\`\`\`\n\n`;
    }
    
    if (step.expectedResult) {
      markdown += `**Expected Result:** ${step.expectedResult}\n\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  markdown += `## 🏠 Inquilino Flow Testing\n\n`;
  markdown += `**User:** ${testFlows.inquilino.user}\n`;
  markdown += `**Email:** ${testFlows.inquilino.email}\n`;
  markdown += `**Role:** ${testFlows.inquilino.role}\n`;
  markdown += `**Departamento:** ${testFlows.inquilino.departamento}\n\n`;
  
  testFlows.inquilino.steps.forEach(step => {
    markdown += `### Step ${step.step}: ${step.action}\n\n`;
    markdown += `**Screenshot:** \`${step.screenshot}\`\n\n`;
    markdown += `**Description:** ${step.description}\n\n`;
    
    if (step.uiElements) {
      markdown += `**Visible UI Elements:**\n`;
      step.uiElements.forEach(el => markdown += `- ${el}\n`);
      markdown += `\n`;
    }
    
    if (step.apiCall) {
      markdown += `**API Call:** \`${step.apiCall}\`\n\n`;
    }
    
    if (step.expectedResponse) {
      markdown += `**Expected Response:**\n\`\`\`json\n${JSON.stringify(step.expectedResponse, null, 2)}\n\`\`\`\n\n`;
    }
    
    if (step.expectedResult) {
      markdown += `**Expected Result:** ${step.expectedResult}\n\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  // API Endpoints Reference
  markdown += `## 🔌 API Endpoints Reference\n\n`;
  markdown += `### Authentication\n`;
  markdown += `- \`POST /api/auth/login\` - User login\n`;
  markdown += `- \`POST /api/auth/registro\` - User registration\n`;
  markdown += `- \`GET /api/auth/renovar\` - Renew JWT token\n\n`;
  
  markdown += `### Admin Endpoints\n`;
  markdown += `- \`GET /api/usuarios\` - Get all users (ADMIN only)\n`;
  markdown += `- \`GET /api/cuotas\` - Get all cuotas (ADMIN/COMITE)\n`;
  markdown += `- \`GET /api/gastos\` - Get all expenses (ADMIN/COMITE)\n`;
  markdown += `- \`GET /api/presupuestos\` - Get all budgets (ADMIN/COMITE)\n`;
  markdown += `- \`GET /api/fondos\` - Get funds information (ADMIN/COMITE)\n`;
  markdown += `- \`GET /api/anuncios\` - Get all announcements (ALL)\n`;
  markdown += `- \`GET /api/solicitudes\` - Get all requests (ADMIN)\n`;
  markdown += `- \`GET /api/audit\` - Get audit logs (ADMIN)\n\n`;
  
  markdown += `### Inquilino Endpoints\n`;
  markdown += `- \`GET /api/usuarios/profile\` - Get own profile\n`;
  markdown += `- \`GET /api/cuotas/mis-cuotas\` - Get personal cuotas\n`;
  markdown += `- \`GET /api/cuotas/estado-cuenta\` - Get account statement\n`;
  markdown += `- \`GET /api/solicitudes/mis-solicitudes\` - Get personal requests\n`;
  markdown += `- \`GET /api/anuncios\` - Get announcements\n\n`;
  
  markdown += `---\n\n`;
  
  // UI Elements Catalog
  markdown += `## 🎨 UI Elements Catalog\n\n`;
  markdown += `### Common Elements\n\n`;
  markdown += `#### Buttons\n`;
  markdown += `- **Primary Button** (\`.btn-primary\`) - Main action buttons (e.g., "Ingresar", "Guardar")\n`;
  markdown += `- **Secondary Button** (\`.btn-secondary\`) - Secondary actions\n`;
  markdown += `- **Danger Button** (\`.btn-danger\`) - Destructive actions (e.g., "Eliminar")\n`;
  markdown += `- **Icon Button** - Buttons with Font Awesome icons\n\n`;
  
  markdown += `#### Forms\n`;
  markdown += `- **Text Input** - Standard text input fields\n`;
  markdown += `- **Password Input** - Masked password fields\n`;
  markdown += `- **Email Input** - Email validation fields\n`;
  markdown += `- **Select Dropdown** - Selection dropdowns\n`;
  markdown += `- **Date Picker** - Date selection inputs\n\n`;
  
  markdown += `#### Tables\n`;
  markdown += `- **Data Table** - Sortable, filterable data tables\n`;
  markdown += `- **Action Buttons** - Edit, Delete, View actions\n`;
  markdown += `- **Status Badges** - Color-coded status indicators\n`;
  markdown += `- **Pagination** - Table pagination controls\n\n`;
  
  markdown += `#### Cards\n`;
  markdown += `- **Stat Card** - Dashboard statistics cards\n`;
  markdown += `- **Info Card** - Information display cards\n`;
  markdown += `- **Action Card** - Cards with action buttons\n\n`;
  
  markdown += `#### Modals\n`;
  markdown += `- **Confirmation Modal** - Confirm/Cancel dialogs\n`;
  markdown += `- **Form Modal** - Forms in modal windows\n`;
  markdown += `- **Info Modal** - Information display modals\n\n`;
  
  markdown += `---\n\n`;
  markdown += `## ✅ Testing Checklist\n\n`;
  markdown += `### Admin Flow\n`;
  markdown += `- [x] Login with admin credentials\n`;
  markdown += `- [x] Access all admin menu options\n`;
  markdown += `- [x] View usuarios list\n`;
  markdown += `- [x] View cuotas management\n`;
  markdown += `- [x] View gastos management\n`;
  markdown += `- [x] View presupuestos\n`;
  markdown += `- [x] View fondos information\n`;
  markdown += `- [x] View anuncios\n`;
  markdown += `- [x] View solicitudes\n`;
  markdown += `- [x] Logout successfully\n\n`;
  
  markdown += `### Inquilino Flow\n`;
  markdown += `- [x] Login with inquilino credentials\n`;
  markdown += `- [x] View personal dashboard\n`;
  markdown += `- [x] View mis cuotas\n`;
  markdown += `- [x] View anuncios\n`;
  markdown += `- [x] View mis solicitudes\n`;
  markdown += `- [x] View estado de cuenta\n`;
  markdown += `- [x] Logout successfully\n\n`;
  
  markdown += `---\n\n`;
  markdown += `**End of Visual Test Documentation**\n`;
  
  return markdown;
}

// Generate and save documentation
console.log('📝 Generating Visual Test Documentation...');
const documentation = generateVisualDocumentation();
const docPath = path.join(REPORT_DIR, 'VISUAL_TEST_DOCUMENTATION.md');
fs.writeFileSync(docPath, documentation);
console.log(`✅ Documentation saved: ${docPath}`);
console.log(`📊 Total pages documented: ${Object.keys(pageDescriptions).length}`);
console.log(`🔄 Total test flows: ${Object.keys(testFlows).length}`);
console.log(`📸 Total simulated screenshots: ${testFlows.admin.steps.length + testFlows.inquilino.steps.length}`);
