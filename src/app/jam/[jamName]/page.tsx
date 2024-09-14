import { TypographyH1 } from "@/ui/typography";
import JamGraph from "@/ui/JamGraph";

import FAQ from "@/ui/faq";

import { JamGraphData } from "@/lib/types";
import { hour } from "@/lib/types";
import { getJamBySlug } from "@/lib/db";

export default async function Home({ params }: { params: { jamName: string } }) {
  const data = getJamBySlug(params.jamName);

  const prettyJamName = params.jamName.replaceAll("-", " ").replace("gmtk", "GMTK");
  const items = [
    {
      title: "When are statistics updated?",
      content: "They are updated every hour.",
    },
    {
      title: "What should I do to get more ratings?",
      content:
        "Increase your karma by commenting on other peoples games and rating them. Make sure to leave constructive feedback.",
    },
  ];

  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-between p-6 lg:p-12 gap-24">
      <div className="capitalize">
        <TypographyH1>
          <span className="font-normal text-neutral-950">Statistics of: </span>
          <span className="capitalize">{prettyJamName}&nbsp;</span>
          <span className="capitalize">Game Jam</span>
        </TypographyH1>
      </div>

      {data ? <>{JSON.stringify(data)}</> : <>Cannot fetch stuff</>}

      <FAQ items={items}></FAQ>
    </main>
  );
}
