export function validateCategoryInput({
  nameEn,
  nameHi = null,
}) {
  if (typeof nameEn !== "string" || !nameEn.trim()) {
    return {
      code: "CATEGORY_NAME_EN_REQUIRED",
      message: "English category name is required.",
    };
  }

  if (
    nameHi !== null &&
    nameHi !== undefined &&
    typeof nameHi !== "string"
  ) {
    return {
      code: "CATEGORY_NAME_HI_INVALID",
      message: "Hindi category name must be a string.",
    };
  }

  return null;
}

export function validateCategoryUpdate({
  nameEn,
  nameHi,
  status,
}) {
  if (nameEn !== undefined) {
    if (typeof nameEn !== "string" || !nameEn.trim()) {
      return {
        code: "CATEGORY_NAME_EN_INVALID",
        message: "English category name cannot be empty.",
      };
    }
  }

  if (
    nameHi !== undefined &&
    nameHi !== null &&
    typeof nameHi !== "string"
  ) {
    return {
      code: "CATEGORY_NAME_HI_INVALID",
      message: "Hindi category name must be a string.",
    };
  }

  if (
    status !== undefined &&
    !["active", "inactive"].includes(status)
  ) {
    return {
      code: "STATUS_INVALID",
      message: "Status must be active or inactive.",
    };
  }

  return null;
}

export function validateUnitInput({
  nameEn,
  nameHi = null,
  shortName,
  type,
}) {
  if (typeof nameEn !== "string" || !nameEn.trim()) {
    return {
      code: "UNIT_NAME_EN_REQUIRED",
      message: "English unit name is required.",
    };
  }

  if (
    nameHi !== null &&
    nameHi !== undefined &&
    typeof nameHi !== "string"
  ) {
    return {
      code: "UNIT_NAME_HI_INVALID",
      message: "Hindi unit name must be a string.",
    };
  }

  if (typeof shortName !== "string" || !shortName.trim()) {
    return {
      code: "UNIT_SHORT_NAME_REQUIRED",
      message: "Unit short name is required.",
    };
  }

  if (typeof type !== "string" || !type.trim()) {
    return {
      code: "UNIT_TYPE_REQUIRED",
      message: "Unit type is required.",
    };
  }

  return null;
}

export function validateUnitUpdate({
  nameEn,
  nameHi,
  shortName,
  type,
  status,
}) {
  if (nameEn !== undefined) {
    if (typeof nameEn !== "string" || !nameEn.trim()) {
      return {
        code: "UNIT_NAME_EN_INVALID",
        message: "English unit name cannot be empty.",
      };
    }
  }

  if (
    nameHi !== undefined &&
    nameHi !== null &&
    typeof nameHi !== "string"
  ) {
    return {
      code: "UNIT_NAME_HI_INVALID",
      message: "Hindi unit name must be a string.",
    };
  }

  if (shortName !== undefined) {
    if (typeof shortName !== "string" || !shortName.trim()) {
      return {
        code: "UNIT_SHORT_NAME_INVALID",
        message: "Unit short name cannot be empty.",
      };
    }
  }

  if (type !== undefined) {
    if (typeof type !== "string" || !type.trim()) {
      return {
        code: "UNIT_TYPE_INVALID",
        message: "Unit type cannot be empty.",
      };
    }
  }

  if (
    status !== undefined &&
    !["active", "inactive"].includes(status)
  ) {
    return {
      code: "STATUS_INVALID",
      message: "Status must be active or inactive.",
    };
  }

  return null;
}