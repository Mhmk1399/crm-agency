export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} with id "${id}" not found` : `${entity} not found`,
      "NOT_FOUND",
      404,
      { entity, id }
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "CONFLICT", 409, details);
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(entity: string, from: string, to: string) {
    super(
      `${entity} cannot transition from "${from}" to "${to}"`,
      "INVALID_STATE_TRANSITION",
      422,
      { entity, from, to }
    );
  }
}

export class FinancialCalculationError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "FINANCIAL_CALCULATION_ERROR", 422, details);
  }
}

export class CapacityConflictError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "CAPACITY_CONFLICT", 422, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, "DATABASE_ERROR", 500, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}
