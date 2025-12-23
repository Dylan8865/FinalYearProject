import React from "react";

interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
}

interface BreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (topicId: string) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  if (path.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg">
      <button
        onClick={() => onNavigate("root")}
        className="hover:text-white transition-colors flex items-center gap-1"
        title="Back to Cloud"
      >
        🏠 Cloud
      </button>
      
      {path.map((item, index) => (
        <React.Fragment key={`${item.id}-${index}`}>
          <span className="text-gray-600">›</span>
          {index === path.length - 1 ? (
            <span className="text-white font-medium">{item.name}</span>
          ) : (
            <button
              onClick={() => onNavigate(item.id)}
              className="hover:text-white transition-colors"
              title={`Back to ${item.name}`}
            >
              {item.name}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <span className="ml-2 text-gray-500 text-xs">
        Level {path[path.length - 1]?.level || 0}
      </span>
    </div>
  );
}
