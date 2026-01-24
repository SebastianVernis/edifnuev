import { readData, writeData, updateItem, deleteItem } from '../data.js';
import { handleControllerError } from '../middleware/error-handler.js';
import { generarJWT } from '../middleware/auth.js';
import Usuario from '../models/Usuario.js';

/**
 * Super Admin Login
 * Solo permite login si el usuario tiene rol SUPERADMIN
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.getByEmail(email);
        if (!usuario || usuario.rol !== 'SUPERADMIN') {
            return res.status(401).json({
                ok: false,
                msg: 'Acceso denegado. Se requiere cuenta de Super Admin.'
            });
        }

        const validPassword = await Usuario.validatePassword(usuario, password);
        if (!validPassword) {
            return res.status(401).json({
                ok: false,
                msg: 'Credenciales inválidas'
            });
        }

        const token = await generarJWT(usuario.id, usuario.rol, usuario.departamento);

        res.json({
            ok: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });
    } catch (error) {
        return handleControllerError(error, res, 'superAdmin.login');
    }
};

/**
 * Obtener estadísticas globales del sistema
 */
export const getStats = async (req, res) => {
    try {
        const data = readData();

        const stats = {
            totalBuildings: data.buildings ? data.buildings.length : 0,
            totalUsuarios: data.usuarios.length,
            buildingsActivos: data.buildings ? data.buildings.filter(b => b.active).length : 0,
            pagosPendientes: data.pagos_temporales ? data.pagos_temporales.length : 0 // Ejemplo de tabla futura
        };

        res.json({ ok: true, stats });
    } catch (error) {
        return handleControllerError(error, res, 'superAdmin.getStats');
    }
};

/**
 * Obtener lista de todos los edificios registrados
 */
export const getBuildings = async (req, res) => {
    try {
        const data = readData();
        const buildings = (data.buildings || []).map(b => {
            // Intentar encontrar el admin de este edificio
            const admin = data.usuarios.find(u => u.buildingId === b.id && u.rol === 'ADMIN');
            return {
                ...b,
                admin_email: admin ? admin.email : 'N/A'
            };
        });

        res.json({ ok: true, buildings });
    } catch (error) {
        return handleControllerError(error, res, 'superAdmin.getBuildings');
    }
};

/**
 * Actualizar límites de un edificio (ej. unidades máximas)
 */
export const updateBuildingLimits = async (req, res) => {
    const { id } = req.params;
    const { units_count } = req.body;

    try {
        const updated = updateItem('buildings', id, { units_count: parseInt(units_count) });
        if (!updated) {
            return res.status(404).json({ ok: false, msg: 'Edificio no encontrado' });
        }

        res.json({ ok: true, building: updated });
    } catch (error) {
        return handleControllerError(error, res, 'superAdmin.updateBuildingLimits');
    }
};

/**
 * Cambiar estado activo/inactivo de un edificio
 */
export const updateBuildingStatus = async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    try {
        const updated = updateItem('buildings', id, { active: !!active });
        if (!updated) {
            return res.status(404).json({ ok: false, msg: 'Edificio no encontrado' });
        }

        res.json({ ok: true, building: updated });
    } catch (error) {
        return handleControllerError(error, res, 'superAdmin.updateBuildingStatus');
    }
};

/**
 * Restringir un administrador (suspender cuenta)
 */
export const restrictAdmin = async (req, res) => {
    const { id } = req.params;

    try {
        const updated = updateItem('usuarios', id, { activo: false, restringido: true });
        if (!updated) {
            return res.status(404).json({ ok: false, msg: 'Administrador no encontrado' });
        }

        res.json({ ok: true, msg: 'Administrador restringido correctamente', admin: updated });
    } catch (error) {
        return handleControllerError(error, res, 'superAdmin.restrictAdmin');
    }
};

/**
 * Generar reporte de soporte (Troubleshooting)
 * Inspecciona el estado de un edificio o usuario para detectar inconsistencias
 */
export const generateSupportReport = async (req, res) => {
    const { type, targetId } = req.query;

    try {
        const data = readData();
        const report = {
            timestamp: new Date().toISOString(),
            type,
            targetId,
            findings: []
        };

        if (type === 'building') {
            const building = data.buildings?.find(b => b.id === parseInt(targetId));
            if (!building) {
                report.findings.push('CRITICAL: Edificio no existe en DB');
            } else {
                const units = data.cuotas?.filter(c => c.buildingId === building.id).length;
                if (units > building.units_count) {
                    report.findings.push(`WARNING: El edificio tiene más cuotas registradas (${units}) que su límite permitido (${building.units_count})`);
                }

                const admins = data.usuarios.filter(u => u.buildingId === building.id && u.rol === 'ADMIN');
                if (admins.length === 0) report.findings.push('ERROR: El edificio no tiene un administrador asignado');
            }
        }
    }
        } else if (type === 'project') {
    const project = data.proyectos?.find(p => p.id === parseInt(targetId));
    if (!project) {
        report.findings.push('CRITICAL: Proyecto no existe en DB');
    } else {
        if (!project.nombre || project.monto <= 0) {
            report.findings.push('ERROR: El proyecto tiene datos inconsistentes (nombre vacío o monto inválido)');
        }
    }
}

res.json({ ok: true, report });
    } catch (error) {
    return handleControllerError(error, res, 'superAdmin.generateSupportReport');
}
};
