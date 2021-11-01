import { IHttpResponse } from "./http-response.i";

export class HttpError extends Error {

  private status: number;
  private data?: Record<string, any>;

  constructor(status: number, message: string,
      stackTrace?: string, data?: Record<string, any>) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.status = status;
    this.data = data;

    if (stackTrace) {
      this.stack = stackTrace;
    }
  }

  toResponse(includeStackTrace?: boolean): IHttpResponse {
    let jsonData = this.data;

    if (includeStackTrace && this.stack) {
      if (!jsonData) { jsonData = {}; }

      jsonData.stackTrace = this.stack;
    }

    return {
      status: this.status,
      message: this.message,
      jsonData: jsonData,
    };
  }

  static fromError(error: Error, status = 500): HttpError {
    // if 'error' object is already an instance of ApiError, we return the same object...
    if (error instanceof HttpError) { return error; }

    // otherwise, we create new 'ApiError'...
    return new HttpError(status, error.message, error.stack);
  }
}
