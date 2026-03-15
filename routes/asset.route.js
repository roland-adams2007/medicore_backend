const express = require("express");
const router = express.Router({ mergeParams: true });
const validateTokenHandler = require("../middleware/validateTokenHandler");
const {
  uploadClinicAsset,
  getClinicAssets,
  deleteClinicAsset,
  transferAsset,
  getAssetTransfers,
  updateTransferStatus,
  getMyTransfers,
  downloadClinicAsset,
  getStorageStats,
} = require("../controllers/asset.controller");

router.get("/my-transfers", validateTokenHandler, getMyTransfers);

router.get("/:clinicId/assets", validateTokenHandler, getClinicAssets);

router.get("/:clinicId/storage", validateTokenHandler, getStorageStats);

router.post(
  "/:clinicId/assets/upload",
  validateTokenHandler,
  uploadClinicAsset,
);

router.delete(
  "/:clinicId/assets/:assetId",
  validateTokenHandler,
  deleteClinicAsset,
);

router.post(
  "/:clinicId/assets/:assetId/transfer",
  validateTokenHandler,
  transferAsset,
);

router.get(
  "/:clinicId/assets/:assetId/transfers",
  validateTokenHandler,
  getAssetTransfers,
);

router.patch(
  "/:clinicId/assets/transfers/:transferId/status",
  validateTokenHandler,
  updateTransferStatus,
);

router.get(
  "/:clinicId/assets/:assetId/download",
  validateTokenHandler,
  downloadClinicAsset,
);

module.exports = router;