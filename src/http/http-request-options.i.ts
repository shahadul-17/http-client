import { HttpMethod } from "./http-method.e";
import { XmlHttpRequestBody } from "./xml-http-request-body.t";

export interface IHttpRequestOptions {
  /**
   * Number of milliseconds a request can take before automatically
   * being terminated. Default value is 0.
   */
  timeout?: number;
  /**
   * Setting this value to true will parse request body as JSON
   * if possible. Default value is true.
   */
  automaticJsonRequestBodyParsing?: boolean;
  /**
   * Setting this value to true will parse response body as JSON
   * if possible. Default value is true.
   */
  automaticJsonResponseBodyParsing?: boolean;
  /**
   * Indicates whether or not cross-site Access-Control requests
   * should be made using credentials such as cookies,
   * authorization headers or TLS client certificates. Setting
   * this value has no effect on same-origin requests.
   */
  allowCredentialsOnCrossSiteRequests?: boolean;
  /**
   * (Optional) HTTP request method. e.g. "GET", "POST" etc.
   * Default value is "GET".
   */
  method?: HttpMethod;
  /** Request URL. */
  url: string;
  /** (Optional) Any additional data that needs to be passed down. */
  additionalData?: Record<string, any>;
  /** (Optional) Request tags that needs to be passed down. */
  requestTags?: string[];
  /** (Optional) HTTP request headers. */
  headers?: Record<string, string>;
  /** (Optional) HTTP request body. */
  body?: XmlHttpRequestBody | Record<string, any>;
}
