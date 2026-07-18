export interface ITripStatistics {
  totalEarnings: number;
  totalTips: number;
  totalBonus: number;
  totalDistance: number;
  averagePerTrip: number;
  medianTip: number;
  medianPay: number;
  averagePay: number;
  highestPay: number;
  lowestPay: number | null;
  highestTip: number;
  zeroTipTrips: number;
  cashTrips: number;
  averagePerMile: number;
  bestEarningsPerMile: number;
  worstEarningsPerMile: number;
  averageTip: number;
  lowestNonZeroTip: number | null;
  tipPercentage: number;
  longestTrip: number;
  shortestTrip: number | null;
}
