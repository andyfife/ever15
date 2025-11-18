'use client';

import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const client = generateClient<Schema>();

export function FileUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!client.models.File) {
      setError('Backend not ready. Please deploy your Amplify backend first by running: npx ampx sandbox');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Determine the S3 path based on visibility
      const path = visibility === 'PUBLIC' ? 'public/' : 'private/';
      const fileName = `${Date.now()}-${file.name}`;
      const fullPath = `${path}${fileName}`;

      // Upload to S3
      const result = await uploadData({
        path: fullPath,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      // Create database record
      await client.models.File.create({
        name: file.name,
        key: result.path,
        size: file.size,
        type: file.type,
        visibility: visibility,
        uploadedAt: new Date().toISOString(),
      });

      setSuccess(`File uploaded successfully!`);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Callback to refresh file list
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload File</CardTitle>
        <CardDescription>
          Upload photos, videos, documents, and more. Choose visibility to control who can access your files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-input">Select File</Label>
          <Input
            id="file-input"
            type="file"
            accept="image/*,video/*,.pdf,.txt,.doc,.docx"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={visibility}
            onValueChange={(value) => setVisibility(value as 'PRIVATE' | 'PUBLIC')}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIVATE">Private - Only you can access</SelectItem>
              <SelectItem value="PUBLIC">Public - Anyone can view</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {success && (
          <p className="text-sm text-green-600">{success}</p>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </CardContent>
    </Card>
  );
}
