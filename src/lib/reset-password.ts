export function buildResetPasswordBody(email: string, token: string, newPassword: string) {
  return {
    email: email.trim(),
    token,
    newPassword,
  };
}
