type AutoLogoProps = {
  className?: string;
};

export function AutoLogo({ className = "h-10 w-10" }: AutoLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="18" fill="#17171C" />
      <path
        d="M18.5 47.5 31.7 16.5 45.5 47.5"
        fill="none"
        stroke="#FCFCFB"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M25 37.2h16"
        fill="none"
        stroke="#FCFCFB"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M41.5 20.2c5.9.4 9.1 3.2 9.1 7.3 0 4.7-4.1 7.6-10.5 7.6H34"
        fill="none"
        stroke="#00C4CC"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <circle cx="48.8" cy="27.6" r="4.2" fill="#8B3DFF" />
      <circle cx="17" cy="48" r="3.6" fill="#FFD43B" />
    </svg>
  );
}
