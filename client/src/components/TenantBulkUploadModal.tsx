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
import { usePG } from "@/hooks/use-pg";

interface BulkUploadResult {
  success: boolean; 
  dryRun: boolean;
  summary: {
    total: number;
    created: number;
    failed: number;
    emailsSent?: number;
    emailsFailed?: number;
  };
  errors: { row: number; email: string; message: string }[];
  warnings: { row: number; email: string; message: string }[];
}

interface TenantBulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TenantBulkUploadModal({ open, onOpenChange, onSuccess }: TenantBulkUploadModalProps) {
  const { pg } = usePG();
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
    if (!pg?.id) {
      toast.error("No PG selected. Please select a PG to download the template.");
      return;
    }
    try {
      const response = await api.get('/api/tenants/bulk-upload-template', {
        params: { pgId: pg.id },
        responseType: 'blob',
      });
      
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tenant_bulk_upload_template.csv';
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

      const response = await api.post('/api/tenants/bulk-upload', formData, {
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
        toast.success(`Successfully created ${data.summary.created} tenants!`);
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

      const response = await api.post('/api/tenants/bulk-upload', formData, {
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
        toast.success(`Successfully created ${data.summary.created} tenants!`);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Upload Tenants
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple tenants at once. You can also assign bed positions in the CSV.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-muted-foreground">
                    Get the CSV template with required columns
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-2"
                data-testid="button-download-template"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors hover:border-primary hover:bg-primary/5
                ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
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
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">Validate First</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Test your file before creating tenants
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dry-run"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                  data-testid="switch-dry-run"
                />
                <Label htmlFor="dry-run" className="text-amber-800 dark:text-amber-200">
                  Dry Run
                </Label>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 space-y-4 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <p className="font-medium">Processing your file...</p>
              <p className="text-sm text-muted-foreground">
                {dryRun ? 'Validating tenants...' : 'Creating tenants...'}
              </p>
            </div>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
          </div>
        )}

        {step === 'results' && result && (
          <div className="space-y-4 py-4">
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {result.dryRun ? 'Validation Complete' : 'Upload Complete'}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {result.summary.created} of {result.summary.total} tenants {result.dryRun ? 'validated' : 'created'}
                    {result.summary.failed > 0 && `, ${result.summary.failed} failed`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{result.summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-950/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{result.summary.created}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{result.dryRun ? 'Valid' : 'Created'}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-950/50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{result.summary.failed}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
              </div>
            </div>

            {!result.dryRun && (result.summary.emailsSent || result.summary.emailsFailed) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{result.summary.emailsSent || 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Emails Sent</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-950/50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{result.summary.emailsFailed || 0}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Email Failures</p>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Errors ({result.errors.length})
                </p>
                <ScrollArea className="h-[150px] border rounded-lg p-3">
                  <div className="space-y-2">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="text-sm p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800">
                        <span className="font-medium text-red-700 dark:text-red-300">
                          Row {error.row} - {error.email}:
                        </span>{' '}
                        <span className="text-red-600 dark:text-red-400">{error.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2 text-amber-600">
                  <FileWarning className="h-4 w-4" />
                  Warnings ({result.warnings.length})
                </p>
                <ScrollArea className="h-[100px] border rounded-lg p-3">
                  <div className="space-y-2">
                    {result.warnings.map((warning, idx) => (
                      <div key={idx} className="text-sm p-2 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                        <span className="font-medium text-amber-700 dark:text-amber-300">
                          Row {warning.row} - {warning.email}:
                        </span>{' '}
                        <span className="text-amber-600 dark:text-amber-400">{warning.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="gap-2"
                data-testid="button-upload-csv"
              >
                <Upload className="h-4 w-4" />
                {dryRun ? 'Validate' : 'Upload & Create'}
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
                  <Button onClick={handleActualUpload} className="gap-2" data-testid="button-confirm-upload">
                    <CheckCircle2 className="h-4 w-4" />
                    Create Tenants Now
                  </Button>
                </>
              )}
              {result.dryRun && !result.success && (
                <>
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={resetState}>
                    Fix & Re-upload
                  </Button>
                </>
              )}
              {!result.dryRun && (
                <Button onClick={handleClose}>
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
