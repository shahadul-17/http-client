import { HttpError } from "../../../http";
import { DataUtilities } from "../data-utilities";
import { ParameterInfo } from "./parameter-info.t";

const PATH_PARAMETER_PATTERN = "{(?<pathParameter>\\w+\\??)}";
const PATH_PARAMETER_REGULAR_EXPRESSION = new RegExp(PATH_PARAMETER_PATTERN, "g");

export class HttpUtilities {

  /**
   * Sanitizes the path by removing unnecessary slashes.
   * @param path Path that needs to be sanitized.
   * @returns Returns sanitized path.
   */
  static sanitizePath(path: string) {
    if (!path) { return path; }

    while (path.indexOf("//") !== -1) {
      path = path.replace("//", "/");
    }

    if (path.endsWith("/")) {
      path = path.substring(0, path.length - 1);
    }

    return path;
  }

  /**
   * Checks if a parameter is an array. If the parameter is an array,
   * it will extract parameter name. Otherwise, it will return the original
   * parameter name without modification.
   * @param parameter Parameter to check.
   * @returns Returns extracted parameter name if the parameter is an array.
   * Otherwise returns the original parameter name.
   */
  static extractArrayTypeParameterName(parameter: string): string {
    const lastIndexOfClosingSquareBracket = parameter.lastIndexOf("]");

    if (lastIndexOfClosingSquareBracket === -1 || lastIndexOfClosingSquareBracket !== parameter.length - 1) { return parameter; }

    const lastIndexOfOpeningSquareBracket = parameter.lastIndexOf("[");

    if (lastIndexOfOpeningSquareBracket === -1) { return parameter; }

    const parameterName = parameter.substring(lastIndexOfOpeningSquareBracket);

    return parameterName;
  }

  /**
   * Extracts information of a parameter.
   * @param parameter Parameter of which, information should be extracted.
   * @returns Returns parameter information.
   */
  static extractParameterInfo(parameter: string): ParameterInfo {
    // if a parameter has question mark, it is considered
    // as an optional parameter...
    const indexOfQuestionMark = parameter.indexOf("?");
    const isMandatory = indexOfQuestionMark === -1;

    if (!isMandatory) {
      // if the parameter is optional, we remove
      // the question mark...
      parameter = parameter.substring(0, indexOfQuestionMark);
    }

    const _parameter = this.extractArrayTypeParameterName(parameter);

    return {
      isMandatory: isMandatory,
      name: _parameter,
      isArray: parameter !== _parameter,
    };
  }

  /**
   * Extracts parameters from the given path.
   * @param path Path from which parameters shall be extracted.
   * @returns Returns path parameters.
   */
  static extractPathParameters(path: string): string[] {
    let match: null | RegExpExecArray;
    const pathParameters: string[] = [];

    while (match = PATH_PARAMETER_REGULAR_EXPRESSION.exec(path)) {
      const pathParameter = match[1];
      // const pathParameter = match.groups?.pathParameter;         // <-- to make this doesn't work, we must target 'es2018' or later...

      if (!pathParameter) { continue; }

      pathParameters.push(pathParameter);
    }

    return pathParameters;
  }

  /**
   * Sets provided query parameters to a given path.
   * @param path Path in which parameters need to be set.
   * @param queryParameters Parameters
   * (name of the parameters) that needs to be set.
   * @param data Object containing values for query parameters.
   * @returns Returns a new path with parameters set.
   */
  static setQueryParameters(path: string,
    queryParameters: undefined | string[], data?: FormData | Record<string, any>): string {
    if (!path || !queryParameters || !data) { return path; }

    let doesPathContainQuestionMark = path.includes("?");

    for (const parameter of queryParameters) {
      const parameterInfo = this.extractParameterInfo(parameter);
      let value = DataUtilities.getValue(parameterInfo.name, data);

      if (!value) {
        if (parameterInfo.isMandatory) {
          throw new HttpError(400, `Mandatory query parameter '${parameterInfo.name}' not provided.`,
            undefined, { parameter: parameterInfo.name, location: "QUERY" });
        }

        continue;
      }

      value = encodeURIComponent(value);
      path += doesPathContainQuestionMark ? "&" : "?";
      path += `${parameterInfo.name}=${value}`;
      doesPathContainQuestionMark = true;
    }

    return path;
  }

  /**
   * Sets provided parameters to a given path.
   * @param path Path in which parameters need to be set.
   * @param data Object containing values for path parameters.
   * @returns Returns a new path with parameters set.
   */
  static setPathParameters(path: string, data?: Record<string, any> | FormData): string {
    if (!path) { return path; }

    const pathParameters = this.extractPathParameters(path);

    if (pathParameters.length === 0) { return path; }

    // this is done regardless of data being undefined/null
    // because, we need to remove keys from path...
    for (const parameter of pathParameters) {
      const parameterInfo = this.extractParameterInfo(parameter);
      const value = DataUtilities.getValue(parameterInfo.name, data) ?? "";

      if (!value && parameterInfo.isMandatory) {
        throw new HttpError(400, `Mandatory path parameter '${parameterInfo.name}' not provided.`,
          undefined, { parameter: parameterInfo.name, location: "PATH" });
      }

      path = path.replace(`{${parameterInfo.name}${parameterInfo.isMandatory ? "" : "?"}}`, value);
    }

    return this.sanitizePath(path);
  }

