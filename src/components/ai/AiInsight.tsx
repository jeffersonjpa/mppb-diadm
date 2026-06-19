'use client';

import { useEffect, useRef, useState } from 'react';

interface AiInsightPayload {
  periodoLabel: string;
  kpis: object;
  topCidades?: { label: string; value: number }[];
}

interface AiInsightProps {
  endpoint?: string;
  payload?: AiInsightPayload;
  /** Texto fixo para simulação/preview — quando fornecido, não chama a API. Suporta **negrito**. */
  mockText?: string;
}

/** Converte **texto** em <strong>texto</strong> inline. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-semibold text-mp-ink">{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

export default function AiInsight({ endpoint, payload, mockText }: AiInsightProps) {
  const [text, setText] = useState<string | null>(mockText ?? null);
  const [loading, setLoading] = useState(!mockText);
  const [error, setError] = useState(false);

  const payloadKey = payload ? JSON.stringify(payload) : '';
  const lastKey = useRef<string>('');

  useEffect(() => {
    if (mockText) return;
    if (!endpoint || !payload) return;
    if (payloadKey === lastKey.current) return;
    lastKey.current = payloadKey;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setText(null);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadKey,
    })
      .then(r => r.json())
      .then(data => { if (!cancelled) setText(data.text ?? ''); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [payloadKey, endpoint, mockText, payload]);

  if (error) return (
    <div className="bg-mp-tint border border-mp-primary/20 rounded-mp-card px-5 py-3 flex items-center gap-2">
      <span className="shrink-0 text-mp-muted opacity-60" aria-hidden>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-[12px] text-mp-muted">Análise IA indisponível no momento.</p>
    </div>
  );

  return (
    <div className="bg-mp-tint border border-mp-primary/20 rounded-mp-card px-5 py-4 flex flex-col gap-3">
      <div className="flex gap-3 items-start">
        <span className="mt-0.5 shrink-0 text-mp-primary opacity-60" aria-hidden>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>

        {loading ? (
          <div className="flex gap-1.5 items-center h-5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-mp-primary/40 animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-mp-ink leading-relaxed">
            {text && <RichText text={text} />}
          </p>
        )}
      </div>

      {!loading && (
        <div className="flex justify-end">
          <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-mp-primary/60 bg-mp-primary/10 px-2 py-0.5 rounded">
            Texto gerado por IA
          </span>
        </div>
      )}
    </div>
  );
}
