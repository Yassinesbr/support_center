import * as Icons from "../icons";
import { useState } from "react";

const iconList = Object.entries(Icons);

export default function IconsGallery() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopied(name);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Icons Gallery</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 32,
        }}
      >
        {iconList.map(([name, Icon]) => (
          <div
            key={name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 8,
              background: "#fafafa",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => handleCopy(name)}
            title={`Click to copy "${name}"`}
          >
            <Icon style={{ width: 32, height: 32, marginBottom: 8 }} />
            <span style={{ fontSize: 12, textAlign: "center" }}>{name}</span>
            {copied === name && (
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#e0ffe0",
                  color: "#2e7d32",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                Copied!
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