  /**
   * Prepares request headers using parameters and data.
   * @param headerParameters Parameters (name of the parameters) that needs to be set.
   * @param data Object containing values for header parameters.
   * @returns Returns the prepared request headers object.
   */
  static prepareRequestHeaders(headerParameters: undefined | string[],
    data?: Record<string, any> | FormData): Record<string, string> {
    const headers: Record<string, string> = {};

    // if no header parameters are needed or no data is provided, we return empty record...
    if (!headerParameters || headerParameters.length === 0 || !data) { return headers; }

    for (const parameter of headerParameters) {
      const parameterInfo = this.extractParameterInfo(parameter);
      const value = DataUtilities.getValue(parameterInfo.name, data);

      // we could've simply checked 'if (!value)' but this will
      // also remove empty strings...
      if (value === undefined || value === null || typeof (value) !== "string") {
        if (parameterInfo.isMandatory) {
          throw new HttpError(400, `Mandatory header '${parameterInfo.name}' not provided.`,
            undefined, { parameter: parameterInfo.name, location: "HEADER" });
        }

        continue;
      }

      headers[parameterInfo.name.toLowerCase()] = value;
    }

    return headers;
  }

  /**
   * Prepares a request body using parameters and data.
   * @param bodyParameters Parameters (name of the parameters) that needs to be set.
   * @param data Object containing values for body parameters.
   * @returns Returns the prepared request body object.
   */
  static prepareRequestBody(bodyParameters: undefined | string[],
    data?: Record<string, any> | FormData): undefined | Record<string, any> {
    if (!bodyParameters || bodyParameters.length === 0 || !data) { return undefined; }

    const body: Record<string, any> = {};

    for (const parameter of bodyParameters) {
      const parameterInfo = this.extractParameterInfo(parameter);
      const value = DataUtilities.getValue(parameterInfo.name, data);

      // we could've simply checked 'if (!value)' but this will
      // also remove empty strings...
      if (value === undefined || value === null) {
        if (parameterInfo.isMandatory) {
          throw new HttpError(400, `Mandatory body parameter '${parameterInfo.name}' not provided.`,
            undefined, { parameter: parameterInfo.name, location: "BODY" });
        }

        continue;
      }

      body[parameterInfo.name] = value;
    }

    return body;
  }

  /**
   * Prepares form data using parameters and data.
   * @param formFields Fields (name of the form fields) that needs to be set.
   * @param data Object containing values for form fields.
   * @returns Returns the prepared form data object.
   */
  static prepareFormData(formFields: undefined | string[],
    data?: Record<string, any> | FormData): undefined | FormData {
    if (!formFields || formFields.length === 0 || !data) { return undefined; }

    const formData = new FormData();
    const formDataKeys = data instanceof FormData ?
      DataUtilities.getIterableIteratorToArray(data.keys()) : [];
    const arrayTypeParameterInfos = [];

    for (const formField of formFields) {
      const formFieldInfo = this.extractParameterInfo(formField);

      // if current field is an array, we'll push that to 'arrayTypeParameters' list...
      if (formFieldInfo.isArray) {
        arrayTypeParameterInfos.push(formFieldInfo);

        continue;
      }

      // 'single' flag is set to 'false' because form data may contain multiple
      // values with identical names...
      const value = DataUtilities.getValue(formFieldInfo.name, data, false);

      // we could've simply checked 'if (!value)' but this will
      // also remove empty strings...
      if (value === undefined || value === null) {
        if (formFieldInfo.isMandatory) {
          throw new HttpError(400, `Mandatory field '${formFieldInfo.name}' not provided.`,
            undefined, { parameter: formFieldInfo.name, location: "FORM" });
        }

        continue;
      }

      // if value is an array, we'll append all the elements...
      if (Array.isArray(value)) {
        for (const element of value) {
          formData.append(formFieldInfo.name, element);
        }
      } else {
        // otherwise we'll append the single element...
        formData.append(formFieldInfo.name, value);
      }
    }

    // this portion of code handles array type form fields...
    for (const arrayTypeParameterInfo of arrayTypeParameterInfos) {
      const formDataArrayEntryKeys = DataUtilities.findFormDataArrayEntryKeys(
        arrayTypeParameterInfo.name, formDataKeys);

      // if no keys were found and the parameter is mandatory, we'll throw error...
      if (arrayTypeParameterInfo.isMandatory && formDataArrayEntryKeys.length === 0) {
        throw new HttpError(400, `Mandatory field '${arrayTypeParameterInfo.name}' not provided.`,
          undefined, { parameter: arrayTypeParameterInfo.name, location: "FORM" });
      }

      for (const key of formDataArrayEntryKeys) {
        // 'single' flag is set to 'false' because form data may contain multiple
        // values with identical names...
        const value = DataUtilities.getValue(key, data, false);

        // if value is an array, we'll append all the elements...
        if (Array.isArray(value)) {
          for (const element of value) {
            formData.append(key, element);
          }
        } else {
          // otherwise we'll append the single element...
          formData.append(key, value);
        }
      }
    }

    return formData;
  }
}
