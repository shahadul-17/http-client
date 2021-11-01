import { IEventManager } from "@shahadul-17/event-manager";
import { IHttpRequestOptions, IHttpResponse, IHttpEventArguments, HttpEvent, } from "./http";

export interface IHttpClient<EventType extends string = HttpEvent,
  ArgumentsType extends IHttpEventArguments<EventType> = IHttpEventArguments<EventType>>
  extends IEventManager<EventType, ArgumentsType> {

  /**
   * Send an HTTP request as an asynchronous operation.
   * @param options URL or options for the request.
   * @returns Returns promise object for HTTP response.
   */
  sendRequestAsync(options: string | IHttpRequestOptions): Promise<IHttpResponse>;
}
