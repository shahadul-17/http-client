import { IEventManager } from "@shahadul-17/event-manager";
import { HttpEvent, IHttpEventArguments, IHttpResponse } from "./http";

export interface IHttpWebRequest<EventType extends string = HttpEvent,
  ArgumentsType extends IHttpEventArguments<EventType> = IHttpEventArguments<EventType>>
  extends IEventManager<EventType, ArgumentsType> {

  sendAsync(): Promise<IHttpResponse>;
  abort(): void;
}
