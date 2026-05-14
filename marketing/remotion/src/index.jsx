import { registerRoot, Composition } from 'remotion';
import { HeroIntro } from './HeroIntro.jsx';
import { FeatureShowcase } from './FeatureShowcase.jsx';
import { FullPromo } from './FullPromo.jsx';

const Root = () => (
  <>
    <Composition
      id="HeroIntro"
      component={HeroIntro}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="FeatureShowcase"
      component={FeatureShowcase}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="FullPromo"
      component={FullPromo}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1080}
    />
  </>
);

registerRoot(Root);
