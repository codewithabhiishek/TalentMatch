import { Candidate, Job, JobMatch, ImportedFile, Notification } from '../types';

export const candidates: Candidate[] = [
  {
    id: 'c1',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@email.com',
    phone: '(555) 234-5678',
    position: 'Registered Nurse',
    specialty: 'ICU',
    experience: 7,
    currentLocation: 'Portland, OR',
    previousTravelLocations: ['Seattle, WA', 'San Francisco, CA', 'Denver, CO'],
    bestMatch: 'ICU Nurse — Mercy General, Sacramento',
    status: 'matched',
    resumeFilename: 'mitchell_sarah_rn_icu.pdf',
    uploadedAt: '2025-01-15',
    professionalSummary: 'Experienced ICU Registered Nurse with 7 years of critical care experience across Level I and Level II trauma centers. Proficient in ventilator management, hemodynamic monitoring, and complex medication administration. Holds CCRN certification and BLS/ACLS.',
    experienceTimeline: [
      { id: 'e1', position: 'ICU Staff Nurse', facility: 'Oregon Health & Science University', location: 'Portland, OR', startDate: '2022-03', endDate: 'Present', description: 'Provide critical care in a 48-bed medical-surgical ICU. Manage ventilated patients, CRRT, and vasoactive drips.' },
      { id: 'e2', position: 'ICU Travel Nurse', facility: 'Swedish Medical Center', location: 'Seattle, WA', startDate: '2021-01', endDate: '2022-02', description: '13-week assignment in a 36-bed cardiac ICU. Specialized in post-open-heart surgical recovery.' },
      { id: 'e3', position: 'Staff Nurse — Med/Surg', facility: 'Providence Portland Medical Center', location: 'Portland, OR', startDate: '2018-06', endDate: '2020-12', description: 'Transitioned from med/surg to ICU through internal residency program.' }
    ],
    verifiedByRecruiter: true
  },
  {
    id: 'c2',
    firstName: 'James',
    lastName: 'Rodriguez',
    email: 'j.rodriguez@email.com',
    phone: '(555) 345-6789',
    position: 'Physical Therapist',
    specialty: 'Orthopedics',
    experience: 5,
    currentLocation: 'Austin, TX',
    previousTravelLocations: ['Dallas, TX', 'Phoenix, AZ', 'Nashville, TN'],
    bestMatch: 'Ortho PT — Bone & Joint Clinic, Tulsa',
    status: 'reviewing',
    resumeFilename: 'rodriguez_james_pt.pdf',
    uploadedAt: '2025-01-18',
    professionalSummary: 'Doctor of Physical Therapy specializing in orthopedic rehabilitation. Experienced in post-surgical protocols, sports injury recovery, and manual therapy techniques. OCS board-certified.',
    experienceTimeline: [
      { id: 'e4', position: 'Physical Therapist', facility: 'Austin Sports & Spine', location: 'Austin, TX', startDate: '2023-01', endDate: 'Present', description: 'Manage a caseload of 12-15 patients daily focusing on orthopedic and sports injuries.' },
      { id: 'e5', position: 'Travel PT', facility: 'Banner Health', location: 'Phoenix, AZ', startDate: '2022-01', endDate: '2022-12', description: 'Outpatient orthopedic clinic. Implemented evidence-based protocols for total joint replacement.' },
      { id: 'e6', position: 'PT Resident', facility: 'Vanderbilt Health', location: 'Nashville, TN', startDate: '2020-06', endDate: '2021-12', description: 'Completed orthopedic residency with focus on manual therapy and return-to-sport testing.' }
    ],
    verifiedByRecruiter: false
  },
  {
    id: 'c3',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@email.com',
    phone: '(555) 456-7890',
    position: 'Registered Nurse',
    specialty: 'Emergency',
    experience: 4,
    currentLocation: 'Chicago, IL',
    previousTravelLocations: ['Milwaukee, WI', 'Minneapolis, MN'],
    bestMatch: 'ER Nurse — Northwestern Memorial, Chicago',
    status: 'new',
    resumeFilename: 'chen_emily_rn_er.pdf',
    uploadedAt: '2025-01-20',
    professionalSummary: 'Emergency Department RN with experience in high-volume Level I trauma centers. Skilled in triage, rapid assessment, and emergency procedures. TNCC and ENPC certified.',
    experienceTimeline: [
      { id: 'e7', position: 'ER Staff Nurse', facility: 'University of Chicago Medicine', location: 'Chicago, IL', startDate: '2022-08', endDate: 'Present', description: 'Level I trauma center ED. Handle 60+ patients per shift across all acuity levels.' },
      { id: 'e8', position: 'Travel Nurse — ED', facility: 'Froedtert Hospital', location: 'Milwaukee, WI', startDate: '2021-06', endDate: '2022-07', description: 'Fast-paced community hospital ED with stroke and STEMI center designation.' }
    ],
    verifiedByRecruiter: false
  },
  {
    id: 'c4',
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'm.thompson@email.com',
    phone: '(555) 567-8901',
    position: 'Radiologic Technologist',
    specialty: 'MRI',
    experience: 8,
    currentLocation: 'Denver, CO',
    previousTravelLocations: ['Salt Lake City, UT', 'Boise, ID', 'Omaha, NE', 'Kansas City, MO'],
    bestMatch: 'MRI Tech — UCHealth, Denver',
    status: 'matched',
    resumeFilename: 'thompson_michael_mri.pdf',
    uploadedAt: '2025-01-12',
    professionalSummary: 'Senior MRI Technologist with 8 years of experience in cardiac, neuro, and musculoskeletal imaging. ARRT certified with additional cardiac MRI certification. Experienced with Siemens and GE platforms.',
    experienceTimeline: [
      { id: 'e9', position: 'Senior MRI Technologist', facility: 'UCHealth University of Colorado Hospital', location: 'Denver, CO', startDate: '2023-01', endDate: 'Present', description: 'Lead technologist for cardiac MRI program. Perform 15-20 studies daily.' },
      { id: 'e10', position: 'MRI Travel Tech', facility: 'Intermountain Medical Center', location: 'Salt Lake City, UT', startDate: '2021-06', endDate: '2022-12', description: 'High-volume imaging center. Specialized in cardiac and oncology protocols.' },
      { id: 'e11', position: 'MRI Technologist', facility: 'St. Luke\'s Health System', location: 'Boise, ID', startDate: '2018-01', endDate: '2021-05', description: 'Community hospital MRI department. Cross-trained in CT.' }
    ],
    verifiedByRecruiter: true
  },
  {
    id: 'c5',
    firstName: 'Amanda',
    lastName: 'Foster',
    email: 'a.foster@email.com',
    phone: '(555) 678-9012',
    position: 'Respiratory Therapist',
    specialty: 'Neonatal',
    experience: 6,
    currentLocation: 'Atlanta, GA',
    previousTravelLocations: ['Charlotte, NC', 'Tampa, FL', 'Birmingham, AL'],
    bestMatch: 'NICU RT — Children\'s Healthcare of Atlanta',
    status: 'interview',
    resumeFilename: 'foster_amanda_rt_nicu.pdf',
    uploadedAt: '2025-01-10',
    professionalSummary: 'Neonatal Respiratory Therapist with specialized experience in Level IV NICUs. Expert in high-frequency ventilation, surfactant administration, and neonatal transport. NPS-certified.',
    experienceTimeline: [
      { id: 'e12', position: 'Lead RT — NICU', facility: 'Emory University Hospital', location: 'Atlanta, GA', startDate: '2022-01', endDate: 'Present', description: 'Lead respiratory therapist in 150-bed Level IV NICU. Manage complex ventilator cases and ECMO.' },
      { id: 'e13', position: 'Travel RT — NICU', facility: 'Carolinas Medical Center', location: 'Charlotte, NC', startDate: '2020-06', endDate: '2021-12', description: 'Regional perinatal center. Participated in neonatal transport team.' }
    ],
    verifiedByRecruiter: true
  },
  {
    id: 'c6',
    firstName: 'David',
    lastName: 'Kim',
    email: 'd.kim@email.com',
    phone: '(555) 789-0123',
    position: 'Registered Nurse',
    specialty: 'Med-Surg',
    experience: 3,
    currentLocation: 'San Jose, CA',
    previousTravelLocations: ['Sacramento, CA', 'Reno, NV'],
    bestMatch: 'Med-Surg Nurse — Regional Medical Center, San Jose',
    status: 'new',
    resumeFilename: 'kim_david_rn_ms.pdf',
    uploadedAt: '2025-01-22',
    professionalSummary: 'Med-Surg RN with strong foundation in acute care nursing. Experienced with telemetry, wound care, and post-operative management. Recently completed progressive care certification.',
    experienceTimeline: [
      { id: 'e14', position: 'Staff Nurse — Med/Surg', facility: 'Regional Medical Center of San Jose', location: 'San Jose, CA', startDate: '2022-09', endDate: 'Present', description: '32-bed medical-surgical unit with telemetry. Manage diverse patient population.' },
      { id: 'e15', position: 'New Grad RN', facility: 'UC Davis Medical Center', location: 'Sacramento, CA', startDate: '2021-07', endDate: '2022-08', description: 'Completed nurse residency program in medical-surgical/telemetry unit.' }
    ],
    verifiedByRecruiter: false
  },
  {
    id: 'c7',
    firstName: 'Rachel',
    lastName: 'Bennett',
    email: 'r.bennett@email.com',
    phone: '(555) 890-1234',
    position: 'Occupational Therapist',
    specialty: 'Pediatrics',
    experience: 9,
    currentLocation: 'Philadelphia, PA',
    previousTravelLocations: ['Pittsburgh, PA', 'Baltimore, MD', 'Washington, DC', 'Richmond, VA'],
    bestMatch: 'Pediatric OT — Children\'s Hospital of Philadelphia',
    status: 'placed',
    resumeFilename: 'bennett_rachel_ot_peds.pdf',
    uploadedAt: '2025-01-05',
    professionalSummary: 'Pediatric Occupational Therapist with 9 years of experience in hospital and school-based settings. Specialized in sensory integration, fine motor development, and autism spectrum interventions.',
    experienceTimeline: [
      { id: 'e16', position: 'Senior OT — Pediatrics', facility: 'Children\'s Hospital of Philadelphia', location: 'Philadelphia, PA', startDate: '2022-01', endDate: 'Present', description: 'Inpatient and outpatient pediatric OT. Lead sensory integration program.' },
      { id: 'e17', position: 'Travel OT', facility: 'Johns Hopkins All Children\'s', location: 'Baltimore, MD', startDate: '2019-06', endDate: '2021-12', description: 'NICU follow-up clinic and early intervention programs.' }
    ],
    verifiedByRecruiter: true
  },
  {
    id: 'c8',
    firstName: 'Marcus',
    lastName: 'Williams',
    email: 'm.williams@email.com',
    phone: '(555) 901-2345',
    position: 'Pharmacy Technician',
    specialty: 'Hospital',
    experience: 4,
    currentLocation: 'Houston, TX',
    previousTravelLocations: ['San Antonio, TX', 'New Orleans, LA'],
    bestMatch: 'Hospital Pharm Tech — Methodist Hospital, Houston',
    status: 'reviewing',
    resumeFilename: 'williams_marcus_pharmtech.pdf',
    uploadedAt: '2025-01-19',
    professionalSummary: 'Certified Pharmacy Technician with hospital experience in sterile compounding, automated dispensing systems, and medication reconciliation. PTCB certified with IV certification.',
    experienceTimeline: [
      { id: 'e18', position: 'Pharmacy Technician — Inpatient', facility: 'Houston Methodist Hospital', location: 'Houston, TX', startDate: '2022-03', endDate: 'Present', description: 'Central pharmacy operations. Manage Pyxis automated dispensing and IV room.' },
      { id: 'e19', position: 'Travel Pharmacy Tech', facility: 'Ochsner Medical Center', location: 'New Orleans, LA', startDate: '2021-01', endDate: '2022-02', description: 'Satellite pharmacy and decentralized operations in a 900-bed facility.' }
    ],
    verifiedByRecruiter: false
  }
];

