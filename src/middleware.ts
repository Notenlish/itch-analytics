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

  const headers = Object.fromEntries(req.headers);

  const method = req.method;

  // check if request matches ruleset.
  const shouldBlock = (() => {
    if (!rules || typeof rules !== "object") return false;

    // Check if any header matches a blocked value
    for (const [key, blockedValues] of Object.entries(rules.headers || {})) {
      const headerValue = req.headers.get(key) || "UNKNOWN";
      console.log(
        `Key: ${key} -|- headerValue: ${headerValue} -|- blockedValues: ${blockedValues}`
      );
      // @ts-ignore
      if (blockedValues.includes(headerValue)) return true;
    }

    // Check if IP is in the blocked range
    if (req.ip && rules.ip_ranges) {
      // @ts-ignore
      if (rules.ip_ranges.some((range) => req.ip.startsWith(range.split(".")[0]))) {
        return true;
      }
    }

    return false;
  })();

  // console.log("shouldBlock:", shouldBlock);

  if (shouldBlock) {
    if (rules.method?.strict_block.includes(method)) {
      // Strict block for POST, PUT, DELETE → Return 503
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
// @ts-ignore
function matchesRules(requestData, ruleSet) {
  return Object.keys(ruleSet).some((key) => {
    // @ts-ignore
    return ruleSet[key].some((value) =>
      requestData[key]?.toLowerCase().includes(value.toLowerCase())
    );
  });
}

// @ts-ignore
function matchesIP(ip, blockedRanges) {
  if (!ip) return false;
  // @ts-ignore
  return blockedRanges.some((range) => ip.startsWith(range.split(".")[0]));
}

// @ts-ignore
function matchesCookies(req, blockedCookies) {
  const cookieHeader = req.headers.get("cookie") || "";
  // @ts-ignore
  return blockedCookies.some((cookie) => cookieHeader.includes(cookie));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const config = {
  matcher: ["/", "/jam/:path*"],
};
