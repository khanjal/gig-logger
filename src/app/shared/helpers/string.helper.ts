export class StringHelper {
  static truncate(text: string, length: number = 20, suffix: string = '...'): string {
    if (!text || text.length <= length) {
      return text;
    }
    
    // Replace last characters with suffix instead of appending
    const truncatedLength = length - suffix.length;
    return text.substring(0, truncatedLength) + suffix;
  }
}