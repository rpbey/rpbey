import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { RyugaChat } from '@/components/bot/RyugaChat';
import { auth } from '@/lib/auth';

export const metadata = {
  title: 'Ryuga AI | RPB Dashboard',
  description:
    "Discutez avec Ryuga, l'IA officielle de la République Populaire du Beyblade.",
};

export default async function BotPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in?callbackUrl=/dashboard/bot');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
            Ryuga - L\'Empereur Dragon
          </h1>
          <p className="text-muted-foreground text-sm">
            Posez vos questions sur la méta, les tournois ou le serveur.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-card border rounded-xl overflow-hidden shadow-sm">
        <RyugaChat user={session.user} />
      </div>
    </div>
  );
}
