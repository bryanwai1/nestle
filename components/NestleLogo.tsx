interface NestleLogoProps {
  size?: number;
  className?: string;
}

export default function NestleLogo({ size = 36, className = "" }: NestleLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nestlé logo"
      className={className}
    >
      <rect width="36" height="36" rx="8" fill="white" />
      {/* Nest base — outer ellipse */}
      <ellipse cx="18" cy="23" rx="10" ry="5" stroke="#E2001A" strokeWidth="1.8" fill="none" />
      {/* Nest base — inner ellipse */}
      <ellipse cx="18" cy="23" rx="6.5" ry="3.2" stroke="#E2001A" strokeWidth="1.4" fill="none" />
      {/* Mother bird body */}
      <circle cx="18" cy="13.5" r="3.2" fill="#E2001A" />
      {/* Mother bird beak / wing */}
      <path d="M18 10.3C18 10.3 20.5 8 22 9" stroke="#E2001A" strokeWidth="1.4" strokeLinecap="round" />
      {/* Three chicks */}
      <circle cx="14.5" cy="19.5" r="1.8" fill="#E2001A" />
      <circle cx="18"   cy="19"   r="1.8" fill="#E2001A" />
      <circle cx="21.5" cy="19.5" r="1.8" fill="#E2001A" />
    </svg>
  );
}
