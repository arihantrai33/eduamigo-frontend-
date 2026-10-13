// Draws a tutor diagram from a validated spec (backend learning/diagram.js). Only these shapes exist; the spec is data,
// and nothing from the model is rendered as HTML or SVG markup. Every diagram has a text description for screen readers,
// and an unknown or broken spec shows nothing (the written explanation stands on its own).

const W = 320;

function Frame({ d, children, height }) {
  return (
    <figure className="ea-diagram" role="img" aria-label={d.alt}>
      {d.title && <figcaption className="ea-diagram__title">{d.title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${height}`} style={{ width: "min(400px, 100%)", height: "auto", display: "block" }} aria-hidden="true" focusable="false">{children}</svg>
    </figure>
  );
}

function NumberLine({ d }) {
  const x = (v) => 20 + ((v - d.min) / (d.max - d.min)) * (W - 40);
  const ticks = [];
  for (let v = d.min; v <= d.max + 1e-9; v += d.step) ticks.push(Math.round(v * 1000) / 1000);
  return (
    <Frame d={d} height={90}>
      {d.ranges.map((r, i) => <rect key={`r${i}`} x={x(r.from)} y={34} width={x(r.to) - x(r.from)} height={12} rx={3} className="ea-diagram__range" />)}
      <line x1={10} y1={40} x2={W - 10} y2={40} className="ea-diagram__axis" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(v)} y1={34} x2={x(v)} y2={46} className="ea-diagram__axis" />
          <text x={x(v)} y={62} textAnchor="middle" className="ea-diagram__text">{v}</text>
        </g>
      ))}
      {d.points.map((p, i) => (
        <g key={`p${i}`}>
          <circle cx={x(p.value)} cy={40} r={5} className="ea-diagram__point" />
          {p.label && <text x={x(p.value)} y={24} textAnchor="middle" className="ea-diagram__label">{p.label}</text>}
        </g>
      ))}
      {d.ranges.map((r, i) => r.label && <text key={`rl${i}`} x={(x(r.from) + x(r.to)) / 2} y={82} textAnchor="middle" className="ea-diagram__label">{r.label}</text>)}
    </Frame>
  );
}

function Bars({ d }) {
  const max = Math.max(...d.values.map(Math.abs), 1);
  const bw = (W - 40) / d.values.length;
  return (
    <Frame d={d} height={180}>
      <line x1={20} y1={140} x2={W - 20} y2={140} className="ea-diagram__axis" />
      {d.values.map((v, i) => {
        const h = (Math.abs(v) / max) * 110;
        return (
          <g key={i}>
            <rect x={20 + i * bw + bw * 0.15} y={140 - h} width={bw * 0.7} height={h} rx={3} className="ea-diagram__bar" />
            <text x={20 + i * bw + bw / 2} y={135 - h} textAnchor="middle" className="ea-diagram__text">{v}{d.unit ? ` ${d.unit}` : ""}</text>
            <text x={20 + i * bw + bw / 2} y={156} textAnchor="middle" className="ea-diagram__text">{d.labels[i]}</text>
          </g>
        );
      })}
    </Frame>
  );
}

const SERIES_CLASS = ["ea-diagram__line", "ea-diagram__line ea-diagram__line--2", "ea-diagram__line ea-diagram__line--3"];

function Graph({ d }) {
  const series = d.series?.length ? d.series : [{ label: d.title, points: d.points }];
  const ys = series.flatMap((s) => s.points.map((p) => p[1]));
  const yMin = Math.min(0, ...ys); const yMax = Math.max(0, ...ys);
  const legendH = series.length > 1 ? 18 * series.length + 4 : 0;
  const H = 210 + legendH; const pad = 30; const top = 8; const bottom = H - legendH - pad;
  const sx = (x) => pad + ((x - d.xMin) / (d.xMax - d.xMin)) * (W - 2 * pad);
  const sy = (y) => bottom - ((y - yMin) / ((yMax - yMin) || 1)) * (bottom - top);
  const step = (d.xMax - d.xMin) / 60;
  // A line is broken where points are missing (for example 1/x around 0).
  const lines = series.map((s) => {
    const segments = []; let cur = [];
    s.points.forEach((p, i) => {
      if (i && p[0] - s.points[i - 1][0] > step * 1.5) { segments.push(cur); cur = []; }
      cur.push(`${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`);
    });
    segments.push(cur);
    return segments.filter((x) => x.length > 1);
  });
  const xTicks = [d.xMin, (d.xMin + d.xMax) / 2, d.xMax].map((v) => Math.round(v * 100) / 100);
  const yTicks = [yMin, (yMin + yMax) / 2, yMax].map((v) => Math.round(v * 100) / 100);
  return (
    <Frame d={d} height={H}>
      {yTicks.map((v) => <line key={`gy${v}`} x1={pad} y1={sy(v)} x2={W - pad} y2={sy(v)} className="ea-diagram__grid" />)}
      <line x1={pad} y1={sy(0)} x2={W - pad} y2={sy(0)} className="ea-diagram__axis" />
      {d.xMin <= 0 && d.xMax >= 0 && <line x1={sx(0)} y1={top} x2={sx(0)} y2={bottom} className="ea-diagram__axis" />}
      {lines.map((segs, i) => segs.map((seg, j) => <polyline key={`${i}-${j}`} points={seg.join(" ")} className={SERIES_CLASS[i % 3]} fill="none" />))}
      {xTicks.map((v) => <text key={`tx${v}`} x={sx(v)} y={bottom + 14} textAnchor="middle" className="ea-diagram__text">{v}</text>)}
      {yTicks.map((v) => <text key={`ty${v}`} x={pad - 4} y={sy(v) + 3} textAnchor="end" className="ea-diagram__text">{v}</text>)}
      {d.xLabel && <text x={W - pad} y={bottom + 26} textAnchor="end" className="ea-diagram__label">{d.xLabel}</text>}
      {d.yLabel && <text x={pad + 4} y={top + 8} className="ea-diagram__label">{d.yLabel}</text>}
      {series.length > 1 && series.map((s, i) => (
        <g key={`lg${i}`} transform={`translate(${pad}, ${H - legendH + 4 + i * 18})`}>
          <line x1="0" y1="6" x2="22" y2="6" className={SERIES_CLASS[i % 3]} />
          <text x="28" y="10" className="ea-diagram__text">{s.label}</text>
        </g>
      ))}
    </Frame>
  );
}

function ConceptMap({ d }) {
  const n = d.branches.length; const cx = W / 2; const cy = 130; const rx = 105; const ry = 78;
  return (
    <Frame d={d} height={270}>
      {d.branches.map((b, i) => {
        const a = (2 * Math.PI * i) / n - Math.PI / 2;
        const x = cx + rx * Math.cos(a); const y = cy + ry * Math.sin(a);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} className="ea-diagram__axis" />
            <rect x={x - 40} y={y - 11} width={80} height={22} rx={11} className="ea-diagram__node" />
            <text x={x} y={y + 4} textAnchor="middle" className="ea-diagram__label">{b.label}</text>
            {b.children.map((c, k) => <text key={k} x={x} y={y + (y >= cy ? 24 + k * 11 : -16 - k * 11)} textAnchor="middle" className="ea-diagram__text">{c}</text>)}
          </g>
        );
      })}
      <ellipse cx={cx} cy={cy} rx={46} ry={20} className="ea-diagram__center" />
      <text x={cx} y={cy + 4} textAnchor="middle" className="ea-diagram__label ea-diagram__label--on-brand">{d.center}</text>
    </Frame>
  );
}

function Flow({ d }) {
  return (
    <figure className="ea-diagram" role="img" aria-label={d.alt}>
      {d.title && <figcaption className="ea-diagram__title">{d.title}</figcaption>}
      <ol className="ea-diagram__flow" aria-hidden="true">
        {d.steps.map((s, i) => <li key={i}><span className="ea-diagram__step-no">{i + 1}</span><span>{s}</span></li>)}
      </ol>
    </figure>
  );
}

function Cycle({ d }) {
  const n = d.steps.length; const cx = W / 2; const cy = 120; const r = 80;
  const at = (i) => [cx + r * Math.sin((2 * Math.PI * i) / n), cy - r * Math.cos((2 * Math.PI * i) / n)];
  return (
    <Frame d={d} height={250}>
      <circle cx={cx} cy={cy} r={r} className="ea-diagram__ring" fill="none" />
      {d.steps.map((s, i) => {
        const [x, y] = at(i);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={7} className="ea-diagram__point" />
            <text x={x} y={y + (y < cy ? -12 : 20)} textAnchor="middle" className="ea-diagram__label">{s}</text>
          </g>
        );
      })}
    </Frame>
  );
}

function Table({ d }) {
  return (
    <figure className="ea-diagram">
      {d.title && <figcaption className="ea-diagram__title">{d.title}</figcaption>}
      <div className="ea-diagram__table-wrap">
        <table className="ea-diagram__table" data-stack="">
          <thead><tr>{d.headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
          <tbody>{d.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}

const SHAPES = { numberline: NumberLine, bar: Bars, graph: Graph, flow: Flow, cycle: Cycle, table: Table, conceptmap: ConceptMap };

export default function Diagram({ d }) {
  const Shape = d && SHAPES[d.type];
  return Shape ? <Shape d={d} /> : null;
}
