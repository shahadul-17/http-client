import { EventManager } from "@shahadul-17/event-manager";
import { IHttpRequestOptions, IHttpResponse, IHttpEventArguments, HttpEvent, } from "./http";
import { IHttpClient } from "./http-client.i";
import { HttpWebRequest } from "./http-web-request";

export class HttpClient<EventType extends string = HttpEvent,
  ArgumentsType extends IHttpEventArguments<EventType> = IHttpEventArguments<EventType>>
  extends EventManager<EventType, ArgumentsType> implements IHttpClient<EventType, ArgumentsType> {

  async sendRequestAsync(options: string | IHttpRequestOptions): Promise<IHttpResponse> {
    // if only URL is provided, it creates a new HttpRequestOptions object...
    if (typeof options === "string") {
      options = { url: options };
    }

    let httpWebRequest;

    if (HttpClient._isSupported === false) {
      return {
        status: -1,
        message: "HttpClient is not supported by this environment.",
        requestOptions: options,
      };
    }

    try {
      httpWebRequest = new HttpWebRequest<EventType, ArgumentsType>(options);

      HttpClient._isSupported = true;
    } catch (error) {
      HttpClient._isSupported = false;

      return {
        status: -1,
        message: "HttpClient is not supported by this environment.",
        requestOptions: options,
      };
    }

    httpWebRequest.copyEventListeners(this);

    const response = await httpWebRequest.sendAsync();

    return response;
  }

  private static _isSupported: undefined | boolean;

  /**
   * Checks if HttpClient is supported.
   * @returns Returns true if HttpClient is supported. Otherwise returns false.
   */
  static isSupported(): boolean {
    if (typeof this._isSupported === "undefined") {
      try {
        new HttpWebRequest({ url: "", });

        this._isSupported = true;
      } catch {
        this._isSupported = false;
      }
    }

    return this._isSupported;
  }
}
