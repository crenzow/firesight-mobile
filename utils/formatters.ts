export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString.replace(' ', 'T'));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function formatFullDate(isoString: string): string {
  const date = new Date(isoString.replace(' ', 'T'));
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString.replace(' ', 'T'));
  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null,
  suffix?: string | null
): string {
  const parts: string[] = [];

  if (firstName && firstName.trim()) {
    parts.push(firstName.trim());
  }

  if (middleName && middleName.trim()) {
    const initial = middleName.trim().charAt(0).toUpperCase();
    parts.push(`${initial}.`);
  }

  if (lastName && lastName.trim()) {
    parts.push(lastName.trim());
  }

  if (suffix && suffix.trim()) {
    parts.push(suffix.trim());
  }

  return parts.join(' ');
}