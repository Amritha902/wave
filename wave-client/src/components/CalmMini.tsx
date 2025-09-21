import { useEffect, useMemo, useState } from 'react'
import { apiMoodAdd, apiMoodList } from '../services/api'
import { supabase } from '../services/supabaseClient'
import CalmMini from '../components/CalmMini'

type MoodLevel = 1|2|3|4|5
const META: Record<MoodLevel,{label:string;emoji:string;color:string}> = {
  1:{label:'Very Low', emoji:'😞', color:'#ef4444'},
  2:{label:'Low',      emoji:'🙁', color:'#f97316'},
  3:{label:'Neutral',  emoji:'😐', color:'#eab308'},
  4:{label:'Good',     emoji:'🙂', color:'#22c55e'},
  5:{label:'Great',    emoji:'😄', color:'#10b981'},
}

export default function Mood({ deviceId }:{ deviceId:string }){
  const [mood, setMood] = useState<MoodLevel>(3)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')
  const [items, setItems] = useState<any[]>([])

  async function refresh(){
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    const res = await apiMoodList(deviceId, token)
    setItems(res.items || [])
  }
  useEffect(()=>{ refresh() }, [])

  async function onSave(){
    setSaving(true)
    try{
      const { data: sess } = await supabase.auth.getSession()
      const token = sess.session?.access_token
      // send structured payload if backend supports it; safe if it ignores `note`
      await apiMoodAdd({ mood, note }, deviceId, token)
      setFlash('Saved ✓'); setTimeout(()=>setFlash(''), 1500)
      setNote('')
      refresh()
    } finally { setSaving(false) }
  }

  // last 7 days + average (client-side)
  const last7 = useMemo(()=>{
    const now = Date.now()
    return (items||[]).filter((it:any)=> now - new Date(it.created_at).getTime() <= 7*24*3600*1000)
  }, [items])
  const avg7 = useMemo(()=>{
    if (!last7.length) return 0
    const sum = last7.reduce((s:any,it:any)=> s + Number(it.mood||0), 0)
    return (sum / last7.length).toFixed(1)
  }, [last7])

  const meta = META[mood]

  return (
    <div className="grid gap-6">
      {/* Mood input */}
      <div className="card p-6 grid gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">How are you feeling?</h2>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <span className="hidden sm:inline">7-day avg:</span>
            <b>{avg7 || '—'}</b>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span style={{fontSize:20}}>{meta.emoji}</span>
          <div className="flex-1">
            <input
              type="range" min={1} max={5} value={mood}
              onChange={e=>setMood(Number(e.target.value) as MoodLevel)}
              style={{ width:'100%', accentColor: meta.color }}
            />
            <div className="flex justify-between text-[11px] opacity-70 mt-1">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>
          <div className="text-right min-w-[92px]">
            <div className="text-sm font-medium" style={{color:meta.color}}>{meta.label}</div>
            <div className="text-xs opacity-70">({mood}/5)</div>
          </div>
        </div>

        <textarea
          className="card p-3 min-h-[80px] text-sm focus:ring-2"
          placeholder="Optional note (e.g., exam stress, great workout, met a friend)…"
          value={note}
          onChange={e=>setNote(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button className="btn px-4" disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <span className="opacity-80">{flash}</span>
        </div>
      </div>

      {/* Contextual calming mini-game */}
      {(mood <= 2 || (items[0]?.mood ?? 3) <= 2) && (
        <div className="card p-4 grid gap-3">
          <h3 className="font-medium">Feeling low? Try a 60-second reset</h3>
          <CalmMini />
        </div>
      )}

      {/* History */}
      <div className="card p-4">
        <h3 className="font-medium mb-3">Recent moods</h3>
        <div className="grid gap-2 text-sm">
          {items.map((it:any)=>(
            <div key={it.id} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="opacity-80">{new Date(it.created_at).toLocaleString()}</span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)' }}
                >
                  {META[it.mood as MoodLevel]?.emoji || '😐'} {it.mood}
                </span>
              </span>
            </div>
          ))}
          {!items.length && <div className="opacity-60 italic text-center py-6">No logs yet</div>}
        </div>
      </div>
    </div>
  )
}
