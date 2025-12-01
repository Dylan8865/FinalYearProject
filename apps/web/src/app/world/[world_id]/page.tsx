"use client";

export default function WorldPage({ params }: { params: { world_id: string } }) {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>World {params.world_id}</h1>
      <p>Welcome to World {params.world_id}</p>
    </div>
  );
}