export const jobs: Job[] = [
  {
    id: 'j1',
    position: 'ICU Registered Nurse',
    specialty: 'ICU',
    city: 'Sacramento',
    state: 'CA',
    facility: 'Mercy General Hospital',
    sourceFile: 'nursing_positions_q1_2025.xlsx',
    status: 'active',
    postedDate: '2025-01-10',
    description: 'Seeking experienced ICU RN for 13-week assignment in our 40-bed medical-surgical ICU. Must have current BLS, ACLS, and minimum 2 years ICU experience.',
    requirements: ['Active RN license', 'BLS/ACLS', '2+ years ICU experience', 'CCRN preferred']
  },
  {
    id: 'j2',
    position: 'Physical Therapist',
    specialty: 'Orthopedics',
    city: 'Tulsa',
    state: 'OK',
    facility: 'Bone & Joint Clinic',
    sourceFile: 'rehab_opportunities_2025.xlsx',
    status: 'active',
    postedDate: '2025-01-12',
    description: 'Outpatient orthopedic PT position at a leading musculoskeletal clinic. Focus on post-surgical rehabilitation and sports medicine.',
    requirements: ['DPT degree', 'State PT license', 'OCS preferred', '3+ years ortho experience']
  },
  {
    id: 'j3',
    position: 'Emergency Department RN',
    specialty: 'Emergency',
    city: 'Chicago',
    state: 'IL',
    facility: 'Northwestern Memorial Hospital',
    sourceFile: 'nursing_positions_q1_2025.xlsx',
    status: 'active',
    postedDate: '2025-01-14',
    description: 'Level I trauma center seeking experienced ED nurses. High-acuity environment with 80,000+ annual visits.',
    requirements: ['Active RN license', 'BLS/ACLS/TNCC', '2+ years ED experience', 'ENPC preferred']
  },
  {
    id: 'j4',
    position: 'MRI Technologist',
    specialty: 'MRI',
    city: 'Denver',
    state: 'CO',
    facility: 'UCHealth',
    sourceFile: 'imaging_staff_needs.xlsx',
    status: 'active',
    postedDate: '2025-01-08',
    description: 'Senior MRI technologist needed for cardiac MRI program. Experience with Siemens platforms preferred.',
    requirements: ['ARRT certification', 'MRI certification', 'Cardiac MRI experience', '5+ years MRI']
  },
  {
    id: 'j5',
    position: 'NICU Respiratory Therapist',
    specialty: 'Neonatal',
    city: 'Atlanta',
    state: 'GA',
    facility: 'Children\'s Healthcare of Atlanta',
    sourceFile: 'respiratory_positions.xlsx',
    status: 'active',
    postedDate: '2025-01-11',
    description: 'Level IV NICU seeking experienced respiratory therapist. High-frequency ventilation and ECMO experience required.',
    requirements: ['RRT credential', 'NPS preferred', '3+ years NICU experience', 'Neonatal transport experience']
  },
  {
    id: 'j6',
    position: 'Med-Surg Registered Nurse',
    specialty: 'Med-Surg',
    city: 'San Jose',
    state: 'CA',
    facility: 'Regional Medical Center',
    sourceFile: 'nursing_positions_q1_2025.xlsx',
    status: 'active',
    postedDate: '2025-01-16',
    description: 'Community hospital seeking med-surg RNs for telemetry unit. Great opportunity for early-career nurses.',
    requirements: ['Active RN license', 'BLS', '1+ year acute care', 'Telemetry experience']
  },
  {
    id: 'j7',
    position: 'Pediatric Occupational Therapist',
    specialty: 'Pediatrics',
    city: 'Philadelphia',
    state: 'PA',
    facility: 'Children\'s Hospital of Philadelphia',
    sourceFile: 'rehab_opportunities_2025.xlsx',
    status: 'filled',
    postedDate: '2024-12-15',
    description: 'Senior pediatric OT position in our nationally ranked children\'s hospital. Lead sensory integration program.',
    requirements: ['OTR/L', '5+ years pediatrics', 'Sensory integration training', 'NBCOT']
  },
  {
    id: 'j8',
    position: 'Hospital Pharmacy Technician',
    specialty: 'Hospital',
    city: 'Houston',
    state: 'TX',
    facility: 'Methodist Hospital',
    sourceFile: 'pharmacy_staffing_2025.xlsx',
    status: 'active',
    postedDate: '2025-01-13',
    description: 'Inpatient pharmacy technician for central operations. Sterile compounding and automated dispensing experience required.',
    requirements: ['PTCB certification', 'IV certification', '2+ years hospital experience', 'Pyxis experience']
  },
  {
    id: 'j9',
    position: 'ICU Registered Nurse',
    specialty: 'ICU',
    city: 'Phoenix',
    state: 'AZ',
    facility: 'Banner Boswell Medical Center',
    sourceFile: 'nursing_positions_q1_2025.xlsx',
    status: 'active',
    postedDate: '2025-01-17',
    description: 'Seeking ICU RNs for our newly expanded cardiac ICU. 12-bed unit with latest monitoring technology.',
    requirements: ['Active RN license', 'BLS/ACLS', '3+ years ICU', 'Cardiac ICU experience']
  },
  {
    id: 'j10',
    position: 'Physical Therapist',
    specialty: 'Orthopedics',
    city: 'Nashville',
    state: 'TN',
    facility: 'Vanderbilt Health',
    sourceFile: 'rehab_opportunities_2025.xlsx',
    status: 'draft',
    postedDate: '2025-01-20',
    description: 'Outpatient orthopedic PT at academic medical center. Research opportunities available.',
    requirements: ['DPT degree', 'State PT license', 'OCS or board-eligible', 'Academic interest']
  }
];

