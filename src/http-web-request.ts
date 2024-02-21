import { EventManager } from "@shahadul-17/event-manager";
import { StringUtilities } from "@shahadul-17/utilities";
import {
  HttpEvent, HttpRequestState, IHttpRequestOptions,
  IHttpResponse, XmlHttpRequestBody, IHttpEventArguments,
} from "./http";
import { MathUtilities, ObjectUtilities } from "./utilities";
import { IHttpWebRequest } from "./http-web-request.i";

const HTTP_CONTENT_TYPE_HEADER = "content-type";
const HTTP_JSON_CONTENT_TYPE = "application/json";

export class HttpWebRequest<EventType extends string = HttpEvent,
  ArgumentsType extends IHttpEventArguments<EventType> = IHttpEventArguments<EventType>>
  extends EventManager<EventType, ArgumentsType> implements IHttpWebRequest<EventType, ArgumentsType> {

  private _isUploadProgressComputable = false;
  private _bytesUploaded = 0;
  private _uploadContentLength = 0;
  private _uploadProgressPercentage = 0;

  private _isDownloadProgressComputable = false;
  private _bytesDownloaded = 0;
  private _downloadContentLength = 0;
  private _downloadProgressPercentage = 0;

  private _state = 0;
  private _stateName = HttpWebRequest._stateMap[this._state];

  private _requestHeaders: Record<string, string>;
  private _requestBody: XmlHttpRequestBody | Record<string, any>;

  private _textData?: string;
  private _jsonData?: Record<string, any>;
  private _responseHeaders?: Record<string, undefined | string | Array<string>> = undefined;

  private readonly _options: IHttpRequestOptions;
  private readonly _xmlHttpRequest: XMLHttpRequest;

  constructor(options: string | IHttpRequestOptions) {
    super();

    const xmlHttpRequest = HttpWebRequest._createXmlHttpRequest();

    if (!xmlHttpRequest) {
      throw new Error("HttpWebRequest is not supported by this environment.");
    }

    // if only URL is provided, it creates a new HttpRequestOptions object...
    if (typeof options === "string") {
      options = { url: options };
    }

    this._options = options;
    this._xmlHttpRequest = xmlHttpRequest;

    // setting default value to true if false is not set...
    if (this._options.automaticJsonRequestBodyParsing !== false) {
      this._options.automaticJsonRequestBodyParsing = true;
    }

    // setting default value to true if false is not set...
    if (this._options.automaticJsonResponseBodyParsing !== false) {
      this._options.automaticJsonResponseBodyParsing = true;
    }

    // transforms all header names to lower case...
    this._requestHeaders = this._options.headers ?? {};
    this._requestHeaders = ObjectUtilities.modifyKeyCase(this._requestHeaders) as Record<string, string>;

    // processes request body...
    this._requestBody = this.options.body;
    const requestBodyContentType = this._requestHeaders[HTTP_CONTENT_TYPE_HEADER] ?? "";

    // checks if request body should be parsed as JSON...
    if (options.automaticJsonRequestBodyParsing && HttpWebRequest._shallConvertToJson(this._requestBody)) {
      // checks if content type header is present...
      if (!requestBodyContentType.includes("JSON")) {
        this._requestHeaders[HTTP_CONTENT_TYPE_HEADER] = HTTP_JSON_CONTENT_TYPE;
      }

      // parses request body as JSON if needed.
      this._requestBody = HttpWebRequest._sanitizeRequestBody(this._requestBody);
    }

    this._handleUploadProgressEvent = this._handleUploadProgressEvent.bind(this);
    this._handleDownloadProgressEvent = this._handleDownloadProgressEvent.bind(this);

    // adding upload event listeners...
    this._xmlHttpRequest.upload.addEventListener("loadstart", this._handleUploadProgressEvent);
    this._xmlHttpRequest.upload.addEventListener("loadend", this._handleUploadProgressEvent);
    this._xmlHttpRequest.upload.addEventListener("load", this._handleUploadProgressEvent);
    this._xmlHttpRequest.upload.addEventListener("progress", this._handleUploadProgressEvent);
    this._xmlHttpRequest.upload.addEventListener("timeout", this._handleUploadProgressEvent);
    this._xmlHttpRequest.upload.addEventListener("abort", this._handleUploadProgressEvent);
    this._xmlHttpRequest.upload.addEventListener("error", this._handleUploadProgressEvent);

    // adding download event listeners...
    this._xmlHttpRequest.addEventListener("loadstart", this._handleDownloadProgressEvent);
    this._xmlHttpRequest.addEventListener("loadend", this._handleDownloadProgressEvent);
    this._xmlHttpRequest.addEventListener("load", this._handleDownloadProgressEvent);
    this._xmlHttpRequest.addEventListener("progress", this._handleDownloadProgressEvent);
    this._xmlHttpRequest.addEventListener("timeout", this._handleDownloadProgressEvent);
    this._xmlHttpRequest.addEventListener("abort", this._handleDownloadProgressEvent);
    this._xmlHttpRequest.addEventListener("error", this._handleDownloadProgressEvent);
  }

  //#region Getters

  get isUploadProgressComputable() {
    return this._isUploadProgressComputable;
  }

  get bytesUploaded() {
    return this._bytesUploaded;
  }

  get uploadContentLength() {
    return this._uploadContentLength;
  }

  get uploadProgressPercentage() {
    return this._uploadProgressPercentage;
  }

  get isDownloadProgressComputable() {
    return this._isDownloadProgressComputable;
  }

  get bytesDownloaded() {
    return this._bytesDownloaded;
  }

  get downloadContentLength() {
    return this._downloadContentLength;
  }

  get downloadProgressPercentage() {
    return this._downloadProgressPercentage;
  }

  get state() {
    return this._state;
  }

  get stateName() {
    return this._stateName;
  }

  get options() {
    return this._options;
  }

  //#endregion

  /**
   * Parses contents (e.g. HTML, JSON etc.) if possible.
   * @returns Returns true if ready state is equal to 4.
   * Otherwise returns false.
   */
  private _parseContent(): boolean {
    if (this._xmlHttpRequest.readyState !== 4) { return false; }

    const contentType = this._xmlHttpRequest.getResponseHeader(HTTP_CONTENT_TYPE_HEADER)?.toUpperCase() ?? "";
    const isJsonContent = contentType.includes("JSON");

    // checks content type for textual content...
    if (isJsonContent || contentType.includes("TEXT")) {
      this._textData = StringUtilities.fromBytes(this._xmlHttpRequest.response);

      // if content type is JSON and automatic parsing is enabled...
      if (isJsonContent && this.options.automaticJsonResponseBodyParsing) {
        this._jsonData = JSON.parse(this._textData) as Record<string, any>;
      }
    }

    return true;
  }

  private _parseResponseHeaders(): undefined | Record<string, undefined | string | Array<string>> {
    if (typeof this._responseHeaders !== 'undefined') { return this._responseHeaders; }
    if (this._xmlHttpRequest.readyState < 2) { return undefined; }      // this._xmlHttpRequest.HEADERS_RECEIVED = 2...

    const responseHeadersAsString = this._xmlHttpRequest.getAllResponseHeaders();
    const responseHeadersAsArray = responseHeadersAsString.trim().split(/[\r\n]+/);
    const responseHeaders: Record<string, undefined | string | Array<string>> = {};

    for (const responseHeader of responseHeadersAsArray) {
      const indexOfColon = responseHeader.indexOf(':');

      if (indexOfColon === -1) { continue; }

      const headerName = responseHeader.substring(0, indexOfColon);
      const headerValue = responseHeader.substring(indexOfColon + 1).trim();
      const previousHeaderValue = responseHeaders[headerName];

      // if no previous header value exists for the header name...
      if (typeof previousHeaderValue === 'undefined') {
        // we shall assign the header value to the headers...
        responseHeaders[headerName] = headerValue;

        continue;
      }

      // if previous header value exists for the header name and previous value is an array...
      if (Array.isArray(previousHeaderValue)) {
        // we shall push the header value to the headers...
        previousHeaderValue.push(headerValue);

        continue;
      }

      // otherwise, if the previous header value is a string,
      // we shall create a new array and assign that array
      // to the corresponding header name...
      responseHeaders[headerName] = [ previousHeaderValue, headerValue, ];
    }

    this._responseHeaders = responseHeaders;

    return this._responseHeaders;
  }

  private _handleUploadProgressEvent(event: ProgressEvent<XMLHttpRequestEventTarget>): any {
    const httpEventType = HttpWebRequest._eventTypeMaps.uploadEventTypeMap[event.type];

    this._isUploadProgressComputable = event.lengthComputable;

    if (httpEventType === HttpEvent.UploadProgressChange && this.isUploadProgressComputable) {
      this._bytesUploaded = event.loaded;
      this._uploadContentLength = event.total;
      this._uploadProgressPercentage = MathUtilities.calculatePercentage(this.bytesUploaded, this.uploadContentLength);
    }

    // fires event listeners...
    this.fireEventListeners({
      type: httpEventType as EventType,
      isProgressComputable: this.isUploadProgressComputable,
      bytesUploaded: this.bytesUploaded,
      contentLength: this.uploadContentLength,
      progress: this.uploadProgressPercentage,
      httpRequestOptions: this.options,
      state: this.state,
      stateName: this.stateName,
    } as ArgumentsType);

    return undefined;
  }

  private _handleDownloadProgressEvent(event: Event | ProgressEvent<XMLHttpRequestEventTarget>,
    httpResponse?: IHttpResponse): any {
    const httpEventType = HttpWebRequest._eventTypeMaps.downloadEventTypeMap[event.type];

    if (httpEventType === HttpEvent.StateChange) {
      this._state = this._xmlHttpRequest.readyState;
      this._stateName = HttpWebRequest._stateMap[this.state];
    } else if (event instanceof ProgressEvent) {
      this._isDownloadProgressComputable = event.lengthComputable;

      if (httpEventType === HttpEvent.DownloadProgressChange && this.isDownloadProgressComputable) {
        this._bytesDownloaded = event.loaded;
        this._downloadContentLength = event.total;
        this._downloadProgressPercentage = MathUtilities.calculatePercentage(this.bytesDownloaded, this.downloadContentLength);
      }
    }

    // fires event listeners...
    this.fireEventListeners({
      type: httpEventType as EventType,
      isProgressComputable: this.isDownloadProgressComputable,
      bytesDownloaded: this.bytesDownloaded,
      contentLength: this.downloadContentLength,
      progress: this.downloadProgressPercentage,
      httpRequestOptions: this.options,
      state: this.state,
      stateName: this.stateName,
      httpResponse: httpResponse,
    } as ArgumentsType);

    return undefined;
  }

  sendAsync(): Promise<IHttpResponse> {
    const context = this;

    return new Promise<IHttpResponse>(function (resolve, reject): void {
      const { options, _requestHeaders, _requestBody, _xmlHttpRequest } = context;

      _xmlHttpRequest.open(options.method ?? "GET", options.url, true);
      _xmlHttpRequest.timeout = options.timeout ?? 0;
      _xmlHttpRequest.responseType = "arraybuffer";
      _xmlHttpRequest.withCredentials = options.allowCredentialsOnCrossSiteRequests ?? false;

      // adding headers...
      for (const headerName in _requestHeaders) {
        const headerValue = _requestHeaders[headerName];

        _xmlHttpRequest.setRequestHeader(headerName, headerValue);
      }

      _xmlHttpRequest.addEventListener("abort", function (event): any {
        resolve({
          status: -4,
          message: "Your request has been aborted.",
          requestOptions: options,
        });

        return undefined;
      });

      _xmlHttpRequest.addEventListener("timeout", function (event): any {
        resolve({
          status: -3,
          message: "Your request has timed out.",
          requestOptions: options,
        });

        return undefined;
      });

      _xmlHttpRequest.addEventListener("error", function (event): any {
        resolve({
          status: -2,
          message: "An error occurred while sending the request.",
          requestOptions: options,
        });

        return undefined;
      });

      _xmlHttpRequest.addEventListener("readystatechange", function (event): any {
        // parses text based contents (e.g. HTML, JSON etc.)...
        const httpResponse: undefined | IHttpResponse = context._parseContent() ? {
          status: this.status,
          rawData: this.response,
          textData: context._textData,
          jsonData: context._jsonData,
          requestOptions: options,
          headers: context._parseResponseHeaders(),
        } : undefined;

        context._handleDownloadProgressEvent(event, httpResponse);

        // this allows error listener resolve the promise. because,
        // error listener is executed after ready state change listener...
        httpResponse && _xmlHttpRequest.status !== 0 && resolve(httpResponse);

        return undefined;
      });

      _xmlHttpRequest.send(_requestBody as XmlHttpRequestBody);
    });
  }

  abort(): void {
    this._xmlHttpRequest.abort();
  }

  //#region Private Static

  /** This map contains ready state value (numeric) as key and ready state name as value. */
  private static _stateMap: Record<string, HttpRequestState> = {
    0: HttpRequestState.Unsent,
    1: HttpRequestState.Opened,
    2: HttpRequestState.HeadersReceived,
    3: HttpRequestState.Loading,
    4: HttpRequestState.Done,
  };

  /**
   * This map contains XMLHttpRequest event type as key and
   * corresponding http event type as value.
   */
  private static _eventTypeMaps: Record<string, Record<string, HttpEvent>> = {
    uploadEventTypeMap: {
      loadstart: HttpEvent.UploadStart,
      loadend: HttpEvent.UploadComplete,
      load: HttpEvent.UploadSuccess,
      progress: HttpEvent.UploadProgressChange,
      timeout: HttpEvent.UploadTimeout,
      abort: HttpEvent.UploadAbort,
      error: HttpEvent.UploadError,
    },
    downloadEventTypeMap: {
      loadstart: HttpEvent.DownloadStart,
      loadend: HttpEvent.DownloadComplete,
      load: HttpEvent.DownloadSuccess,
      progress: HttpEvent.DownloadProgressChange,
      timeout: HttpEvent.DownloadTimeout,
      abort: HttpEvent.DownloadAbort,
      error: HttpEvent.DownloadError,
      readystatechange: HttpEvent.StateChange,
    }
  };

  /**
   * Checks if the instance is of ArrayBufferView.
   * @param instance Instance to check.
   * @returns Returns true if the instance is of ArrayBufferView. Otherwise returns false.
   */
  private static _isArrayBufferView(instance: any): boolean {
    try {
      const arrayBufferView = instance as ArrayBufferView;

      if (arrayBufferView.buffer && arrayBufferView.buffer instanceof ArrayBuffer) { return true; }

      return false;
    } catch (error) {
      return false;
    }
  }

  private static _shallConvertToJson(requestBody?: null | Document | BodyInit | Record<string, any>): boolean {
    return !(!requestBody || typeof requestBody !== "object" ||
      requestBody instanceof FormData || requestBody instanceof ArrayBuffer ||
      requestBody instanceof Document || requestBody instanceof URLSearchParams ||
      requestBody instanceof Blob || requestBody instanceof ReadableStream ||
      this._isArrayBufferView(requestBody));
  }

  private static _sanitizeRequestBody(requestBody: XmlHttpRequestBody | Record<string, any>): XmlHttpRequestBody {
    if (!this._shallConvertToJson(requestBody)) { return requestBody as XmlHttpRequestBody; }

    const json = JSON.stringify(requestBody as Record<string, any>);

    return json;
  }

  /**
   * Creates new XmlHttpRequest object.
   * @returns Returns new XmlHttpRequest object.
   */
  private static _createXmlHttpRequest(): undefined | XMLHttpRequest {
    try {
      return new XMLHttpRequest();
    } catch (error) {
      console.error("An error occurred while instantiating 'XMLHttpRequest'.", error);
    }

    /* try {
      return new (ActiveXObject("Msxml3.XMLHTTP") as any);
    } catch (error) {
      console.error("An error occurred while instantiating 'Msxml3.XMLHTTP'.", error);
    }

    try {
      return new (ActiveXObject("Msxml2.XMLHTTP.6.0") as any);
    } catch (error) {
      console.error("An error occurred while instantiating 'Msxml2.XMLHTTP.6.0'.", error);
    }

    try {
      return new (ActiveXObject("Msxml2.XMLHTTP.3.0") as any);
    } catch (error) {
      console.error("An error occurred while instantiating 'Msxml2.XMLHTTP.3.0'.", error);
    }

    try {
      return new (ActiveXObject("Msxml2.XMLHTTP") as any);
    } catch (error) {
      console.error("An error occurred while instantiating 'Msxml2.XMLHTTP'.", error);
    }

    try {
      return new (ActiveXObject("Microsoft.XMLHTTP") as any);
    } catch (error) {
      console.error("An error occurred while instantiating 'Microsoft.XMLHTTP'.", error);
    } */

    return undefined;
  }

  //#endregion
}
