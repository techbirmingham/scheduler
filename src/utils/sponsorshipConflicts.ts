// src/utils/sponsorshipConflicts.ts
//
// Detects mismatches in Host/Presenter attribution between a program and the
// sessions inside it. These are soft warnings — the data model permits the
// state, and the team decides whether it's actually a conflict. Sponsors are
// intentionally excluded: program-level sponsorship doesn't cascade to
// sessions, so divergence there is expected.
//
// Two directions:
//   - computeSessionConflicts: from a session's perspective, do any parent
//     programs have different Host/Presenter orgs?
//   - computeProgramConflicts: from a program's perspective, do any child
//     sessions have different Host/Presenter orgs?
//
// A "conflict" requires BOTH sides to have someone in the role. If either
// side is empty for that role, there's no claim to conflict over.

import type { Program, Session, Organization } from '../types'

export type ConflictRole = 'Host' | 'Presenter'

export interface SponsorshipConflict {
  role: ConflictRole
  /** Where the conflicting attribution lives, from the caller's perspective. */
  entityType: 'program' | 'session'
  entityId: string
  entityName: string
  /** Names of the orgs at the conflicting entity that don't overlap with ours. */
  conflictingOrgNames: string[]
}

function orgNamesById(ids: string[], organizations: Organization[]): string[] {
  return ids
    .map(id => organizations.find(o => o.id === id)?.name)
    .filter((n): n is string => Boolean(n))
}

function compareRole(
  ourIds: string[],
  theirIds: string[],
): { hasConflict: boolean; theirIds: string[] } {
  if (!ourIds.length || !theirIds.length) return { hasConflict: false, theirIds }
  const overlap = ourIds.some(id => theirIds.includes(id))
  return { hasConflict: !overlap, theirIds }
}

export function computeSessionConflicts(
  sessionForm: {
    hosted_by_org_ids?: string[]
    presented_by_org_ids?: string[]
    programIds?: string[]
  },
  programs: Program[],
  organizations: Organization[],
): SponsorshipConflict[] {
  const conflicts: SponsorshipConflict[] = []
  const sessionHosts = sessionForm.hosted_by_org_ids ?? []
  const sessionPresenters = sessionForm.presented_by_org_ids ?? []
  const programIds = sessionForm.programIds ?? []

  for (const programId of programIds) {
    const program = programs.find(p => p.id === programId)
    if (!program) continue
    const programHosts = program.hosted_by_org_ids ?? []
    const programPresenters = program.presented_by_org_ids ?? []

    const hostCmp = compareRole(sessionHosts, programHosts)
    if (hostCmp.hasConflict) {
      conflicts.push({
        role: 'Host',
        entityType: 'program',
        entityId: program.id,
        entityName: program.name,
        conflictingOrgNames: orgNamesById(hostCmp.theirIds, organizations),
      })
    }
    const presCmp = compareRole(sessionPresenters, programPresenters)
    if (presCmp.hasConflict) {
      conflicts.push({
        role: 'Presenter',
        entityType: 'program',
        entityId: program.id,
        entityName: program.name,
        conflictingOrgNames: orgNamesById(presCmp.theirIds, organizations),
      })
    }
  }
  return conflicts
}

export function computeProgramConflicts(
  programForm: {
    id?: string | null
    hosted_by_org_ids?: string[]
    presented_by_org_ids?: string[]
  },
  sessions: Session[],
  organizations: Organization[],
): SponsorshipConflict[] {
  const conflicts: SponsorshipConflict[] = []
  if (!programForm.id) return conflicts
  const programHosts = programForm.hosted_by_org_ids ?? []
  const programPresenters = programForm.presented_by_org_ids ?? []

  const childSessions = sessions.filter(s => s.programIds?.includes(programForm.id!))
  for (const session of childSessions) {
    const sessionHosts = session.hosted_by_org_ids ?? []
    const sessionPresenters = session.presented_by_org_ids ?? []

    const hostCmp = compareRole(programHosts, sessionHosts)
    if (hostCmp.hasConflict) {
      conflicts.push({
        role: 'Host',
        entityType: 'session',
        entityId: session.id,
        entityName: session.title || '(untitled)',
        conflictingOrgNames: orgNamesById(hostCmp.theirIds, organizations),
      })
    }
    const presCmp = compareRole(programPresenters, sessionPresenters)
    if (presCmp.hasConflict) {
      conflicts.push({
        role: 'Presenter',
        entityType: 'session',
        entityId: session.id,
        entityName: session.title || '(untitled)',
        conflictingOrgNames: orgNamesById(presCmp.theirIds, organizations),
      })
    }
  }
  return conflicts
}
