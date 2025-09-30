import { TypographyH1 } from "@/ui/typography";
import GameForm from "@/ui/gameForm";

import FAQ from "@/ui/faq";

export default function Home() {
  const items = [
    {
      title: "Is this website safe?",
      content:
        "This website scrapes public data available on itch.io for everyone. It's safe.",
    },
    {
      title: "Is this affiliated with Itch.io?",
      content:
        "No. This site is not affiliated with itch.io in any way. This site simply scrapes itch.io gamejam data and presents it in a simple format",
    },
    {
      title: "How often Game jam statistics are updated?",
      content: "Statistics are updated every hour.",
    },
    {
      title: "How reliable is the data?",
      content:
        "The data this website scrapes is what itch.io uses for rendering the jam entries. It is not 100% up-to-date and may contain inaccuracies.",
    },
    {
      title: "Is this for profit?",
      content:
        "I don't make money from it. If this project grows and I need to buy hosting, I might consider adding a donation box so that I can keep the website up.",
    },
  ];

  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-between p-12 gap-24">
      <div className="relative">
        <TypographyH1>Analyze Your GameJam Score for Itch.io</TypographyH1>
      </div>
      <GameForm />

      <FAQ items={items} />
      <div className="block">
        New domain is at <a className="bold text-orange-400 underline" href="https://itchanalytics.pages.dev/">Itchanalytics.pages.dev</a>
      </div>
    </main>
  );
}