export const jobMatches: JobMatch[] = [
  {
    id: 'm1',
    candidateId: 'c1',
    jobId: 'j1',
    score: 94,
    status: 'reviewed',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'RN position matches candidate qualification' },
      { factor: 'Specialty Match', score: 100, detail: 'ICU specialty aligns with candidate expertise' },
      { factor: 'Location Compatibility', score: 85, detail: 'Sacramento is within acceptable travel range; candidate has CA experience' },
      { factor: 'Experience Level', score: 95, detail: '7 years exceeds minimum 2-year requirement' },
      { factor: 'Previous Travel Relevance', score: 90, detail: 'Previous work in San Francisco, CA demonstrates West Coast adaptability' }
    ],
    explanation: 'Strong match based on specialty alignment, sufficient experience, and demonstrated West Coast work history. Candidate\'s previous San Francisco assignment shows comfort with California practice environment.'
  },
  {
    id: 'm2',
    candidateId: 'c2',
    jobId: 'j2',
    score: 88,
    status: 'pending',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'PT position matches candidate qualification' },
      { factor: 'Specialty Match', score: 100, detail: 'Orthopedics specialty is candidate\'s primary focus' },
      { factor: 'Location Compatibility', score: 75, detail: 'Tulsa is new territory; candidate has traveled to nearby Phoenix' },
      { factor: 'Experience Level', score: 85, detail: '5 years meets requirement; OCS certification adds value' },
      { factor: 'Previous Travel Relevance', score: 70, detail: 'Phoenix experience shows Southwest adaptability but Tulsa is different region' }
    ],
    explanation: 'Good specialty and position match. Candidate has strong orthopedic credentials. Location is less familiar territory but previous Southwest travel suggests adaptability.'
  },
  {
    id: 'm3',
    candidateId: 'c3',
    jobId: 'j3',
    score: 82,
    status: 'pending',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'ED RN position matches candidate qualification' },
      { factor: 'Specialty Match', score: 100, detail: 'Emergency specialty is candidate\'s focus' },
      { factor: 'Location Compatibility', score: 90, detail: 'Chicago is candidate\'s current location — ideal match' },
      { factor: 'Experience Level', score: 65, detail: '4 years meets minimum but Level I trauma center is demanding' },
      { factor: 'Previous Travel Relevance', score: 70, detail: 'Midwest travel experience (Milwaukee, Minneapolis) shows regional comfort' }
    ],
    explanation: 'Excellent location match with candidate already in Chicago. Specialty and position align well. Experience level is adequate but at the lower end for this high-acuity setting.'
  },
  {
    id: 'm4',
    candidateId: 'c4',
    jobId: 'j4',
    score: 96,
    status: 'accepted',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'MRI Tech position matches perfectly' },
      { factor: 'Specialty Match', score: 100, detail: 'MRI specialty with cardiac focus — exact match' },
      { factor: 'Location Compatibility', score: 100, detail: 'Denver is candidate\'s current location' },
      { factor: 'Experience Level', score: 95, detail: '8 years significantly exceeds requirements' },
      { factor: 'Previous Travel Relevance', score: 85, detail: 'Extensive travel history shows high adaptability' }
    ],
    explanation: 'Exceptional match. Candidate is already in Denver, works at UCHealth, has cardiac MRI expertise, and exceeds all experience requirements. This is a near-perfect alignment.'
  },
  {
    id: 'm5',
    candidateId: 'c5',
    jobId: 'j5',
    score: 91,
    status: 'reviewed',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'NICU RT position matches candidate qualification' },
      { factor: 'Specialty Match', score: 100, detail: 'Neonatal specialty is candidate\'s expertise' },
      { factor: 'Location Compatibility', score: 90, detail: 'Atlanta is candidate\'s current location' },
      { factor: 'Experience Level', score: 90, detail: '6 years in NICU with lead role experience' },
      { factor: 'Previous Travel Relevance', score: 80, detail: 'Southeast travel history (Charlotte, Birmingham) shows regional familiarity' }
    ],
    explanation: 'Very strong match. Candidate is already in Atlanta, works in a Level IV NICU, and has the exact specialized skills required including high-frequency ventilation and ECMO.'
  },
  {
    id: 'm6',
    candidateId: 'c4',
    jobId: 'j9',
    score: 72,
    status: 'pending',
    reasons: [
      { factor: 'Position Match', score: 60, detail: 'Different position — ICU RN vs MRI Tech' },
      { factor: 'Specialty Match', score: 50, detail: 'ICU specialty doesn\'t match MRI expertise' },
      { factor: 'Location Compatibility', score: 85, detail: 'Phoenix is within candidate\'s travel range (previously worked in Salt Lake City)' },
      { factor: 'Experience Level', score: 80, detail: '8 years healthcare experience, though not in ICU nursing' },
      { factor: 'Previous Travel Relevance', score: 75, detail: 'Mountain West travel history suggests comfort with Phoenix area' }
    ],
    explanation: 'Cross-specialty match with lower relevance. Candidate has extensive healthcare experience and regional familiarity but position and specialty don\'t align with their MRI focus.'
  },
  {
    id: 'm7',
    candidateId: 'c1',
    jobId: 'j9',
    score: 87,
    status: 'pending',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'ICU RN position matches candidate qualification' },
      { factor: 'Specialty Match', score: 100, detail: 'ICU specialty aligns perfectly' },
      { factor: 'Location Compatibility', score: 70, detail: 'Phoenix is new territory for candidate' },
      { factor: 'Experience Level', score: 95, detail: '7 years ICU experience exceeds requirements' },
      { factor: 'Previous Travel Relevance', score: 65, detail: 'No Southwest experience; all previous travel was West Coast/Northwest' }
    ],
    explanation: 'Strong specialty match with excellent experience level. Location is less ideal as candidate hasn\'t worked in the Southwest before, but extensive ICU credentials compensate.'
  },
  {
    id: 'm8',
    candidateId: 'c6',
    jobId: 'j6',
    score: 78,
    status: 'pending',
    reasons: [
      { factor: 'Position Match', score: 100, detail: 'Med-Surg RN matches candidate qualification' },
      { factor: 'Specialty Match', score: 100, detail: 'Med-Surg specialty aligns' },
      { factor: 'Location Compatibility', score: 95, detail: 'San Jose is candidate\'s current location' },
      { factor: 'Experience Level', score: 60, detail: '3 years meets minimum but is on lower end' },
      { factor: 'Previous Travel Relevance', score: 70, detail: 'Sacramento and Reno experience shows California comfort' }
    ],
    explanation: 'Good location match with candidate already in San Jose. Position and specialty align. Experience is adequate for this community hospital setting.'
  }
];

