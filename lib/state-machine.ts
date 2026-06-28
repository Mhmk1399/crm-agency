import { InvalidStateTransitionError } from "./errors";

export type TransitionMap<S extends string> = Record<S, S[]>;

export function validateTransition<S extends string>(
  map: TransitionMap<S>,
  entityName: string,
  from: S,
  to: S
): void {
  const allowed = map[from];
  if (!allowed || !allowed.includes(to)) {
    throw new InvalidStateTransitionError(entityName, from, to);
  }
}

export function getAllowedTransitions<S extends string>(
  map: TransitionMap<S>,
  from: S
): S[] {
  return map[from] ?? [];
}
