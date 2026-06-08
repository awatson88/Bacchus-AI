# Neighborhood 311 Rat Response Plan

## Goal

Collect individual neighbor authorizations and submit accurate, separate Chicago 311 rodent baiting or rat complaint requests tied to each resident's own observations. The campaign should document public health and park usability concerns and can identify the observed food source at [HOUSEHOLD/ADDRESS] when the statement is supported by photos, dates, or direct observation.

## Recommended Google Form Fields

Required:

- Full name
- Street address
- Email address
- Phone number
- What have you personally observed? Options: rat burrows, live rats, dead rats, food or nuts left in park, property damage, school or child safety concern, other
- Date or approximate date of observation
- Location of observation, such as park name, block, tree well, alley, or nearby address
- Have you personally observed food, nuts, or squirrel feeding at or around [HOUSEHOLD/ADDRESS]?
- If yes, date/location of the observation and what you saw
- Consent checkbox: "I authorize Andrew Watson, or a service operating under Andrew Watson's direction, to submit a Chicago 311 rodent or sanitation service request using my name, address, contact information, and the observations I provide in this form. I understand this authorization is limited to reporting the rat, rodent, sanitation, and wildlife-feeding conditions described here. I can revoke this authorization by emailing Andrew before my request is submitted."
- Accuracy checkbox: "I confirm that the information I am providing is true to the best of my knowledge and based on my own observations."

Optional:

- Upload photos or video
- May Andrew follow up with you if the city requests more information?
- Are you comfortable being contacted by the city about this request?
- Additional notes

## Automation Approach

Use a Google Form backed by a Google Sheet. A script or service should process each row only after consent is checked and should create a separate request for each consenting resident.

Preferred implementation:

1. Request a Chicago Open311 API key from the official Chicago Open311 app registration page.
2. Use the Open311 service discovery endpoint to confirm the current rodent-related service code before launch.
3. Store the API key in a protected environment variable or Apps Script property, not in the sheet.
4. On each approved form response, submit one 311 request with the resident's own contact details, address, observation text, and photo URLs if available.
5. Write the returned service request number back to the sheet.
6. Throttle submissions and deduplicate identical reports from the same person and same observation location.
7. Keep copies of the consent timestamp, submitted payload, and city confirmation number.

No-code alternative:

- Google Forms -> Google Sheets -> Make or Zapier webhook -> small Cloudflare Worker or Google Apps Script -> Chicago Open311.

Manual fallback:

- Export the sheet, submit requests through 311.chicago.gov or the Chi 311 app one by one, and record each service request number in the sheet.

## Submission Guardrails

- Do not submit a request for a neighbor unless that neighbor has checked the consent box.
- Do not use a neighbor's name, address, phone, or email for anything beyond the stated 311 reporting campaign.
- Do not fabricate observations or submit hearsay as a first-person observation.
- If naming [HOUSEHOLD/ADDRESS], use evidence-based wording: "observed feeding squirrels," "photos show pecans/nuts around the property," or "resident observed nuts being left at tree trunks." Avoid claims about motive, character, or legal conclusions.
- Keep the core city ask practical and enforcement-oriented: inspect the park/tree wells and [HOUSEHOLD/ADDRESS], treat active burrows, remove dead rodents, order the feeding or food dumping to stop, issue citations/fines or other enforcement where authorized, and coordinate with the Park District and aldermanic office where needed.

## Suggested 311 Description Template

Resident-authorized report. The resident reports rat activity and food-source conditions at or near [LOCATION]. Observations include [OBSERVATIONS]. The resident also reports/documented [DIRECT OBSERVATION CONNECTING FOOD SOURCE TO HOUSEHOLD/ADDRESS], including [PHOTO SUMMARY] if photos are attached. The resident requests inspection for active rat burrows, rodent baiting or appropriate rodent control, removal of dead rodents if present, and enforcement action to stop the feeding or dumping of pecans/nuts and other food at [HOUSEHOLD/ADDRESS] and in the park. Please issue citations, fines, orders to stop, or other enforcement action where authorized, and coordinate with the Chicago Park District and aldermanic office as needed.

This submission is made with the resident's consent. Resident contact information is included so the City can verify details if needed.

## Direct-Callout Flyer Wording

Use this when you want the flyer to name the source directly:

"Neighbors have documented repeated squirrel feeding and large quantities of pecans/nuts at and around [HOUSEHOLD/ADDRESS]. Nuts are also being found around the park, at tree trunks, and on nearby private property. The park now has visible rat burrows and dead rats. We are collecting resident-authorized 311 reports asking the City and Park District to inspect, treat active burrows, remove dead rodents, and require the feeding/food dumping to stop, including citations, fines, orders to stop, or other enforcement where authorized."

Before posting, replace the placeholder with the exact address or household description, and keep a folder of dated photos and notes supporting the statement.

## Official References Checked

- Chicago 311 homepage: https://311.chicago.gov/s/?language=en_US
- Chicago Open311 API key registration: https://311api.cityofchicago.org/open311/v2/apps/new
- Chicago Open311 documentation landing page: https://test311api.cityofchicago.org/open311
- Chicago Park District Natural Areas Rules and FAQs: https://www.chicagoparkdistrict.com/natural-areas-rules-faqs
- Chicago Park District Code Chapter 7: https://www.chicagoparkdistrict.com/media/121/download?inline=
