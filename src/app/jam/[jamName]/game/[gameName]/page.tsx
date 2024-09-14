import { TypographyH1 } from "@/ui/typography";
import { getJamSubmissionSlug } from "@/lib/db";

export default async function Page({
  params,
}: {
  params: { jamName: string; gameName: string };
}) {
  const prettyGameName = params.gameName.replaceAll("-", " ");
  const prettyJamName = params.jamName.replaceAll("-", " ");
  const data = await getJamSubmissionSlug(params.jamName, params.gameName);

  return (
    <div>
      <TypographyH1>
        <span>
          Statistics about your game {prettyGameName} in {prettyJamName}
        </span>
      </TypographyH1>
      <div>{data ? <>{JSON.stringify(data)}</> : <>Couldn't fetch data.</>}</div>
    </div>
  );
}
