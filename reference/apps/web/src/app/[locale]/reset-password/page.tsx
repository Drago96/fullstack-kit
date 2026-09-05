import { ResetPasswordForm } from '@/components/reset-password-form';

// Better Auth's reset link comes back here with a token on the query string; without one
// the visitor is still at the "email me a link" step.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={token ?? null} />;
}
