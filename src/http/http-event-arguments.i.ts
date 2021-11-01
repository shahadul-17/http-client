import { IEventArguments } from "@shahadul-17/event-manager";
import { HttpRequestState } from "./http-request-state.e";
import { IHttpRequestOptions } from "./http-request-options.i";
import { IHttpResponse } from ".";

export interface IHttpEventArguments<EventType extends string>
  extends IEventArguments<EventType> {

  isProgressComputable?: boolean;
  bytesUploaded?: number;
  bytesDownloaded?: number;
  contentLength?: number;
  progress?: number;
  state?: number;
  stateName?: HttpRequestState;
  httpRequestOptions?: IHttpRequestOptions;
  httpResponse?: IHttpResponse;
}
