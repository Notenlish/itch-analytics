import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TypographyH1 } from "@/ui/typography";
import GameForm from "@/ui/gameForm";
import JamGraph from "@/ui/JamGraph";

import FAQ from "@/ui/faq";

export default function Home() {
  const items = [
    {
      title: "Is this affiliated with Itch.io?",
      content:
        "No. This site is not affiliated with itch.io in any way. This site simply scrapes itch.io gamejam data and presents it in a simple format",
    },
    {
      title: "How often Game jam statistics are updated?",
      content: "IDK. I have yet to implement gamejam statistics",
    },
    {
      title: "How reliable is the data",
      content:
        "The data this website scrapes is what itch.io uses for rendering the jam entries. It is not 100% up-to-date and may contain inaccuracies.",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 gap-24">
      <TypographyH1 text="Analyze Your GameJam Score for Itch.io" />
      <GameForm />

      <FAQ items={items} />
    </main>
  );
}
