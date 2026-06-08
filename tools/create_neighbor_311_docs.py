from __future__ import annotations

import html
import os
import zipfile
from pathlib import Path


OUT_DIR = Path("docs/neighborhood-311-rat-response-kit")


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def p(text: str = "", style: str | None = None, bold: bool = False, size: int | None = None) -> str:
    pstyle = f'<w:pStyle w:val="{style}"/>' if style else ""
    sz = f'<w:sz w:val="{size * 2}"/>' if size else ""
    b = "<w:b/>" if bold else ""
    if not text:
        return f"<w:p><w:pPr>{pstyle}</w:pPr></w:p>"
    return (
        f"<w:p><w:pPr>{pstyle}</w:pPr><w:r><w:rPr>{b}{sz}</w:rPr>"
        f"<w:t xml:space=\"preserve\">{esc(text)}</w:t></w:r></w:p>"
    )


def bullet(text: str) -> str:
    return (
        '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>'
        f'<w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
    )


def numbered(text: str) -> str:
    return (
        '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>'
        f'<w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
    )


def table(rows: list[list[str]], widths: list[int] | None = None) -> str:
    widths = widths or [4680 for _ in rows[0]]
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    out = [
        '<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/>'
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="DADCE0"/>'
        '<w:left w:val="single" w:sz="4" w:color="DADCE0"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="DADCE0"/>'
        '<w:right w:val="single" w:sz="4" w:color="DADCE0"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="DADCE0"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="DADCE0"/></w:tblBorders></w:tblPr>'
        f"<w:tblGrid>{grid}</w:tblGrid>"
    ]
    for row in rows:
        out.append("<w:tr>")
        for cell, width in zip(row, widths):
            paras = "".join(p(line) for line in cell.split("\n"))
            out.append(
                f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>'
                '<w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/>'
                '<w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>'
                f"</w:tcPr>{paras}</w:tc>"
            )
        out.append("</w:tr>")
    out.append("</w:tbl>")
    return "".join(out)


def checkbox(label: str) -> str:
    return p(f"[ ] {label}")


