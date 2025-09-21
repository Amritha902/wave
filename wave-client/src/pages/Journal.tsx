import { useEffect, useState } from "react";
import { apiJournalAdd, apiJournalList } from "../services/api";
import { supabase } from "../services/supabaseClient";

export default function Journal({ deviceId }: { deviceId: string }) {
  const [text, setText] = useState("");
  const [timeCapsule, setTimeCapsule] = useState("");
  const [tags, setTags] = useState("");
  const [items, setItems] = useState<any[]>([]);

  async function refresh() {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const r = await apiJournalList(deviceId, token);
    setItems(r.items || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function add() {
    if (!text.trim()) return;
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;

    const entry = {
      content: text.trim(),
      timeCapsule: timeCapsule || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    await apiJournalAdd(entry, deviceId, token);
    setText("");
    setTimeCapsule("");
    setTags("");
    refresh();
  }

  return (
    <div className="grid gap-6">
      {/* Entry Form */}
      <div className="card p-6 grid gap-4 shadow-lg">
        <textarea
          className="card p-3 min-h-[120px] text-sm focus:ring-2 focus:ring-blue-400"
          placeholder="Write about your day, thoughts, or feelings…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="grid sm:grid-cols-3 gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="opacity-80 text-sm">Time capsule:</label>
            <input
              type="date"
              className="card px-2 py-1"
              value={timeCapsule}
              onChange={(e) => setTimeCapsule(e.target.value)}
            />
          </div>
          <input
            type="text"
            className="card px-2 py-1 sm:col-span-2"
            placeholder="Tags (comma separated, e.g., gratitude, stress)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <button
          className="btn ml-auto px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow-md hover:scale-105 transition"
          onClick={add}
        >
          Add Entry
        </button>
      </div>

      {/* Journal Timeline */}
      <div className="relative border-l border-white/10 pl-4 ml-2">
        {items.length === 0 && (
          <p className="text-center opacity-60 italic">
            No entries yet. Start writing your first journal entry ✨
          </p>
        )}

        {items.map((it: any) => {
          const due = it.time_capsule_at
            ? new Date(it.time_capsule_at).getTime() < Date.now()
            : false;

          return (
            <div key={it.id} className="mb-8 relative">
              {/* Timeline dot */}
              <div className="w-3 h-3 bg-blue-400 rounded-full absolute -left-1.5 top-2 shadow-md" />

              {/* Card */}
              <div
                className={`card p-4 transition hover:scale-[1.01] ${
                  due
                    ? "border border-blue-400/40 bg-blue-500/5"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs opacity-70">
                    {new Date(it.created_at).toLocaleString()}
                  </span>
                  {due && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-xl bg-blue-500/20 text-blue-300">
                      ⏰ Time capsule ready
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-line leading-relaxed">
                  {it.content}
                </p>

                {/* Tags */}
                {it.tags && it.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {it.tags.map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-lg bg-white/10 text-white/70"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Optional: Reflection suggestion */}
                {it.reflection && (
                  <p className="mt-3 text-sm italic text-white/70">
                    💡 {it.reflection}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
