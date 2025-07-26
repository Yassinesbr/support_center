interface AvatarProps {
  src?: string; // URL of the avatar image (optional now)
  alt?: string; // Alt text for the avatar
  name?: string; // Name to generate initials from
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge"; // Avatar size
  status?: "online" | "offline" | "busy" | "none"; // Status indicator
}

const sizeClasses = {
  xsmall: "h-6 w-6 max-w-6",
  small: "h-8 w-8 max-w-8",
  medium: "h-10 w-10 max-w-10",
  large: "h-12 w-12 max-w-12",
  xlarge: "h-14 w-14 max-w-14",
  xxlarge: "h-16 w-16 max-w-16",
};

const statusSizeClasses = {
  xsmall: "h-1.5 w-1.5 max-w-1.5",
  small: "h-2 w-2 max-w-2",
  medium: "h-2.5 w-2.5 max-w-2.5",
  large: "h-3 w-3 max-w-3",
  xlarge: "h-3.5 w-3.5 max-w-3.5",
  xxlarge: "h-4 w-4 max-w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
};

const getInitials = (name?: string) => {
  if (!name) return "";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  name,
  size = "medium",
  status = "none",
}) => {
  const initials = !src && name ? getInitials(name) : "";

  return (
    <div
      className={`relative flex items-center justify-center bg-gray-100 text-gray-700 font-semibold rounded-full ${sizeClasses[size]}`}
    >
      {/* Avatar Image or Initials */}
      {src ? (
        <img
          src={src}
          alt={alt}
          className="object-cover rounded-full w-full h-full"
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}

      {/* Status Indicator */}
      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
            statusSizeClasses[size]
          } ${statusColorClasses[status] || ""}`}
        ></span>
      )}
    </div>
  );
};

export default Avatar;
