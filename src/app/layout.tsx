import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { TypographyH2 } from "@/ui/typography";


export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Itch.io Analytics",
  description: "Analyze your Itch.io Game Jam results and view jam statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-background antialiased ${poppins.className}`}>
        <>
          <header className="pt-8">
            <TypographyH2 text="Itch.io Analytics" />
          </header>
          <div className="grid place-content-center">
            <div className="max-w-3xl">{children}</div>
          </div>
        </>
      </body>
    </html>
  );
}
