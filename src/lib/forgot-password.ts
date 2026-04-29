export function buildForgotPasswordBody(email: string) {
  return { email: email.trim() };
}
