export function passwordIssues(password: string, name = '', email = '') {
  const normalized = password.toLowerCase();
  const localEmail = email.split('@')[0]?.toLowerCase();
  return [
    password.length < 12 && 'Usa almeno 12 caratteri',
    !/[a-z]/.test(password) && 'Aggiungi una lettera minuscola',
    !/[A-Z]/.test(password) && 'Aggiungi una lettera maiuscola',
    !/\d/.test(password) && 'Aggiungi un numero',
    !/[^A-Za-z0-9]/.test(password) && 'Aggiungi un simbolo',
    (name.length > 2 && normalized.includes(name.toLowerCase())) && 'Non usare il tuo nome',
    (localEmail && localEmail.length > 2 && normalized.includes(localEmail)) && 'Non usare la tua email',
  ].filter(Boolean) as string[];
}
export function passwordStrength(password: string, name = '', email = '') { const issues = passwordIssues(password, name, email).length; return issues === 0 ? 'sicura' : issues <= 2 ? 'discreta' : 'debole'; }
