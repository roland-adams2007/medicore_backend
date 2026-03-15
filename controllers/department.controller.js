const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const { db_connection } = require("../config/config.inc");
const BranchUser = require("../models/branch_user.model.js");
const Clinic = require("../models/clinic.model.js");
const cache = require("../utils/cache.js");

const getBranchDepartments = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const branchId = parseInt(req.params.branchId, 10);
  const userId = req.user?.id;

  if (!clinicId || isNaN(clinicId)) {
    res.status(400);
    throw new Error("Valid clinic ID is required.");
  }

  if (!branchId || isNaN(branchId)) {
    res.status(400);
    throw new Error("Valid branch ID is required.");
  }

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found.");
  }

  const isOwner = clinic.owner_id === userId;
  if (!isOwner) {
    const role = await BranchUser.findUserRoleInClinic(clinicId, userId);
    if (!role) {
      res.status(403);
      throw new Error("Access denied.");
    }
  }

  const cacheKey = `clinic:${clinicId}:branch:${branchId}:departments`;

  const cachedDepartments = await cache.get(cacheKey);
  if (cachedDepartments) {
    return responseHandler(res, { departments: cachedDepartments }, "Departments");
  }

  const [rows] = await db_connection.execute(
    `SELECT d.id, d.uuid, d.name, d.description, d.created_at,
            COUNT(DISTINCT sd.staff_profile_id) AS staff_count
     FROM departments d
     LEFT JOIN staff_departments sd ON sd.department_id = d.id
     WHERE d.branch_id = ?
     GROUP BY d.id
     ORDER BY d.name ASC`,
    [branchId],
  );

  await cache.set(cacheKey, rows || [], 86400);

  res.status(200);
  responseHandler(res, { departments: rows || [] });
});

const createDepartment = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const branchId = parseInt(req.params.branchId, 10);
  const userId = req.user?.id;
  const { name, description } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Department name is required.");
  }

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found.");
  }

  const isOwner = clinic.owner_id === userId;
  if (!isOwner) {
    const role = await BranchUser.findUserRoleInClinic(clinicId, userId);
    if (!role) {
      res.status(403);
      throw new Error("Access denied.");
    }
  }

  const uuid = require("../utils/generateUUID")();

  const [result] = await db_connection.execute(
    `INSERT INTO departments (uuid, branch_id, name, description)
     VALUES (?, ?, ?, ?)`,
    [uuid, branchId, name.trim(), description?.trim() || null],
  );

  if (!result.insertId) {
    res.status(500);
    throw new Error("Failed to create department.");
  }

  const [[dept]] = await db_connection.execute(
    `SELECT id, uuid, name, description, created_at FROM departments WHERE id = ?`,
    [result.insertId],
  );

  // Bust departments cache for this branch
  await cache.del(`clinic:${clinicId}:branch:${branchId}:departments`);

  res.status(201);
  responseHandler(res, { department: dept });
});

const updateDepartment = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const branchId = parseInt(req.params.branchId, 10);
  const deptId = parseInt(req.params.deptId, 10);
  const userId = req.user?.id;
  const { name, description } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Department name is required.");
  }

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found.");
  }

  const isOwner = clinic.owner_id === userId;
  if (!isOwner) {
    const role = await BranchUser.findUserRoleInClinic(clinicId, userId);
    if (!role) {
      res.status(403);
      throw new Error("Access denied.");
    }
  }

  const [[dept]] = await db_connection.execute(
    `SELECT id FROM departments WHERE id = ? AND branch_id = ?`,
    [deptId, branchId],
  );

  if (!dept) {
    res.status(404);
    throw new Error("Department not found.");
  }

  await db_connection.execute(
    `UPDATE departments SET name = ?, description = ?, updated_at = NOW() WHERE id = ?`,
    [name.trim(), description?.trim() || null, deptId],
  );

  // Bust departments cache for this branch
  await cache.del(`clinic:${clinicId}:branch:${branchId}:departments`);

  res.status(200);
  responseHandler(res, { message: "Department updated." });
});

const deleteDepartment = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const branchId = parseInt(req.params.branchId, 10);
  const deptId = parseInt(req.params.deptId, 10);
  const userId = req.user?.id;

  const clinic = await Clinic.findById(clinicId);
  if (!clinic) {
    res.status(404);
    throw new Error("Clinic not found.");
  }

  const isOwner = clinic.owner_id === userId;
  if (!isOwner) {
    const role = await BranchUser.findUserRoleInClinic(clinicId, userId);
    if (!role) {
      res.status(403);
      throw new Error("Access denied.");
    }
  }

  const [[dept]] = await db_connection.execute(
    `SELECT id FROM departments WHERE id = ? AND branch_id = ?`,
    [deptId, branchId],
  );

  if (!dept) {
    res.status(404);
    throw new Error("Department not found.");
  }

  await db_connection.execute(`DELETE FROM departments WHERE id = ?`, [deptId]);

  // Bust departments cache for this branch
  await cache.del(`clinic:${clinicId}:branch:${branchId}:departments`);

  res.status(200);
  responseHandler(res, { message: "Department deleted." });
});

module.exports = {
  getBranchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};