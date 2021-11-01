export class DataUtilities {

  static getValue(propertyName: string,
    data?: Record<string, any> | FormData): any {
    if (!data) { return undefined; }

    return data instanceof FormData ?
      data.get(propertyName) : data[propertyName];
  }

  static setValue(propertyName: string, value: any,
    data?: Record<string, any> | FormData)
    : Record<string, any> | FormData {
    if (!data) { data = {}; }

    if (data instanceof FormData) {
      data.set(propertyName, value);
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
