class HttpError extends Error {
  constructor(statusCode, message, extras = {}) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.extras = extras;
  }
}

class ValidationError extends HttpError {
  constructor(message) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

class ServiceUnavailableError extends HttpError {
  constructor(message) {
    super(503, message);
    this.name = 'ServiceUnavailableError';
  }
}

class GatewayTimeoutError extends HttpError {
  constructor(message = 'Upstream model timed out') {
    super(504, message);
    this.name = 'GatewayTimeoutError';
  }
}

class InternalError extends HttpError {
  constructor(message = 'Generation failed', extras = {}) {
    super(500, message, extras);
    this.name = 'InternalError';
  }
}

module.exports = {
  HttpError,
  ValidationError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  InternalError,
};
