// Plays the tutor's answer in the natural (neural) voice from the server, a few sentences at a time.
//
// Why pieces: a neural voice takes about three seconds to make a sentence. The first piece is one sentence, so speech starts
// quickly; while it plays the next piece (what has arrived since, up to MAX_BY_PIECE) is already being made, so the voice runs on
// without gaps and without a long wait. Anything that goes wrong (the server is off, a limit is reached, the network drops, the
// browser blocks sound) hands the remaining text to onFallback, in order, to be read by the device's own voice: an answer is
// never left unspoken. After a failure the natural voice is not tried again for a short while.

const MIN_CHARS = 70;   // a piece that is still short waits briefly for the next sentence...
const HOLD_MS = 350;    // ...but never longer than this
// How long each piece may be: one sentence first (speech starts quickly), then growing. A piece takes about 1.5 s plus 0.4 s
// per second of speech to make, so each piece is short enough to be ready before the one before it has finished playing.
const MAX_BY_PIECE = [0, 130, 200, 240];
const FIRST_MIN = 40;   // the first piece is at least this long, so it is not just "Sure."
const DOWN_MS = 2 * 60 * 1000;

let downUntil = 0;
export const naturalVoiceDown = () => Date.now() < downUntil;
export const resetNaturalVoice = () => { downUntil = 0; };

export function createNaturalVoice({ fetchAudio, onPlaying, onIdle, onFallback }) {
  let epoch = 0;
  let queue = [];          // sentences waiting for a piece to be made
  let ready = [];          // made pieces waiting to play: { url, text }
  let fallback = [];       // pieces to read with the device's voice, once natural audio before them has finished
  let fetching = false;
  let audio = null;
  let current = null;
  let aborter = null;
  let timer = null;
  let pieces = 0;          // how many pieces of this answer have been taken
  let lastAdd = 0;

  const busy = () => !!(queue.length || ready.length || fallback.length || fetching || audio);
  const revoke = (url) => { try { URL.revokeObjectURL(url); } catch { /* already gone */ } };

  function takePiece() {
    let piece = queue.shift();
    const max = MAX_BY_PIECE[Math.min(pieces, MAX_BY_PIECE.length - 1)];
    pieces += 1;
    if (!max) {
      while (piece.length < FIRST_MIN && queue.length) piece += ` ${queue.shift()}`;
      return piece;
    }
    while (queue.length && piece.length + 1 + queue[0].length <= max) piece += ` ${queue.shift()}`;
    return piece;
  }

  function fail(texts) {
    downUntil = Date.now() + DOWN_MS;
    fallback.push(...texts, ...queue.splice(0));
  }

  function pump() {
    clearTimeout(timer);
    const mine = epoch;
    // Play a made piece at once; then, while it plays, start making the next one.
    if (!audio && ready.length) play(ready.shift());
    if (!fetching && !ready.length && queue.length) {
      const total = queue.reduce((n, s) => n + s.length, 0);
      const waited = Date.now() - lastAdd;
      if (total >= MIN_CHARS || !audio || waited >= HOLD_MS) {
        const text = takePiece();
        fetching = true;
        aborter = aborter || new AbortController();
        Promise.resolve()
          .then(() => fetchAudio(text, aborter.signal))
          .then((blob) => { if (mine !== epoch) return; fetching = false; ready.push({ url: URL.createObjectURL(blob), text }); pump(); })
          .catch((err) => { if (mine !== epoch || err?.name === "AbortError") return; fetching = false; fail([text]); pump(); });
      } else {
        timer = setTimeout(pump, Math.max(30, HOLD_MS - waited));
      }
    }
    if (!audio && !ready.length && !fetching && fallback.length) {
      const texts = fallback.splice(0);
      for (const t of texts) onFallback(t);
    }
    if (!busy()) onIdle();
  }

  function play(item) {
    const mine = epoch;
    const a = new Audio(item.url);
    audio = a;
    current = item;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      revoke(item.url);
      if (audio === a) { audio = null; current = null; }
      if (mine !== epoch) return;
      if (!ok) { downUntil = Date.now() + DOWN_MS; fallback.push(item.text, ...queue.splice(0)); }
      pump();
    };
    a.onplaying = () => { if (mine === epoch) onPlaying(); };
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => finish(false)); // sound blocked by the browser, or an unplayable file
  }

  return {
    // Adds one sentence (already prepared for speech).
    add(text) {
      if (!text) return;
      queue.push(text);
      lastAdd = Date.now();
      pump();
    },
    stop() {
      epoch += 1;
      clearTimeout(timer);
      queue = [];
      fallback = [];
      for (const r of ready) revoke(r.url);
      ready = [];
      fetching = false;
      pieces = 0;
      try { aborter?.abort(); } catch { /* nothing in flight */ }
      aborter = null;
      if (audio) { try { audio.pause(); } catch { /* already stopped */ } if (current) revoke(current.url); }
      audio = null;
      current = null;
    },
    busy,
  };
}
