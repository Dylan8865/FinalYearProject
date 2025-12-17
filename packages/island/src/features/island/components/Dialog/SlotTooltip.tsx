const SlotTooltip = ({
  title,
  description,
  x,
  y,
}: {
  title: string;
  description: string[];
  x: number;
  y: number;
}) => (
  <div
    className="pointer-events-none fixed z-[100]"
    style={{
      left: x + 15,
      top: y + 15,
      background: "rgba(17, 24, 39, 0.95)",
      color: "white",
      padding: "8px 12px",
      borderRadius: "6px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      minWidth: "100px",
      textAlign: "center",
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ marginBottom: "2px" }}>{title}</div>
    {description.map((item, index) => (
      <div
        key={index}
        style={{
          fontSize: "11px",
          color: "#9ca3af",
        }}
      >
        {item}
      </div>
    ))}
  </div>
);

export default SlotTooltip;
