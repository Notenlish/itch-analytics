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
import { useState } from "react";
import JamGraph from "./JamGraph";

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
      jamRateLink: "https://itch.io/jam/gmtk-2024/rate/2913552",
    },
  });

  const [submitted, setSubmitted] = useState(false);
  const [jamData, setJamData] = useState([]);

  // https://itch.io/jam/gmtk-2024/rate/2913552
  // ->
  // https://itch.io/jam/gmtk-2024/entries
  function onSubmit(values: z.infer<typeof formSchema>) {
    const rateLink = values.jamRateLink;
    const index = rateLink.search("/rate/") as number;
    if (index == null) {
      alert(
        "Couldn't get jam link, make sure you uploaded the correct url.\n\nExample: https://itch.io/jam/gmtk-2024/rate/2913552"
      );
      return;
    }
    const base = rateLink.slice(0, index + 1);
    const entriesLink = base + "entries";

    // TODO: allow people to share their jam game urls n stuff

    const sendData = async () => {
      const link = `/api/getJamGame?ratelink=${rateLink}&entrieslink=${entriesLink}`;
      const response = await fetch(link);
      const data = await response.json()
      setJamData(data);
      setSubmitted(true);
      console.log(data["CdfPoints"])
    };
    sendData();
  }

  return (
    <div className="lg:min-w-80">
      {submitted ? (
        <>
          {/* @ts-ignore */}
          <JamGraph data={jamData} />
          <p>Your game</p>
        </>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="jamRateLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="xl:text-lg">
                    Enter your game's jam rating link:
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
      )}
    </div>
  );
}
