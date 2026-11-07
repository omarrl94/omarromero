import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="PawsMatch, inicio">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="pm-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff3d7f" />
            <stop offset="1" stopColor="#ff8a3d" />
          </linearGradient>
        </defs>
        <g fill="url(#pm-g)">
          <ellipse cx="6" cy="9" rx="2.2" ry="2.8" />
          <ellipse cx="10.2" cy="5.6" rx="2.2" ry="2.8" />
          <ellipse cx="14.6" cy="5.6" rx="2.2" ry="2.8" />
          <ellipse cx="18.6" cy="9" rx="2.2" ry="2.8" />
          <path d="M12.3 11.2c-3 0-6.3 4.4-6.3 6.8 0 2 1.7 2.6 3.2 2.6 1.3 0 2-.6 3.1-.6s1.8.6 3.1.6c1.5 0 3.2-.6 3.2-2.6 0-2.4-3.3-6.8-6.3-6.8z" />
        </g>
      </svg>
      <span>pawsmatch</span>
    </Link>
  );
}
