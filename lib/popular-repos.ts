export interface PopularRepo {
  owner: string;
  repo: string;
  label: string;
  description: string;
  language: string;
  stars: string;
  /** Accent colour for the chip / card */
  color: string;
}

export const POPULAR_REPOS: PopularRepo[] = [
  {
    owner: "facebook",
    repo: "react",
    label: "React",
    description: "The library for web and native user interfaces",
    language: "TypeScript",
    stars: "230k",
    color: "#61dafb",
  },
  {
    owner: "vercel",
    repo: "swr",
    label: "SWR",
    description: "React Hooks for Data Fetching by Vercel",
    language: "TypeScript",
    stars: "31k",
    color: "#a8a8a8",
  },
  {
    owner: "supabase",
    repo: "supabase",
    label: "Supabase",
    description: "Open-source Firebase alternative with Postgres",
    language: "TypeScript",
    stars: "76k",
    color: "#3ecf8e",
  },
  {
    owner: "langchain-ai",
    repo: "langchain",
    label: "LangChain",
    description: "Build LLM-powered applications in Python",
    language: "Python",
    stars: "98k",
    color: "#1c7ed6",
  },
  {
    owner: "nestjs",
    repo: "nest",
    label: "NestJS",
    description: "Progressive Node.js framework for scalable servers",
    language: "TypeScript",
    stars: "68k",
    color: "#e0234e",
  },
  {
    owner: "tailwindlabs",
    repo: "tailwindcss",
    label: "Tailwind CSS",
    description: "Utility-first CSS framework",
    language: "JavaScript",
    stars: "85k",
    color: "#38bdf8",
  },
  {
    owner: "shadcn-ui",
    repo: "ui",
    label: "shadcn/ui",
    description: "Re-usable components built with Radix UI & Tailwind",
    language: "TypeScript",
    stars: "75k",
    color: "#c084fc",
  },
  {
    owner: "trpc",
    repo: "trpc",
    label: "tRPC",
    description: "End-to-end type-safe APIs without code generation",
    language: "TypeScript",
    stars: "35k",
    color: "#398ccb",
  },
  {
    owner: "prisma",
    repo: "prisma",
    label: "Prisma",
    description: "Next-generation ORM for Node.js & TypeScript",
    language: "TypeScript",
    stars: "40k",
    color: "#5a67d8",
  },
  {
    owner: "microsoft",
    repo: "TypeScript",
    label: "TypeScript",
    description: "JavaScript with syntax for types — the language itself",
    language: "TypeScript",
    stars: "102k",
    color: "#3178c6",
  },
];

/** Returns the full GitHub URL for a popular repo entry. */
export function repoUrl(r: PopularRepo): string {
  return `https://github.com/${r.owner}/${r.repo}`;
}
