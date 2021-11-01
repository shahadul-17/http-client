export enum HttpEvent {
  //#region Upload Events

  /** This event is fired when uploading has started . */
  UploadStart = "UPLOAD_START",
  /** This event is fired when uploading has finished. Whether successfully or unsuccessfully. */
  UploadComplete = "UPLOAD_COMPLETE",
  /** This event is fired when uploading has finished successfully. */
  UploadSuccess = "UPLOAD_SUCCESS",
  /** This event is fired when upload progress is changed. */
  UploadProgressChange = "UPLOAD_PROGRESS_CHANGE",
  /** This event is fired when uploading is aborted. */
  UploadAbort = "UPLOAD_ABORT",
  /** This event is fired when uploading timed out. */
  UploadTimeout = "UPLOAD_TIMEOUT",
  /** This event is fired on upload error. */
  UploadError = "UPLOAD_ERROR",

  //#endregion

  //#region Download Events

  /** This event is fired when downloading has started . */
  DownloadStart = "DOWNLOAD_START",
  /** This event is fired when downloading has finished. Whether successfully or unsuccessfully. */
  DownloadComplete = "DOWNLOAD_COMPLETE",
  /** This event is fired when downloading has finished successfully. */
  DownloadSuccess = "DOWNLOAD_SUCCESS",
  /** This event is fired when download progress is changed. */
  DownloadProgressChange = "DOWNLOAD_PROGRESS_CHANGE",
  /** This event is fired when downloading is aborted. */
  DownloadAbort = "DOWNLOAD_ABORT",
  /** This event is fired when downloading timed out. */
  DownloadTimeout = "DOWNLOAD_TIMEOUT",
  /** This event is fired on download error. */
  DownloadError = "DOWNLOAD_ERROR",
  /** This event is fired when state is changed. */
  StateChange = "STATE_CHANGE",

  //#endregion
}
