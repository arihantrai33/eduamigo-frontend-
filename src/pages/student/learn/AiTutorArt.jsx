import base from "../../../assets/ai-tutor-base.png";
import accent from "../../../assets/ai-tutor-accent.png";

// The AI Tutor avatar above the welcome heading: the 3D assistant robot with its two chat bubbles. It is two local
// images stacked: the neutral robot (shell, visor, eyes) and a grey "accent" layer for the parts that carry colour (the
// neck ring, chest panel, visor rim, antenna, ear pods and bubbles). The accent layer is painted in the school's
// colour (--brand) with its shading blended in, so every school gets the same robot in its own colour (see .ea-tutor-art
// in index.css). Decorative: hidden from screen readers.
export default function AiTutorArt() {
  return (
    <span className="ea-tutor-art" aria-hidden="true">
      <img className="ea-tutor-art__base" src={base} alt="" draggable="false" />
      <span className="ea-tutor-art__accent" style={{ "--ea-art-accent": `url(${accent})` }} />
    </span>
  );
}
