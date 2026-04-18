import { useState, useRef } from "react";
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X, AlertTriangle, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/apiClient";

interface BulkUploadResult {
  success: boolean;
  dryRun: boolean;
  summary: {
    total: number;
    created: number;
    failed: number;
  };
  errors: { row: number; roomNumber: string; message: string }[];
  warnings: { row: number; roomNumber: string; message: string }[];
}

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkUploadModal({ open, onOpenChange, onSuccess }: BulkUploadModalProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setDryRun(true);
    setIsUploading(false);
    setUploadProgress(0);
    setResult(null);
  };

  const handleClose = () => {
    if (result && result.success && !result.dryRun) {
      onSuccess?.();
    }
    resetState();
    onOpenChange(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/api/rooms/bulk-upload-template', {
        responseType: 'blob',
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'room_bulk_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to download template');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        toast.error('Please drop a CSV file');
        return;
      }
      setFile(droppedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStep('processing');
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', dryRun.toString());

      setUploadProgress(30);

      const response = await api.post('/api/rooms/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(80);

      const data = response.data;

      setUploadProgress(100);

      setResult(data);
      setStep('results');

      if (data.success && !data.dryRun) {
        toast.success(`Successfully created ${data.summary.created} rooms!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to upload file');
      setStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleActualUpload = async () => {
    if (!file) return;
    setDryRun(false);
    
    setIsUploading(true);
    setStep('processing');
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', 'false');

      setUploadProgress(30);

      const response = await api.post('/api/rooms/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(80);

      const data = response.data;

      setUploadProgress(100);

      setResult(data);
      setStep('results');

      if (data.success) {
        toast.success(`Successfully created ${data.summary.created} rooms!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to upload file');
      setStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Bulk Upload Rooms</span>
          </DialogTitle>
          <DialogDescription className="text-base mt-1">
            Upload a CSV file to efficiently add multiple rooms at once. You can also map tenants to rooms directly in the file.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-background rounded-xl border shadow-sm">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">CSV Template</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                    Get the CSV template with required columns
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                className="gap-2 shadow-sm"
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer
                transition-all duration-300 ease-in-out
                ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'}
              `}
              data-testid="dropzone-csv-upload"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-file-csv"
              />
              {file ? (
                <div className="flex items-center justify-center gap-4 bg-background p-4 rounded-xl shadow-sm border w-full max-w-sm">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="font-semibold text-foreground text-base">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-background rounded-xl border shadow-sm">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Validation Mode</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5">
                    Test your file before creating rooms
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background p-2 rounded-lg border shadow-sm">
                <Switch
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                  data-testid="switch-dry-run"
                />
                <Label htmlFor="dry-run" className="text-foreground font-semibold cursor-pointer select-none">
                  Dry Run
                </Label>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-10 space-y-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
                <Upload className="h-6 w-6 text-primary-foreground animate-bounce" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-bold tracking-tight">Processing your file...</p>
              <p className="text-sm font-medium text-muted-foreground">
                {dryRun ? 'Running comprehensive validation checks on rooms...' : 'Creating rooms and mapping tenants in the database...'}
              </p>
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <Progress value={uploadProgress} className="w-full h-3" />
              <p className="text-xs font-semibold text-right text-primary">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {step === 'results' && result && (
          <div className="space-y-4 py-2">
            <div className={`p-5 rounded-2xl border shadow-sm flex items-start gap-4 ${
              result.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' 
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
            }`}>
              <div className={`p-3 rounded-xl shrink-0 shadow-sm border ${result.success ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-900/50 border-red-200 dark:border-red-800'}`}>
                {result.success ? (
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="pt-1">
                <h3 className={`text-lg font-bold ${result.success ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                  {result.dryRun ? 'Validation Complete' : 'Upload Complete'}
                </h3>
                <p className={`text-sm font-medium mt-1 leading-relaxed ${result.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
                  Successfully {result.dryRun ? 'validated' : 'created'} <span className="font-bold">{result.summary.created}</span> out of <span className="font-bold">{result.summary.total}</span> rooms.
                  {result.summary.failed > 0 && <span> Unfortunately, <span className="font-bold">{result.summary.failed}</span> failed to process.</span>}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-2xl border shadow-sm text-center flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-foreground">{result.summary.total}</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Total Rows</p>
              </div>
              <div className="p-4 bg-background rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm text-center flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{result.summary.created}</p>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-1">{result.dryRun ? 'Valid' : 'Created'}</p>
              </div>
              <div className="p-4 bg-background rounded-2xl border border-red-200 dark:border-red-800/50 shadow-sm text-center flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-red-600 dark:text-red-400">{result.summary.failed}</p>
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mt-1">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2 text-red-700 dark:text-red-400">
                  <div className="p-1 bg-red-100 dark:bg-red-900/50 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  Critical Issues ({result.errors.length})
                </h4>
                <ScrollArea className="h-[120px] rounded-xl border bg-muted/30 p-3">
                  <div className="space-y-2">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm p-2.5 bg-background rounded-xl border border-red-100 dark:border-red-900/50 shadow-sm">
                        <div className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-mono text-xs rounded-md border border-red-100 dark:border-red-800 shrink-0 mt-0.5">
                          Row {error.row}
                        </div>
                        <div className="flex-1 leading-snug">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{error.roomNumber}</span>
                          <span className="text-zinc-400 dark:text-zinc-600 mx-2">•</span>
                          <span className="font-medium text-red-600 dark:text-red-400">{error.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded-md">
                    <FileWarning className="h-4 w-4" />
                  </div>
                  Warnings ({result.warnings.length})
                </h4>
                <ScrollArea className="h-[100px] rounded-xl border bg-muted/30 p-3">
                  <div className="space-y-2">
                    {result.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm p-2.5 bg-background rounded-xl border border-amber-100 dark:border-amber-900/50 shadow-sm">
                        <div className="px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-mono text-xs rounded-md border border-amber-100 dark:border-amber-800 shrink-0 mt-0.5">
                          Row {warning.row}
                        </div>
                        <div className="flex-1 leading-snug">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{warning.roomNumber}</span>
                          <span className="text-zinc-400 dark:text-zinc-600 mx-2">•</span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">{warning.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="default"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="gap-2"
                data-testid="button-upload-csv"
              >
                <Upload className="h-4 w-4" />
                {dryRun ? 'Start Validation' : 'Upload & Create'}
              </Button>
            </>
          )}

          {step === 'results' && result && (
            <>
              {result.dryRun && result.success && (
                <>
                  <Button variant="outline" onClick={resetState}>
                    Upload Different File
                  </Button>
                  <Button onClick={handleActualUpload} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="button-confirm-upload">
                    <CheckCircle2 className="h-4 w-4" />
                    Create Rooms Now
                  </Button>
                </>
              )}
              {result.dryRun && !result.success && (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={resetState} variant="default">
                    Fix & Re-upload
                  </Button>
                </>
              )}
              {!result.dryRun && (
                <Button onClick={handleClose} variant="default">
                  Done
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
