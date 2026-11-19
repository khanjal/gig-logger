/**
 * Timings for the data sync modal's auto-close countdown.
 *
 * The countdown is cancellable: a run that produced a warning gets a longer
 * window so the message can actually be read and acted on before the modal
 * goes away.
 */
export const SYNC_CLOSE = {
  /** Countdown for a clean run with nothing but info messages. */
  DEFAULT_DELAY_MS: 5000,

  /** Countdown once a warning or error has been reported. */
  WARNING_DELAY_MS: 15000,

  /** Interval between countdown ticks. */
  TICK_MS: 1000
} as const;
