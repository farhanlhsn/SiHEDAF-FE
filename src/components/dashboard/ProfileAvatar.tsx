type ProfileAvatarProps = {
  className?: string;
  fullname: string;
  profileImage?: string | null;
};

export function profileInitials(fullname: string) {
  const words = fullname.trim().split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function ProfileAvatar({
  className = "h-20 w-20 text-[1.375rem]",
  fullname,
  profileImage,
}: ProfileAvatarProps) {
  return (
    <span
      aria-label={profileImage ? `Foto profil ${fullname}` : undefined}
      className={`grid shrink-0 place-items-center rounded-full border-4 border-white bg-primary-800 bg-cover bg-center font-bold tracking-[-0.02em] text-white ${profileImage ? "" : "before:content-[attr(data-initials)]"} ${className}`}
      data-initials={profileImage ? undefined : profileInitials(fullname)}
      role={profileImage ? "img" : undefined}
      style={
        profileImage
          ? { backgroundImage: `url("${profileImage.replaceAll('"', "%22")}")` }
          : undefined
      }
    />
  );
}
