"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Button, Card, CardBody, Checkbox, Input, Pagination } from "@heroui/react";

type FilterOption = {
  id: string;
  label: string;
  count: number;
};

type JobsFacets = {
  categories: FilterOption[];
  jobTypes: FilterOption[];
  countries: FilterOption[];
  postedDates: FilterOption[];
  stages: FilterOption[];
  sizes: FilterOption[];
};

type JobListItem = {
  id: string;
  company: string;
  title: string;
  location: string;
  remote: boolean;
  jobType: string;
  postedAt: string | null;
  applyUrl: string;
};

type JobsApiResponse = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  jobs: JobListItem[];
  facets: JobsFacets;
};

const PAGE_SIZE = 40;

const EMPTY_FACETS: JobsFacets = {
  categories: [],
  jobTypes: [],
  countries: [],
  postedDates: [],
  stages: [],
  sizes: [],
};

function toAbcLabel(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized
    .split(/(\s+|-|\/)/)
    .map((token) => {
      if (!token.trim() || token === "-" || token === "/") return token;
      const lower = token.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function formatPostedDate(input: string | null): string {
  if (!input) return "date unavailable";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "date unavailable";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FilterDropdown({
  id,
  title,
  options,
  selected,
  onToggle,
  openFilter,
  setOpenFilter,
}: {
  id: string;
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  openFilter: string | null;
  setOpenFilter: Dispatch<SetStateAction<string | null>>;
}) {
  const isOpen = openFilter === id;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setOpenFilter((current) => (current === id ? null : current));
    }, 140);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpenFilter(id);
      }}
      onMouseLeave={scheduleClose}
    >
      <Button
        radius="full"
        variant={selected.length > 0 || isOpen ? "solid" : "bordered"}
        onPress={() => {
          cancelClose();
          setOpenFilter((current) => (current === id ? null : id));
        }}
        className={
          selected.length > 0 || isOpen
            ? "bg-[#0f1115] px-4 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#ece7df]"
            : "border-black/20 bg-[#d7cec6] px-4 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#0f1115]"
        }
      >
        {title}
        {selected.length > 0 ? ` (${selected.length})` : ""}
      </Button>

      {isOpen ? (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-[280px] sm:w-[340px] max-w-[calc(100vw-2.5rem)] rounded-[0.8rem] border border-black/20 bg-[#d9d0c8] p-3 shadow-[0_18px_45px_-24px_rgba(18,20,23,0.35)]"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="max-h-64 overflow-auto pr-1 flex flex-col">
            {options.length === 0 ? (
              <p className="text-sm text-black/60">No Options</p>
            ) : (
              options.map((option) => (
                <Checkbox
                  key={option.id}
                  size="sm"
                  isSelected={selected.includes(option.id)}
                  onValueChange={() => onToggle(option.id)}
                  className="w-full"
                  classNames={{
                    base: "w-full py-1.5 max-w-none",
                    label:
                      "font-mono text-sm leading-6 tracking-[0.01em] text-black/80",
                  }}
                >
                  {option.label} ({option.count})
                </Checkbox>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TogglePill({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-full border border-black/20 bg-[#d7cec6] px-4 py-1.5">
      <Checkbox
        size="sm"
        isSelected={selected}
        onValueChange={onChange}
        classNames={{
          label:
            "font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#0f1115]",
        }}
      >
        {label}
      </Checkbox>
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [facets, setFacets] = useState<JobsFacets>(EMPTY_FACETS);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDateBuckets, setSelectedDateBuckets] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    const controller = new AbortController();
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        const q = deferredSearch.trim();
        if (q) params.set("q", q);
        params.set("page", String(page));
        params.set("pageSize", String(PAGE_SIZE));
        if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
        if (selectedJobTypes.length > 0) params.set("jobTypes", selectedJobTypes.join(","));
        if (selectedCountries.length > 0) params.set("countries", selectedCountries.join(","));
        if (selectedDateBuckets.length > 0)
          params.set("postedDates", selectedDateBuckets.join(","));
        if (selectedStages.length > 0) params.set("stages", selectedStages.join(","));
        if (selectedSizes.length > 0) params.set("sizes", selectedSizes.join(","));
        if (remoteOnly) params.set("remoteOnly", "1");

        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("failed_to_fetch_jobs");

        const payload = (await response.json()) as JobsApiResponse;
        setJobs(Array.isArray(payload.jobs) ? payload.jobs : []);
        setFacets(payload.facets || EMPTY_FACETS);
        setTotal(payload.total || 0);
        setTotalPages(payload.totalPages || 1);
        if (payload.page && payload.page !== page) setPage(payload.page);
      } catch (error) {
        if (controller.signal.aborted) return;
        setJobs([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchJobs();
    return () => controller.abort();
  }, [
    deferredSearch,
    page,
    remoteOnly,
    selectedCategories,
    selectedCountries,
    selectedDateBuckets,
    selectedJobTypes,
    selectedSizes,
    selectedStages,
  ]);

  function toggleListValue(value: string, setter: Dispatch<SetStateAction<string[]>>) {
    setPage(1);
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  function resetAllFilters() {
    setPage(1);
    setSelectedCategories([]);
    setSelectedJobTypes([]);
    setSelectedCountries([]);
    setSelectedDateBuckets([]);
    setSelectedStages([]);
    setSelectedSizes([]);
    setRemoteOnly(false);
  }

  const startIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = total === 0 ? 0 : Math.min((page - 1) * PAGE_SIZE + jobs.length, total);

  return (
    <main className="min-h-screen bg-[#d7cec6] text-[#0f1115]">
      <section className="sticky top-0 z-20 border-b border-black/10 bg-[rgba(215,206,198,0.92)] px-5 py-5 backdrop-blur-xl sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-full border border-black/22 px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-black/55">
              {total} live roles
            </div>

            <Button
              as={Link}
              href="/"
              radius="full"
              variant="bordered"
              className="border-black/20 bg-[#d7cec6] px-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#0f1115]"
            >
              back home
            </Button>
          </div>

          <Input
            size="lg"
            radius="lg"
            value={search}
            onValueChange={(next) => {
              setPage(1);
              setSearch(next);
            }}
            placeholder="search company, role, location, or category"
            className="w-full"
            classNames={{
              inputWrapper:
                "h-16 border border-black/18 bg-[#d9d0c8] px-4 shadow-none data-[hover=true]:bg-[#d9d0c8] data-[focus=true]:bg-[#d9d0c8] group-data-[focus=true]:bg-[#d9d0c8]",
              input:
                "font-mono text-sm text-[#0f1115] placeholder:text-black/40",
            }}
            endContent={
              <button
                type="button"
                className="flex h-10 shrink-0 items-center justify-center rounded-md bg-[#0f1115] px-5 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#ece7df] transition-opacity hover:opacity-80"
              >
                search
              </button>
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              id="category"
              title="Category"
              options={facets.categories}
              selected={selectedCategories}
              onToggle={(value) => toggleListValue(value, setSelectedCategories)}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterDropdown
              id="job_type"
              title="Job Type"
              options={facets.jobTypes}
              selected={selectedJobTypes}
              onToggle={(value) => toggleListValue(value, setSelectedJobTypes)}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterDropdown
              id="country"
              title="Country"
              options={facets.countries}
              selected={selectedCountries}
              onToggle={(value) => toggleListValue(value, setSelectedCountries)}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterDropdown
              id="posted_date"
              title="Posted Date"
              options={facets.postedDates}
              selected={selectedDateBuckets}
              onToggle={(value) => toggleListValue(value, setSelectedDateBuckets)}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterDropdown
              id="company_size"
              title="Company Size"
              options={facets.sizes}
              selected={selectedSizes}
              onToggle={(value) => toggleListValue(value, setSelectedSizes)}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <TogglePill
              label="Remote Only"
              selected={remoteOnly}
              onChange={(next) => {
                setPage(1);
                setRemoteOnly(next);
              }}
            />
            <Button
              radius="full"
              variant="bordered"
              onPress={resetAllFilters}
              className="border-black/20 bg-[#d7cec6] px-4 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#0f1115]"
            >
              clear filters
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        {!isLoading && total === 0 ? (
          <div className="rounded-[1.1rem] border border-black/10 bg-[#d9d0c8] p-8">
            <p className="font-mono text-sm uppercase tracking-[0.06em] text-black/50">
              nothing matches that search right now. try broadening filters.
            </p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[1.1rem] border border-black/10 bg-[#d9d0c8] p-8">
            <p className="font-mono text-sm uppercase tracking-[0.06em] text-black/50">
              loading live roles...
            </p>
          </div>
        ) : null}

        {!isLoading && total > 0 ? (
          <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[0.9rem] border border-black/10 bg-[#d9d0c8] px-4 py-3">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-black/50">
                showing {startIndex}-{endIndex} of {total}
              </p>
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                size="sm"
                showControls
                classNames={{ cursor: "bg-[#0f1115] text-[#ece7df]" }}
              />
            </div>

            {jobs.map((job) => (
              <Card
                key={job.id}
                className="rounded-[0.9rem] border border-black/8 bg-[#d9d0c8] shadow-none transition-transform duration-300 hover:-translate-y-1"
              >
                <CardBody className="gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-[family-name:var(--font-instrument-serif)] text-xl font-bold tracking-[-0.02em] text-[#0f1115]">
                        {job.title}
                      </h3>
                    </div>

                    <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-black/50">
                      {job.company}  •  {job.location}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-black/55">
                      <span className="rounded-full border border-black/20 px-3 py-1">
                        {toAbcLabel(job.jobType)}
                      </span>
                      <span className="rounded-full border border-black/20 px-3 py-1">
                        posted {formatPostedDate(job.postedAt)}
                      </span>
                      <span className="rounded-full border border-black/20 px-3 py-1">
                        {job.remote ? "remote-friendly" : "location-based"}
                      </span>
                    </div>
                  </div>

                  <Button
                    as="a"
                    href={job.applyUrl}
                    target="_blank"
                    rel="noreferrer"
                    radius="none"
                    className="mt-4 sm:mt-0 w-full sm:w-auto h-11 bg-[#0f1115] px-6 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#ece7df]"
                  >
                    apply now
                  </Button>
                </CardBody>
              </Card>
            ))}

            <div className="flex justify-center pt-2">
              <Pagination
                total={totalPages}
                page={page}
                onChange={setPage}
                showControls
                classNames={{ cursor: "bg-[#0f1115] text-[#ece7df]" }}
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
