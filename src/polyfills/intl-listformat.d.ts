// Polyfill for Intl.ListFormat types for TypeScript
// Remove this file if you upgrade TypeScript and Node/browser supports Intl.ListFormat

declare namespace Intl {
  type ListFormatType = 'conjunction' | 'disjunction' | 'unit';
  type ListFormatStyle = 'long' | 'short' | 'narrow';
  type ListFormatOptions = {
    localeMatcher?: 'best fit' | 'lookup';
    type?: ListFormatType;
    style?: ListFormatStyle;
  };
  interface ListFormat {
    format(list: string[]): string;
    formatToParts(list: string[]): Array<{ type: string; value: string }>;
    resolvedOptions(): ListFormatOptions;
  }
}
