/*
  Google Forms -> Google Sheets -> Chicago Open311 starter.

  Setup:
  1. Link the Google Form to a response Sheet.
  2. In Apps Script, set Script Properties:
     CHICAGO_OPEN311_API_KEY = your API key
     OPEN311_BASE_URL = https://311api.cityofchicago.org/open311/v2
     RODENT_SERVICE_CODE = the current service code confirmed from /services.json
  3. Create an installable onFormSubmit trigger for handleFormSubmit.
  4. Test with DRY_RUN = true before live submissions.
*/

const DRY_RUN = true;

function handleFormSubmit(e) {
  const values = namedValues_(e);

  if (!yes_(values["I consent to a 311 request being submitted with my information."])) {
    return;
  }
  if (!yes_(values["I confirm this information is true to the best of my knowledge and based on my own observations."])) {
    return;
  }

  const props = PropertiesService.getScriptProperties();
  const baseUrl = props.getProperty("OPEN311_BASE_URL") || "https://311api.cityofchicago.org/open311/v2";
  const apiKey = props.getProperty("CHICAGO_OPEN311_API_KEY");
  const serviceCode = props.getProperty("RODENT_SERVICE_CODE");

  if (!apiKey || !serviceCode) {
    throw new Error("Missing CHICAGO_OPEN311_API_KEY or RODENT_SERVICE_CODE in Script Properties.");
  }

  const description = [
    "Resident-authorized report.",
    "Resident reports rat activity and food-source conditions at or near: " + field_(values, "Location observed"),
    "Observations: " + observations_(values),
    "Household/address food-source observation: " + field_(values, "If yes, date/location of the observation and what you saw"),
    "Details: " + field_(values, "Describe what you personally observed"),
    "Requested action: inspect for active rat burrows, perform appropriate rodent control, remove dead rodents if present, and take enforcement action to stop the feeding or dumping of pecans/nuts and other food at [HOUSEHOLD/ADDRESS] and in the park. Please issue citations, fines, orders to stop, or other enforcement action where authorized, and coordinate with the Chicago Park District and aldermanic office as needed.",
    "This submission is made with the resident's consent."
  ].join("\n\n");

  const payload = {
    api_key: apiKey,
    service_code: serviceCode,
    description: description,
    address_string: field_(values, "Street address"),
    first_name: firstName_(field_(values, "Full name")),
    last_name: lastName_(field_(values, "Full name")),
    email: field_(values, "Email"),
    phone: field_(values, "Phone")
  };

  if (DRY_RUN) {
    Logger.log(JSON.stringify(payload, null, 2));
    writeBack_(e, "DRY RUN - not submitted");
    return;
  }

  const response = UrlFetchApp.fetch(baseUrl + "/requests.json", {
    method: "post",
    payload: payload,
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) {
    writeBack_(e, "Submission failed: " + status + " " + body);
    throw new Error("Open311 submission failed: " + status + " " + body);
  }

  const parsed = JSON.parse(body);
  const requestId = Array.isArray(parsed) && parsed[0] ? parsed[0].service_request_id : body;
  writeBack_(e, requestId);
}

function namedValues_(e) {
  const out = {};
  Object.keys(e.namedValues || {}).forEach(function(key) {
    out[key] = Array.isArray(e.namedValues[key]) ? e.namedValues[key].join(", ") : e.namedValues[key];
  });
  return out;
}

function field_(values, key) {
  return values[key] || "";
}

function yes_(value) {
  return String(value || "").toLowerCase().indexOf("yes") !== -1 ||
    String(value || "").toLowerCase().indexOf("consent") !== -1 ||
    String(value || "").toLowerCase().indexOf("confirm") !== -1;
}

function observations_(values) {
  const keys = [
    "Rat burrows",
    "Live rats",
    "Dead rats",
    "Food or nuts left in park or tree wells",
    "Direct feeding observed at or around [HOUSEHOLD/ADDRESS]",
    "Large quantity of pecans/nuts observed at or around [HOUSEHOLD/ADDRESS]",
    "Property damage",
    "School, child, or public safety concern",
    "Other"
  ];
  return keys.filter(function(key) { return yes_(values[key]); }).join(", ");
}

function firstName_(fullName) {
  return String(fullName || "").trim().split(/\s+/)[0] || "";
}

function lastName_(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

function writeBack_(e, value) {
  const sheet = e.range.getSheet();
  const row = e.range.getRow();
  const headerRow = 1;
  const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  let col = headers.indexOf("311 confirmation number") + 1;
  if (col === 0) {
    col = sheet.getLastColumn() + 1;
    sheet.getRange(headerRow, col).setValue("311 confirmation number");
  }
  sheet.getRange(row, col).setValue(value);
}
