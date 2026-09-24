import {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deactivateUnit,
} from "../services/unitService.js";

import {
  validateUnitInput,
  validateUnitUpdate,
} from "../utils/referenceValidation.js";

import { handleDatabaseError } from "../utils/databaseErrors.js";

export async function listUnits(req, res) {
  try {
    const { status = "active" } = req.query;

    const units = await getUnits({ status });

    return res.status(200).json({
      success: true,
      data: units,
    });
  } catch (error) {
    console.error("List units error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function getUnit(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "UNIT_ID_INVALID",
        message:
          "Unit ID must be a valid positive integer.",
      });
    }

    const unit = await getUnitById(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        code: "UNIT_NOT_FOUND",
        message: "Unit not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error("Get unit error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function addUnit(req, res) {
  try {
    const {
      nameEn,
      nameHi = null,
      shortName,
      type,
    } = req.body;

    const validationError =
      validateUnitInput({
        nameEn,
        nameHi,
        shortName,
        type,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        ...validationError,
      });
    }

    const unit = await createUnit({
      nameEn,
      nameHi,
      shortName,
      type,
    });

    return res.status(201).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error("Create unit error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function editUnit(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "UNIT_ID_INVALID",
        message:
          "Unit ID must be a valid positive integer.",
      });
    }

    const {
      nameEn,
      nameHi,
      shortName,
      type,
      status,
    } = req.body;

    const validationError =
      validateUnitUpdate({
        nameEn,
        nameHi,
        shortName,
        type,
        status,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        ...validationError,
      });
    }

    const unit = await updateUnit(id, {
      nameEn,
      nameHi,
      shortName,
      type,
      status,
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        code: "UNIT_NOT_FOUND",
        message: "Unit not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error("Update unit error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function removeUnit(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "UNIT_ID_INVALID",
        message:
          "Unit ID must be a valid positive integer.",
      });
    }

    const unit = await deactivateUnit(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        code: "UNIT_NOT_FOUND",
        message: "Unit not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: unit,
    });
  } catch (error) {
    console.error("Delete unit error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}