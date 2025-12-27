export interface IDiagnosticItem {
  name: string;
  count: number;
  severity: 'info' | 'warning' | 'error';
  description: string;
  itemType?: 'shift' | 'trip' | 'address' | 'place' | 'name' | 'service' | 'region';
  items?: any[];
  groups?: any[][];
  fixable?: boolean;
  bulkFixable?: boolean;
  selectedValues?: Map<number, any>;
}

export interface IDuplicateGroup<T> {
  key: string;
  items: T[];
}

export interface IDuplicateResult<T> {
  items: T[];
  groups: T[][];
}

export type DiagnosticEntityType = 'shift' | 'trip' | 'address' | 'place' | 'name' | 'service' | 'region';
