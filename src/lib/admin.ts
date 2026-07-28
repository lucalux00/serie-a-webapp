const defaultAdminEmails = [
  'luca.pinelli0000@gmail.com',
  'lucapinelli0000@gmail.com',
];

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const configuredEmails = process.env.ADMIN_EMAILS
    ?.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const allowedEmails = configuredEmails?.length ? configuredEmails : defaultAdminEmails;
  return allowedEmails.includes(email.trim().toLowerCase());
}
