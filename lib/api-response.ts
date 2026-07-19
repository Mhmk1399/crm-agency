import { AppError } from "./errors";

interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
  requestId: string;
}

export function successResponse<T>(
  data: T,
  requestId: string,
  status = 200
): Response {
  const body: SuccessResponse<T> = { success: true, data, requestId };
  return Response.json(body, { status });
}

export function errorResponse(
  error: unknown,
  requestId: string
): Response {
  if (error instanceof AppError) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      requestId,
    };
    return Response.json(body, { status: error.statusCode });
  }

  if (isMongooseValidationError(error)) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: {},
      },
      requestId,
    };
    return Response.json(body, { status: 400 });
  }

  if (isMongooseCastError(error)) {
    const body: ErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Invalid value for ${error.path}.`,
        details: { path: error.path, value: error.value },
      },
      requestId,
    };
    return Response.json(body, { status: 400 });
  }

  if (isMongoDuplicateKeyError(error)) {
    const fields = Object.keys(error.keyPattern ?? {});
    const body: ErrorResponse = {
      success: false,
      error: {
        code: "CONFLICT",
        message: fields.length > 0
          ? `${fields.join(", ")} already exists.`
          : "This record already exists.",
        details: { fields },
      },
      requestId,
    };
    return Response.json(body, { status: 409 });
  }

  const body: ErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      details: {},
    },
    requestId,
  };
  return Response.json(body, { status: 500 });
}

function isMongooseValidationError(error: unknown): error is { name: string; message: string } {
  return typeof error === "object" && error !== null && "name" in error && error.name === "ValidationError";
}

function isMongooseCastError(error: unknown): error is { name: string; path: string; value: unknown } {
  return typeof error === "object" && error !== null && "name" in error && error.name === "CastError" && "path" in error;
}

function isMongoDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, unknown> } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