export const importedFiles: ImportedFile[] = [
  { id: 'f1', filename: 'nursing_positions_q1_2025.xlsx', type: 'jobs', uploadedAt: '2025-01-10', status: 'completed', recordCount: 24 },
  { id: 'f2', filename: 'rehab_opportunities_2025.xlsx', type: 'jobs', uploadedAt: '2025-01-12', status: 'completed', recordCount: 12 },
  { id: 'f3', filename: 'imaging_staff_needs.xlsx', type: 'jobs', uploadedAt: '2025-01-08', status: 'completed', recordCount: 8 },
  { id: 'f4', filename: 'respiratory_positions.xlsx', type: 'jobs', uploadedAt: '2025-01-11', status: 'completed', recordCount: 6 },
  { id: 'f5', filename: 'pharmacy_staffing_2025.xlsx', type: 'jobs', uploadedAt: '2025-01-13', status: 'completed', recordCount: 10 },
  { id: 'f6', filename: 'mitchell_sarah_rn_icu.pdf', type: 'resume', uploadedAt: '2025-01-15', status: 'completed', recordCount: 1 },
  { id: 'f7', filename: 'rodriguez_james_pt.pdf', type: 'resume', uploadedAt: '2025-01-18', status: 'completed', recordCount: 1 },
  { id: 'f8', filename: 'chen_emily_rn_er.pdf', type: 'resume', uploadedAt: '2025-01-20', status: 'completed', recordCount: 1 },
];

