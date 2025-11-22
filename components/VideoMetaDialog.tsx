'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, Trash2, User, Users } from 'lucide-react';
import { format } from 'date-fns';

export type Visibility = 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
export type SpeakerMeta = {
  name: string;
  relationship?: string | null;
  isSelf?: boolean;
};
export type VideoMeta = {
  name: string;
  description: string;
  visibility: Visibility;
  speakers: SpeakerMeta[];
  date?: Date | null;
  location?: string;
};

type Friend = {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  isSelf?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'edit' | 'create';
  initial: VideoMeta;
  onSubmit: (meta: VideoMeta) => Promise<void> | void;
  lockVisibility?: boolean;
};

const RELATIONSHIP_OPTIONS = [
  'Grandfather (maternal)',
  'Grandfather (paternal)',
  'Grandmother (maternal)',
  'Grandmother (paternal)',
  'Father',
  'Mother',
  'Uncle (maternal)',
  'Uncle (paternal)',
  'Aunt (maternal)',
  'Aunt (paternal)',
  "Dad's side (other)",
  "Mom's side (other)",
  'Sibling',
  'Spouse',
  'Child',
  'Friend',
  'Other',
];

export default function VideoMetaDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  lockVisibility = false,
}: Props) {
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(initial.name);
  const [description, setDescription] = React.useState(initial.description);
  const [visibility, setVisibility] = React.useState<Visibility>(
    initial.visibility
  );
  const [speakers, setSpeakers] = React.useState<SpeakerMeta[]>(() =>
    initial.speakers?.length
      ? initial.speakers.map((s) => ({
          name: typeof s === 'string' ? s : s.name || '',
          relationship: typeof s === 'string' ? undefined : s.relationship,
          isSelf: typeof s === 'string' ? false : !!s.isSelf,
        }))
      : [{ name: '', relationship: undefined, isSelf: false }]
  );
  const [date, setDate] = React.useState<Date | null>(initial.date ?? null);
  const [location, setLocation] = React.useState(initial.location ?? '');
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoadingFriends(true);
    fetch('/api/user-and-friends')
      .then((r) => r.json())
      .then((d) => setFriends(Array.isArray(d?.friends) ? d.friends : []))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setName(initial.name);
      setDescription(initial.description);
      setVisibility(initial.visibility);
      setSpeakers(
        initial.speakers?.length
          ? initial.speakers.map((s) => ({
              name: typeof s === 'string' ? s : s.name || '',
              relationship: typeof s === 'string' ? undefined : s.relationship,
              isSelf: typeof s === 'string' ? false : !!s.isSelf,
            }))
          : [{ name: '', relationship: undefined, isSelf: false }]
      );
      setDate(initial.date ?? null);
      setLocation(initial.location ?? '');
    }
  }, [open, initial]);

  const friendLabel = (f: Friend) =>
    f.username ||
    [f.firstName, f.lastName].filter(Boolean).join(' ') ||
    'Unnamed User';

  const updateSpeaker = (index: number, updates: Partial<SpeakerMeta>) => {
    setSpeakers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };

  const addSpeaker = () =>
    speakers.length < 6 &&
    setSpeakers((prev) => [
      ...prev,
      { name: '', relationship: undefined, isSelf: false },
    ]);
  const removeSpeaker = (index: number) =>
    setSpeakers((prev) => prev.filter((_, i) => i !== index));

  const submit = async () => {
    setSaving(true);
    try {
      if (!name.trim()) return alert('Please enter a title.');
      const cleaned = speakers
        .map((s) => ({ ...s, name: s.name.trim() }))
        .filter((s) => s.name);
      if (cleaned.length === 0)
        return alert('Please add at least one speaker.');

      await onSubmit({
        name: name.trim(),
        description,
        visibility,
        speakers: cleaned,
        date: date || undefined,
        location: location.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {mode === 'edit' ? 'Edit Video Details' : 'Upload New Video'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma tells her immigration story"
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this video about? Any context or memorable moments?"
              rows={3}
            />
          </div>

          {/* Speakers */}
          <div className="grid gap-3">
            <Label>
              Speakers <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-4">
              {speakers.map((speaker, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-border p-4"
                >
                  <div className="pt-2 text-sm font-medium text-muted-foreground">
                    #{idx + 1}
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Contact Selector or Custom Name */}
                    <div className="grid gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between font-normal"
                            disabled={loadingFriends}
                          >
                            {speaker.name
                              ? speaker.isSelf
                                ? `You — ${speaker.name}`
                                : speaker.name
                              : 'Select from contacts or type name...'}
                            <User className="ml-2 h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search contacts..." />
                            <CommandList>
                              <CommandEmpty>
                                {loadingFriends
                                  ? 'Loading...'
                                  : 'No contacts found.'}
                              </CommandEmpty>
                              <CommandGroup heading="You">
                                {friends
                                  .filter((f) => f.isSelf)
                                  .map((f) => (
                                    <CommandItem
                                      key={f.userId}
                                      value={f.userId}
                                      onSelect={() =>
                                        updateSpeaker(idx, {
                                          name: friendLabel(f),
                                          isSelf: true,
                                          relationship: undefined,
                                        })
                                      }
                                    >
                                      <User className="mr-2 h-4 w-4" />
                                      You — {friendLabel(f)}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                              <CommandGroup heading="Contacts">
                                {friends
                                  .filter((f) => !f.isSelf)
                                  .map((f) => (
                                    <CommandItem
                                      key={f.userId}
                                      value={f.userId}
                                      onSelect={() =>
                                        updateSpeaker(idx, {
                                          name: friendLabel(f),
                                          isSelf: false,
                                        })
                                      }
                                    >
                                      <Users className="mr-2 h-4 w-4" />
                                      {friendLabel(f)}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Custom name override */}
                      <Input
                        placeholder="Or type a custom name (e.g. Great Uncle John)"
                        value={speaker.name}
                        onChange={(e) =>
                          updateSpeaker(idx, {
                            name: e.target.value,
                            isSelf: false,
                          })
                        }
                      />
                    </div>

                    {/* Relationship (only if not self) */}
                    {!speaker.isSelf && (
                      <div className="grid gap-2">
                        <Label className="text-sm">Relationship to you</Label>
                        <Select
                          value={speaker.relationship ?? ''}
                          onValueChange={(val) =>
                            updateSpeaker(idx, {
                              relationship: val || undefined,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {speakers.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSpeaker(idx)}
                      className="mt-1"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}

              {speakers.length < 6 && (
                <Button
                  variant="outline"
                  onClick={addSpeaker}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Another Speaker
                </Button>
              )}
            </div>
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Interview Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date ?? undefined}
                    onSelect={(d) => setDate(d ?? null)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Brooklyn, NY"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="grid gap-3">
            <Label>Who can view this video?</Label>
            <div className="flex flex-wrap gap-2">
              {(['PRIVATE', 'FRIENDS', 'PUBLIC'] as Visibility[]).map((opt) => (
                <Button
                  key={opt}
                  variant={visibility === opt ? 'default' : 'outline'}
                  onClick={() => !lockVisibility && setVisibility(opt)}
                  disabled={lockVisibility}
                  className="capitalize"
                >
                  {opt === 'PRIVATE' && '🔒 Private'}
                  {opt === 'FRIENDS' && '👥 Friends'}
                  {opt === 'PUBLIC' && '🌍 Public'}
                </Button>
              ))}
            </div>
            {lockVisibility && (
              <p className="text-sm text-amber-600">
                Sharing options unlock after admin approval.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving
              ? 'Saving...'
              : mode === 'edit'
                ? 'Save Changes'
                : 'Upload Video'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
