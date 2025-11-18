'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const client = generateClient<Schema>();

type FileRecord = Schema['File']['type'];

export function FileList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      if (!client.models.File) {
        console.error('File model not available. Please deploy your backend first.');
        setFiles([]);
        return;
      }
      const { data } = await client.models.File.list();
      setFiles(data.sort((a, b) =>
        new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
      ));
    } catch (err) {
      console.error('Error fetching files:', err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleDelete = async (file: FileRecord) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      // Delete from S3
      await remove({ path: file.key });

      // Delete from database
      await client.models.File.delete({ id: file.id });

      // Refresh list
      fetchFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file');
    }
  };

  const handleVisibilityChange = async (file: FileRecord, newVisibility: 'PRIVATE' | 'PUBLIC') => {
    try {
      await client.models.File.update({
        id: file.id,
        visibility: newVisibility,
      });
      fetchFiles();
    } catch (err) {
      console.error('Error updating visibility:', err);
      alert('Failed to update visibility');
    }
  };

  const handlePreview = async (file: FileRecord) => {
    try {
      const result = await getUrl({ path: file.key });
      setPreviewUrl(result.url.toString());
      setPreviewFile(file);
    } catch (err) {
      console.error('Error getting file URL:', err);
      alert('Failed to load file preview');
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      const result = await getUrl({ path: file.key });
      const link = document.createElement('a');
      link.href = result.url.toString();
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('text')) return '📝';
    return '📎';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Loading files...</p>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No files uploaded yet. Upload your first file above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Files</CardTitle>
        <CardDescription>
          Manage your uploaded files, change visibility, or delete them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                  {file.uploadedAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={file.visibility || 'PRIVATE'}
                  onValueChange={(value) =>
                    handleVisibilityChange(file, value as 'PRIVATE' | 'PUBLIC')
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">
                      <Badge variant="secondary">Private</Badge>
                    </SelectItem>
                    <SelectItem value="PUBLIC">
                      <Badge variant="default">Public</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(file)}
                    >
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{previewFile?.name}</DialogTitle>
                      <DialogDescription>
                        {previewFile?.type} • {previewFile && formatFileSize(previewFile.size)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      {previewFile?.type.startsWith('image/') && (
                        <img src={previewUrl} alt={previewFile.name} className="w-full h-auto" />
                      )}
                      {previewFile?.type.startsWith('video/') && (
                        <video src={previewUrl} controls className="w-full h-auto" />
                      )}
                      {previewFile?.type.startsWith('audio/') && (
                        <audio src={previewUrl} controls className="w-full" />
                      )}
                      {!previewFile?.type.startsWith('image/') &&
                        !previewFile?.type.startsWith('video/') &&
                        !previewFile?.type.startsWith('audio/') && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                              Preview not available for this file type
                            </p>
                            <Button onClick={() => previewFile && handleDownload(previewFile)}>
                              Download File
                            </Button>
                          </div>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                >
                  Download
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(file)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
