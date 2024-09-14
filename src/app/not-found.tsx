import { TypographyH2 } from "@/ui/typography";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="min-h-[80dvh] grid place-content-center">
      <TypographyH2>
        <span className="text-red-700">Resource not found. 404.</span>
      </TypographyH2>
      <Link
        className="bg-neutral-900 hover:bg-neutral-800 text-neutral-100 rounded-lg text-center py-4"
        href="/">
        Return Home
      </Link>
    </div>
  );
}
