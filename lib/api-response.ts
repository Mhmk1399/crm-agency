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
