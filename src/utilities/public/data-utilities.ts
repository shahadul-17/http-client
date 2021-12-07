export class DataUtilities {

  static getIterableIteratorToArray<Type>(iterableIterator: IterableIterator<Type>): Type[] {
    const array: Type[] = [];
    let iterationResult = iterableIterator.next();

    while (!iterationResult.done) {
      array.push(iterationResult.value);

      iterationResult = iterableIterator.next();
    }

    return array;
  }

  static findFormDataArrayEntryKeys(propertyName: string, formDataKeys: string[]): string[] {
    const keys = [];

    for (const key of formDataKeys) {
      if (!key.startsWith(propertyName)) { continue; }

      keys.push(key);
    }

    return keys;
  }

  static getFormDataValue(propertyName: string,
    data?: FormData, single = true): any {
    // checks if data is an instance of FormData...
    if (!(data instanceof FormData)) { return undefined; }

    const value = data.getAll(propertyName);

    // for empty array we'll return 'undefined'...
    if (value.length === 0) { return undefined; }
    // if the array contains a single value,
    // or 'single' flag is 'true', returns the
    // first element of the array...
    else if (single || value.length === 1) { return value[0]; }

    // otherwise returns the array...
    return value;
  }

  static getValue(propertyName: string,
    data?: Record<string, any> | FormData,
    single = true): any {
    if (!data) { return undefined; }

    // checks if data is an instance of FormData...
    if (data instanceof FormData) {
      return this.getFormDataValue(propertyName, data, single);
    }

    return data[propertyName];
  }

  static setValue(propertyName: string, value: any,
    data?: Record<string, any> | FormData,
    overwrite = false)
    : Record<string, any> | FormData {
    if (!data) { data = {}; }

    if (data instanceof FormData) {
      if (overwrite) {
        data.set(propertyName, value);
      } else {
        data.append(propertyName, value);
      }
    } else {
      data[propertyName] = value;
    }

    return data;
  }

  static clone(data?: Record<string, any> | FormData)
    : undefined | Record<string, any> | FormData {
    if (!data) { return undefined; }

    if (data instanceof FormData) {
      const clonedData = new FormData();

      data.forEach((value, key) => {
        clonedData.append(key, value);
      });

      return clonedData;
    }

    return { ...data };
  }
}
