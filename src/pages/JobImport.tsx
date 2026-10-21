import { useState } from 'react';
import { Upload, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const mockHeaders = ['Job Title', 'Discipline', 'Site Location', 'City', 'State', 'Facility Name', 'Shift Type', 'Duration', 'Start Date'];
const mockRows = [
  ['ICU Registered Nurse', 'ICU', 'Mercy General Hospital', 'Sacramento', 'CA', 'Mercy General', 'Nights', '13 weeks', '2025-02-01'],
  ['Physical Therapist', 'Orthopedics', 'Bone & Joint Clinic', 'Tulsa', 'OK', 'BJC', 'Days', '26 weeks', '2025-02-15'],
  ['Emergency RN', 'Emergency', 'Northwestern Memorial', 'Chicago', 'IL', 'Northwestern', 'Nights', '13 weeks', '2025-03-01'],
  ['MRI Technologist', 'MRI', 'UCHealth', 'Denver', 'CO', 'UCHealth', 'Days', 'Permanent', '2025-02-10'],
  ['NICU RT', 'Neonatal', 'Children\'s Healthcare', 'Atlanta', 'GA', 'CHOA', 'Nights', '13 weeks', '2025-02-20'],
];

const canonicalFields = [
  { key: 'position', label: 'Position', required: true },
  { key: 'specialty', label: 'Specialty', required: true },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'facility', label: 'Facility', required: false },
];

const autoMappings: Record<string, string> = {
  position: 'Job Title',
  specialty: 'Discipline',
  city: 'City',
  state: 'State',
  facility: 'Facility Name',
};

