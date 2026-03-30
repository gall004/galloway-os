import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, CopyCheck } from 'lucide-react';
import { fetchWeeklyReport } from '@/lib/api';
import { toast } from 'sonner';

/**
 * @description Renders a button that fetches the weekly status report and copies it to clipboard.
 */
export default function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await fetchWeeklyReport(7);
      if (data && data.report) {
        await navigator.clipboard.writeText(data.report);
        setCopied(true);
        toast.success('Report copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error('Failed to parse report data.');
      }
    } catch (err) {
      toast.error('Failed to generate report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleGenerate} 
      disabled={loading}
      className="text-xs shrink-0"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
      ) : copied ? (
        <CopyCheck className="w-3.5 h-3.5 mr-1.5 text-green-500" />
      ) : (
        <FileText className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
      )}
      {copied ? 'Copied to Clipboard' : 'Weekly Report'}
    </Button>
  );
}
