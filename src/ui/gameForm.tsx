"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

let defaultJamRateLink: string | undefined = undefined;
if (process.env.NEXT_PUBLIC_IS_DEV) {
  // https://itch.io/jam/godot-wild-jam-72/rate/2902486
  defaultJamRateLink = "https://itch.io/jam/gmtk-2024/rate/2913552";
}

// example rate url: https://itch.io/jam/gmtk-2024/rate/2913552
const formSchema = z.object({
  jamRateLink: z
    .string()
    .url()
    .startsWith("https://itch.io/jam/", {
      message: "Url must be: https://itch.io/jam/JAM_NAME/rate/GAME_ID",
    })
    .includes("/rate/", { message: "Your URL must include /rate/GAME_ID" })
    .min(2)
    .max(80),
});

export default function GameForm() {
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jamRateLink: defaultJamRateLink,
    },
  });

  // https://itch.io/jam/gmtk-2024/rate/2913552
  // ->
  // https://itch.io/jam/gmtk-2024/entries
  function onSubmit(values: z.infer<typeof formSchema>) {
    // clean the ? part
    const rateLink = values.jamRateLink.split("?")[0];

    const index = rateLink.search("/rate/") as number;
    if (index == null) {
      alert(
        "Couldn't get jam link, make sure you uploaded the correct url.\n\nExample: https://itch.io/jam/gmtk-2024/rate/2913552"
      );
      return;
    }
    // console.log(rateLink);
    const base = rateLink.slice(0, index + 1);
    // console.log(base);
    const entriesLink = base + "entries";
    // console.log(base, entriesLink, rateLink);
    const jamName = base.replace("https://itch.io/jam/", "");
    if (entriesLink == null || rateLink == null) {
      alert(
        "Error! Couldn't parse link. Please make sure your url is like this: https://itch.io/jam/gmtk-2024/rate/2913552"
      );
      return;
    }
    const sendData = async () => {
      router.push(`/${jamName}?ratelink=${rateLink}&entrieslink=${entriesLink}`);
    };
    sendData();
  }
  const router = useRouter();

  return (
    <div className="lg:min-w-80">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="jamRateLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="xl:text-lg">
                  Enter your game&apos;s jam rating link:
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://itch.io/jam/gmtk-2024/rate/2913552"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  );
}
