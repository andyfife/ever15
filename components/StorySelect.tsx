'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MotionTrigger = motion(SelectTrigger);

export default function StorySelect() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const overlayControls = useAnimation();

  const options = [
    { label: 'Clara', url: '/who-we-are/our-story/clara' },
    { label: 'Zhangyu', url: '/who-we-are/our-story/zhangyu' },
    { label: 'Sanbuzha', url: '/who-we-are/our-story/sanbuzha' },
  ];

  async function handleChange(targetUrl: string) {
    if (isTransitioning) return;
    setIsTransitioning(true);

    try {
      // 1) Prefetch the next page bundle (Next will fetch the route ahead of time)
      if (router.prefetch) await router.prefetch(targetUrl);

      // 2) Animate a quick fade overlay to cover the UI
      await overlayControls.start({
        opacity: 1,
        transition: { duration: 0.18, ease: 'easeIn' },
      });

      // small pause so overlay feels smooth
      await new Promise((r) => setTimeout(r, 40));

      // 3) Navigate (should be near-instant if prefetch happened)
      router.push(targetUrl);
    } catch (err) {
      // fallback — navigate anyway
      router.push(targetUrl);
    } finally {
      // keep the overlay until the new page handles its own entrance animation
      setIsTransitioning(false);
    }
  }

  return (
    <>
      <div className="max-w-md">
        <Select
          onValueChange={(value) => handleChange(value)}
          disabled={isTransitioning}
        >
          {/* Use a motion-enabled trigger so hover/tap are animated */}
          <MotionTrigger
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-disabled={isTransitioning}
          >
            <SelectValue placeholder="Select a story" />
          </MotionTrigger>

          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.url} value={opt.url}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Full-screen overlay controlled by framer-motion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={overlayControls}
        // block pointer events while transitioning so user can't interact
        style={{ pointerEvents: isTransitioning ? 'auto' : 'none' }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      >
        {/* Keep text hidden until overlay nearly opaque to avoid flash */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={
            isTransitioning
              ? { opacity: 1, transition: { delay: 0.16 } }
              : { opacity: 0 }
          }
          className="text-lg font-semibold text-gray-700 select-none"
        >
          Loading…
        </motion.div>
      </motion.div>
    </>
  );
}
