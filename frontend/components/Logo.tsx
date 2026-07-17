import { useId } from "react";
import Image from "next/image";

function SfLogoSvg({ size }: { size: number }) {
  return (
    <Image 
      src="/logo-sift-v2.png"
      alt="Sift app icon logo"
      width={size}
      height={size}
      style={{ borderRadius: size > 40 ? 12 : 8, objectFit: "contain" }}
      priority
    />
  );
}

export function LogoIcon({ size = 32 }: { size?: number }) {
  return <SfLogoSvg size={size} />;
}

export function LogoIconSmall({ size = 28 }: { size?: number }) {
  return <SfLogoSvg size={size} />;
}
