# 🗄️ Resumen Base de Datos D1 - ChispartBuilding

**Database:** `edificio-admin-db`  
**ID:** `a571aea0-d80d-4846-a31c-9936bddabdf5`  
**Tamaño:** 368,640 bytes (360 KB)  
**Fecha consulta:** 2026-01-20

---

## 📊 Tablas del Sistema (27 tablas)

### **🔹 Tablas Principales (con datos)**

| Tabla | Registros | Descripción |
|-------|-----------|-------------|
| **usuarios** | 1 | Usuarios del sistema |
| **buildings** | 7 | Edificios/condominios registrados |
| **fondos** | 8 | Fondos y patrimonios |
| **proyectos** | 2 | Proyectos críticos del edificio |
| **permisos** | 8 | Permisos de Antonio |

### **🔹 Tablas Vacías (sin datos actualmente)**

| Tabla | Uso |
|-------|-----|
| **cuotas** | Cuotas mensuales de departamentos |
| **gastos** | Gastos del edificio |
| **anuncios** | Anuncios para residentes |
| **cierres** | Cierres contables mensuales |
| **solicitudes** | Solicitudes de residentes |
| **parcialidades** | Planes de pago |
| **movimientos_fondos** | Movimientos entre fondos |
| **documentos** | Documentos del edificio |
| **multas** | Multas a residentes |
| **reservas** | Reservas de amenidades |
| **notificaciones** | Notificaciones del sistema |
| **pagos** | Historial de pagos |
| **gastos_comunes** | Gastos compartidos |

### **🔹 Tablas del Sistema**

| Tabla | Uso |
|-------|-----|
| **otps** | Códigos OTP para autenticación |
| **payments** | Pagos de onboarding (Clip) |
| **patrimonies** | Patrimonios (legacy) |
| **edificios** | Edificios (legacy) |
| **super_admins** | Super administradores |
| **theme_configs** | Configuraciones de tema |
| **audit_log** | Log de auditoría |
| **d1_migrations** | Migraciones de base de datos |

---

## 👤 USUARIO ÚNICO - Antonio

```sql
SELECT id, nombre, email, rol, building_id, activo FROM usuarios;
```

| ID | Nombre | Email | Rol | Building | Activo |
|----|--------|-------|-----|----------|--------|
| 4 | Antonio | antonio.gemelo.95@gmail.com | ADMIN | 7 | ✅ Sí |

**Password:** `edificiod125` (Hash SHA-256)

---

## 🏢 BUILDINGS (Edificios)

```sql
SELECT id, name, plan, units_count, active FROM buildings;
```

| ID | Nombre | Plan | Unidades | Activo |
|----|--------|------|----------|--------|
| 1 | Pruebas En Vivo | basico | 20 | ✅ |
| 2 | Pruebas En Vivo | basico | 20 | ✅ |
| 4 | Pruebas En Vivo | basico | 20 | ✅ |
| 5 | Pruebas En Vivosssss | profesional | 20 | ✅ |
| 6 | 12588 | profesional | 20 | ✅ |
| **7** | **Edificio D 2026** | **basico** | **20** | ✅ |
| 8 | Pruebas En Vivo | profesional | 20 | ✅ |

**Building de Antonio:** ID 7 (Edificio D 2026)

---

## 💰 FONDOS

```sql
SELECT id, nombre, tipo, saldo, building_id FROM fondos;
```

**Total:** 8 fondos registrados

| ID | Nombre | Tipo | Saldo | Building |
|----|--------|------|-------|----------|
| 1 | 10000 | RESERVA | $10,000 | 5 |
| 2 | 15000 | RESERVA | $15,000 | 5 |
| 3 | 15000 | RESERVA | $15,000 | 6 |
| ... | ... | ... | ... | ... |

---

## 🏗️ PROYECTOS

```sql
SELECT id, nombre FROM proyectos;
```

| ID | Nombre del Proyecto |
|----|---------------------|
| 1 | Acta constitutiva |
| 2 | Sistema de agua potable |

---

## 🔐 PERMISOS DE ANTONIO (Usuario ID 4)

```sql
SELECT recurso, puede_crear, puede_editar, puede_eliminar 
FROM permisos WHERE usuario_id = 4;
```

| Recurso | Crear | Editar | Eliminar |
|---------|-------|--------|----------|
| anuncios | ✅ | ✅ | ✅ |
| cierres | ✅ | ✅ | ✅ |
| configuracion | ✅ | ✅ | ✅ |
| cuotas | ✅ | ✅ | ✅ |
| fondos | ✅ | ✅ | ✅ |
| gastos | ✅ | ✅ | ✅ |
| proyectos | ✅ | ✅ | ✅ |
| **usuarios** | ✅ | ✅ | ✅ |

**Antonio tiene permisos COMPLETOS en los 8 recursos principales.**

---

## 📈 Estadísticas Globales

- **Total tablas:** 27
- **Tablas con datos:** 5
- **Tablas vacías:** 22
- **Total usuarios:** 1 (Antonio)
- **Total buildings:** 7
- **Buildings activos:** 7
- **Fondos:** 8
- **Proyectos:** 2
- **Permisos configurados:** 8

---

## 🔧 Comandos Útiles

### Ver estructura de tabla:
```bash
wrangler d1 execute edificio-admin-db --remote --command "PRAGMA table_info(usuarios)"
```

### Consulta personalizada:
```bash
wrangler d1 execute edificio-admin-db --remote --command "SELECT * FROM usuarios WHERE activo = 1"
```

### Actualizar registro:
```bash
wrangler d1 execute edificio-admin-db --remote --command "UPDATE usuarios SET activo = 1 WHERE id = 4"
```

---

## ⚠️ Notas Importantes

1. **Soft Delete:** Los usuarios se marcan como `activo = 0` en lugar de eliminarse
2. **Foreign Keys:** Activadas - protegen integridad referencial
3. **Building Principal:** ID 7 (Edificio D 2026) - Asignado a Antonio
4. **Cuotas:** Se generan solo para usuarios activos (`activo = 1`)
5. **Data.json vs D1:** Sistema dual (local usa JSON, producción usa D1)

---

**Última actualización:** 2026-01-20 06:28 UTC
