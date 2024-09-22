import { TypographyH1 } from "@/ui/typography";
import JamGraph from "@/ui/JamGraph";

import FAQ from "@/ui/faq";
import { JamGraphData } from "@/lib/types";
import { hour } from "@/lib/types";

// gotta move back to csr, smh
// I dont know what I'm doing with this ISR thing, next.js docs just told me to add these.
// invalidate page after 1 hour
export const revalidate = hour;
export const dynamicParams = true;

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

  const random = `${Math.random() * 100}${params.jamName}`;

  // why am I sending request to my server api though my ssr page :skull:
  // this is absolute url because this api is called from server, not client
  const link = `${process.env.BASE_URL}/api/getJamGame?ratelink=${rateLink}&entrieslink=${entriesLink}&jamname=${rawJamName}?random=${random}`;
  const response = await fetch(link, {
    // cant use both, revalidate or cache
    // no cache basically means cache
    cache: "no-cache",
    // next: { revalidate: hour },
  });

  const data: JamGraphData = await response.json();
  const jamData = data;

  const items = [
    {
      title: "How often are statistics updated?",
      content: "They are updated every hour.",
    },
    {
      title: "What should I do to get more ratings?",
      content:
        'Increase your "coolness" value by commenting on other peoples games and rating them.',
    },
  ];

  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-between p-6 lg:p-12 gap-24 px-12 sm:px-0">
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

      <p className="text-lg font-normal">
        Don&apos;t forget to check out{" "}
        <a className="text-blue-500 font-bold" href="https://discord.gg/AsQChfzBuF">
          Jamlytics
        </a>{" "}
        by Quinten too!
      </p>
    </main>
  );
}
