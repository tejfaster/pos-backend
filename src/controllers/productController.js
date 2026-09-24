import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";

import {
  validateProductInput,
  validateProductUpdate,
  validateStatus,
} from "../utils/productValidation.js";

import { handleDatabaseError } from "../utils/databaseErrors.js";

export async function listProducts(req, res) {
  try {
    const {
      search = "",
      categoryId = null,
      status = "active",
    } = req.query;

    const statusError = validateStatus(status);

    if (statusError) {
      return res.status(400).json({
        success: false,
        ...statusError,
      });
    }

    const products = await getProducts({
      search,
      categoryId,
      status,
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("List products error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function getProduct(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "PRODUCT_ID_INVALID",
        message:
          "Product ID must be a valid positive integer.",
      });
    }

    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function addProduct(req, res) {
  try {
    const {
      nameEn,
      nameHi = null,
      categoryId,
      unitId = null,
      brand = null,
    } = req.body;

    const validationError = validateProductInput({
      nameEn,
      nameHi,
      categoryId,
      unitId,
      brand,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        ...validationError,
      });
    }

    const product = await createProduct({
      nameEn,
      nameHi,
      categoryId: Number(categoryId),
      unitId:
        unitId === null
          ? null
          : Number(unitId),
      brand,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function editProduct(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "PRODUCT_ID_INVALID",
        message:
          "Product ID must be a valid positive integer.",
      });
    }

    const {
      nameEn,
      nameHi,
      categoryId,
      unitId,
      brand,
      status,
    } = req.body;

    const validationError =
      validateProductUpdate({
        nameEn,
        nameHi,
        categoryId,
        unitId,
        brand,
        status,
      });

    if (validationError) {
      return res.status(400).json({
        success: false,
        ...validationError,
      });
    }

    const product = await updateProduct(id, {
      nameEn,

      nameHi,

      categoryId:
        categoryId === undefined
          ? undefined
          : Number(categoryId),

      unitId:
        unitId === undefined
          ? undefined
          : unitId === null
            ? null
            : Number(unitId),

      brand,

      status,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}

export async function removeProduct(req, res) {
  try {
    const { id } = req.params;

    if (
      !Number.isInteger(Number(id)) ||
      Number(id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        code: "PRODUCT_ID_INVALID",
        message:
          "Product ID must be a valid positive integer.",
      });
    }

    const product = await deleteProduct(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    const dbError = handleDatabaseError(error);

    return res.status(dbError.status).json({
      success: false,
      code: dbError.code,
      message: dbError.message,
    });
  }
}