import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getForumPosts, addForumPost, votePost, reportForum } from "../services/api";

export default function ForumHome() {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [tab, setTab] = useState<"recent" | "trending">("recent");

  useEffect(() => {
    load();
  }, [tab]);

  async function load() {
    const all = await getForumPosts();
    if (!all) return;
    setPosts(
      tab === "recent"
        ? all.sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))
        : all.sort((a: any, b: any) => b.score - a.score)
    );
  }

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    await addForumPost({
      user_id: uid(),
      title,
      body,
      category_slug: category,
      is_anonymous: true,
    });
    setTitle("");
    setBody("");
    await load();
  }

  async function upvote(id: number) {
    await votePost(id, { user_id: uid(), value: 1 });
    await load();
  }

  async function report(id: number) {
    await reportForum({ post_id: id, user_id: uid(), reason: "abuse" });
    alert("Reported. Thank you for keeping the forum safe.");
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Forum Column */}
      <div className="lg:col-span-2 space-y-6">

        {/* Post Creation */}
        <div className="card p-4 space-y-3">
          <h2 className="font-bold text-lg">Start a Discussion</h2>
          <input
            className="input"
            placeholder="Title (be kind, be clear)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="input min-h-[100px]"
            placeholder="What's on your mind?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex gap-3">
            <select
              className="input flex-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="vent">Daily Vent</option>
              <option value="motivation">Motivation</option>
              <option value="advice">Peer Advice</option>
            </select>
            <button className="btn" onClick={submit}>Post</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            className={`btn ${tab === "recent" ? "bg-blue-500 text-white" : ""}`}
            onClick={() => setTab("recent")}
          >
            🆕 Recent
          </button>
          <button
            className={`btn ${tab === "trending" ? "bg-blue-500 text-white" : ""}`}
            onClick={() => setTab("trending")}
          >
            🔥 Trending
          </button>
        </div>

        {/* Threads */}
        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="text-xs text-muted">
                {p.category_slug} • {new Date(p.created_at).toLocaleString()}
              </div>
              <h3 className="font-bold text-lg">{p.title}</h3>
              <p className="line-clamp-3">{p.body}</p>
              <div className="flex gap-3 mt-2">
                <button className="btn" onClick={() => upvote(p.id)}>👍 {p.score}</button>
                <button className="btn" onClick={() => report(p.id)}>🚩 Report</button>
                <Link className="btn ml-auto" to={`/forum/${p.id}`}>
                  View Discussion →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side Kindness Panel */}
      <div className="space-y-4">
        <div className="card p-4">
          <h3 className="font-bold mb-2">💡 Kindness Bot</h3>
          <p className="text-sm">
            "Even the darkest night will end, and the sun will rise." — Try writing one
            good thing that happened today.
          </p>
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
