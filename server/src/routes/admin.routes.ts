import { Router, Request, Response, NextFunction } from 'express';
import * as adminCtrl from '../controllers/admin.controller';
import { adminAuth } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin-internal.middleware';

const router = Router();

/**
 * Hybrid Authentication:
 * Allows access via X-Admin-Api-Key OR an active SuperAdmin session.
 */
function unifiedAdminAuth(req: Request, res: Response, next: NextFunction) {
    // 1. Try API Key first
    const apiKey = req.headers['x-admin-api-key'];
    if (apiKey) {
        return adminAuth(req, res, next);
    }

    // 2. Try Session (authenticate + requireAdmin)
    authenticate(req, res, (err) => {
        if (err) return next(err);
        requireAdmin(req, res, next);
    });
}

router.use(unifiedAdminAuth);

// ==========================================
// METRICS
// ==========================================
router.get('/metrics/overview', adminCtrl.getOverview);
router.get('/metrics/activation', adminCtrl.getActivationFunnel);

// Backward compatibility until frontend updates
router.get('/overview', adminCtrl.getOverview);

// ==========================================
// TENANTS (CRUD & Mute)
// ==========================================
router.get('/tenants', adminCtrl.listTenants);
router.get('/tenants/:id', adminCtrl.getTenantDetails);
router.put('/tenants/:id', adminCtrl.updateTenant);
router.delete('/tenants/:id', adminCtrl.deleteTenant);

// ==========================================
// USERS & SUBSCRIPTIONS
// ==========================================
router.get('/users', adminCtrl.listUsers);
router.put('/users/:id', adminCtrl.updateAnyUser);
router.delete('/users/:id', adminCtrl.deleteAnyUser);

router.get('/subscriptions', adminCtrl.listSubscriptions);

// ==========================================
// ENTITIES "DEUS MODE" (CROSS-TENANT)
// ==========================================
// Tools
router.get('/tools', adminCtrl.listAllTools);
router.put('/tools/:id', adminCtrl.updateAnyTool);
router.delete('/tools/:id', adminCtrl.deleteAnyTool);

// Customers
router.get('/customers', adminCtrl.listAllCustomers);
router.put('/customers/:id', adminCtrl.updateAnyCustomer);
router.delete('/customers/:id', adminCtrl.deleteAnyCustomer);

// Rentals
router.get('/rentals', adminCtrl.listAllRentals);
router.put('/rentals/:id', adminCtrl.updateAnyRental);
router.delete('/rentals/:id', adminCtrl.deleteAnyRental);

export default router;
