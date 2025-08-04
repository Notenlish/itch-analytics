import { TypographyH1 } from "@/ui/typography";
import JamGraph from "@/ui/JamGraph";

import FAQ from "@/ui/faq";
import { JamGraphData } from "@/lib/types";
import { hour } from "@/lib/types";
import { Metadata /* ResolvingMetadata */ } from "next";

// gotta move back to csr, smh
// I dont know what I'm doing with this ISR thing, next.js docs just told me to add these.
// invalidate page after 1 hour

export const revalidate = hour;
export const dynamicParams = true;

const prettifyJamName = (text: string) =>
  text.replaceAll("-", " ").replace("gmtk", "GMTK");

type PageProps = {
  params: { jamName: string; rateID: string };
};

// cant do the dynamic title and descrpition, I'd need to fetch the game page from api(and api has to fetch it) or store in db but a game may not be found in the db
// So best solution is to just not care, its not like im losing out on billions of seo ad revenue lol

export async function generateMetadata(
  { params }: PageProps,
  parent: any,
): Promise<Metadata> {
  return {
    alternates: { canonical: `/${params.jamName}/${params.rateID}` },
  };
}

export default async function Home({ params }: PageProps) {
  // gmtk-2024
  params.jamName;

  const prettyJamName = prettifyJamName(params.jamName);
  const rateID = Number.parseInt(params.rateID);

  // https://itch.io/jam/gmtk-2024/rate/2911865
  const rateLink = `https://itch.io/jam/${params.jamName}/rate/${rateID}`;

  // https://itch.io/jam/gmtk-2024/entries
  const entriesLink = `https://itch.io/jam/${params.jamName}/entries`;
  // gmtk-2024/
  const rawJamName = params.jamName;

  const random = `${Math.random() * 10000}`;

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
      content: "They are updated every half hour.",
    },
    {
      title: "What should I do to get more ratings?",
      content:
        'Increase your "coolness" value by commenting on other peoples games and rating them.',
    },
    {
      title: "How is coolness and karma calculated?",
      content:
        "Coolness is calculated with: max(votes_given - disqualified_votes) of each contributor related to the project. karma is calculated with: log(1 + coolness) - (log(1 + votes_received) / log(5)) source: https://itch.io/t/4046566/what-exactly-is-karma-coolness-in-gamejams",
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
        <div className="mb-8 p-6 max-w-2xl rounded-lg bg-gradient-to-br from-orange-100 to-orange-200  border border-orange-400">
          <p>
            ⚠️ Generated this analysis on{" "}
            {new Date(data.dateProcessed).toLocaleString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZoneName: "long",
            })}
            . Data is updated every half hour.
          </p>
        </div>

        {/* @ts-ignore */}
        <JamGraph data={jamData} />
      </div>

      <FAQ items={items}></FAQ>

      <div className="text-lg">
        Gaza is starving in the genocide, you can donate to help them here:{" "}
        <a
          className=" inline text-blue-500 font-bold"
          href="https://www.islamic-relief.org.uk/giving/appeals/palestine/"
        >
          Donate To Gaza
        </a>
      </div>
    </main>
  );
}
