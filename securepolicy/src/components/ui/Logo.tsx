"use client";
import Link from "next/link";

const SIZES = {
  sm: { shield: 22, text: "text-sm" },
  md: { shield: 26, text: "text-base" },
  lg: { shield: 32, text: "text-xl" },
};

function ShieldIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield background */}
      <path
        d="M16 2L4 7V16C4 22.6 9.2 28.8 16 30C22.8 28.8 28 22.6 28 16V7L16 2Z"
        fill="#2563EB"
      />
      {/* Inner shield outline */}
      <path
        d="M16 5.5L7 9.5V16C7 21 11.2 25.8 16 27C20.8 25.8 25 21 25 16V9.5L16 5.5Z"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Checkmark */}
      <path
        d="M11.5 16L14.5 19L20.5 13"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = SIZES[size];

  return (
    <Link href="/" className="flex items-center gap-2">
      <ShieldIcon size={s.shield} />
      <span className={`${s.text} font-bold tracking-tight text-gray-900`}>
        Secure<span className="text-blue-600">Pilot</span>
      </span>
    </Link>
  );
}
