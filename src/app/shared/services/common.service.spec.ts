import { TestBed } from '@angular/core/testing';
import { CommonService } from './common.service';
import { Subscription } from 'rxjs';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommonService]
    });
    service = TestBed.inject(CommonService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have onHeaderLinkUpdate observable', () => {
      expect(service.onHeaderLinkUpdate).toBeDefined();
    });

    it('should initialize with empty string', (done) => {
      service.onHeaderLinkUpdate.subscribe(value => {
        expect(value).toBe('');
        done();
      });
    });
  });

  describe('updateHeaderLink', () => {
    it('should emit string messages', (done) => {
      const testMessage = 'test-link';

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === testMessage) {
          expect(message).toBe(testMessage);
          done();
        }
      });

      service.updateHeaderLink(testMessage);
    });

    it('should emit object messages', (done) => {
      const testObject = { link: '/dashboard', text: 'Dashboard' };

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === testObject) {
          expect(message).toEqual(testObject);
          done();
        }
      });

      service.updateHeaderLink(testObject);
    });

    it('should emit null values', (done) => {
      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === null) {
          expect(message).toBeNull();
          done();
        }
      });

      service.updateHeaderLink(null);
    });

    it('should emit undefined values', (done) => {
      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === undefined) {
          expect(message).toBeUndefined();
          done();
        }
      });

      service.updateHeaderLink(undefined);
    });

    it('should emit array messages', (done) => {
      const testArray = ['link1', 'link2', 'link3'];

      service.onHeaderLinkUpdate.subscribe(message => {
        if (Array.isArray(message) && message.length === 3) {
          expect(message).toEqual(testArray);
          done();
        }
      });

      service.updateHeaderLink(testArray);
    });

    it('should emit numeric values', (done) => {
      const testNumber = 123;

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === testNumber) {
          expect(message).toBe(testNumber);
          done();
        }
      });

      service.updateHeaderLink(testNumber);
    });

    it('should emit boolean values', (done) => {
      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === true) {
          expect(message).toBe(true);
          done();
        }
      });

      service.updateHeaderLink(true);
    });
  });

  describe('Observable Behavior', () => {
    it('should support multiple subscribers', () => {
      const emissions1: any[] = [];
      const emissions2: any[] = [];

      service.onHeaderLinkUpdate.subscribe(msg => emissions1.push(msg));
      service.onHeaderLinkUpdate.subscribe(msg => emissions2.push(msg));

      service.updateHeaderLink('message1');
      service.updateHeaderLink('message2');

      expect(emissions1).toContain('message1');
      expect(emissions1).toContain('message2');
      expect(emissions2).toContain('message1');
      expect(emissions2).toContain('message2');
    });

    it('should emit to late subscribers', (done) => {
      service.updateHeaderLink('early-message');

      // Subscribe after the message was sent
      service.onHeaderLinkUpdate.subscribe(message => {
        // BehaviorSubject emits last value immediately to new subscribers
        expect(message).toBe('early-message');
        done();
      });
    });

    it('should maintain last emitted value', (done) => {
      service.updateHeaderLink('first');
      service.updateHeaderLink('second');
      service.updateHeaderLink('third');

      // New subscriber should get 'third' immediately
      service.onHeaderLinkUpdate.subscribe(message => {
        expect(message).toBe('third');
        done();
      });
    });

    it('should allow unsubscribing', () => {
      const emissions: any[] = [];
      const subscription: Subscription = service.onHeaderLinkUpdate.subscribe(
        msg => emissions.push(msg)
      );

      service.updateHeaderLink('message1');
      subscription.unsubscribe();
      service.updateHeaderLink('message2');

      expect(emissions).toContain('message1');
      expect(emissions).not.toContain('message2');
    });

    it('should handle rapid updates', () => {
      const emissions: any[] = [];
      service.onHeaderLinkUpdate.subscribe(msg => emissions.push(msg));

      for (let i = 0; i < 100; i++) {
        service.updateHeaderLink(`message${i}`);
      }

      expect(emissions.length).toBeGreaterThan(1);
      expect(emissions).toContain('message99');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle navigation link updates', (done) => {
      const navigationLink = {
        url: '/trips',
        label: 'Trips',
        icon: 'directions_car'
      };

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message.url === '/trips') {
          expect(message.url).toBe('/trips');
          expect(message.label).toBe('Trips');
          expect(message.icon).toBe('directions_car');
          done();
        }
      });

      service.updateHeaderLink(navigationLink);
    });

    it('should handle breadcrumb updates', (done) => {
      const breadcrumbs = [
        { text: 'Home', link: '/' },
        { text: 'Trips', link: '/trips' },
        { text: 'Details', link: null }
      ];

      service.onHeaderLinkUpdate.subscribe(message => {
        if (Array.isArray(message) && message.length === 3) {
          expect(message[0].text).toBe('Home');
          expect(message[2].link).toBeNull();
          done();
        }
      });

      service.updateHeaderLink(breadcrumbs);
    });

    it('should handle page title updates', (done) => {
      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === 'Dashboard - Raptor Gig') {
          expect(message).toBe('Dashboard - Raptor Gig');
          done();
        }
      });

      service.updateHeaderLink('Dashboard - Raptor Gig');
    });

    it('should clear header link with empty string', (done) => {
      service.updateHeaderLink('some-link');

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === '') {
          expect(message).toBe('');
          done();
        }
      });

      service.updateHeaderLink('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle complex nested objects', (done) => {
      const complexObject = {
        navigation: {
          main: { link: '/home', active: true },
          sub: [
            { link: '/trips', label: 'Trips' },
            { link: '/shifts', label: 'Shifts' }
          ]
        },
        metadata: {
          timestamp: Date.now(),
          user: 'test-user'
        }
      };

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message.navigation) {
          expect(message.navigation.main.link).toBe('/home');
          expect(message.navigation.sub.length).toBe(2);
          expect(message.metadata.user).toBe('test-user');
          done();
        }
      });

      service.updateHeaderLink(complexObject);
    });

    it('should handle messages with special characters', (done) => {
      const specialMessage = 'Link with 特殊文字 & symbols!@#$%';

      service.onHeaderLinkUpdate.subscribe(message => {
        if (message === specialMessage) {
          expect(message).toBe(specialMessage);
          done();
        }
      });

      service.updateHeaderLink(specialMessage);
    });

    it('should handle sequential updates without losing data', () => {
      const messages: any[] = [];
      service.onHeaderLinkUpdate.subscribe(msg => messages.push(msg));

      service.updateHeaderLink('link1');
      service.updateHeaderLink({ url: '/page2' });
      service.updateHeaderLink(['breadcrumb1', 'breadcrumb2']);
      service.updateHeaderLink(null);

      expect(messages).toContain('link1');
      expect(messages.some((m: any) => m?.url === '/page2')).toBe(true);
      expect(messages.some((m: any) => Array.isArray(m))).toBe(true);
      expect(messages).toContain(null);
    });
  });
});
