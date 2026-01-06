import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdatesComponent } from './updates.component';
import { UpdatesService, UpdateDetail } from '@services/updates.service';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('UpdatesComponent', () => {
  let component: UpdatesComponent;
  let fixture: ComponentFixture<UpdatesComponent>;
  let updatesService: jasmine.SpyObj<UpdatesService>;

  const mockUpdates = [
    {
      date: '2026-01-02',
      dateLabel: 'January 2, 2026',
      updates: [
        {
          title: 'Issues & Refactoring',
          changes: [
            'Cleaned up code',
            'Fixed bugs'
          ]
        }
      ] as UpdateDetail[]
    },
    {
      date: '2025-10-25-11-01',
      dateLabel: 'October 25 - November 1, 2025',
      isWeekly: true,
      updates: [
        {
          title: 'Updated privacy policy',
          changes: [
            'Improved clarity on data handling',
            'Added local storage info'
          ],
          pagesAffected: ['Policy']
        },
        {
          title: 'Added demo spreadsheet support',
          changes: [
            'Demo mode available'
          ],
          pagesAffected: ['Setup']
        }
      ] as UpdateDetail[]
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('UpdatesService', ['getUpdates']);
    spy.getUpdates.and.returnValue(of(mockUpdates));

    await TestBed.configureTestingModule({
      imports: [UpdatesComponent, MatCardModule, MatDividerModule, MatIconModule],
      providers: [
        { provide: UpdatesService, useValue: spy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    updatesService = TestBed.inject(UpdatesService) as jasmine.SpyObj<UpdatesService>;
    fixture = TestBed.createComponent(UpdatesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load updates on init', () => {
    fixture.detectChanges();
    expect(updatesService.getUpdates).toHaveBeenCalled();
  });

  it('should subscribe to updates service', (done) => {
    component.ngOnInit();
    setTimeout(() => {
      expect(component.updates.length).toBe(2);
      expect(component.updates[0].dateLabel).toBe('January 2, 2026');
      done();
    }, 100);
  });

  it('should display all update entries', () => {
    component.updates = mockUpdates;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const entries = compiled.querySelectorAll('.update-entry');
    expect(entries.length).toBe(2);
  });

  it('should display date labels correctly', () => {
    component.updates = mockUpdates;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const dateLabels = compiled.querySelectorAll('.date-label');
    expect(dateLabels[0].textContent).toContain('January 2, 2026');
  });

  it('should show weekly badge for weekly entries', () => {
    component.updates = mockUpdates;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const weeklyBadge = compiled.querySelectorAll('.weekly-badge');
    expect(weeklyBadge.length).toBe(1);
  });

  it('should display update items with titles', () => {
    component.updates = mockUpdates;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const titles = compiled.querySelectorAll('.update-title');
    expect(titles.length).toBe(3); // 1 + 2 updates
    expect(titles[0].textContent).toContain('Issues & Refactoring');
  });

  it('should display changes as bullet list when available', () => {
    component.updates = mockUpdates;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const changesList = compiled.querySelectorAll('.changes-list');
    expect(changesList.length).toBeGreaterThan(0);
    const changeItems = compiled.querySelectorAll('.change-item');
    expect(changeItems.length).toBeGreaterThan(0);
  });

  it('should display pages affected when available', () => {
    component.updates = mockUpdates;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const pageBadges = compiled.querySelectorAll('.page-badge');
    expect(pageBadges.length).toBe(2); // Policy + Setup
  });
});
