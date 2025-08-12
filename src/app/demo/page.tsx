"use client";

import { useEffect, useState } from "react";

type DemoItem = { src: string; name: string };

export default function DemoPage() {
  const [items, setItems] = useState<DemoItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    // Static list; extend as needed
    const base = "/demo_images";
    setItems([
      { src: `${base}/tricho_0.png`, name: "tricho_0.png" },
      { src: `${base}/tricho_1.png`, name: "tricho_1.png" },
      { src: `${base}/tricho_3.png`, name: "tricho_3.png" },
      { src: `${base}/tricho_4.png`, name: "tricho_4.png" },
    ]);
  }, []);

  const onUpload = () => {
    if (!selected) return;
    // Navigate back to home with imageUrl param - processing will happen there
    window.location.href = "/?imageUrl=" + encodeURIComponent(selected);
  };

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-sm text-neutral-400">Home / Select Demo Image</div>
        <h1 className="text-3xl font-extrabold text-white mt-2 mb-6">Select Demo Image</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <button
              key={it.name}
              onClick={() => setSelected(it.src)}
              className={`rounded-2xl border ${selected === it.src ? "border-rose-500" : "border-white/10"} overflow-hidden hover:brightness-110 transition`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} alt={it.name} className="w-full h-48 object-cover" />
            </button>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            disabled={!selected}
            onClick={onUpload}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-3 font-bold text-white shadow-lg disabled:opacity-60"
          >
            Upload
          </button>
        </div>
      </div>
    </main>
  );
}


