const INITIAL_BUFFER_LENGTH = 8192;             // 8 KB...

export class StringUtilities {

  static fromArrayBuffer(arrayBuffer: ArrayBuffer): string {
    let bufferLength = INITIAL_BUFFER_LENGTH;
    let text = "";
    const array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < array.length; i += bufferLength) {
      if (i + bufferLength > length) {
        bufferLength = array.length - 1;
      }

      const subArray = array.subarray(i, i + bufferLength);

      text += String.fromCharCode.apply(null, subArray as any);
    }

    return text;
  }
}
