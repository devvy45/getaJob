/**
 * getajob — Google Sheets jobs API
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment → Web app
 * Execute as: Me | Who has access: Anyone
 */

var SHEET_NAME = "Jobs";
var DEFAULT_TTL_DAYS = 10;

var HEADER_MAP = {
  id: "id",
  person_name: "personName",
  person_headline: "personHeadline",
  company: "company",
  role: "role",
  category: "category",
  location: "location",
  excerpt: "excerpt",
  published_at: "publishedAt",
  expires_at: "expiresAt",
  source_url: "sourceUrl",
  initials: "initials",
  accent: "accent",
  active: "active",
};

function doGet() {
  var jobs = getActiveJobs_();
  var payload = {
    jobs: jobs,
    updatedAt: new Date().toISOString(),
  };

  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getActiveJobs_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Missing sheet named "' + SHEET_NAME + '".');
  }

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  var headers = values[0].map(normalizeHeader_);
  var today = startOfDay_(new Date());

  return values.slice(1).reduce(function (jobs, row) {
    var job = rowToJob_(headers, row);
    if (!job || !job.id) {
      return jobs;
    }
    if (!isTruthy_(job.active)) {
      return jobs;
    }
    if (isExpired_(job, today)) {
      return jobs;
    }

    delete job.active;
    jobs.push(job);
    return jobs;
  }, []);
}

function rowToJob_(headers, row) {
  var job = {};

  for (var i = 0; i < headers.length; i++) {
    var header = headers[i];
    if (!header) {
      continue;
    }

    var field = HEADER_MAP[header];
    if (!field) {
      continue;
    }

    job[field] = normalizeCell_(row[i], field);
  }

  return job;
}

function normalizeHeader_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeCell_(value, field) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (field === "active") {
    return value;
  }

  if (field === "publishedAt" || field === "expiresAt") {
    if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
      return formatDate_(value);
    }
    return String(value).trim();
  }

  return String(value).trim();
}

function formatDate_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function isTruthy_(value) {
  if (value === "" || value === null || value === undefined) {
    return true;
  }

  var normalized = String(value).trim().toLowerCase();
  return normalized !== "false" && normalized !== "no" && normalized !== "0";
}

function isExpired_(job, today) {
  var expiresAt = job.expiresAt;

  if (!expiresAt && job.publishedAt) {
    expiresAt = addDays_(job.publishedAt, DEFAULT_TTL_DAYS);
  }

  if (!expiresAt) {
    return false;
  }

  var expiryDate = parseDate_(expiresAt);
  if (!expiryDate) {
    return false;
  }

  return startOfDay_(expiryDate).getTime() < today.getTime();
}

function addDays_(isoDate, days) {
  var date = parseDate_(isoDate);
  if (!date) {
    return "";
  }

  date.setDate(date.getDate() + days);
  return formatDate_(date);
}

function parseDate_(value) {
  var parts = String(value).trim().split("-");
  if (parts.length !== 3) {
    return null;
  }

  var year = Number(parts[0]);
  var month = Number(parts[1]) - 1;
  var day = Number(parts[2]);
  var date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