const now = Date.now();
export const notifications: Notification[] = [
  { id: 'n1', title: 'New candidate matched', message: 'Sarah Mitchell has been matched with ICU Nurse at Mercy General (94% score)', read: false, timestamp: new Date(now - 8 * 60 * 1000).toISOString(), type: 'success' },
  { id: 'n2', title: 'Resume processing complete', message: 'David Kim\'s resume has been processed and profile created', read: false, timestamp: new Date(now - 35 * 60 * 1000).toISOString(), type: 'info' },
  { id: 'n3', title: 'New jobs imported', message: '10 positions imported from pharmacy_staffing_2025.xlsx', read: true, timestamp: new Date(now - 2 * 3600 * 1000).toISOString(), type: 'info' },
  { id: 'n4', title: 'Match requires review', message: '3 new candidate-job matches pending your review', read: false, timestamp: new Date(now - 5 * 3600 * 1000).toISOString(), type: 'warning' },
  { id: 'n5', title: 'Interview scheduled', message: 'Amanda Foster interview confirmed for next week at Children\'s Healthcare', read: true, timestamp: new Date(now - 26 * 3600 * 1000).toISOString(), type: 'success' },
];

export const weeklyActivity = [
  { day: 'Mon', candidates: 3, matches: 5, imports: 1 },
  { day: 'Tue', candidates: 5, matches: 3, imports: 0 },
  { day: 'Wed', candidates: 2, matches: 7, imports: 2 },
  { day: 'Thu', candidates: 4, matches: 4, imports: 1 },
  { day: 'Fri', candidates: 6, matches: 6, imports: 0 },
  { day: 'Sat', candidates: 1, matches: 2, imports: 0 },
  { day: 'Sun', candidates: 0, matches: 1, imports: 0 },
];
