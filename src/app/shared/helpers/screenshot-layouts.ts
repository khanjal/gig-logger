export interface IScreenshotLayout {
  id: string;
  name: string;
  signatures: RegExp[]; // indicators to detect this layout
  description?: string;
}

export const ScreenshotLayouts: IScreenshotLayout[] = [
  {
    id: 'doordash-earnings-summary',
    name: 'DoorDash Earnings Summary',
    description: 'Earnings summary screens with DoorDash Pay, Customer Tips, and per-offer lines',
    signatures: [
      /doordash\s*pay/i,
      /customer\s*tips/i,
      /earn\s*per\s*offer/i,
      /offers?\b|deliveries?\b/i
    ]
  },
  {
    id: 'doordash-offer',
    name: 'DoorDash Offer',
    description: 'Offer screen with restaurant name and guaranteed amount or accept/decline buttons',
    signatures: [
      /guaranteed/i,
      /accept\b|decline\b/i,
      /restaurant\s*pickup/i
    ]
  },
  {
    id: 'uber-earnings-summary',
    name: 'Uber Eats Earnings Summary',
    signatures: [
      /uber\s*eats/i,
      /earn\s*per\s*offer/i,
      /deliveries?\b/i
    ]
  }
];
