import { connection } from 'next/server';
import DeckClient from './DeckClient';

export const metadata = {
  title: 'Mes Decks | Dashboard RPB',
  description: 'Gère tes decks Beyblade X pour les tournois officiels.',
};

export default async function DeckPage() {
  await connection();
  return <DeckClient />;
}