"use client";

import { TypographyH1 } from "@/ui/typography";
import JamGraph from "@/ui/JamGraph";

import FAQ from "@/ui/faq";
import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import { JamGraphData } from "@/lib/types";

export default function Home({ params }: { params: { jamName: string } }) {
  const prettyJamName = params.jamName.replaceAll("-", " ").replace("gmtk", "GMTK");

  const searchParams = useSearchParams();
  const rateLink = searchParams.get("ratelink") || null;
  const entriesLink = searchParams.get("entrieslink") || null;

  const [submitted, setSubmitted] = useState(false);
  const [jamData, setJamData] = useState({} as JamGraphData);
  useEffect(() => {
    const doStuff = async () => {
      const link = `/api/getJamGame?ratelink=${rateLink}&entrieslink=${entriesLink}`;
      const response = await fetch(link);
      const data: JamGraphData = await response.json();
      setJamData(data);
      setSubmitted(true);
    };
    doStuff();
  }, []);

  return (
    <main className="flex min-h-[90vh] flex-col items-center justify-between p-12 gap-24">
      <div className="capitalize">
        {submitted ? (
          <TypographyH1
            text={`Results of: "${jamData.ratedGame.game?.title}" in ${prettyJamName}`}
          />
        ) : (
          <TypographyH1 text={`Your Game results in ${prettyJamName}`} />
        )}
      </div>

      {submitted ? (
        <div className="lg:w-[80%]">
          {/* @ts-ignore */}
          <JamGraph data={jamData} />
        </div>
      ) : (
        <div className="h-[80vh] grid place-content-start">
          <div className="font-bold">Loading...</div>
        </div>
      )}
    </main>
  );
}
