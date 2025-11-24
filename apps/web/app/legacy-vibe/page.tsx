"use client";

import { useState } from "react";

export default function LegacyVibePage() {
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    // Vibe Coding: Just fetch it, don't worry about types
    const res = await fetch("/api/legacy-vibe?id=1");
    const json = await res.json();
    setData(json);
  };

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold text-red-600">
        Legacy Vibe (Insecure)
      </h1>
      <p>
        This component ignores the design system and security best practices.
      </p>

      {/* UI FLAW: Hardcoded styles instead of using @workspace/ui */}
      <button
        onClick={fetchData}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Fetch User (Legacy)
      </button>

      {data && (
        <pre className="bg-gray-100 p-4 rounded mt-4 border border-red-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
