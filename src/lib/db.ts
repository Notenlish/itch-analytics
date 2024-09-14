import { unstable_cache as cache } from "next/cache";
import { hour } from "./types";

const KEY = process.env.API_SECRET_KEY;
const VPS_IP = process.env.VPS_IP;

async function _getPaginatedJams(i: number) {
  const data = JSON.stringify({ key: KEY, i: i });
  const response = await fetch(`${VPS_IP}/api/get-jams/`, { method: "POST", body: data });
  return response.ok ? await response.json() : null;
}

export const getPaginatedJams = cache(
  (i: number) => _getPaginatedJams(i),
  ["PLZgetPaginatedJams"],
  {
    revalidate: hour * 2,
  }
);

async function _getJamBySlug(slug: string) {
  const data = JSON.stringify({ key: KEY, slug: slug });
  const response = await fetch(`${VPS_IP}/api/get-jam-by-slug/`, {
    method: "POST",
    body: data,
  });
  return response.ok ? await response.json() : null;
}

export const getJamBySlug = cache((slug) => _getJamBySlug(slug), ["GetJamBySlug"], {
  revalidate: hour,
});

async function _getJamSubmissionBySlug(jamSlug: string, gameSlug: string) {
  const data = JSON.stringify({ key: KEY, jamSlug: jamSlug, gameSlug: gameSlug });
  const response = await fetch(`${VPS_IP}/api/get-jam-submission-by-slug`, {
    method: "POST",
    body: data,
  });
  return response.ok ? await response.json() : null;
}

export const getJamSubmissionSlug = cache(
  (jamSlug, gameSlug) => _getJamSubmissionBySlug(jamSlug, gameSlug),
  ["GetJamSubmissionSlug"],
  { revalidate: hour }
);
