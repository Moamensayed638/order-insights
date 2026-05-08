export function buildResetPasswordBody(email: string, token: string, newPassword: string) {
  return {
    email: email.trim(),
    token,
    newPassword,
  };
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
