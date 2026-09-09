import type { IconType } from "react-icons";
import * as FontAwesome from "react-icons/fa6";
import { Link2 } from "lucide-react";
import Image from "next/image";

const icons = Object.entries(FontAwesome).filter(
  ([, icon]) => typeof icon === "function",
) as Array<[string, IconType]>;

function iconLabel(name: string) {
  return name
    .replace(/^Fa/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

const iconAliases: Record<string, string[]> = {
  facebook: ["facebook", "fb"],
  instagram: ["instagram", "insta"],
  linkedin: ["linkedin"],
  twitter: ["twitter", "x"],
  youtube: ["youtube", "yt"],
  github: ["github"],
  website: ["website", "web", "portfolio"],
};

function getAutoIcon(label: string) {
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  const alias = Object.entries(iconAliases).find(([, names]) =>
    names.some((name) => normalizedLabel === name || normalizedLabel.includes(name)),
  )?.[0];
  if (alias) {
    const aliasedIcon = icons.find(([name]) =>
      iconLabel(name).toLowerCase().replace(/[^a-z0-9]/g, "") === alias,
    )?.[1];
    if (aliasedIcon) return aliasedIcon;
  }

  return icons
    .filter(([name]) => iconLabel(name).length >= 3)
    .sort((first, second) => iconLabel(second[0]).length - iconLabel(first[0]).length)
    .find(([name]) => {
      const normalizedName = iconLabel(name).toLowerCase().replace(/[^a-z0-9]/g, "");
      return normalizedLabel === normalizedName || normalizedLabel.includes(normalizedName);
    })?.[1];
}

function FontAwesomeGlyph({ Icon, size }: { Icon: IconType; size: number }) {
  return <Icon size={size} />;
}

export const socialIconOptions = icons
  .map(([value]) => ({ value, label: iconLabel(value) }))
  .sort((first, second) => first.label.localeCompare(second.label));

export function SocialIcon({
  label,
  icon,
  iconImage,
  size = 16,
}: {
  label: string;
  icon?: string;
  iconImage?: string;
  size?: number;
}) {
  if (iconImage) {
    return (
      <Image
        src={iconImage}
        alt=""
        width={size}
        height={size}
        className="social-icon-image rounded object-cover"
      />
    );
  }

  const SelectedIcon = icons.find(([name]) => name === icon)?.[1];
  if (SelectedIcon) return <FontAwesomeGlyph Icon={SelectedIcon} size={size} />;

    const Icon = getAutoIcon(label);

  return Icon ? <FontAwesomeGlyph Icon={Icon} size={size} /> : <Link2 size={size} />;
}