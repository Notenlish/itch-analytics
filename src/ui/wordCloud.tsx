import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WordCloudData } from "@/lib/types";
import { cn } from "@/lib/utils";

const WordCloud = ({ data }: { data: WordCloudData }) => {
  return (
    <>
      {data ? (
        <Card className="p-4 flex flex-wrap justify-center gap-2">
          <CardHeader className="items-center pb-8">
            <CardTitle className="text-center">Common Words in Comments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-8">
            {data.map(({ word, count, size }, index) => (
              <span
                key={index}
                className={cn(
                  "inline-block font-semibold capitalize",
                  size === "large" && "text-2xl",
                  size === "medium" && "text-xl",
                  size === "small" && "text-lg"
                )}
                style={{
                  fontSize: `${Math.min(Math.max(count * 5, 10), 50)}px`,
                }}>
                {word}
              </span>
            ))}
          </CardContent>
        </Card>
      ) : (
        <></>
      )}
    </>
  );
};
export default WordCloud;
