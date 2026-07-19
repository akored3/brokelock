import Hero from './Hero.jsx';
import Ticker from './Ticker.jsx';
import Mechanism from './Mechanism.jsx';
import LandingFooter from './LandingFooter.jsx';

export default function Landing({ onConnect, burned }) {
  return (
    <main>
      <Hero onConnect={onConnect} />
      <Ticker burned={burned} />
      <Mechanism />
      <LandingFooter />
    </main>
  );
}
