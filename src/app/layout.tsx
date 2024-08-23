import type { Metadata } from "next";
import { poppins } from "./font";
import "./globals.css";
import { TypographyH2 } from "@/ui/typography";
import Footer from "@/ui/footer";

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
            <Footer />
          </div>
        </>
      </body>
    </html>
  );
}
