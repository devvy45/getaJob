import { fetchJobs } from "../../lib/jobs";
import JobsClient from "./jobs-client";

export default async function JobsPage() {
  const jobs = await fetchJobs();
  return <JobsClient jobs={jobs} />;
}
