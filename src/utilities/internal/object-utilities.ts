export class ObjectUtilities {

  /**
   * Modifies key case of the given object. This method modifies the
   * original object.
   * @param object Object of which the keys need to be modified.
   * @param isUpperCase (Optional) If set to true, keys will be upper-cased.
   * Otherwise, keys will be lower cased. Default value is false.
   * @returns Returns modified object.
   */
  static modifyKeyCase(object: undefined | Record<string, any>,
    isUpperCase = false): undefined | Record<string, any> {
    if (!object) { return object; }

    const keys = Object.keys(object);

    for (const key of keys) {
      const modifiedKey = isUpperCase ? key.toUpperCase() : key.toLowerCase();
      const value = object[key];

      delete object[key];

      object[modifiedKey] = value;
    }

    return object;
  }
}
