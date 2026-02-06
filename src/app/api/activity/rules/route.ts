import { NextResponse } from 'next/server';
import rulesLogic from '../../../../../data/beyblade_x_logic_rules.json';
import wboRules from '../../../../../data/wbo_rules.json';

export async function GET() {
  // Combine structured logic with descriptive text
  const response = {
    logic: rulesLogic,
    content: {
      title: wboRules.title,
      sections: [
        {
          id: 'scoring',
          title: 'Système de Points',
          items: Object.entries(rulesLogic.scoring).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([key, val]: [string, any]) => ({
              name: key.replace('_', ' ').toUpperCase(),
              points: val.points,
              description: val.description,
            }),
          ),
        },
        {
          id: 'battle_types',
          title: 'Types de Combats',
          items: Object.entries(rulesLogic.battle_types).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ([key, val]: [string, any]) => ({
              name: key,
              description: val.description,
              type: val.type,
            }),
          ),
        },
      ],
    },
  };

  return NextResponse.json(response);
}
