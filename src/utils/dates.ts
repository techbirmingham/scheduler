import { Session } from '../store';

export const getInitialDate = (sessions: Session[]): string => {
  // Default conference start date
  const conferenceStartDate = '2025-06-25';
  
  // If there are no sessions, return the conference start date
  if (sessions.length === 0) {
    return conferenceStartDate;
  }

  // Find the earliest date from all sessions
  return sessions.reduce((earliest, session) => 
    session.date < earliest ? session.date : earliest, 
    sessions[0].date
  );
};