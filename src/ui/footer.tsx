import Link from "next/link";
export default function Footer() {
  return (
    <footer className="text-center pt-6 pb-4">
      Made by{" "}
      <a
        className="text-amber-500 underline"
        target="_blank"
        rel="noopener noreferrer"
        href="https://notenlish.vercel.app/">
        Notenlish
      </a>
    </footer>
  );
}
