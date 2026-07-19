import Embers from './Embers.jsx';

// Fixed ambient layer stack behind everything: abyss→void gradient,
// drifting iris glow orbs, film grain, ember particles. Content sits above.
export default function Backdrop({ density = 28 }) {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-orb backdrop-orb-a" />
      <div className="backdrop-orb backdrop-orb-b" />
      <div className="backdrop-grain" />
      <Embers density={density} />
    </div>
  );
}
