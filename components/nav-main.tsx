'use client';

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as React from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      badge?: string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  // Calculate which items should be open based on current path
  const getOpenItems = React.useCallback(() => {
    const openMap: Record<string, boolean> = {};
    items.forEach((item) => {
      const hasActiveChild = item.items?.some(
        (subItem) => pathname === subItem.url
      );
      if (item.isActive || hasActiveChild) {
        openMap[item.title] = true;
      }
    });
    return openMap;
  }, [items, pathname]);

  const [openItems, setOpenItems] = React.useState(getOpenItems);

  // Recalculate when pathname changes
  React.useEffect(() => {
    setOpenItems(getOpenItems());
  }, [getOpenItems]);

  const handleOpenChange = (title: string, isOpen: boolean) => {
    setOpenItems((prev) => ({ ...prev, [title]: isOpen }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel></SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={openItems[item.title] ?? false}
            onOpenChange={(isOpen) => handleOpenChange(item.title, isOpen)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === subItem.url}
                      >
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                          {subItem.badge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
