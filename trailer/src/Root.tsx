import React from 'react';
import { Composition } from 'remotion';
import { RPBTrailer } from './Trailer';

const SCENE_DURATION = 75;
const TRANSITION = 15;
const SCENES_COUNT = 8;
const TITLE_DUR = 90;
const OUTRO_DUR = 90;
const TOTAL = TITLE_DUR + SCENES_COUNT * (SCENE_DURATION - TRANSITION) + OUTRO_DUR;

export const Root: React.FC = () => {
  return (
    <Composition
      id="RPBTrailer"
      component={RPBTrailer}
      durationInFrames={TOTAL}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
