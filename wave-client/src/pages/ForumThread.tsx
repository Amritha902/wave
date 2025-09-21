import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getForumThread,
  addForumComment,
  reportForum,
  summarizeThread,
  votePost,
} from "../services/api";

export default function ForumThread() {
  const { id } = useParams();
  const postId = Number(id);
  const [data, setData] = useState<any>({ post: null, comments: [] });
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    (async () => {
      setData((await getForumThread(postId)) || { post: null, comments: [] });
    })();
  }, [postId]);

  async function send() {
    if (!body.trim()) return;
    await addForumComment(postId, { user_id: uid(), body, is_anonymous: true });
    setBody("");
    setData(await getForumThread(postId));
  }

  async function up() {
    await votePost(postId, { user_id: uid(), value: 1 });
    setData(await getForumThread(postId));
  }

  async function rep() {
    await reportForum({ post_id: postId, user_id: uid(), reason: "unsafe" });
    alert("Reported");
  }

  async function kind() {
    const r = await summarizeThread(postId);
    setSummary(r?.summary || "No summary available.");
  }

  const p = data.post;
  if (!p) return <div className="card p-4">Post not found or still loading…</div>;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">

        <Link to="/forum" className="text-sm text-blue-400 hover:underline">
          &larr; Back to Forum
        </Link>

        <div className="card p-4">
          <div className="text-xs text-muted">
            {p.category_slug} • {new Date(p.created_at).toLocaleString()}
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--accent)" }}>
            {p.title}
          </h1>
          <p className="mt-2">{p.body}</p>
          <div className="flex gap-3 mt-3">
            <button className="btn" onClick={up}>
              Upvote ({p.score})
            </button>
            <button className="btn" onClick={rep}>
              Report
            </button>
            <button className="btn ml-auto" onClick={kind}>
              Kind Summary
            </button>
          </div>
          {summary && (
            <div className="mt-3 p-3 rounded-xl border border-white/10">
              {summary}
            </div>
          )}
        </div>

        <div className="card p-4 space-y-3">
          <textarea
            className="input min-h-[100px]"
            placeholder="Be kind and supportive…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button className="btn ml-auto" onClick={send}>
            Reply
          </button>
        </div>

        <div className="space-y-3">
          {(data.comments || []).map((c: any, i: number) => (
            <div key={i} className="card p-3">
              <div className="text-xs text-muted flex justify-between">
                <span>Anonymous</span>
                <span>{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1">{c.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function uid() {
  const k = "wave-uid";
  const v = localStorage.getItem(k);
  if (v) return v;
  const n = crypto.randomUUID();
  localStorage.setItem(k, n);
  return n;
}
