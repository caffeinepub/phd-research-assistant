interface SourceBadgeProps {
  sourceType: string;
  className?: string;
}

export function SourceBadge({ sourceType, className = "" }: SourceBadgeProps) {
  const type = sourceType?.toLowerCase() || "other";

  let label = sourceType;
  let badgeClass = "badge-other";

  if (type.includes("arxiv")) {
    label = "arXiv";
    badgeClass = "badge-arxiv";
  } else if (type.includes("semantic")) {
    label = "Semantic Scholar";
    badgeClass = "badge-semantic";
  } else if (type.includes("shodhganga")) {
    label = "Shodhganga";
    badgeClass = "badge-shodhganga";
  } else if (type.includes("arxiv")) {
    label = "arXiv";
    badgeClass = "badge-arxiv";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${badgeClass} ${className}`}
    >
      {label}
    </span>
  );
}
