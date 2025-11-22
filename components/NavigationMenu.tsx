'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { usePathname } from 'next/navigation';

interface NavigationMenuDemoProps {
  user: any | null;
}

export function NavigationMenuDemo({ user }: NavigationMenuDemoProps) {
  const isSignedIn = !!user?.username; // or user?.id depending on your shape
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Home */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/">Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>Who We Are</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="/who-we-are/about-us">About Us</Link>
                </NavigationMenuLink>

                <NavigationMenuLink asChild>
                  <Link href="/who-we-are/our-mission">Our Mission</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="/who-we-are/our-story">Our Story</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="/who-we-are/our-team">Our Team</Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {/* Get Started */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={isSignedIn ? '/videos/upload' : '/signup'}>
              Get Started
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/archived-stories">Archived Stories</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        {/* Contact Us */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/contact-us">Contact Us</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Donate */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link
              href="https://www.globalgiving.org/donate/33117/evergreen-education-foundation/"
              target="_blank"
            >
              Donate
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
