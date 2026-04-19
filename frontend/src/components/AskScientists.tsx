import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Play } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Scientist } from "@/components/Scientist";
import type { AnalyzeResponse } from "@/lib/mock-analyze";
import { setQuestion } from "@/lib/run-store";
import { fetchChat, type ChatHistoryItem } from "@/lib/api";

type Speaker = "watson" | "crick";
type Msg =
  | { id: string; from: "user"; text: string }
  | { id: string; from: Speaker; text: string }
  | { id: string; from: "rerun"; variable: string };

const STARTERS = [
  "Why did you choose these datasets?",
  "What would happen if we controlled for age?",
  "How confident are you in this result?",
  "Re-run with heat stress as the variable instead",
];

type Props = {
  question: string;
  data: AnalyzeResponse;
};

export function AskScientists({ question, data }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the full chat history to send to the backend
  const historyRef = useRef<ChatHistoryItem[]>([]);

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "intro",
      from: "watson",
      text: `Hi — I'm Watson. Crick and I are happy to walk you through "${question}". Ask anything about the methodology, the datasets, or the stats.`,
    },
  ]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    const id = crypto.randomUUID();

    // Add user message immediately
    setMessages((m) => [...m, { id, from: "user", text }]);
    setInput("");
    setBusy(true);

    // Add to history
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: text },
    ];

    try {
      const res = await fetchChat(question, text, historyRef.current);

      if (res.is_rerun_request) {
        const variable =
          res.suggested_rerun_query?.replace(/re-?run.*?(?:with|using|for)\s+/i, "").replace(/[.?!]+$/, "") ??
          "a new variable";
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), from: res.speaker, text: res.message },
          { id: crypto.randomUUID(), from: "rerun", variable },
        ]);
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: res.message, speaker: res.speaker },
        ];
      } else {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), from: res.speaker, text: res.message },
        ]);
        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: res.message, speaker: res.speaker },
        ];
      }
    } catch (err) {
      console.error("[AskScientists] chat error", err);
      // Graceful fallback
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          from: "watson",
          text: "Apologies — I'm having trouble reaching the lab right now. Try again in a moment.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const triggerRerun = (variable: string) => {
    const newQuery = `${question} — re-run with ${variable} as the variable`;
    setQuestion(newQuery);
    navigate({ to: "/run" });
  };

  return (
    <>
      {/* Floating toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-foreground text-background mono text-[11px] uppercase tracking-[0.18em] px-4 py-3 shadow-pop hover:scale-[1.03] transition-transform"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
        {open ? "close" : "ask the scientists"}
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(420px,calc(100vw-3rem))] h-[min(560px,calc(100vh-10rem))] flex flex-col pop-card-lg bg-card animate-bubble-up">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-foreground/15">
            <div className="flex -space-x-2">
              <div className="rounded-full ring-2 ring-card overflow-hidden bg-background">
                <Scientist who="watson" size={36} />
              </div>
              <div className="rounded-full ring-2 ring-card overflow-hidden bg-background">
                <Scientist who="crick" size={36} />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Ask Watson & Crick</div>
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                Live · {data.env_factor} → {data.outcome}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m) => (
              <ChatMsg key={m.id} msg={m} onRun={triggerRerun} />
            ))}
            {busy && (
              <div className="flex items-center gap-1.5 text-foreground/45 pl-1">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>

          {/* Starters */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={busy}
                  className="rounded-full bg-muted hover:bg-muted/70 px-2.5 py-1 text-[11px] text-foreground/70 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 px-3 py-3 border-t-2 border-foreground/15"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the methodology…"
              className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              className="rounded-full bg-foreground text-background h-9 w-9 flex items-center justify-center disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ChatMsg({ msg, onRun }: { msg: Msg; onRun: (v: string) => void }) {
  if (msg.from === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-foreground text-background px-3 py-2 text-sm">
          {msg.text}
        </div>
      </div>
    );
  }
  if (msg.from === "rerun") {
    return (
      <div className="ink-border rounded-xl bg-lab-blue-soft p-3 animate-bubble-up">
        <div className="mono text-[10px] uppercase tracking-[0.18em] text-foreground/55 mb-1">
          Crick proposes
        </div>
        <p className="text-sm text-foreground/85 mb-3">
          Re-run the experiment with <strong>{msg.variable}</strong> as the variable. Should we
          proceed?
        </p>
        <button
          type="button"
          onClick={() => onRun(msg.variable)}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background mono text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 hover:scale-[1.03] transition-transform"
        >
          <Play className="h-3 w-3" /> run experiment
        </button>
      </div>
    );
  }
  const isWatson = msg.from === "watson";
  return (
    <div className="flex items-start gap-2">
      <div className="shrink-0">
        <Scientist who={msg.from} size={32} />
      </div>
      <div className="max-w-[85%]">
        <div className="mono text-[9px] uppercase tracking-[0.18em] text-foreground/45 mb-0.5">
          {isWatson ? "Watson" : "Crick"}
        </div>
        <div
          className={`rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed ${
            isWatson ? "tag-green" : "tag-blue"
          }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}