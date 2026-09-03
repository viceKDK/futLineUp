import { makeProject } from '@motion-canvas/core';
import logoIntro from './scenes/logo-intro?scene';
import featureFlow from './scenes/feature-flow?scene';

export default makeProject({
  scenes: [logoIntro, featureFlow],
  variables: {
    brand: 'futbolClub',
  },
});
