export function validateProductInput({
  nameEn,
  nameHi = null,
  categoryId,
  unitId = null,
  brand = null,
}) {
  // English name
  if (typeof nameEn !== "string" || !nameEn.trim()) {
    return {
      code: "PRODUCT_NAME_EN_REQUIRED",
      message: "English product name is required.",
    };
  }

  // Hindi name
  if (
    nameHi !== null &&
    nameHi !== undefined &&
    typeof nameHi !== "string"
  ) {
    return {
      code: "PRODUCT_NAME_HI_INVALID",
      message: "Hindi product name must be a string.",
    };
  }

  // Category
  if (
    !Number.isInteger(Number(categoryId)) ||
    Number(categoryId) <= 0
  ) {
    return {
      code: "CATEGORY_ID_INVALID",
      message: "A valid category is required.",
    };
  }

  // Unit
  if (
    unitId !== null &&
    unitId !== undefined &&
    (!Number.isInteger(Number(unitId)) ||
      Number(unitId) <= 0)
  ) {
    return {
      code: "UNIT_ID_INVALID",
      message: "Unit ID must be a valid positive integer.",
    };
  }

  // Brand
  if (
    brand !== null &&
    brand !== undefined &&
    typeof brand !== "string"
  ) {
    return {
      code: "BRAND_INVALID",
      message: "Brand must be a string.",
    };
  }

  return null;
}

export function validateProductUpdate({
  nameEn,
  nameHi,
  categoryId,
  unitId,
  brand,
  status,
}) {
  // English name
  if (nameEn !== undefined) {
    if (
      typeof nameEn !== "string" ||
      !nameEn.trim()
    ) {
      return {
        code: "PRODUCT_NAME_EN_INVALID",
        message: "English product name cannot be empty.",
      };
    }
  }

  // Hindi name
  if (
    nameHi !== undefined &&
    nameHi !== null &&
    typeof nameHi !== "string"
  ) {
    return {
      code: "PRODUCT_NAME_HI_INVALID",
      message: "Hindi product name must be a string.",
    };
  }

  // Category
  if (
    categoryId !== undefined &&
    (!Number.isInteger(Number(categoryId)) ||
      Number(categoryId) <= 0)
  ) {
    return {
      code: "CATEGORY_ID_INVALID",
      message:
        "Category ID must be a valid positive integer.",
    };
  }

  // Unit
  if (
    unitId !== undefined &&
    unitId !== null &&
    (!Number.isInteger(Number(unitId)) ||
      Number(unitId) <= 0)
  ) {
    return {
      code: "UNIT_ID_INVALID",
      message:
        "Unit ID must be a valid positive integer.",
    };
  }

  // Brand
  if (
    brand !== undefined &&
    brand !== null &&
    typeof brand !== "string"
  ) {
    return {
      code: "BRAND_INVALID",
      message: "Brand must be a string.",
    };
  }

  // Status
  if (
    status !== undefined &&
    !["active", "inactive"].includes(status)
  ) {
    return {
      code: "STATUS_INVALID",
      message:
        "Status must be active or inactive.",
    };
  }

  return null;
}

export function validateStatus(status) {
  if (
    status !== undefined &&
    status !== null &&
    !["active", "inactive"].includes(status)
  ) {
    return {
      code: "STATUS_INVALID",
      message:
        "Status must be active or inactive.",
    };
  }

  return null;
}