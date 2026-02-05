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
      src={animated ? '/logos_rpb.gif' : '/logo.png'}
      alt="RPB Logo"
      width={size}
      height={size}
      className={className}
      priority
      unoptimized={animated}
    />
  );
}
