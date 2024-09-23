import { Metadata, /* ResolvingMetadata */ } from "next";
import { poppins } from "./font";
import "./globals.css";
import { TypographyH2 } from "@/ui/typography";
import Footer from "@/ui/footer";
import { GoogleAnalytics } from "@next/third-parties/google";
import Link from "next/link";

export async function generateMetadata(parent: any): Promise<Metadata> {
  return {
    title: "Itch.io Analytics - Analyze Your Game's Jam Results",
    description: "Analyze your Itch.io Game Jam results and view jam statistics",
    verification: {
      google: "Gurmrqg74NHiG1yD0S6seTXKXN1R3bL7-aVK38bjBNk",
    },
    metadataBase: new URL(process.env.BASE_URL as string),
    alternates: { canonical: "/" },
    openGraph: {
      images: ["/og-thumbnail.webp"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleAnalytics gaId="G-08BE4C6F4F" />
      <body className={`min-h-screen bg-background antialiased ${poppins.className}`}>
        <>
          <header className="pt-8">
            <Link className="hover:underline" href="/">
              <TypographyH2>
                <span className="normal-case">Itch.io Analytics</span>
              </TypographyH2>
            </Link>
          </header>
          <div className="grid place-content-center">
            <div className="max-w-4xl">{children}</div>
            <Footer />
          </div>
        </>
      </body>
    </html>
  );
}
