const { db_connection } = require("../config/config.inc");

const Subscription = {
  // get the active subscription + limits for a clinic
  getActiveForClinic: async (clinicId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT 
            s.id, s.name, s.description,
            s.price_monthly, s.price_yearly,
            s.max_users, s.max_branches, s.max_storage_mb,
            cs.status, cs.start_date, cs.end_date
         FROM clinic_subscriptions cs
         JOIN subscriptions s ON cs.subscription_id = s.id
         WHERE cs.clinic_id = ?
           AND cs.status = 'active'
         ORDER BY cs.created_at DESC
         LIMIT 1`,
        [clinicId],
      );
      return rows[0] || null;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  // get all permission names for a subscription (uses the recursive view)
  getPermissions: async (subscriptionId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT DISTINCT permission_name
         FROM vw_subscription_permissions
         WHERE subscription_id = ?`,
        [subscriptionId],
      );
      return rows.map((r) => r.permission_name);
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // get full subscription details including permissions in one call
  getActiveWithPermissions: async (clinicId) => {
    try {
      const sub = await Subscription.getActiveForClinic(clinicId);
      if (!sub) return null;
      sub.permissions = await Subscription.getPermissions(sub.id);
      return sub;
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  // count current branches for a clinic
  countBranches: async (clinicId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT COUNT(*) AS total FROM branches WHERE clinic_id = ?`,
        [clinicId],
      );
      return rows[0]?.total ?? 0;
    } catch {
      return 0;
    }
  },

  // count current staff (branch_users) across all branches of a clinic
  countUsers: async (clinicId) => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT COUNT(DISTINCT bu.user_id) AS total
         FROM branch_users bu
         JOIN branches b ON bu.branch_id = b.id
         WHERE b.clinic_id = ?`,
        [clinicId],
      );
      return rows[0]?.total ?? 0;
    } catch {
      return 0;
    }
  },

  getAll: async () => {
    try {
      const [rows] = await db_connection.execute(
        `SELECT id, uuid, name, description, price_monthly, price_yearly,
            max_users, max_branches, max_storage_mb, is_active
         FROM subscriptions
         WHERE is_active = 1
         ORDER BY id ASC`,
      );
      return rows || [];
    } catch {
      return [];
    }
  },
};

module.exports = Subscription;