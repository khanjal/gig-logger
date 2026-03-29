import { SheetSourceLabelPipe } from './sheet-source-label.pipe';
import { SHEET_CONSTANTS } from '@constants/sheet.constants';

describe('SheetSourceLabelPipe', () => {
  let pipe: SheetSourceLabelPipe;

  beforeEach(() => {
    pipe = new SheetSourceLabelPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform lambda source to Direct Service', () => {
    expect(pipe.transform(SHEET_CONSTANTS.SOURCES.LAMBDA)).toBe('Direct Service');
  });

  it('should transform s3 source to Cloud Storage', () => {
    expect(pipe.transform(SHEET_CONSTANTS.SOURCES.S3)).toBe('Cloud Storage');
  });

  it('should return Unknown for undefined source', () => {
    expect(pipe.transform(undefined)).toBe('Unknown');
  });

  it('should return Unknown for empty string source', () => {
    expect(pipe.transform('')).toBe('Unknown');
  });

  it('should return the original value for unknown source codes', () => {
    const unknownSource = 'unknown-source';
    expect(pipe.transform(unknownSource)).toBe(unknownSource);
  });
});
