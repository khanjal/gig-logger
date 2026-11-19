import { TestBed } from '@angular/core/testing';

import { spreadsheetDB } from '@data/spreadsheet.db';
import { TagService } from './tag.service';

describe('TagService', () => {
  let service: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagService);
  });

  const stub = (trips: unknown[], shifts: unknown[]) => {
    spyOn(spreadsheetDB.trips, 'toArray').and.resolveTo(trips as never);
    spyOn(spreadsheetDB.shifts, 'toArray').and.resolveTo(shifts as never);
  };

  it('collects distinct tags from both trips and shifts', async () => {
    stub([{ tags: ['rain'] }], [{ tags: ['weekend'] }]);

    expect(await service.getAllTags()).toEqual(['rain', 'weekend']);
  });

  it('orders alphabetically regardless of how often a tag is used', async () => {
    // Ranked by use at first, so habitual tags surfaced first. That order is unstable - the list
    // reshuffles as tags are used and a reader can never learn where anything sits - so a
    // predictable order wins in a list that is scanned repeatedly.
    stub([{ tags: ['rain'] }, { tags: ['rain'] }, { tags: ['airport'] }, { tags: ['surge'] }], []);

    expect(await service.getAllTags()).toEqual(['airport', 'rain', 'surge']);
  });

  it('sorts case-insensitively', async () => {
    stub([{ tags: ['Surge'] }, { tags: ['airport'] }, { tags: ['Rain'] }], []);

    expect(await service.getAllTags()).toEqual(['airport', 'Rain', 'Surge']);
  });

  it('treats differently-cased spellings as one tag, keeping the first seen', async () => {
    stub([{ tags: ['Rain'] }, { tags: ['rain'] }], []);

    expect(await service.getAllTags()).toEqual(['Rain']);
  });

  it('reads tags that are still raw sheet text', async () => {
    // Guards the window before deserialization has run over locally cached rows.
    stub([{ tags: 'rain, surge' }], []);

    expect(await service.getAllTags()).toEqual(['rain', 'surge']);
  });

  it('ignores rows with no tags at all', async () => {
    stub([{ tags: [] }, { tags: null }, {}], []);

    expect(await service.getAllTags()).toEqual([]);
  });

  describe('suggest', () => {
    it('filters by what has been typed, case-insensitively', async () => {
      stub([{ tags: ['rain', 'airport', 'surge'] }], []);

      expect(await service.suggest('AIR')).toEqual(['airport']);
    });

    it('hides tags already applied to the row being edited', async () => {
      stub([{ tags: ['rain', 'surge'] }], []);

      expect(await service.suggest('', ['rain'])).toEqual(['surge']);
    });

    it('returns everything for an empty query, so focusing shows what exists', async () => {
      stub([{ tags: ['rain', 'surge'] }], []);

      expect(await service.suggest('')).toEqual(['rain', 'surge']);
    });
  });
});
