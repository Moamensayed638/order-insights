export function buildResetPasswordBody(email: string, token: string, newPassword: string) {
  return {
    email: email.trim(),
    token,
    newPassword,
  };
}

export function validateNewPassword(newPassword: string, confirmPassword: string): string | null {
  if (newPassword.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

export function getRawResetTokenFromSearch(search: string) {
  const query = search.startsWith("?") ? search.slice(1) : search;
  if (!query) return "";

  for (const part of query.split("&")) {
    if (!part) continue;

    const separatorIndex = part.indexOf("=");
    const key = separatorIndex === -1 ? part : part.slice(0, separatorIndex);
    if (key !== "token") continue;

    return (separatorIndex === -1 ? "" : part.slice(separatorIndex + 1)).trim();
  }

  return "";
}
