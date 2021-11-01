export class MathUtilities {

  static calculatePercentage(value: number, totalValue: number): number {
    if (!totalValue) { return 0; }

    return (value / totalValue) * 100.0;
  }
}
