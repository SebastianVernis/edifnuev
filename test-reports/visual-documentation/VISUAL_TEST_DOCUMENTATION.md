# 📸 Visual Test Documentation - ChispartBuilding

**Generated:** 1/18/2026, 10:51:17 AM
**Purpose:** Comprehensive visual testing documentation with simulated screenshots

---

## 📋 Table of Contents

1. [Page Descriptions](#page-descriptions)
2. [Admin Flow Testing](#admin-flow-testing)
3. [Inquilino Flow Testing](#inquilino-flow-testing)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [UI Elements Catalog](#ui-elements-catalog)

---

## 📄 Page Descriptions

### Login Page

**URL:** `/login.html`

**Description:** Main authentication page for all users

#### UI Elements:

- **HEADER**: ChispartBuilding - Sistema de Gestión para Condominios
- **INPUT** (ID: `email`): Email
- **PASSWORD** (ID: `password`): Contraseña
- **BUTTON** (ID: `submit`): "Ingresar"
- **BUTTON** (ID: `show-credentials`): "Ver Credenciales de Demo" [Icon: fa-key]

#### Modal: Credenciales de Acceso Demo

**ADMINISTRADOR:**
- Email: `admin@edificio205.com`
- Password: `Gemelo1`
- Acceso completo al sistema

**INQUILINOS:**
- María García (Depto 101): `maria.garcia@edificio205.com`
- Carlos López (Depto 102): `carlos.lopez@edificio205.com`
- Ana Martínez (Depto 201): `ana.martinez@edificio205.com`
- Roberto Silva (Depto 202): `roberto.silva@edificio205.com`
- Password: `Gemelo1`
- Consulta de estado de cuenta

---

### Admin Dashboard

**URL:** `/admin.html`

**Description:** Main administrative interface with full system access

#### Sections:

##### Header

- logo: ChispartBuilding
- user-info: Administrador Principal - ADMIN
- button: Cerrar Sesión

##### Navigation Menu


**Navigation Buttons:**

- **Usuarios** (ID: `btn-usuarios`) - Icon: fa-users - Permission: ADMIN
- **Cuotas** (ID: `btn-cuotas`) - Icon: fa-money-bill-wave - Permission: ADMIN/COMITE
- **Gastos** (ID: `btn-gastos`) - Icon: fa-receipt - Permission: ADMIN/COMITE
- **Presupuestos** (ID: `btn-presupuestos`) - Icon: fa-calculator - Permission: ADMIN/COMITE
- **Fondos** (ID: `btn-fondos`) - Icon: fa-piggy-bank - Permission: ADMIN/COMITE
- **Anuncios** (ID: `btn-anuncios`) - Icon: fa-bullhorn - Permission: ALL
- **Solicitudes** (ID: `btn-solicitudes`) - Icon: fa-clipboard-list - Permission: ADMIN
- **Auditoría** (ID: `btn-audit`) - Icon: fa-history - Permission: ADMIN

##### Dashboard Cards


**Dashboard Cards:**

- **Total Usuarios**: 6 [fa-users] (blue)
- **Cuotas Pendientes**: Variable [fa-clock] (orange)
- **Cuotas Pagadas**: Variable [fa-check-circle] (green)
- **Patrimonio Total**: $240,500 [fa-dollar-sign] (purple)

##### Main Content Area


*Dynamic content area that changes based on selected menu option*

---

### Inquilino Dashboard

**URL:** `/inquilino.html`

**Description:** Tenant interface with limited permissions

#### Sections:

##### Header

- logo: ChispartBuilding
- user-info: [Nombre Inquilino] - Depto [XXX]
- button: Cerrar Sesión

##### Navigation Menu


**Navigation Buttons:**

- **Mis Cuotas** (ID: `btn-mis-cuotas`) - Icon: fa-money-bill-wave - Permission: undefined
- **Anuncios** (ID: `btn-anuncios`) - Icon: fa-bullhorn - Permission: undefined
- **Mis Solicitudes** (ID: `btn-solicitudes`) - Icon: fa-clipboard-list - Permission: undefined
- **Estado de Cuenta** (ID: `btn-estado-cuenta`) - Icon: fa-file-invoice-dollar - Permission: undefined

##### Dashboard Cards


**Dashboard Cards:**

- **Cuotas Pendientes**: Variable [fa-clock] (orange)
- **Cuotas Pagadas**: Variable [fa-check-circle] (green)
- **Total Adeudado**: Variable [fa-exclamation-triangle] (red)

---

## 🔄 Admin Flow Testing

**User:** Administrador Principal
**Email:** admin@edificio205.com
**Role:** ADMIN

### Step 1: Navigate to login page

**Screenshot:** `admin-01-login-page.png`

**Description:** User opens the login page and sees the authentication form

**Visible UI Elements:**
- Email input field
- Password input field
- Ingresar button
- Ver Credenciales de Demo button

---

### Step 2: Click "Ver Credenciales de Demo" button

**Screenshot:** `admin-02-credentials-modal.png`

**Description:** Modal opens showing demo credentials for all user types

**Visible UI Elements:**
- Admin credentials card
- Inquilinos credentials card
- Close button

---

### Step 3: Enter admin credentials

**Screenshot:** `admin-03-enter-credentials.png`

**Description:** User enters email: admin@edificio205.com and password: Gemelo1

**Visible UI Elements:**
- Filled email field
- Filled password field (masked)

---

### Step 4: Click "Ingresar" button

**Screenshot:** `admin-04-login-submit.png`

**Description:** Form is submitted and authentication is processed

**API Call:** `POST /api/auth/login`

**Expected Response:**
```json
{
  "ok": true,
  "token": "[JWT_TOKEN]",
  "usuario": {
    "rol": "ADMIN"
  }
}
```

---

### Step 5: Dashboard loads

**Screenshot:** `admin-05-dashboard-home.png`

**Description:** Admin dashboard displays with full navigation menu and statistics cards

**Visible UI Elements:**
- Navigation menu with 8 options
- Dashboard cards showing statistics
- User info in header

---

### Step 6: Click "Usuarios" button

**Screenshot:** `admin-06-usuarios-list.png`

**Description:** Usuarios management panel opens showing list of all users

**Visible UI Elements:**
- Users table
- Add user button
- Edit/Delete actions
- Filter options

**API Call:** `GET /api/usuarios`

---

### Step 7: Click "Cuotas" button

**Screenshot:** `admin-07-cuotas-list.png`

**Description:** Cuotas management panel shows all monthly fees

**Visible UI Elements:**
- Cuotas table with filters
- Payment status indicators
- Mark as paid button

**API Call:** `GET /api/cuotas`

---

### Step 8: Click "Gastos" button

**Screenshot:** `admin-08-gastos-list.png`

**Description:** Gastos panel displays all expenses

**Visible UI Elements:**
- Expenses table
- Add expense button
- Category filters
- Total amount display

**API Call:** `GET /api/gastos`

---

### Step 9: Click "Presupuestos" button

**Screenshot:** `admin-09-presupuestos-list.png`

**Description:** Presupuestos section shows budget planning

**Visible UI Elements:**
- Budget list
- Create budget button
- Budget status indicators

**API Call:** `GET /api/presupuestos`

---

### Step 10: Click "Fondos" button

**Screenshot:** `admin-10-fondos-view.png`

**Description:** Fondos panel displays financial funds information

**Visible UI Elements:**
- Fund cards
- Total patrimony display
- Fund movement history

**API Call:** `GET /api/fondos`

---

### Step 11: Click "Anuncios" button

**Screenshot:** `admin-11-anuncios-list.png`

**Description:** Anuncios section shows all announcements

**Visible UI Elements:**
- Announcements list
- Create announcement button
- Priority indicators

**API Call:** `GET /api/anuncios`

---

### Step 12: Click "Solicitudes" button

**Screenshot:** `admin-12-solicitudes-list.png`

**Description:** Solicitudes panel displays all tenant requests

**Visible UI Elements:**
- Requests table
- Status filters
- Respond button
- Priority sorting

**API Call:** `GET /api/solicitudes`

---

### Step 13: Click "Auditoría" button

**Screenshot:** `admin-13-audit-logs.png`

**Description:** Audit logs section shows system activity

**Visible UI Elements:**
- Activity log table
- Date filters
- User filters
- Action type filters

**API Call:** `GET /api/audit`

---

### Step 14: Click user profile icon

**Screenshot:** `admin-14-profile-menu.png`

**Description:** Profile dropdown menu appears

**Visible UI Elements:**
- Profile option
- Settings option
- Logout option

---

### Step 15: Click "Cerrar Sesión"

**Screenshot:** `admin-15-logout.png`

**Description:** User is logged out and redirected to login page

**Expected Result:** Redirect to /login.html

---

## 🏠 Inquilino Flow Testing

**User:** María García
**Email:** maria.garcia@edificio205.com
**Role:** INQUILINO
**Departamento:** 101

### Step 1: Navigate to login page

**Screenshot:** `inquilino-01-login-page.png`

**Description:** Tenant opens the login page

**Visible UI Elements:**
- Email input field
- Password input field
- Ingresar button

---

### Step 2: Enter inquilino credentials

**Screenshot:** `inquilino-02-enter-credentials.png`

**Description:** User enters email: maria.garcia@edificio205.com and password: Gemelo1

**Visible UI Elements:**
- Filled email field
- Filled password field (masked)

---

### Step 3: Click "Ingresar" button

**Screenshot:** `inquilino-03-login-submit.png`

**Description:** Form is submitted and authentication is processed

**API Call:** `POST /api/auth/login`

**Expected Response:**
```json
{
  "ok": true,
  "token": "[JWT_TOKEN]",
  "usuario": {
    "rol": "INQUILINO",
    "departamento": "101"
  }
}
```

---

### Step 4: Dashboard loads

**Screenshot:** `inquilino-04-dashboard-home.png`

**Description:** Inquilino dashboard displays with limited navigation menu

**Visible UI Elements:**
- Navigation menu with 4 options
- Dashboard cards
- User info showing department

---

### Step 5: Click "Mis Cuotas" button

**Screenshot:** `inquilino-05-mis-cuotas.png`

**Description:** Personal cuotas panel shows only this tenant's fees

**Visible UI Elements:**
- Personal cuotas table
- Payment status
- Due dates
- Payment history

**API Call:** `GET /api/cuotas/mis-cuotas`

---

### Step 6: Click "Anuncios" button

**Screenshot:** `inquilino-06-anuncios.png`

**Description:** Announcements section shows building-wide announcements

**Visible UI Elements:**
- Announcements list
- Priority indicators
- Date posted

**API Call:** `GET /api/anuncios`

---

### Step 7: Click "Mis Solicitudes" button

**Screenshot:** `inquilino-07-mis-solicitudes.png`

**Description:** Personal requests panel shows only this tenant's requests

**Visible UI Elements:**
- Personal requests table
- Create request button
- Status indicators

**API Call:** `GET /api/solicitudes/mis-solicitudes`

---

### Step 8: Click "Estado de Cuenta" button

**Screenshot:** `inquilino-08-estado-cuenta.png`

**Description:** Account statement shows payment history and balance

**Visible UI Elements:**
- Payment history table
- Current balance
- Download PDF button

**API Call:** `GET /api/cuotas/estado-cuenta`

---

### Step 9: Click "Cerrar Sesión"

**Screenshot:** `inquilino-09-logout.png`

**Description:** User is logged out and redirected to login page

**Expected Result:** Redirect to /login.html

---

## 🔌 API Endpoints Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/registro` - User registration
- `GET /api/auth/renovar` - Renew JWT token

### Admin Endpoints
- `GET /api/usuarios` - Get all users (ADMIN only)
- `GET /api/cuotas` - Get all cuotas (ADMIN/COMITE)
- `GET /api/gastos` - Get all expenses (ADMIN/COMITE)
- `GET /api/presupuestos` - Get all budgets (ADMIN/COMITE)
- `GET /api/fondos` - Get funds information (ADMIN/COMITE)
- `GET /api/anuncios` - Get all announcements (ALL)
- `GET /api/solicitudes` - Get all requests (ADMIN)
- `GET /api/audit` - Get audit logs (ADMIN)

### Inquilino Endpoints
- `GET /api/usuarios/profile` - Get own profile
- `GET /api/cuotas/mis-cuotas` - Get personal cuotas
- `GET /api/cuotas/estado-cuenta` - Get account statement
- `GET /api/solicitudes/mis-solicitudes` - Get personal requests
- `GET /api/anuncios` - Get announcements

---

## 🎨 UI Elements Catalog

### Common Elements

#### Buttons
- **Primary Button** (`.btn-primary`) - Main action buttons (e.g., "Ingresar", "Guardar")
- **Secondary Button** (`.btn-secondary`) - Secondary actions
- **Danger Button** (`.btn-danger`) - Destructive actions (e.g., "Eliminar")
- **Icon Button** - Buttons with Font Awesome icons

#### Forms
- **Text Input** - Standard text input fields
- **Password Input** - Masked password fields
- **Email Input** - Email validation fields
- **Select Dropdown** - Selection dropdowns
- **Date Picker** - Date selection inputs

#### Tables
- **Data Table** - Sortable, filterable data tables
- **Action Buttons** - Edit, Delete, View actions
- **Status Badges** - Color-coded status indicators
- **Pagination** - Table pagination controls

#### Cards
- **Stat Card** - Dashboard statistics cards
- **Info Card** - Information display cards
- **Action Card** - Cards with action buttons

#### Modals
- **Confirmation Modal** - Confirm/Cancel dialogs
- **Form Modal** - Forms in modal windows
- **Info Modal** - Information display modals

---

## ✅ Testing Checklist

### Admin Flow
- [x] Login with admin credentials
- [x] Access all admin menu options
- [x] View usuarios list
- [x] View cuotas management
- [x] View gastos management
- [x] View presupuestos
- [x] View fondos information
- [x] View anuncios
- [x] View solicitudes
- [x] Logout successfully

### Inquilino Flow
- [x] Login with inquilino credentials
- [x] View personal dashboard
- [x] View mis cuotas
- [x] View anuncios
- [x] View mis solicitudes
- [x] View estado de cuenta
- [x] Logout successfully

---

**End of Visual Test Documentation**
