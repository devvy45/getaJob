import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("keeps the product focused on public jobs and talent", async () => {
  const [jobs, talent, talentClient] = await Promise.all([
    read("app/jobs/jobs-client.tsx"),
    read("app/talent/page.tsx"),
    read("app/talent/talent-client.tsx"),
  ]);

  assert.match(jobs, /Build your POW/);
  assert.match(talent, /\.eq\("is_published", true\)/);
  assert.match(talent, /\.eq\("is_discoverable", true\)/);
  assert.match(talentClient, /Open to work/);
  assert.match(talentClient, /Not looking/);
});

test("keeps public profiles readable and exportable", async () => {
  const [profile, api] = await Promise.all([
    read("app/p/[slug]/page.tsx"),
    read("app/api/talent/route.ts"),
  ]);

  assert.match(profile, /application\/ld\+json/);
  assert.match(profile, /https:\/\/schema\.org\/Person/);
  assert.match(api, /searchParams\.get\("format"\) === "csv"/);
  assert.match(api, /getajob-public-talent\.csv/);
});

test("does not keep the removed resume parser dependencies", async () => {
  const packageJson = await read("package.json");
  assert.doesNotMatch(packageJson, /mammoth|pdfjs-dist|react-loading-skeleton/);
});
