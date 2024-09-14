import { getPaginatedJams } from "@/lib/db";
import Link from "next/link";

// export const revalidate = 60 * 60; // hourly
// export const dynamicParams = true;

// export async function generateStaticParams() {
//     return []
// }

export default async function Page({ params }: { params: { paginationCount: number } }) {
  const paginationCount = params.paginationCount;

  const data: { end: number; jams: {}[] } = await getPaginatedJams(paginationCount);
  const end = data?.end;

  return (
    <div>
      <div>
        {/* @ts-ignore */}
        {data ? (
          data["jams"].map((e, i) => {
            return (
              <>
                <p>Welcome to the Jams page!</p>
                <div className="mb-20" key={i}>
                  {JSON.stringify(e)}
                </div>
                <div>
                  {paginationCount == 0 ? (
                    <>
                      <div>0</div>
                      <Link href={"/jams/1"}>Go forward to {1}</Link>
                    </>
                  ) : paginationCount == end ? (
                    <>
                      <div>End</div>
                      <Link href={`/jams/${end - 1}`}>Go back to {end - 1}</Link>
                    </>
                  ) : (
                    <div>
                      <p>Between</p>
                      <Link href={`/jams/${paginationCount - 1}`}>
                        Go back to {paginationCount - 1}
                      </Link>
                      <Link href={`/jams/${paginationCount + 1}`}>
                        Go forward to {paginationCount + 1}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            );
          })
        ) : (
          <>An Error Occurred. 404.</>
        )}
      </div>
    </div>
  );
}
