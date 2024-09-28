import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-20 text-black">
      <h2>Not Found 💀</h2>
      <p>Could not find requested resource</p>
      <Link className="underline" href="/">
        Return Home
      </Link>
    </div>
  );
}
