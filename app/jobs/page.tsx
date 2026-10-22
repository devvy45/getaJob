import { fetchJobs } from "../../lib/jobs";
import JobsClient from "./jobs-client";

export default function JobsPage() {
  // Not awaited: the page shell renders immediately and the board streams in.
  return <JobsClient jobs={fetchJobs()} />;
}
