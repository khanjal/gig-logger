import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'split-dialog',
  standalone: true,
  imports: [CommonModule, MatRadioModule, MatButtonModule, FormsModule],
  styles: [
    `:host { display: block; }
     .container {
       min-width: 300px;
       max-width: 90vw;
       padding: 20px 24px;
       background: var(--color-surface, #ffffff);
       color: var(--color-text-primary, #111827);
       border-radius: 12px;
     }
     
     h3 { 
       margin: 0 0 8px 0; 
       color: var(--color-text-primary); 
       font-size: 1.25rem;
       font-weight: 600;
     }
     
     p { 
       margin: 0 0 16px 0; 
       font-size: 14px; 
       color: var(--color-text-secondary, #6b7280); 
     }
     
     mat-radio-group { 
       display: flex; 
       flex-direction: column; 
       gap: 10px;
       margin-bottom: 20px;
     }
     
     .actions { 
       display: flex; 
       justify-content: flex-end; 
       gap: 12px; 
       padding-top: 16px;
       border-top: 1px solid var(--color-border-light, #e5e7eb);
     }

     /* Dark mode overrides */
     :host-context(html.theme-dark) .container {
       background: var(--color-surface, #1e293b);
       color: var(--color-text-primary, #cbd5e1);
     }
     
     :host-context(html.theme-dark) h3 { color: var(--color-text-primary, #cbd5e1); }
     :host-context(html.theme-dark) p { color: var(--color-text-secondary, #94a3b8); }
     
     :host-context(html.theme-dark) .actions {
       border-top-color: var(--color-border, #475569);
     }
    `
  ],
  template: `
    <div class="container">
      <h3>Split Trip</h3>
      <p>Choose what to copy to the new split trip.</p>

      <mat-radio-group [(ngModel)]="selection">
        <mat-radio-button value="both">Both (same place & customer)</mat-radio-button>
        <mat-radio-button value="place">Same Place</mat-radio-button>
        <mat-radio-button value="customer">Same Customer</mat-radio-button>
        <mat-radio-button value="neither">Neither</mat-radio-button>
      </mat-radio-group>

      <div class="actions">
        <button mat-button (click)="cancel()">Cancel</button>
        <button mat-flat-button color="primary" (click)="confirm()">Split</button>
      </div>
    </div>
  `
})
export class SplitDialogComponent {
  selection: 'both' | 'place' | 'customer' | 'neither' = 'both';

  constructor(private dialogRef: MatDialogRef<SplitDialogComponent>) {}

  cancel() {
    this.dialogRef.close();
  }

  confirm() {
    this.dialogRef.close(this.selection);
  }
}
