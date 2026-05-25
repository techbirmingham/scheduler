import { Session } from '../store';

// Returns the earliest session date if any sessions exist; otherwise
// returns the supplied fallback (typically the current event's
// startDate). Falls back to today only as a last resort so callers
// don't have to guard against undefined.
export const getInitialDate = (sessions: Session[], fallback?: string): string => {
  const safeFallback = fallback ?? new Date().toISOString().slice(0, 10);

  if (sessions.length === 0) {
    return safeFallback;
  }

  return sessions.reduce(
    (earliest, session) => (session.date < earliest ? session.date : earliest),
    sessions[0].date,
  );
};
