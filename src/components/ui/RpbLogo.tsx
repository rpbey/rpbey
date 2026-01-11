import Image from 'next/image';

interface RpbLogoProps {
  size?: number;
  className?: string;
}

export function RpbLogo({ size = 40, className }: RpbLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="RPB Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
