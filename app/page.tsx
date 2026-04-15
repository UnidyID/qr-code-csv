"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Something went wrong");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qrcodes.zip";
      a.click();
      URL.revokeObjectURL(url);

      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">QR Code Generator</h1>
        <p className="text-sm text-gray-500 mb-6">
          Upload a CSV with <code className="bg-gray-100 px-1 rounded">id</code> and{" "}
          <code className="bg-gray-100 px-1 rounded">number</code> columns. Each row becomes a
          QR code PNG named by its <code className="bg-gray-100 px-1 rounded">id</code>. Max 1,000 rows.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
            {file ? (
              <p className="text-sm font-medium text-blue-600">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Click to select a CSV file</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            {loading ? "Generating…" : "Generate ZIP"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          Example CSV: <code>id,number</code> → <code>abc,1234567890</code>
        </p>
      </div>
    </main>
  );
}
