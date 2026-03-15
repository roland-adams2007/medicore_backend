const asyncHandler = require("express-async-handler");
const { responseHandler } = require("../middleware/responseHandler.js");
const Asset = require("../models/asset.model.js");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { file_config, db_connection } = require("../config/config.inc.js");

const uploadClinicAsset = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);
  const { file, filename, filetype, file_size, file_original_name } = req.body;

  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  if (!file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  try {
    const response = await axios.post(
      "https://projectapi.tixora.com.ng/fileflow/files/api/upload",
      {
        image: file,
        folderName: `medicore/clinic_${clinicId}` || "general",
        fileName: file_original_name,
      },
      {
        headers: {
          Authorization: `Bearer ${file_config.apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response from file upload service");
    }

    const uploadData = response.data.data;
    const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");

    const assetId = await Asset.create({
      clinic_id: clinicId,
      user_id: userId,
      file_uuid: uploadData.uuid || uuidv4(),
      file_original_name: uploadData.file_original_name || file_original_name,
      file_url: uploadData.file_url,
      file_name: uploadData.file_name || filename,
      file_size: uploadData.file_size || file_size,
      mime_type: uploadData.type || filetype,
      extension: uploadData.extension,
      created_at: nowUtc,
    });

    if (!assetId) {
      res.status(500);
      throw new Error("Failed to save asset");
    }

    const asset = await Asset.findById(assetId);

    res.status(201);
    responseHandler(res, { asset }, "File uploaded successfully");
  } catch (error) {
    res.status(500);
    throw new Error(`File upload failed: ${error.message}`);
  }
});

const getClinicAssets = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const search = req.query.search?.trim() || null;
  const mimeType = req.query.mime_type || null;

  if (!userId) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const { assets, total } = await Asset.findByClinicAndUser({
    clinicId,
    userId,
    page,
    limit,
    search,
    mimeType,
  });

  const totalPages = Math.ceil(total / limit);

  res.status(200);
  responseHandler(res, {
    assets,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
});

const deleteClinicAsset = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);
  const assetId = parseInt(req.params.assetId, 10);

  const deleted = await Asset.deleteOwnedByUser(assetId, clinicId, userId);

  if (!deleted) {
    res.status(404);
    throw new Error(
      "Asset not found, already deleted, or you do not have permission to delete it",
    );
  }

  res.status(200);
  responseHandler(res, { message: "Asset deleted successfully" });
});

const transferAsset = asyncHandler(async function (req, res) {
  const clinicId = parseInt(req.params.clinicId, 10);
  const assetId = parseInt(req.params.assetId, 10);
  const senderId = req.user?.id;
  const { receiver_id, message } = req.body;

  if (!receiver_id) {
    res.status(400);
    throw new Error("Receiver ID is required");
  }

  const asset = await Asset.findById(assetId);

  if (!asset || asset.clinic_id !== clinicId) {
    res.status(404);
    throw new Error("Asset not found");
  }

  if (asset.user_id !== senderId) {
    res.status(403);
    throw new Error("You do not have permission to transfer this asset");
  }

  const nowUtc = new Date().toISOString().slice(0, 19).replace("T", " ");

  const transferId = await Asset.createTransfer({
    asset_id: assetId,
    sender_id: senderId,
    receiver_id,
    message,
    created_at: nowUtc,
  });

  if (!transferId) {
    res.status(500);
    throw new Error("Failed to create transfer");
  }

  const transfer = await Asset.findTransferById(transferId);

  res.status(201);
  responseHandler(res, { transfer }, "File transferred successfully");
});

const getAssetTransfers = asyncHandler(async function (req, res) {
  const assetId = parseInt(req.params.assetId, 10);
  const transfers = await Asset.findTransfersByAsset(assetId);
  res.status(200);
  responseHandler(res, { transfers });
});

const updateTransferStatus = asyncHandler(async function (req, res) {
  const transferId = parseInt(req.params.transferId, 10);
  const { status } = req.body;

  if (!["received", "declined"].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'received' or 'declined'");
  }

  const updated = await Asset.updateTransferStatus(transferId, status);
  if (!updated) {
    res.status(404);
    throw new Error("Transfer not found");
  }

  res.status(200);
  responseHandler(res, { message: "Transfer status updated" });
});

const getMyTransfers = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const transfers = await Asset.findTransfersByReceiver(userId);
  res.status(200);
  responseHandler(res, { transfers });
});

const downloadClinicAsset = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);
  const assetId = parseInt(req.params.assetId, 10);

  const asset = await Asset.findById(assetId);

  if (!asset || asset.clinic_id !== clinicId) {
    res.status(404);
    throw new Error("Asset not found");
  }

  const isOwner = asset.user_id === userId;
  if (!isOwner) {
    const transfers = await Asset.findTransfersByReceiver(userId);
    const hasAccess = transfers.some((t) => t.asset_id === assetId);
    if (!hasAccess) {
      res.status(403);
      throw new Error("You do not have permission to download this asset");
    }
  }

  const response = await axios.get(asset.file_url, { responseType: "stream" });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${asset.file_original_name}"`,
  );
  res.setHeader("Content-Type", asset.mime_type || "application/octet-stream");
  if (asset.file_size) res.setHeader("Content-Length", asset.file_size);

  response.data.pipe(res);
});

const getStorageStats = asyncHandler(async function (req, res) {
  const userId = req.user?.id;
  const clinicId = parseInt(req.params.clinicId, 10);

  const [[usageRow]] = await db_connection.execute(
    `SELECT COALESCE(SUM(file_size), 0) AS used_bytes
     FROM clinic_assets
     WHERE clinic_id = ? AND user_id = ? AND deleted_at IS NULL`,
    [clinicId, userId],
  );

  const [[subRow]] = await db_connection.execute(
    `SELECT s.max_storage_mb
     FROM clinics c
     LEFT JOIN subscriptions s ON s.id = c.subscription_id
     WHERE c.id = ?
     LIMIT 1`,
    [clinicId],
  );

  const usedBytes = Number(usageRow.used_bytes);
  const maxBytes = subRow?.max_storage_mb
    ? subRow.max_storage_mb * 1024 * 1024
    : null;

  res.status(200);
  responseHandler(res, {
    used_bytes: usedBytes,
    max_bytes: maxBytes,
  });
});

module.exports = {
  uploadClinicAsset,
  getClinicAssets,
  deleteClinicAsset,
  transferAsset,
  getAssetTransfers,
  updateTransferStatus,
  getMyTransfers,
  downloadClinicAsset,
  getStorageStats,
};
