import { useState, useRef } from 'react';
import { Upload, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { Job } from '../types';
import { parseJobSpreadsheet, ParsedJobSpreadsheet } from '../services/jobSpreadsheetParser';
import { sanitizeInput } from '../services/securityService';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const canonicalFields = [
  { key: 'position', label: 'Position / Job Title', required: true },
  { key: 'specialty', label: 'Specialty / Discipline', required: true },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'facility', label: 'Facility / Hospital Name', required: false },
  { key: 'shiftType', label: 'Shift / Schedule', required: false },
  { key: 'duration', label: 'Duration / Contract', required: false },
  { key: 'payRate', label: 'Pay / Bill Rate', required: false },
];

export function JobImport() {
  const { navigateTo, addImportedFile, addNotification, addJobsBatch } = useAppStore();
  const [step, setStep] = useState<WizardStep>(1);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loaded spreadsheet state
  const [parsedData, setParsedData] = useState<ParsedJobSpreadsheet | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importedCount, setImportedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  // Smart auto-mapper: guesses user column names even with different portals
  const autoMapHeaders = (headers: string[]) => {
    const newMappings: Record<string, string> = {};

    const findMatch = (patterns: RegExp[]): string => {
      for (const pattern of patterns) {
        const found = headers.find(h => pattern.test(h.trim().toLowerCase()));
        if (found) return found;
      }
      return '';
    };

    newMappings.position = findMatch([
      /^(job\s*title|title|position|job\s*name|role)$/i,
      /position/i,
      /title/i,
      /job/i,
    ]);

    newMappings.specialty = findMatch([
      /^(discipline|specialty|dept|department|clinical\s*unit|unit)$/i,
      /specialty/i,
      /discipline/i,
      /unit/i,
    ]);

    newMappings.city = findMatch([
      /^(city|site\s*city|work\s*city|location\s*city)$/i,
      /city/i,
      /location/i,
    ]);

    newMappings.state = findMatch([
      /^(state|st|site\s*state|work\s*state|location\s*state|province)$/i,
      /state/i,
      /province/i,
    ]);

    newMappings.facility = findMatch([
      /^(facility|facility\s*name|hospital|client|hospital\s*name|account|site\s*location|site|vendor|location\s*name)$/i,
      /facility/i,
      /hospital/i,
      /client/i,
      /account/i,
    ]);

    newMappings.shiftType = findMatch([
      /^(shift|shift\s*type|schedule|work\s*shift)$/i,
      /shift/i,
    ]);

    newMappings.duration = findMatch([
      /^(duration|contract\s*length|weeks|term)$/i,
      /duration/i,
      /contract/i,
    ]);

    newMappings.payRate = findMatch([
      /^(rate|pay\s*rate|bill\s*rate|pay|compensation|hourly)$/i,
      /rate/i,
      /pay/i,
    ]);

    setMappings(newMappings);
  };

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const parsed = await parseJobSpreadsheet(file);
      setParsedData(parsed);
      autoMapHeaders(parsed.headers);
      setStep(2);
    } catch (err: any) {
      console.error('Spreadsheet load failed:', err);
      setParseError(err.message || 'Could not parse Excel spreadsheet. Please ensure it is a valid .xlsx, .xls, or .csv file.');
    } finally {
      setIsParsing(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const executeImport = () => {
    if (!parsedData) return;

    const { headers, rows, fileName } = parsedData;

    const colIndex = (key: string): number => {
      const headerName = mappings[key];
      return headerName ? headers.indexOf(headerName) : -1;
    };

    const posIdx = colIndex('position');
    const specIdx = colIndex('specialty');
    const cityIdx = colIndex('city');
    const stateIdx = colIndex('state');
    const facIdx = colIndex('facility');
    const shiftIdx = colIndex('shiftType');
    const durIdx = colIndex('duration');

    const newJobs: Job[] = [];
    let skipped = 0;

    rows.forEach((row, rIdx) => {
      const position = posIdx >= 0 ? row[posIdx]?.trim() : '';
      const specialty = specIdx >= 0 ? row[specIdx]?.trim() : '';
      let city = cityIdx >= 0 ? row[cityIdx]?.trim() : '';
      let state = stateIdx >= 0 ? row[stateIdx]?.trim() : '';
      const facility = facIdx >= 0 ? row[facIdx]?.trim() : '';
      const shift = shiftIdx >= 0 ? row[shiftIdx]?.trim() : '';
      const duration = durIdx >= 0 ? row[durIdx]?.trim() : '';

      // Skip row if completely empty or missing required title
      if (!position && !specialty) {
        skipped++;
        return;
      }

      // If City has "City, ST" combined into a single column (e.g. "Dallas, TX" or "Houston, Texas")
      if (city && city.includes(',') && (!state || state.length === 0)) {
        const parts = city.split(',');
        city = parts[0].trim();
        state = parts[1].trim();
      }

      const job: Job = {
        id: `job-imp-${Date.now()}-${rIdx}`,
        position: sanitizeInput(position || 'Clinical Healthcare Position', 120),
        specialty: sanitizeInput(specialty || 'General', 100),
        city: sanitizeInput(city || 'Various', 80),
        state: sanitizeInput(state || 'US', 20),
        facility: sanitizeInput(facility || 'Partner Hospital System', 120),
        sourceFile: fileName,
        status: 'active',
        postedDate: new Date().toISOString().split('T')[0],
        description: `Imported requisition for ${position} (${specialty}). Schedule: ${shift || 'Full-time'}. Duration: ${duration || '13 weeks'}.`,
        requirements: ['Active state licensure or compact eligibility', 'BLS certification', '1+ years relevant clinical experience'],
      };

      newJobs.push(job);
    });

    addJobsBatch(newJobs);

    addImportedFile({
      id: `file-jobs-${Date.now()}`,
      filename: fileName,
      type: 'jobs',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'completed',
      recordCount: newJobs.length,
    });

    addNotification({
      title: 'Excel Job Requisitions Imported',
      message: `Successfully imported ${newJobs.length} live job requisitions from ${fileName}.`,
      read: false,
      type: 'success',
    });

    setImportedCount(newJobs.length);
    setSkippedCount(skipped);
    setStep(5);
  };

  const unmappedRequired = canonicalFields.filter(f => f.required && !mappings[f.key]);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Import Jobs Spreadsheet</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          Upload any vendor or hospital requisition file (.xlsx, .xls, .csv). Custom column headers are automatically detected and mapped.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              s < step ? 'bg-[var(--color-success)] text-white' :
              s === step ? 'bg-[var(--color-primary)] text-white' :
              'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
            }`}>
              {s < step ? <CheckCircle size={12} /> : s}
            </div>
            {s < 5 && <div className={`h-px flex-1 ${s < step ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`} />}
          </div>
        ))}
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* STEP 1: Upload / Drag & Drop */}
      {step === 1 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">Upload Job File</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Accepts real vendor spreadsheets (.xlsx, .xls, .csv)</p>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-sky-500 bg-sky-500/10'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-secondary)]/50'
            }`}
          >
            {isParsing ? (
              <div className="py-4 flex flex-col items-center">
                <Loader2 size={32} className="animate-spin text-sky-400 mb-2" />
                <p className="text-xs font-semibold text-white">Reading workbook sheets and columns...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet size={32} className="mx-auto mb-3 text-sky-400" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Click to select your Excel file (e.g. JobVendors.xlsx)
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">or drag and drop here</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">.xlsx</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">.xls</span>
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">.csv</span>
                </div>
              </>
            )}
          </div>

          {parseError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{parseError}</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Real File Preview */}
      {step === 2 && parsedData && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">File Preview: {parsedData.fileName}</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Detected {parsedData.totalRows} job rows and {parsedData.headers.length} columns from sheet "{parsedData.sheetName}".
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">File</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{parsedData.fileName}</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Sheet</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{parsedData.sheetName}</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Total Records</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">{parsedData.totalRows}</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Detected Columns</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">{parsedData.headers.length}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2 font-semibold">Detected Headers</p>
            <div className="flex flex-wrap gap-1.5">
              {parsedData.headers.map((h, i) => (
                <span key={i} className="px-2 py-0.5 text-[10px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded font-medium">
                  {h || `Column ${i + 1}`}
                </span>
              ))}
            </div>
          </div>

          {/* Table Preview (First 5 Rows) */}
          <div className="overflow-x-auto border border-[var(--color-border)] rounded-md max-h-64">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)] sticky top-0">
                  {parsedData.headers.map((h, i) => (
                    <th key={i} className="text-left font-medium text-[var(--color-text-tertiary)] px-2.5 py-1.5 whitespace-nowrap">
                      {h || `Col ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {parsedData.rows.slice(0, 8).map((row, i) => (
                  <tr key={i} className="hover:bg-[var(--color-surface-secondary)]/40">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2.5 py-1.5 text-[var(--color-text-secondary)] whitespace-nowrap max-w-xs truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(1)} className="btn btn-secondary cursor-pointer">
              <ArrowLeft size={12} /> Choose Another File
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary cursor-pointer">
              Map Columns <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Map Columns */}
      {step === 3 && parsedData && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">Map Columns</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
            Match the columns from <strong>{parsedData.fileName}</strong> to TalentMatch requisition fields.
          </p>

          <div className="space-y-3">
            {canonicalFields.map(field => (
              <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="sm:w-44 flex-shrink-0">
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{field.label}</span>
                  {field.required && <span className="text-[var(--color-error)] ml-1">*</span>}
                </div>
                <div className="relative flex-1">
                  <select
                    value={mappings[field.key] || ''}
                    onChange={e => setMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className={`w-full h-8 px-2.5 text-xs bg-[var(--color-surface)] border rounded-md appearance-none focus:outline-none focus:border-[var(--color-border-hover)] transition-colors ${
                      !mappings[field.key] && field.required ? 'border-[var(--color-error)]' : 'border-[var(--color-border)]'
                    }`}
                  >
                    <option value="">-- Select spreadsheet column --</option>
                    {parsedData.headers.map((h, i) => (
                      <option key={i} value={h}>{h || `Column ${i + 1}`}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
                </div>
                {mappings[field.key] && (
                  <span className="text-[10px] text-[var(--color-success)] flex items-center gap-0.5 shrink-0">
                    <CheckCircle size={10} /> Mapped
                  </span>
                )}
              </div>
            ))}
          </div>

          {unmappedRequired.length > 0 && (
            <div className="mt-4 p-2.5 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-md flex items-start gap-2">
              <AlertTriangle size={13} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[var(--color-warning)]">
                Required fields not yet mapped: {unmappedRequired.map(f => f.label).join(', ')}
              </p>
            </div>
          )}

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(2)} className="btn btn-secondary cursor-pointer">
              <ArrowLeft size={12} /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={unmappedRequired.length > 0}
              className="btn btn-primary cursor-pointer disabled:opacity-50"
            >
              Validate &amp; Preview <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Validation */}
      {step === 4 && parsedData && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">Validation Results</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Ready to import jobs into local requisition database</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-[var(--color-success-bg)] rounded-md text-center">
              <p className="text-xl font-bold text-[var(--color-success)]">{parsedData.totalRows}</p>
              <p className="text-[10px] text-[var(--color-success)] font-medium">Requisitions to Import</p>
            </div>
            <div className="p-3 bg-[var(--color-surface-secondary)] rounded-md text-center">
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{Object.keys(mappings).filter(k => !!mappings[k]).length}</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Mapped Columns</p>
            </div>
            <div className="p-3 bg-[var(--color-surface-secondary)] rounded-md text-center">
              <p className="text-xl font-bold text-sky-400">100%</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Offline Storage</p>
            </div>
          </div>

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(3)} className="btn btn-secondary cursor-pointer">
              <ArrowLeft size={12} /> Back
            </button>
            <button onClick={executeImport} className="btn btn-primary cursor-pointer">
              Import All {parsedData.totalRows} Jobs <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Complete */}
      {step === 5 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-[var(--color-success)]" />
          </div>
          <h3 className="text-sm font-medium mb-1">Import Complete!</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-5">
            Successfully imported {importedCount} live job requisitions into your local database. Candidates will now be matched against these real positions.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setStep(1); setParsedData(null); }}
              className="btn btn-secondary cursor-pointer"
            >
              Import Another Spreadsheet
            </button>
            <button
              onClick={() => navigateTo('jobs')}
              className="btn btn-primary cursor-pointer"
            >
              View Active Jobs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
