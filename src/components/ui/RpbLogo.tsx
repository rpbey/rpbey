import Image from 'next/image';

interface RpbLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function RpbLogo({
  size = 40,
  className,
  animated = false,
}: RpbLogoProps) {
  if (animated) {
    return (
      <video
        src="/rpb.webm"
        width={size}
        height={size}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        aria-label="RPB Logo"
      />
    );
  }
  return (
    <Image
      src="/logo.webp"
      alt="RPB Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
