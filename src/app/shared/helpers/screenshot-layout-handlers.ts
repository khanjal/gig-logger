import { ScreenshotLayouts } from './screenshot-layouts';
import { ScreenshotClassificationHelper } from './screenshot-classification.helper';

export interface IScreenshotLayoutHandler {
  id: string;
  name: string;
  detect(text: string): number; // 0-1 score
  extract(text: string, parsed: any): boolean; // mutate parsed, return handled
}

const doordashEarningsHandler: IScreenshotLayoutHandler = {
  id: 'doordash-earnings-summary',
  name: 'DoorDash Earnings Summary',
  detect(text: string) {
    const layout = ScreenshotLayouts.find(l => l.id === this.id);
    if (!layout) return 0;
    let matches = 0;
    for (const sig of layout.signatures) {
      if (sig.test(text)) matches++;
    }
    return matches / layout.signatures.length;
  },
  extract(text: string, parsed: any) {
    // attempt single-line place+amount pairs first
    const single = extractPlaceAmountPairsLocal(text);
    if (single.length > 0) {
      parsed.places = single.map(p => p.place);
      parsed.perOfferAmounts = single.map(p => p.amount);
      parsed.place = parsed.places[0];
      parsed.extractedTrips = buildTripsLocal(parsed, text);
      return true;
    }

    // try multi-line pairs
    const multi = extractPlaceMultiLinePairsLocal(text);
    if (multi.length > 0) {
      parsed.places = multi.map(p => p.place);
      parsed.perOfferAmounts = multi.map(p => p.amount);
      parsed.place = parsed.places[0];
      parsed.extractedTrips = buildTripsLocal(parsed, text);
      return true;
    }

    // try generic places
    const places = extractPlacesLocal(text);
    if (places.length > 0) {
      parsed.places = places;
      parsed.place = places[0];
      parsed.extractedTrips = buildTripsLocal(parsed, text);
      return true;
    }

    return false;
  }
};

function extractPlaceAmountPairsLocal(text: string): Array<{ place: string; amount: number }> {
  const lines = text.split('\n').map(l => l.replace(/[<>©®]/g, '').trim()).filter(Boolean);
  const results: Array<{ place: string; amount: number }> = [];
  const blockedLabelRegex = /doordash\s*pay|doordash\s*tips|customer\s*tips|earn\s*per\s*offer|start\s*time|end\s*time|base\s*pay|offers?\b|deliveries?\b|total\b/i;

  for (const line of lines) {
    const match = line.match(/^(.+?)\s*\(?\d*\)?\s*\$\s*([0-9]+(?:\.[0-9]{1,2})?)$/);
    if (match) {
      let candidate = match[1].replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
      candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();
      const amount = parseFloat(match[2]);
      if (!candidate || candidate.length < 2) continue;
      if (blockedLabelRegex.test(candidate)) continue;
      if (/[<>@\|]/.test(candidate)) continue;
      if (!Number.isNaN(amount)) results.push({ place: candidate, amount });
    } else {
      const alt = line.match(/^(.+?)\s*\$\s*([0-9]+(?:\.[0-9]{1,2})?)$/);
      if (alt) {
        let candidate = alt[1].replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
        candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();
        const amount = parseFloat(alt[2]);
        if (!candidate || candidate.length < 2) continue;
        if (blockedLabelRegex.test(candidate)) continue;
        if (/[<>@\|]/.test(candidate)) continue;
        if (!Number.isNaN(amount)) results.push({ place: candidate, amount });
      }
    }
  }

  // dedupe
  const seen = new Set<string>();
  const deduped: Array<{ place: string; amount: number }> = [];
  for (const r of results) {
    const key = r.place.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  return deduped;
}

function extractPlaceMultiLinePairsLocal(text: string): Array<{ place: string; amount: number }> {
  const lines = text.split('\n').map(l => l.replace(/[<>©®]/g, '').trim()).filter(Boolean);
  const results: Array<{ place: string; amount: number }> = [];
  const blockedLabelRegex = /doordash\s*pay|doordash\s*tips|customer\s*tips|earn\s*per\s*offer|start\s*time|end\s*time|base\s*pay|offers?\b|deliveries?\b|total\b/i;

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];
    if (blockedLabelRegex.test(line) || blockedLabelRegex.test(next)) continue;
    const hasLetters = /[a-zA-Z]/.test(line);
    const amountMatch = next.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    if (hasLetters && amountMatch) {
      let candidate = line.replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
      candidate = candidate.replace(/\s*\([^)]*\)\s*$/g, '').trim();
      if (!candidate || candidate.length < 2) continue;
      const amount = parseFloat(amountMatch[1]);
      if (!Number.isNaN(amount)) {
        results.push({ place: candidate, amount });
        i += 1;
      }
    }
  }

  const seen = new Set<string>();
  const deduped: Array<{ place: string; amount: number }> = [];
  for (const r of results) {
    const key = r.place.toLowerCase().replace(/[^a-z0-9 ]+/g, '').trim();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
    }
  }

  return deduped;
}

