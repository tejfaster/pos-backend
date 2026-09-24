import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
} from "../services/categoryService.js";

import {
  validateCategoryInput,
  validateCategoryUpdate,
} from "../utils/referenceValidation.js";

import { handleDatabaseError } from "../utils/databaseErrors.js";

export async function listCategories(req, res) {
  try {
    const { status = "active" } = req.query;

    const categories = await getCategories({ status });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("List categories error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function getCategory(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "CATEGORY_ID_INVALID",
        message:
          "Category ID must be a valid positive integer.",
      });
    }

    const category = await getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function addCategory(req, res) {
  try {
    const {
      nameEn,
      nameHi = null,
    } = req.body;

    const validationError =
      validateCategoryInput({
        nameEn,
        nameHi,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        ...validationError,
      });
    }

    const category = await createCategory({
      nameEn,
      nameHi,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function editCategory(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "CATEGORY_ID_INVALID",
        message:
          "Category ID must be a valid positive integer.",
      });
    }

    const {
      nameEn,
      nameHi,
      status,
    } = req.body;

    const validationError =
      validateCategoryUpdate({
        nameEn,
        nameHi,
        status,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        ...validationError,
      });
    }

    const category = await updateCategory(id, {
      nameEn,
      nameHi,
      status,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function removeCategory(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "CATEGORY_ID_INVALID",
        message:
          "Category ID must be a valid positive integer.",
      });
    }

    const category =
      await deactivateCategory(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Delete category error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}