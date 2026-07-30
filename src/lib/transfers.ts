export type TransferLike = {
  id?: number | string;
  team_id?: string | null;
  type?: string | null;
  player?: string | null;
  status?: string | null;
  fee?: string | null;
  other_team?: string | null;
  fromTo?: string | null;
  created_at?: string | null;
};

export function normalizeTransferText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isSamePlayer(first?: string | null, second?: string | null) {
  const a = normalizeTransferText(first);
  const b = normalizeTransferText(second);
  return Boolean(a && b && (a === b || a.endsWith(` ${b}`) || b.endsWith(` ${a}`)));
}

export function isOfficial(status?: string | null) {
  return normalizeTransferText(status) === 'ufficiale';
}

function quality(item: TransferLike) {
  return [item.fee && item.fee !== 'N/D', item.other_team || item.fromTo, item.created_at]
    .filter(Boolean).length;
}

export function preferTransfer<T extends TransferLike>(current: T, candidate: T) {
  if (isOfficial(candidate.status) !== isOfficial(current.status)) {
    return isOfficial(candidate.status) ? candidate : current;
  }

  const candidateQuality = quality(candidate);
  const currentQuality = quality(current);
  if (candidateQuality !== currentQuality) return candidateQuality > currentQuality ? candidate : current;

  return new Date(candidate.created_at || 0).getTime() > new Date(current.created_at || 0).getTime()
    ? candidate
    : current;
}

export function dedupeTransfers<T extends TransferLike>(transfers: T[]) {
  const unique: T[] = [];

  for (const transfer of transfers) {
    const existingIndex = unique.findIndex((existing) =>
      existing.team_id === transfer.team_id &&
      normalizeTransferText(existing.type) === normalizeTransferText(transfer.type) &&
      isSamePlayer(existing.player, transfer.player)
    );

    if (existingIndex === -1) unique.push(transfer);
    else unique[existingIndex] = preferTransfer(unique[existingIndex], transfer);
  }

  return unique;
}
