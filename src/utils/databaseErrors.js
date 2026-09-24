export function handleDatabaseError(error) {
  // Application-level errors created by our services
  if (error?.code && error?.status) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
    };
  }

  // PostgreSQL unique constraint violation
  if (error?.code === "23505") {
    return {
      status: 409,
      code: "DUPLICATE_RESOURCE",
      message: "A resource with the same unique value already exists.",
    };
  }

  // PostgreSQL foreign-key violation
  if (error?.code === "23503") {
    return {
      status: 400,
      code: "INVALID_REFERENCE",
      message: "A referenced resource does not exist.",
    };
  }

  // PostgreSQL check constraint violation
  if (error?.code === "23514") {
    return {
      status: 400,
      code: "INVALID_VALUE",
      message: "One or more values are invalid.",
    };
  }

  // PostgreSQL not-null violation
  if (error?.code === "23502") {
    return {
      status: 400,
      code: "REQUIRED_VALUE_MISSING",
      message: "A required value is missing.",
    };
  }

  // Unknown database/application error
  return {
    status: 500,
    code: "DATABASE_ERROR",
    message: "A database error occurred.",
  };
}