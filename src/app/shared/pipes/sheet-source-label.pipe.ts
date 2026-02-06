import { Pipe, PipeTransform } from '@angular/core';
import { SHEET_SOURCE_LABELS } from '@constants/sheet.constants';

/**
 * Transforms sheet source codes to user-friendly labels
 * Example: 'lambda' -> 'Direct Service', 's3' -> 'Cloud Storage'
 */
@Pipe({
  name: 'sheetSourceLabel',
  standalone: true
})
export class SheetSourceLabelPipe implements PipeTransform {
  transform(source: string | undefined): string {
    if (!source) {
      return 'Unknown';
    }
    return SHEET_SOURCE_LABELS[source] || source;
  }
}
