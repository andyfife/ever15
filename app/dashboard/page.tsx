'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { FileUpload } from '@/components/file-upload';
import { FileList } from '@/components/file-list';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export default function Page() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>My Files</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-8 p-4 md:p-8">
          <div className="max-w-5xl w-full mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">File Management</h1>
              <p className="text-muted-foreground">
                Upload and manage your photos, videos, documents, and more.
                Control who can access your files with visibility settings.
              </p>
            </div>

            <FileUpload onUploadComplete={handleUploadComplete} />

            <FileList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
