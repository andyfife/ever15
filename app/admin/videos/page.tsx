'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BatchJob = {
  jobId: string;
  jobName: string;
  status: string;
  statusReason?: string;
  createdAt: number;
  startedAt?: number;
  stoppedAt?: number;
  jobDefinition?: string;
  logStreamName?: string;
  vcpus?: number;
  memory?: number;
  exitCode?: number;
};

type AdminBatchJobsResponse = {
  jobs: BatchJob[];
  total: number;
  region: string;
  queue: string;
};

export default function AdminVideosPage() {
  const [data, setData] = useState<AdminBatchJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/batch-jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch batch jobs');
      }
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      SUBMITTED: 'secondary',
      PENDING: 'secondary',
      RUNNABLE: 'default',
      STARTING: 'default',
      RUNNING: 'default',
      SUCCEEDED: 'outline',
      FAILED: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp); // AWS Batch returns milliseconds, not seconds
    return date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getCloudWatchUrl = (logStreamName?: string) => {
    if (!logStreamName || !data?.region) return null;

    const logGroup = '/aws/batch/job';
    return `https://${data.region}.console.aws.amazon.com/cloudwatch/home?region=${data.region}#logsV2:log-groups/log-group/${encodeURIComponent(logGroup)}/log-events/${encodeURIComponent(logStreamName)}`;
  };

  const activeJobs = data?.jobs.filter(j =>
    ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING'].includes(j.status)
  ).length || 0;

  const completedJobs = data?.jobs.filter(j =>
    j.status === 'SUCCEEDED'
  ).length || 0;

  const failedJobs = data?.jobs.filter(j =>
    j.status === 'FAILED'
  ).length || 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AWS Batch Job Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of GPU video processing jobs
            {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Succeeded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-500 bg-red-50 text-red-900 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="text-center py-8">Loading...</div>
      )}

      {/* Batch Jobs Table */}
      {data && data.jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Jobs ({data.jobs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.jobs.map((job) => {
                    const duration = job.startedAt && job.stoppedAt
                      ? (job.stoppedAt - job.startedAt)
                      : job.startedAt
                      ? (Date.now() - job.startedAt)
                      : null;

                    return (
                      <TableRow key={job.jobId}>
                        <TableCell>
                          <div className="font-medium max-w-xs truncate">
                            {job.jobName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono text-muted-foreground">
                            {job.jobId.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(job.status)}
                            {job.statusReason && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {job.statusReason}
                              </div>
                            )}
                            {job.exitCode !== undefined && job.exitCode !== 0 && (
                              <div className="text-xs text-red-600">
                                Exit code: {job.exitCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {job.vcpus && job.memory
                              ? `${job.vcpus} vCPUs, ${(job.memory / 1024).toFixed(0)}GB`
                              : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTimestamp(job.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.startedAt ? formatTimestamp(job.startedAt) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {duration ? formatDuration(duration) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {job.logStreamName && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = getCloudWatchUrl(job.logStreamName);
                                  if (url) window.open(url, '_blank');
                                }}
                              >
                                View Logs
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {data && data.jobs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No batch jobs found. Upload a video to start processing!
          </CardContent>
        </Card>
      )}

      {/* Region Info */}
      {data && (
        <div className="text-sm text-muted-foreground text-center">
          Queue: {data.queue} • Region: {data.region} • Timezone: Pacific (PST/PDT)
        </div>
      )}
    </div>
  );
}
