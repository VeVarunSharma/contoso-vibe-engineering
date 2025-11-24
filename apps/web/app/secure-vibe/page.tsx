"use client";

import { useState } from "react";
// UI SUCCESS: Importing from the shared package
import { Button } from "@workspace/ui/components/button";

export default function SecureVibePage() {
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    const res = await fetch("/api/secure-vibe?id=1");
    const json = await res.json();
    setData(json);
  };

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold text-green-600">
        Secure Vibe (Engineering)
      </h1>
      <p>
        This component respects the Monorepo architecture and security rules.
      </p>

      {/* UI SUCCESS: Using the shared Button component */}
      <Button onClick={fetchData} variant="default">
        Fetch User (Secure)
      </Button>

      {data && (
        <pre className="bg-gray-100 p-4 rounded mt-4 border border-green-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
