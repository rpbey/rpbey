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
  return (
    <Image
      src={animated ? '/rpb.gif' : '/logo.webp'}
      alt="RPB Logo"
      width={size}
      height={size}
      className={className}
      priority
      unoptimized={animated}
    />
  );
}
