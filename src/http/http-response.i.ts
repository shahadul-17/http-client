import { IHttpRequestOptions } from "./http-request-options.i";

export interface IHttpResponse extends Record<string, any> {
  /** Status code. */
  status: number;
  /** (Optional) Message that needs to be set. */
  message?: string;
  /** (Optional) HTTP response headers. */
  headers?: Record<string, undefined | string | Array<string>>;
  /** Raw response data received from server. */
  rawData?: ArrayBuffer;
  /** Response data (as plain text) received from server. */
  textData?: string;
  /** JSON response data (as object) received from server. */
  jsonData?: Record<string, any>;
  /** Options that were passed while making the request. */
  requestOptions?: IHttpRequestOptions;
}
