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
} = require("../controllers/asset.controller");
const { checkRolePermission } = require("../middleware/rolePermission");

router.get(
  "/:clinicId/assets",
  validateTokenHandler,
  getClinicAssets
);

router.post(
  "/:clinicId/assets/upload",
  validateTokenHandler,
  uploadClinicAsset
);

router.delete(
  "/:clinicId/assets/:assetId",
  validateTokenHandler,
  deleteClinicAsset
);

router.post(
  "/:clinicId/assets/:assetId/transfer",
  validateTokenHandler,
  transferAsset
);

router.get(
  "/:clinicId/assets/:assetId/transfers",
  validateTokenHandler,
  getAssetTransfers
);

router.patch(
  "/:clinicId/assets/transfers/:transferId/status",
  validateTokenHandler,
  updateTransferStatus
);

router.get(
  "/my-transfers",
  validateTokenHandler,
  getMyTransfers
);

module.exports = router;