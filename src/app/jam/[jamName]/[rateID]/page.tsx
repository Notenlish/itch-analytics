import { TypographyH1 } from "@/ui/typography";
import JamGraph from "@/ui/JamGraph";

import FAQ from "@/ui/faq";
import { JamGraphData } from "@/lib/types";
import { hour } from "@/lib/types";

export default async function Home({
  params,
}: {
  params: { jamName: string; rateID: string };
}) {
  // gmtk-2024
  params.jamName;

  const prettyJamName = params.jamName.replaceAll("-", " ").replace("gmtk", "GMTK");
  const rateID = Number.parseInt(params.rateID);

  // https://itch.io/jam/gmtk-2024/rate/2911865
  const rateLink = `https://itch.io/jam/${params.jamName}/rate/${rateID}`;

  // https://itch.io/jam/gmtk-2024/entries
  const entriesLink = `https://itch.io/jam/${params.jamName}/entries`;
  // gmtk-2024/
  const rawJamName = params.jamName;

  // why am I sending request to my api though my server :sobbing:
  // this is absolute because this api is called from server, not client
  const link = `${process.env.BASE_URL}/api/getJamGame?ratelink=${rateLink}&entrieslink=${entriesLink}&jamname=${rawJamName}`;
  const response = await fetch(link, {
    // cant use both, revalidate 
    // cache: "force-cache",
    next: { revalidate: hour },
  });

  const data: JamGraphData = await response.json();
  const jamData = data;

  const items = [
    {
      title: "When are statistics updated?",
      content: "They are updated every hour.",
    },
    {
      title: "What should I do to get more ratings?",
      content:
        'Increase your "coolness" value by commenting on other peoples games and rating them.',
    },
  ];

  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-between p-6 lg:p-12 gap-24">
      <div className="capitalize">
        <TypographyH1>
          <span className="font-normal text-neutral-950">Results of: </span>
          {jamData.ratedGame.game?.title}
          <span className="font-normal text-neutral-950"> in</span>{" "}
          <span className="capitalize">{prettyJamName}</span>
        </TypographyH1>
      </div>

      <div className="lg:w-[80%]">
        {/* @ts-ignore */}
        <JamGraph data={jamData} />
      </div>

      <FAQ items={items}></FAQ>
    </main>
  );
}
