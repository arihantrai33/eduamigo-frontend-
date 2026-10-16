// Turns a written tutor answer into words for text-to-speech: no Markdown symbols, citation marks, links or code are read
// out, and maths is said in words ("x² + 3" -> "x squared plus 3"). The screen keeps showing the written answer.

const HINDI = /[ऀ-ॿ]/;

export function speakable(text, language = "en") {
  const hi = language === "hi" || HINDI.test(text);
  const w = hi
    ? { sq: " का वर्ग", cube: " का घन", root: " वर्गमूल ", times: " गुणा ", div: " भाग ", eq: " बराबर ", plus: " जमा ", minus: " घटा ", over: " बटा ", pow: " की घात ", pic: "चित्र देखें।", table: "सारांश तालिका स्क्रीन पर दिखाई गई है।" }
    : { sq: " squared", cube: " cubed", root: " square root of ", times: " times ", div: " divided by ", eq: " equals ", plus: " plus ", minus: " minus ", over: " over ", pow: " to the power ", pic: "See the picture on screen.", table: "A summary table is shown on screen." };
  // A table is not read cell by cell (that is a jumble of words): one line points to it. A run of table lines, or a table the
  // model wrote on one line, becomes one sentence. Every line then ends in a full stop, so headings and list items get the
  // pause a teacher would take instead of running into the next line.
  const lines = String(text || "").replace(/\|\s*:?-{3,}[\s|:-]*\|?/g, "|").split(/\n/);
  let inTable = false;
  const prepared = [];
  for (const raw of lines) {
    const line = raw.replace(/\s*\[S\d{1,2}\]/g, "").replace(/\s*https?:\/\/\S+/g, "").trim();
    if ((line.match(/\|/g) || []).length >= 3) {
      if (!inTable) prepared.push(`${w.table}`);
      inTable = true;
      continue;
    }
    inTable = false;
    if (!line || /^[-*•#.!?,;:\s]+$/.test(line)) continue;
    const bare = line.replace(/^#{1,6}\s*/, "").replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/[*_`]+$/g, "");
    prepared.push(/[.!?।:;,]$/.test(bare) || /^\[\[diagram/.test(line) ? line : `${line}.`);
  }
  return prepared.join("\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[\[diagram:\d+\]\]/g, ` ${w.pic} `)
    .replace(/\[S\d{1,2}\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, (m) => m.replace(".", ","))
    .replace(/[*_`~>|]/g, "")
    .replace(/²/g, w.sq).replace(/³/g, w.cube)
    .replace(/\^\s*2\b/g, w.sq).replace(/\^\s*3\b/g, w.cube).replace(/\^\s*(-?\d+)/g, `${w.pow}$1`)
    .replace(/√\s*/g, w.root)
    .replace(/×/g, w.times).replace(/÷/g, w.div)
    .replace(/(\d)\s*\/\s*(\d)/g, `$1${w.over}$2`)
    .replace(/\s=\s|=/g, w.eq)
    .replace(/\s*\+\s*/g, w.plus)
    .replace(/(\d|\)|[a-z])\s+-\s+/gi, `$1${w.minus}`)
    .replace(/\s+/g, " ")
    .replace(/\s+([.!?,;:।])/g, "$1")
    .trim();
}

// Splits streamed text into finished sentences (to speak while the rest is still arriving) and the unfinished tail.
// A sentence ends at . ! ? or । followed by white space, so "3.14" or "x=4." at the very end is not cut (the end of the
// stream is spoken separately).
export function takeSentences(text) {
  const out = [];
  let start = 0;
  for (let i = 0; i < text.length - 1; i += 1) {
    if (".!?।".includes(text[i]) && /\s/.test(text[i + 1])) {
      const s = text.slice(start, i + 1).trim();
      if (s.length > 1) out.push(s);
      start = i + 1;
    }
  }
  return { sentences: out, rest: text.slice(start) };
}
