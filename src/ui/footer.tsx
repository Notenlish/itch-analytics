import Image from "next/image";
import Link from "next/link";
import githubSVG from "@/../public/github.svg";

export default function Footer() {
  return (
    <footer className="text-center pt-6 pb-4 text-lg flex gap-2 items-center justify-center">
      Made by{" "}
      <a
        className="text-amber-500 font-semibold"
        target="_blank"
        rel="noopener noreferrer"
        href="https://notenlish.vercel.app/">
        Notenlish
      </a>{" "}
      -{" "}
      <span className="text-lg font-normal">
        You can check out{" "}
        <a className="text-green-600 font-bold" href="https://discord.gg/AsQChfzBuF">
          Jamlytics
        </a>{" "}
        by Quinten too!
      </span>
      <span> - </span>
      <span>
        <a
          className="opacity-100 hover:opacity-60"
          href="https://github.com/Notenlish/itch-analytics"
          target="_blank">
          <Image className="inline-block size-8" src={githubSVG} alt="github"></Image>
        </a>
      </span>
    </footer>
  );
}