function extractPlacesLocal(text: string): string[] {
  const lines = text.split('\n').map(l => l.replace(/['']/g, "'").trim()).filter(Boolean);
  const blockedPatterns = [
    /doordash\s*pay/i,
    /base\s*pay/i,
    /customer\s*tips/i,
    /doordash\s*tips/i,
    /start\s*time/i,
    /end\s*time/i,
    /deliver(?:y|ies)\s+complet(?:e|ed)/i,
    /earn\s*per\s*offer/i,
  ];
  const isBlocked = (line: string) => blockedPatterns.some(p => p.test(line));
  const hasLetters = (line: string) => /[a-zA-Z]/.test(line);
  const hasMoney = (line: string) => /\$\s*\d/.test(line);

  const places: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    let original = lines[index].replace(/[<>©®]/g, '').replace(/^[)\]-\s]+/, '').trim();
    if (!original || !hasLetters(original) || isBlocked(original)) continue;
    let candidate = original.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    candidate = candidate.replace(/^[\|\[\]•◦○●★☆]+\s*/i, '').trim();
    if (/shop|store|restaurant|cafe|bar|grill|market|general|dollar|subway|pizza|deli|kitchen/i.test(candidate) || (candidate.length >=5 && /[A-Z][a-z]/.test(candidate))) {
      places.push(candidate);
    }
  }

  return [...new Set(places)].slice(0,6);
}

function buildTripsLocal(parsed: any, text: string) {
  const places = parsed.places ?? [];
  const perOffer = parsed.perOfferAmounts ?? [];
  const tipAmounts = (function() {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const idx = lines.findIndex(l => /customer\s*tips/i.test(l));
    if (idx < 0) return [];
    const totalIdx = lines.findIndex((l,i)=> i>idx && /^total\b/i.test(l));
    const end = totalIdx>idx? totalIdx: lines.length;
    const candidateLines = lines.slice(idx+1, end);
    const amounts: number[] = [];
    for (const line of candidateLines) {
      const m = line.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      if (m) { const v=parseFloat(m[1]); if(!Number.isNaN(v)&&v>0) amounts.push(v); }
    }
    return amounts;
  })();

  const count = Math.max(places.length, perOffer.length, tipAmounts.length, 1);
  const basePay = parsed.basePay ?? null;
  const basePayAmounts = (basePay && count>1) ? ScreenshotClassificationHelper.splitBasePay(basePay, count) : (basePay? [basePay] : []);

  const trips: any[] = [];
  for (let i=0;i<count;i++) {
    if (perOffer.length >= count) {
      const offerPay = perOffer[i];
      const tipForOffer = (tipAmounts.length === perOffer.length && (tipAmounts[i] ?? 0) > 0) ? tipAmounts[i] : undefined;
      trips.push({ place: places[i] ?? places[0], pay: offerPay, basePay: undefined, tip: tipForOffer });
    } else {
      const tip = tipAmounts[i] ?? 0;
      const base = basePayAmounts[i] ?? 0;
      const total = base + tip;
      trips.push({ place: places[i] ?? places[0], pay: total>0? total: undefined, basePay: base>0?base:undefined, tip: tip>0?tip:undefined });
    }
  }

  return trips;
}

const handlers: Record<string, IScreenshotLayoutHandler> = {
  [doordashEarningsHandler.id]: doordashEarningsHandler
};

export function getLayoutHandler(id: string): IScreenshotLayoutHandler | undefined {
  return handlers[id];
}
