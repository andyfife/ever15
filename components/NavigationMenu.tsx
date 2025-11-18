'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

const components: { title: string; href: string; description: string }[] = [
  {
    title: 'Our Vision and Mission',
    href: '/about-us/our-vision-and-mission',
    description:
      'Imagine every child in rural China having access to state-of-the-art educational opportunities.',
  },
  {
    title: 'Our Founders',
    href: '/about-us/our-founders',
    description: 'Visionaries of Change . Architects of Opportunity',
  },
  {
    title: 'Our Legacy',
    href: '/about-us/our-legacy',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Our Team',
    href: '/about-us/our-team',
    description:
      'Our team members represent a wide spectrum of experience and qualifications. ',
  },
  {
    title: 'Our Emeriti',
    href: '/about-us/our-emeriti',
    description:
      'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
];

export function NavigationMenuDemo() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same height to prevent layout shift
    return (
      <div className="relative z-10 flex h-9 max-w-max flex-1 items-center justify-center">
        <div className="flex-wrap flex gap-1">
          <div className="h-9 w-16 rounded-md bg-transparent" /> {/* Home */}
          <div className="h-9 w-24 rounded-md bg-transparent" />{' '}
          {/* Who We Are */}
          <div className="h-9 w-24 rounded-md bg-transparent" />{' '}
          {/* What We Do */}
          <div className="h-9 w-24 rounded-md bg-transparent" />{' '}
          {/* Contact Us */}
          <div className="h-9 w-20 rounded-md bg-transparent" /> {/* Donate */}
        </div>
      </div>
    );
  }

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className="flex-wrap">
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/">Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Who We Are</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {components.map((component) => (
                <ListItem
                  key={component.title}
                  title={component.title}
                  href={component.href}
                >
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden md:block">
          <NavigationMenuTrigger>What We Do</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-4">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="#">Our Work Overview</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="family-story">Family Story</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="household-library">Household Library</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="early-childhood">Early Childhood</Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="conferences-and-workshops">
                    Conferences and Workshops
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link href="publications-and-presentations">
                    Publications and Presentations
                  </Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href="/contact-us">Contact Us</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
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

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
