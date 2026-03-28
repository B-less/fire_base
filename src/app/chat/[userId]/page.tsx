import { redirect } from 'next/navigation';

export default async function ChatRedirectPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  redirect(`/?contact=${encodeURIComponent(userId)}`);
}
