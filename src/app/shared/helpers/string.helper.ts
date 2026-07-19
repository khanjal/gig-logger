export class StringHelper {
  public static truncate(text: string, length = 20, suffix = '...'): string {
    if (!text || text.length <= length) {
      return text;
    }
    
    // Replace last characters with suffix instead of appending
    const truncatedLength = length - suffix.length;
    return text.substring(0, truncatedLength) + suffix;
  }
}