export function JobImport() {
  const { navigateTo, addImportedFile, addNotification } = useAppStore();
  const [step, setStep] = useState<WizardStep>(1);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({ ...autoMappings });
  const [fileName, setFileName] = useState('');

  const handleImport = () => {
    const currentFileName = fileName || uploadedFile || 'hospital_job_requisitions.xlsx';
    addImportedFile({
      id: `file-jobs-${Date.now()}`,
      filename: currentFileName,
      type: 'jobs',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'completed',
      recordCount: 21,
    });

    addNotification({
      title: 'Job File Imported',
      message: `Imported ${currentFileName} with 21 job positions to local storage.`,
      read: false,
      type: 'success',
    });

    setStep(5);
  };

  const handleFileUpload = (name: string) => {
    setFileName(name);
    setUploadedFile(name);
    setStep(2);
  };

  const unmappedRequired = canonicalFields.filter(f => f.required && !mappings[f.key]);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Import Jobs</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Import job listings from Excel or CSV files. Demo import — no data is actually saved.</p>
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

      {/* Step 1 - Upload */}
      {step === 1 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">Upload Job File</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Accept .xlsx, .xls, and .csv files</p>
          <div
            onClick={() => handleFileUpload('healthcare_positions_q1_2025.xlsx')}
            className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-secondary)]/50 transition-all"
          >
            <FileSpreadsheet size={28} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Click to select a file</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">or drag and drop here</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">.xlsx</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">.xls</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--color-surface-tertiary)] border border-[var(--color-border)] rounded">.csv</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[var(--color-surface-secondary)] rounded-md">
            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              <strong>Demo:</strong> Click the drop zone to simulate uploading a file. In production, this would connect to the FastAPI backend for real file processing.
            </p>
          </div>
        </div>
      )}

      {/* Step 2 - Preview */}
      {step === 2 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">File Preview</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Review the detected content before mapping columns</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">File</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{fileName}</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Sheet</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">Sheet1</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Rows</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">24</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Columns</p>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">{mockHeaders.length}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-[var(--color-text-tertiary)] mb-2">Detected Headers</p>
            <div className="flex flex-wrap gap-1.5">
              {mockHeaders.map(h => (
                <span key={h} className="px-2 py-0.5 text-[10px] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] rounded font-medium">{h}</span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-[var(--color-border)] rounded-md">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                  {mockHeaders.map(h => (
                    <th key={h} className="text-left font-medium text-[var(--color-text-tertiary)] px-2.5 py-1.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {mockRows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-2.5 py-1.5 text-[var(--color-text-secondary)] whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(1)} className="btn btn-secondary">
              <ArrowLeft size={12} /> Back
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary">
              Map Columns <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 - Map columns */}
      {step === 3 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">Map Columns</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Map source columns to required fields. Auto-mapping has been applied where possible.</p>

          <div className="space-y-3">
            {canonicalFields.map(field => (
              <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="sm:w-32 flex-shrink-0">
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
                    <option value="">Select column...</option>
                    {mockHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
                </div>
                {mappings[field.key] && autoMappings[field.key] === mappings[field.key] && (
                  <span className="text-[10px] text-[var(--color-success)] flex items-center gap-0.5">
                    <CheckCircle size={10} /> Auto-mapped
                  </span>
                )}
              </div>
            ))}
          </div>

          {unmappedRequired.length > 0 && (
            <div className="mt-3 p-2.5 bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/20 rounded-md flex items-start gap-2">
              <AlertTriangle size={13} className="text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[var(--color-warning)]">
                Required fields not mapped: {unmappedRequired.map(f => f.label).join(', ')}
              </p>
            </div>
          )}

          <div className="mt-4 p-2.5 bg-[var(--color-surface-secondary)] rounded-md">
            <p className="text-[10px] text-[var(--color-text-tertiary)]">
              <strong>Unmapped columns:</strong> {mockHeaders.filter(h => !Object.values(mappings).includes(h)).join(', ') || 'None'}
            </p>
          </div>

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(2)} className="btn btn-secondary">
              <ArrowLeft size={12} /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={unmappedRequired.length > 0}
              className="btn btn-primary"
            >
              Validate <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4 - Validate */}
      {step === 4 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 animate-fade-in">
          <h3 className="text-sm font-medium mb-1">Validation Results</h3>
          <p className="text-xs text-[var(--color-text-tertiary)] mb-4">Review data quality before importing</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="p-2.5 bg-[var(--color-success-bg)] rounded-md text-center">
              <p className="text-lg font-semibold text-[var(--color-success)]">21</p>
              <p className="text-[10px] text-[var(--color-success)]">Valid rows</p>
            </div>
            <div className="p-2.5 bg-[var(--color-warning-bg)] rounded-md text-center">
              <p className="text-lg font-semibold text-[var(--color-warning)]">2</p>
              <p className="text-[10px] text-[var(--color-warning)]">Missing fields</p>
            </div>
            <div className="p-2.5 bg-[var(--color-error-bg)] rounded-md text-center">
              <p className="text-lg font-semibold text-[var(--color-error)]">1</p>
              <p className="text-[10px] text-[var(--color-error)]">Invalid data</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-tertiary)] rounded-md text-center">
              <p className="text-lg font-semibold text-[var(--color-text-secondary)]">0</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Duplicates</p>
            </div>
          </div>

          <div className="border border-[var(--color-border)] rounded-md overflow-hidden">
            <div className="bg-[var(--color-surface-secondary)] px-3 py-2 border-b border-[var(--color-border)]">
              <p className="text-[10px] font-medium text-[var(--color-text-secondary)]">Issues Found</p>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              <div className="flex items-center gap-2 px-3 py-2">
                <AlertTriangle size={11} className="text-[var(--color-warning)] flex-shrink-0" />
                <p className="text-[10px] text-[var(--color-text-secondary)]">Row 14: Missing "State" value</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <AlertTriangle size={11} className="text-[var(--color-warning)] flex-shrink-0" />
                <p className="text-[10px] text-[var(--color-text-secondary)]">Row 19: Missing "City" value</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2">
                <XCircle size={11} className="text-[var(--color-error)] flex-shrink-0" />
                <p className="text-[10px] text-[var(--color-text-secondary)]">Row 22: Invalid date format in "Start Date"</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-5">
            <button onClick={() => setStep(3)} className="btn btn-secondary">
              <ArrowLeft size={12} /> Back
            </button>
            <button onClick={handleImport} className="btn btn-primary cursor-pointer">
              Import <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5 - Summary */}
      {step === 5 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[var(--color-success-bg)] flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={24} className="text-[var(--color-success)]" />
          </div>
          <h3 className="text-sm font-medium mb-1">Import Complete</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-5">Job positions imported and saved to device Local Storage</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 max-w-md mx-auto">
            <div className="p-2.5 bg-[var(--color-success-bg)] rounded-md">
              <p className="text-lg font-semibold text-[var(--color-success)]">21</p>
              <p className="text-[10px] text-[var(--color-success)]">Imported</p>
            </div>
            <div className="p-2.5 bg-[var(--color-warning-bg)] rounded-md">
              <p className="text-lg font-semibold text-[var(--color-warning)]">2</p>
              <p className="text-[10px] text-[var(--color-warning)]">Skipped</p>
            </div>
            <div className="p-2.5 bg-[var(--color-surface-tertiary)] rounded-md">
              <p className="text-lg font-semibold text-[var(--color-text-secondary)]">0</p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">Duplicates</p>
            </div>
            <div className="p-2.5 bg-[var(--color-error-bg)] rounded-md">
              <p className="text-lg font-semibold text-[var(--color-error)]">1</p>
              <p className="text-[10px] text-[var(--color-error)]">Failed</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setStep(1); setUploadedFile(null); setFileName(''); }}
              className="btn btn-secondary"
            >
              Import Another File
            </button>
            <button
              onClick={() => navigateTo('jobs')}
              className="btn btn-primary"
            >
              View Jobs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
