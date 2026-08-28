import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TagInputComponent } from './tag-input.component';
import { TagService } from '@services/tag.service';

describe('TagInputComponent', () => {
  let fixture: ComponentFixture<TagInputComponent>;
  let component: TagInputComponent;
  let tagService: jasmine.SpyObj<TagService>;

  beforeEach(async () => {
    tagService = jasmine.createSpyObj<TagService>('TagService', ['suggest', 'getAllTags']);
    tagService.suggest.and.resolveTo([]);
    tagService.getAllTags.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [TagInputComponent],
      providers: [provideNoopAnimations(), { provide: TagService, useValue: tagService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const chipEvent = (value: string) => ({ value, chipInput: { clear: () => undefined } }) as never;

  it('writes an array value straight through', () => {
    component.writeValue(['rain', 'surge']);

    expect(component.tags()).toEqual(['rain', 'surge']);
  });

  it('accepts raw comma-delimited text', () => {
    // A control bound before deserialization has run should still render something sensible.
    component.writeValue('rain, surge' as never);

    expect(component.tags()).toEqual(['rain', 'surge']);
  });

  it('treats null or undefined as no tags', () => {
    component.writeValue(null);
    expect(component.tags()).toEqual([]);

    component.writeValue(undefined);
    expect(component.tags()).toEqual([]);
  });

  it('adds a tag and notifies the form', async () => {
    const changes: string[][] = [];
    component.registerOnChange(value => changes.push(value));

    await component.add(chipEvent('rain'));

    expect(component.tags()).toEqual(['rain']);
    expect(changes).toEqual([['rain']]);
  });

  it('trims whitespace and ignores an empty entry', async () => {
    await component.add(chipEvent('  rain  '));
    await component.add(chipEvent('   '));

    expect(component.tags()).toEqual(['rain']);
  });

  it('does not add the same tag twice, regardless of casing', async () => {
    await component.add(chipEvent('rain'));
    await component.add(chipEvent('Rain'));

    expect(component.tags()).toEqual(['rain']);
  });

  it('removes a tag and notifies the form', async () => {
    component.writeValue(['rain', 'surge']);
    const changes: string[][] = [];
    component.registerOnChange(value => changes.push(value));

    await component.remove('rain');

    expect(component.tags()).toEqual(['surge']);
    expect(changes).toEqual([['surge']]);
  });

  it('excludes already-applied tags when asking for suggestions', async () => {
    component.writeValue(['rain']);

    await component.onInput('r');

    expect(tagService.suggest).toHaveBeenCalledWith('r', ['rain']);
  });

  it('reports disabled state', () => {
    component.setDisabledState(true);
    expect(component.disabled()).toBeTrue();

    component.setDisabledState(false);
    expect(component.disabled()).toBeFalse();
  });
});
