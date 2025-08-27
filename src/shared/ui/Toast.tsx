"use client";
import { useEffect, useState } from "react";

type ToastMsg = { id: number; text: string; type: "info"|"success"|"error"|"warning" };
let push!: (m: Omit<ToastMsg,"id">)=>void;

export function ToastHost() {
  const [list, setList] = useState<ToastMsg[]>([]);
  useEffect(() => {
    let id = 0;
    push = (m) => setList((prev) => [...prev, { id: ++id, ...m }]);
  }, []);
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {list.map(m => (
        <div key={m.id} className="min-w-[300px] rounded-xl shadow-lg text-white px-4 py-3 flex items-center justify-between animate-slideIn"
             style={{ backgroundColor: ({info:"#6366f1",success:"#10b981",error:"#ef4444",warning:"#f59e0b"})[m.type] }}>
          <span>{m.text}</span>
          <button onClick={()=>setList((prev)=>prev.filter(x=>x.id!==m.id))} className="ml-3 text-white/80 hover:text-white">✖</button>
        </div>
      ))}
    </div>
  );
}
export const Toast = {
  info: (text: string) => push?.({ text, type: "info" }),
  success: (text: string) => push?.({ text, type: "success" }),
  error: (text: string) => push?.({ text, type: "error" }),
  warning: (text: string) => push?.({ text, type: "warning" }),
};
