import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const rules = (() => {
    try {
      return JSON.parse(process.env.BLOCK_RULES || "{}");
    } catch (e) {
      console.error("Failed to parse BLOCK_RULES", e);
      return {};
    }
  })();

  const method = req.method;

  // check if request matches ruleset.
  const shouldBlock = (() => {
    if (!rules || typeof rules !== "object") return false;

    // Check if any header matches a blocked value
    for (const [key, blockedValues] of Object.entries(rules.headers || {})) {
      const headerValue = req.headers.get(key) || "UNKNOWN";
      // console.log(
      //   `Key: ${key} -|- headerValue: ${headerValue} -|- blockedValues: ${blockedValues}`
      // );

      // @ts-ignore
      if (blockedValues.includes(headerValue)) return true;
    }

    if (req.ip && rules.ip_ranges) {
      // @ts-ignore
      if (rules.ip_ranges.some((range) => req.ip.startsWith(range.split(".")[0]))) {
        return true;
      }
    }

    return false;
  })();


  if (shouldBlock) {
    if (rules.method?.strict_block.includes(method)) {
      console.log("503 - Blocked");
      await delay(1000 + Math.random() * 2000);
      return NextResponse.json({ message: "Service Unavailable" }, { status: 503 });
    }

    if (rules.method?.delayed.includes(method)) {
      const randomChance = Math.random();

      if (randomChance < 0.3) {
        console.log("DELAYING");
        await delay(2000 + Math.random() * 3000);
        return NextResponse.next(); // Allow with delay
      } else if (randomChance < 0.5) {
        console.log("504 - Blocked");
        await delay(1000 + Math.random() * 2000);
        return NextResponse.json({ message: "Gateway Timeout" }, { status: 504 });
      } else if (randomChance < 0.7) {
        console.log("500 - Blocked");
        await delay(1000 + Math.random() * 2000);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
      } else {
        console.log("503 - Blocked");
        await delay(1000 + Math.random() * 2000);
        return NextResponse.json({ message: "Service Unavailable" }, { status: 503 });
      }
    }
  }

  return NextResponse.next();
}
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const config = {
  matcher: ["/", "/jam/:path*"],
};
