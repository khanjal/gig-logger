import type { OnChanges, OnDestroy} from '@angular/core';
import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appBaseButton]',
  standalone: true
})
export class BaseButtonDirective implements OnChanges, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() variant: 'primary' | 'secondary' | 'outlined' | 'danger' | 'icon' = 'primary';
  @Input() fab = false;
  @Input() fabStyle: 'regular' | 'mini' = 'regular';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() extraClass = '';

  @Output() clicked = new EventEmitter<void>();

  private host: HTMLElement;

  constructor() {
    this.host = this.el.nativeElement as HTMLElement;
    this.renderer.addClass(this.host, 'app-base-button');
  }

  ngOnChanges(): void {
    this.updateClasses();
    this.updateDisabled();
  }

  private updateClasses(): void {
    // remove variant classes
    ['btn-primary','btn-secondary','btn-outlined','btn-danger','btn-icon','btn-fab','btn-mini','btn-extended','btn-no-background','btn-loading','btn-disabled','btn-full-width'].forEach(c => {
      this.renderer.removeClass(this.host, c);
    });

    // add variant
    const variantClass = this.variant ? `btn-${this.variant}` : 'btn-primary';
    this.renderer.addClass(this.host, variantClass);

    if (this.fab) {
      this.renderer.addClass(this.host, 'btn-fab');
      if (this.fabStyle === 'mini') this.renderer.addClass(this.host, 'btn-mini');
    }

    if (this.loading) this.renderer.addClass(this.host, 'btn-loading');
    if (this.disabled) this.renderer.addClass(this.host, 'btn-disabled');

    // extra classes
    if (this.extraClass) {
      this.extraClass.split(' ').filter(Boolean).forEach(c => this.renderer.addClass(this.host, c));
    }
  }

  private updateDisabled(): void {
    const isDisabled = !!this.disabled || !!this.loading;
    this.renderer.setProperty(this.host, 'disabled', isDisabled);
    if (isDisabled) this.renderer.addClass(this.host, 'btn-disabled');
    else this.renderer.removeClass(this.host, 'btn-disabled');
  }

  // emit clicked only when not loading/disabled
  @HostListener('click', ['$event'])
  handleClick(event?: Event) {
    if (this.loading || this.disabled) {
      event?.stopImmediatePropagation();
      return;
    }
    this.clicked.emit();
  }

  ngOnDestroy(): void {
    // cleanup classes we added
    this.renderer.removeClass(this.host, 'app-base-button');
  }
}
