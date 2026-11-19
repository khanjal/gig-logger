// App routes the specs navigate to and assert on (src/app/app-routing.module.ts).
export const ROUTES = {
  setup: '/setup',
  trips: '/trips',
  shifts: '/shifts',
  stats: '/stats',
} as const;

/** Matches the URL of a route, ignoring the origin. */
export function urlOf(route: string): RegExp {
  return new RegExp(`${route}$`);
}
