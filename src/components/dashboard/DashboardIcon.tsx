export type DashboardIconName =
  | "battery"
  | "bell"
  | "calendar"
  | "chevron"
  | "dashboard"
  | "edit"
  | "history"
  | "key"
  | "logout"
  | "profile";

type DashboardIconProps = {
  className?: string;
  name: DashboardIconName;
};

export function DashboardIcon({
  className = "h-5 w-5",
  name,
}: DashboardIconProps) {
  const commonProps = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  };

  if (name === "dashboard") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="6" rx="1.5" width="6" x="3" y="3" />
        <rect height="6" rx="1.5" width="6" x="15" y="3" />
        <rect height="6" rx="1.5" width="6" x="3" y="15" />
        <rect height="6" rx="1.5" width="6" x="15" y="15" />
      </svg>
    );
  }

  if (name === "history") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4.6 8.2A8.3 8.3 0 1 1 4 14" />
        <path d="M4.6 3.8v4.4H9" />
        <path d="M12 7.4v5l3.3 2" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.8 20c.4-4 2.5-6 6.2-6s5.8 2 6.2 6" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M6.8 9.7c0-3.2 1.8-5.5 5.2-5.5s5.2 2.3 5.2 5.5v3.1l1.5 2.5H5.3l1.5-2.5V9.7Z" />
        <path d="M9.8 18.2c.5 1 1.2 1.5 2.2 1.5s1.7-.5 2.2-1.5" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="16" rx="2.5" width="17" x="3.5" y="5" />
        <path d="M8 3v4M16 3v4M3.5 10h17" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="m14.5 5.2 4.3 4.3M5 19l2.1-5.7L15.5 5a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L10.7 17 5 19Z" />
      </svg>
    );
  }

  if (name === "key") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="8" cy="13" r="4" />
        <path d="m11 10 7-7M15 6l3 3M13 8l3 3" />
      </svg>
    );
  }

  if (name === "logout") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10" />
        <path d="M13 8l4 4-4 4M8 12h9" />
      </svg>
    );
  }

  if (name === "battery") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="10" rx="2" width="16" x="3" y="7" />
        <path d="M21 10v4M6 10v4M9 10v4M12 10v4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