def section_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def document_xml(body: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>{body}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>
</w:body></w:document>'''


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="60"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="400" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="32"/></w:rPr></w:style>
</w:styles>'''


def numbering_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="●"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
<w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
<w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>'''


def rels_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''


def doc_rels_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'''


def content_types_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>'''


def write_docx(path: Path, body: str) -> None:
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types_xml())
        z.writestr("_rels/.rels", rels_xml())
        z.writestr("word/_rels/document.xml.rels", doc_rels_xml())
        z.writestr("word/document.xml", document_xml(body))
        z.writestr("word/styles.xml", styles_xml())
        z.writestr("word/numbering.xml", numbering_xml())


def flyer_body() -> str:
    return "".join(
        [
            p("Help stop the feeding that is fueling rats in our park", "Title"),
            p("Neighbors have documented repeated squirrel feeding and large quantities of pecans/nuts at and around [HOUSEHOLD/ADDRESS]. Nuts are also being found around the park, at tree trunks, and on nearby private property.", bold=True, size=13),
            table(
                [[
                    "SCAN THE QR CODE\n\n[ Place Google Form QR code here ]\n\nAdd your observation and consent in under 2 minutes.",
                    "What to report\n\nRat burrows at tree wells\nLive or dead rats\nFood or nuts left in the park\nNuts found on private property\nDirect feeding observed at [HOUSEHOLD/ADDRESS]\nSchool or child safety concerns",
                ]],
                [4200, 5160],
            ),
            p("Why this matters", "Heading1"),
            bullet("The park now has visible rat burrows and dead rats, including around tree wells."),
            bullet("Food left in public areas concentrates wildlife and can attract rodents."),
            bullet("Neighbors have tried asking for this to stop, and the problem continues."),
            bullet("A clear record of separate resident observations helps 311 and the Park District understand the scale, exact locations, and recurring food source."),
            p("What you are authorizing", "Heading1"),
            p("By completing the form, you authorize Andrew Watson or a service operating under his direction to submit a Chicago 311 rodent or sanitation request using only the information you provide. You are not signing a petition and your report should be based on your own observations."),
            p("Requested action: inspect the park and [HOUSEHOLD/ADDRESS], treat active burrows, remove dead rodents, require the feeding/food dumping to stop, and issue citations, fines, orders to stop, or other enforcement where authorized.", bold=True),
            p("Questions: [add email or phone]"),
        ]
    )


def consent_body() -> str:
    return "".join(
        [
            p("Resident Consent and 311 Intake Form", "Title"),
            p("Purpose: authorize a 311 rodent, sanitation, or park-condition request based on your own observations.", bold=True),
            p("Resident information", "Heading1"),
            table(
                [
                    ["Full name", ""],
                    ["Street address", ""],
                    ["Email", ""],
                    ["Phone", ""],
                ],
                [3000, 6360],
            ),
            p("Observation details", "Heading1"),
            checkbox("Rat burrows"),
            checkbox("Live rats"),
            checkbox("Dead rats"),
            checkbox("Food or nuts left in park or tree wells"),
            checkbox("Direct feeding observed at or around [HOUSEHOLD/ADDRESS]"),
            checkbox("Large quantity of pecans/nuts observed at or around [HOUSEHOLD/ADDRESS]"),
            checkbox("Property damage"),
            checkbox("School, child, or public safety concern"),
            checkbox("Other: ______________________________"),
            p("Date or approximate date observed: ______________________________"),
            p("Location observed: _____________________________________________"),
            p("Describe what you personally observed:", "Heading2"),
            table([[""]], [9360]),
            p("Authorization", "Heading1"),
            p("I authorize Andrew Watson, or a service operating under Andrew Watson's direction, to submit a Chicago 311 rodent, sanitation, or park-condition service request using my name, address, contact information, and the observations I provide in this form. This authorization is limited to the conditions described here. I may revoke this authorization before submission by contacting Andrew."),
            checkbox("I confirm this information is true to the best of my knowledge and based on my own observations."),
            checkbox("I consent to a 311 request being submitted with my information."),
            checkbox("The City may contact me if it needs more information."),
            p("Signature: ______________________________    Date: ________________"),
            p("Privacy note", "Heading1"),
            p("Information collected through this campaign should be used only for resident-authorized 311 reporting and related follow-up. Do not publish private resident contact information."),
        ]
    )


def implementation_body() -> str:
    steps = [
        "Create the Google Form using the field list in docs/neighborhood-311-rat-response-plan.md.",
        "Generate the QR code from the Google Form and paste it into the flyer placeholder.",
        "Request a Chicago Open311 API key and confirm the current rodent-related service code before automating.",
        "Use Google Apps Script, Make, Zapier, or a small Cloudflare Worker to submit one request per consenting resident.",
        "Write the 311 confirmation number back to the response sheet and keep the consent timestamp.",
    ]
    return "".join(
        [
            p("311 Automation Implementation Notes", "Title"),
            p("The safest operational pattern is one accurate, resident-authorized request per consenting resident. Do not batch residents into one report, and do not submit for anyone who did not consent.", bold=True),
            p("Build sequence", "Heading1"),
            *[numbered(step) for step in steps],
            p("Request description template", "Heading1"),
            p("Resident-authorized report. The resident reports rat activity and food-source conditions at or near [LOCATION]. Observations include [OBSERVATIONS]. The resident also reports/documented [DIRECT OBSERVATION CONNECTING FOOD SOURCE TO HOUSEHOLD/ADDRESS], including [PHOTO SUMMARY] if photos are attached. The resident requests inspection for active rat burrows, rodent baiting or appropriate rodent control, removal of dead rodents if present, and enforcement action to stop the feeding or dumping of pecans/nuts and other food at [HOUSEHOLD/ADDRESS] and in the park. Please issue citations, fines, orders to stop, or other enforcement action where authorized, and coordinate with the Chicago Park District and aldermanic office as needed."),
            p("Important guardrails", "Heading1"),
            bullet("If naming [HOUSEHOLD/ADDRESS], use evidence-based wording and keep dated photos or notes supporting each statement."),
            bullet("Distinguish direct observations from inferences in every submission."),
            bullet("Avoid duplicate submissions from the same resident for the same location and date."),
            bullet("Store API keys outside the Google Sheet."),
        ]
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_docx(OUT_DIR / "neighborhood-rat-311-flyer.docx", flyer_body())
    write_docx(OUT_DIR / "resident-311-consent-and-intake-form.docx", consent_body())
    write_docx(OUT_DIR / "311-automation-implementation-notes.docx", implementation_body())
    print(f"Wrote documents to {OUT_DIR}")


if __name__ == "__main__":
    main()
