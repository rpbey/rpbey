import type React from 'react';
import { Composition } from 'remotion';
import { AphrodyGif } from './AphrodyGif';
import { BeybladeIntro } from './Composition';
import { GameMaster } from './GameMaster';
import { LogosGif } from './LogosGif';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BeybladeIntro"
        component={BeybladeIntro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'RPB - RÉPUBLIQUE POPULAIRE',
          subtitle: 'DU BEYBLADE',
        }}
      />
      <Composition
        id="LogosGif"
        component={LogosGif}
        durationInFrames={150}
        fps={30}
        width={512}
        height={512}
      />
      <Composition
        id="GameMaster"
        component={GameMaster}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="AphrodyGif"
        component={AphrodyGif}
        durationInFrames={60}
        fps={30}
        width={512}
        height={512}
      />
    </>
  );
};
