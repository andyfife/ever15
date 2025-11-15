import { AppSidebar } from '@/components/app-sidebar';
import Image from 'next/image';

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
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3"></div>
          <div className="mt-8 flex justify-center w-full">
            <div className="relative w-full max-w-5xl aspect-video">
              <Image
                src="/images/evergreen-home1.png"
                alt="Evergreen Home"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-xs"
                priority
              />
            </div>
          </div>

          {/* Text section */}
          <div className="max-w-3xl mx-auto px-4 mt-8 text-left">
            <p className="text-xl text-gray-600 leading-relaxed">
              We provide a unique opportunity for families of the Chinese
              Diaspora to preserve their immigrant experiences. This is a space
              where family members interview one another, ensuring that the
              narrative of their family&apos;s journey remains authentic and firmly
              in their hands. It&apos;s a place where families take control of their
              own stories, creating a lasting legacy for future generations.
            </p>

            {/* Show Sign Up button only if user is signed out */}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
