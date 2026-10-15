import { useEffect, useState } from "react";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { getAiUsage, errorText } from "../../api/assistant";
import Skeleton from "../../components/ui/Skeleton";

// The school's AI use this month: calls, tokens, an estimated cost (only when prices are configured) and the limits that stop
// paid calls, with warnings. The cost is an estimate from tokens, never the provider's invoice; the page says so.

const num = (n) => Number(n || 0).toLocaleString("en-IN");
const money = (v, currency) => (v == null ? "not priced" : `${currency || ""} ${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 4 })}`.trim());
const ALERT_ICON = { critical: OctagonAlert, warning: AlertTriangle, info: Info };

export default function AiUsage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getAiUsage().then(setData).catch((err) => setError(errorText(err))); }, []);
  if (error) return <p className="ea-alert" role="alert"><span>{error}</span></p>;
  if (!data) return <Skeleton rows={4} label="Loading AI usage" />;
  const { totals, cost, limits, alerts } = data;
  return (
    <section style={{ display: "grid", gap: 14 }} aria-label="AI usage and cost">
      {data.provider && !data.provider.available && (
        <p className="ea-alert ea-alert--warning" role="status"><span>{data.provider.reason === "off" ? "The AI is switched off on this server: no AI answers are being produced." : "No AI provider is configured on this server: no AI answers are being produced."}</span></p>
      )}
      {alerts.map((a) => {
        const Icon = ALERT_ICON[a.level] || Info;
        return <p key={a.key} className={`ea-alert${a.level === "critical" ? "" : " ea-alert--warning"}`} role="alert"><Icon size={16} aria-hidden="true" /><span>{a.message}</span></p>;
      })}
      <div className="ea-card" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>This month ({data.period})</h2>
        {data.zeroUse ? (
          <p style={{ margin: "6px 0", fontSize: 14 }}>No AI was used this month. No variable AI cost was incurred.</p>
        ) : (
          <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, margin: "10px 0" }}>
            <div><dt style={{ fontSize: 12, color: "var(--subtext)" }}>AI calls</dt><dd style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{num(totals.calls)}</dd></div>
            <div><dt style={{ fontSize: 12, color: "var(--subtext)" }}>Tokens</dt><dd style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{num(totals.tokens)}</dd></div>
            <div><dt style={{ fontSize: 12, color: "var(--subtext)" }}>Estimated cost</dt><dd style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{money(cost.estimated, cost.currency)}</dd></div>
            <div><dt style={{ fontSize: 12, color: "var(--subtext)" }}>Answered from cache</dt><dd style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{num(totals.cacheHits)}</dd></div>
            <div><dt style={{ fontSize: 12, color: "var(--subtext)" }}>Failed calls</dt><dd style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{num(totals.failed)}</dd></div>
          </dl>
        )}
        <p style={{ fontSize: 12, color: "var(--subtext)", margin: "6px 0 0", lineHeight: 1.5 }}>
          {cost.note} {cost.pricesConfigured ? "" : "No model prices are configured on this server (AI_PRICING), so the cost cannot be estimated; calls and tokens are exact where the provider reports them."}
          {cost.tokensEstimatedCalls > 0 ? ` ${cost.tokensEstimatedCalls} call(s) had no provider token count and are estimated from text length.` : ""}
          {cost.unpricedCalls > 0 && cost.pricesConfigured ? ` ${cost.unpricedCalls} call(s) used a model with no configured price and are not in the estimate.` : ""}
        </p>
      </div>

      {limits.length > 0 && (
        <div className="ea-card" style={{ padding: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>Limits</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {limits.map((l) => (
              <li key={l.key}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
                  <strong>{l.label}</strong>
                  <span>{l.used == null ? "not enforced" : `${num(l.used)} of ${num(l.limit)} ${l.unit === "tokens" || l.unit === "requests" ? l.unit : l.unit || ""}`.trim()} · {l.state === "exhausted" ? "limit reached, AI paused" : l.state === "warning" ? "nearly used" : l.state === "unenforceable" ? "cannot be enforced" : "ok"}</span>
                </div>
                {l.used != null && <progress value={Math.min(l.used, l.limit)} max={l.limit || 1} aria-label={l.label} style={{ width: "100%", height: 8 }} />}
              </li>
            ))}
          </ul>
          <p style={{ fontSize: 12, color: "var(--subtext)", margin: "8px 0 0" }}>At a limit, paid AI calls stop (the AI Tutor and practice say why; EduAmigo Ask keeps working in keyword mode). Limits are set by EduAmigo for your plan.</p>
        </div>
      )}

      <div className="ea-card" style={{ padding: 16, overflowX: "auto" }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>By feature</h2>
        {data.byFeature.length === 0 ? <p style={{ margin: 0, fontSize: 13, color: "var(--subtext)" }}>Nothing yet.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Feature", "Calls", "Cache hits", "Tokens in", "Tokens out", "Estimated cost"].map((h) => <th key={h} scope="col" style={{ textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--subtext)", padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {data.byFeature.map((f) => (
                <tr key={f.feature}>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)" }}>{f.label}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)" }}>{num(f.calls)}{f.failed ? ` (+${f.failed} failed)` : ""}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)" }}>{num(f.cacheHits)}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)" }}>{num(f.inputTokens)}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)" }}>{num(f.outputTokens)}</td>
                  <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--border)" }}>{cost.pricesConfigured && !f.unpricedCalls ? money(f.costEstimate, cost.currency) : "not priced"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 12, color: "var(--subtext)", margin: "10px 0 0", lineHeight: 1.5 }}>
          Voice: {data.voice.requests} spoken question(s) this month. {data.voice.note} The provider's actual charge is not shown here; check the provider's billing page for it. Nothing in this table contains what students asked or were answered.
        </p>
      </div>
    </section>
  );
}
