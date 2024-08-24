import Link from "next/link";
export default function Footer() {
  return (
    <footer className="text-center pt-6 pb-4 text-lg">
      Made by{" "}
      <a
        className="text-amber-500 font-semibold"
        target="_blank"
        rel="noopener noreferrer"
        href="https://notenlish.vercel.app/">
        Notenlish
      </a>
    </footer>
  );
}
