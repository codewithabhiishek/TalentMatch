import { parseJobSpreadsheet } from '../src/services/jobSpreadsheetParser';
import { extractWithHeuristics, parseResumeWithAI } from '../src/services/aiExtractionService';
import JSZip from 'jszip';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('   DEEP EDGE-CASE VERIFICATION: SPREADSHEET & RESUME   ');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. SPREADSHEET TEST: HTML table disguised as .xlsx (Vendor Portal)
  // This is what caused "Cannot read properties of undefined (reading 'sheets')"
  // -----------------------------------------------------------------
  console.log('[TEST 1] Vendor Portal HTML table disguised as .xlsx');
  const htmlTableContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><title>Job Vendors Report</title></head>
    <body>
      <table>
        <tr>
          <th>Job Title</th>
          <th>Specialty</th>
          <th>Facility</th>
          <th>City</th>
          <th>State</th>
          <th>Shift</th>
        </tr>
        <tr>
          <td>Critical Care RN</td>
          <td>ICU</td>
          <td>Parkland Memorial Hospital</td>
          <td>Dallas</td>
          <td>TX</td>
          <td>Night 12hr</td>
        </tr>
        <tr>
          <td>Staff Physical Therapist</td>
          <td>Orthopedics</td>
          <td>Austin Sports & Spine</td>
          <td>Austin</td>
          <td>TX</td>
          <td>Day 8hr</td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Create mock File object for browser environment test
  const htmlFile = new File([htmlTableContent], 'JobVendors (29).xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  try {
    const parsedHtml = await parseJobSpreadsheet(htmlFile);
    assert(parsedHtml.headers.length === 6, `Parsed 6 headers: ${parsedHtml.headers.join(', ')}`);
    assert(parsedHtml.rows.length === 2, `Parsed 2 job rows (found ${parsedHtml.rows.length})`);
    assert(parsedHtml.rows[0][0] === 'Critical Care RN', `First row title is 'Critical Care RN'`);
    assert(parsedHtml.rows[0][2] === 'Parkland Memorial Hospital', `First row facility is Parkland Memorial Hospital`);
  } catch (err: any) {
    assert(false, `Unexpected error on HTML disguised xlsx: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 2. SPREADSHEET TEST: Real Binary OpenXML .xlsx
  // -----------------------------------------------------------------
  console.log('\n[TEST 2] Real Binary OpenXML .xlsx via JSZip');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Sheet1" sheetId="1" id="rId1"/></sheets></workbook>');
  zip.file('xl/sharedStrings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6"><si><t>Position</t></si><si><t>Facility Name</t></si><si><t>City, State</t></si><si><t>Emergency Room RN</t></si><si><t>UChicago Medicine</t></si><si><t>Chicago, IL</t></si></sst>');
  zip.file('xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2" t="s"><v>5</v></c></row></sheetData></worksheet>');

  const xlsxBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  const xlsxFile = new File([xlsxBuffer], 'vendor_jobs.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  try {
    const parsedXlsx = await parseJobSpreadsheet(xlsxFile);
    assert(parsedXlsx.headers.length === 3, `Extracted ${parsedXlsx.headers.length} headers: ${parsedXlsx.headers.join(', ')}`);
    assert(parsedXlsx.rows.length === 1, `Extracted 1 row: ${parsedXlsx.rows[0].join(' | ')}`);
    assert(parsedXlsx.rows[0][0] === 'Emergency Room RN', `Row matched: Emergency Room RN`);
  } catch (err: any) {
    assert(false, `Unexpected error on real xlsx: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 3. SPREADSHEET TEST: Standard CSV / TSV file
  // -----------------------------------------------------------------
  console.log('\n[TEST 3] Standard CSV Requisition Import');
  const csvContent = `Job Title,Specialty,Location,Facility\nRegistered Nurse,Pediatrics,"Dallas, TX",Children's Health\nTravel RN,Med-Surg,"Houston, TX",Houston Methodist`;
  const csvFile = new File([csvContent], 'requisitions.csv', { type: 'text/csv' });

  try {
    const parsedCsv = await parseJobSpreadsheet(csvFile);
    assert(parsedCsv.rows.length === 2, `Parsed 2 CSV rows`);
    assert(parsedCsv.headers.includes('Job Title'), `Headers contain Job Title`);
  } catch (err: any) {
    assert(false, `Unexpected error on CSV: ${err.message}`);
  }

  // -----------------------------------------------------------------
  // 4. RESUME TEST: Whole multi-line employment history (NO PIPES)
  // Client said: "It's not pulling the whole employment of a resume"
  // -----------------------------------------------------------------
  console.log('\n[TEST 4] Whole Multi-line Employment Extraction (No Pipes)');
  const multiJobResume = `
    Marcus Vance, MSN, APRN, FNP-C
    Dallas, TX 75201 | (214) 555-0199 | marcus.vance@texashealth.org

    PROFESSIONAL SUMMARY
    Board-Certified Family Nurse Practitioner with extensive emergency and ICU clinical background.

    CERTIFICATIONS
    - Family Nurse Practitioner (FNP-BC)
    - Advanced Cardiac Life Support (ACLS)
    - Basic Life Support (BLS)

    PROFESSIONAL EXPERIENCE

    Family Nurse Practitioner
    Texas Health Physicians Group - Dallas, TX
    January 2022 - Present
    - Conducted comprehensive clinical assessments and diagnosed acute/chronic illnesses.
    - Prescribed pharmacologic therapies and developed outpatient care regimens.

    Emergency Room Staff Nurse
    Methodist Dallas Medical Center - Dallas, TX
    June 2018 - December 2021
    - Provided direct trauma triage care in high-volume Level I emergency department.
    - Administered rapid sequence intubation medications and resuscitation protocols.

    Telemetry Registered Nurse
    Baylor University Medical Center - Dallas, TX
    May 2015 - May 2018
    - Monitored continuous telemetry cardiac strips for 30-bed cardiovascular unit.

    Certified Nursing Assistant
    Parkland Memorial Hospital - Dallas, TX
    January 2012 - April 2015
    - Assisted clinical nursing staff with basic hygiene, vitals, and patient mobility.
  `;

  const parsedCandidate = extractWithHeuristics(multiJobResume, 'marcus_vance_fnp.pdf');
  const timeline = parsedCandidate.experienceTimeline || [];

  assert(timeline.length === 4, `Extracted all 4 employment blocks across entire career (found ${timeline.length})`);
  assert(timeline[0].position.includes('Family Nurse Practitioner'), `Job 1 (Current): ${timeline[0].position} at ${timeline[0].facility} (${timeline[0].startDate} - ${timeline[0].endDate})`);
  assert(timeline[1].position.includes('Emergency Room Staff Nurse'), `Job 2 (2018-2021): ${timeline[1].position} at ${timeline[1].facility}`);
  assert(timeline[2].position.includes('Telemetry Registered Nurse'), `Job 3 (2015-2018): ${timeline[2].position} at ${timeline[2].facility}`);
  assert(timeline[3].position.includes('Certified Nursing Assistant'), `Job 4 (2012-2015): ${timeline[3].position} at ${timeline[3].facility}`);

  // -----------------------------------------------------------------
  // 5. RESUME TEST: Assigning right title as per LAST 3 YEARS
  // Client said: "Not assigning right title as per last 3 years"
  // Candidate was a CNA 10 years ago, but has been an FNP for the last 3 years.
  // -----------------------------------------------------------------
  console.log('\n[TEST 5] Right Title Assigned as per Last 3 Years (Not past student role)');
  assert(
    parsedCandidate.position === 'Nurse Practitioner',
    `Candidate position correctly assigned as '${parsedCandidate.position}' (expected 'Nurse Practitioner', NOT student CNA)`
  );

  // -----------------------------------------------------------------
  // 6. RESUME TEST: Zero Fabricated Data Check
  // -----------------------------------------------------------------
  console.log('\n[TEST 6] Zero Fabricated Data Check');
  const noCertResume = `
    Jane Smith
    janesmith@hospital.org
    Austin, TX
    Clinical Experience
    Speech-Language Pathologist | Austin Neuro Care | Austin, TX
    2020 - Present
    Provided dysphagia therapy.
  `;
  const noCertParsed = extractWithHeuristics(noCertResume, 'jane_smith.docx');
  assert(
    noCertParsed.certifications?.length === 0,
    `No fake BLS/ACLS certifications injected when none exist in document (found ${noCertParsed.certifications?.length} certs)`
  );
  assert(
    !noCertParsed.email?.endsWith('.demo'),
    `No fake .demo email injected: ${noCertParsed.email}`
  );

  console.log('\n------------------------------------------------------');
  console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runVerification();
