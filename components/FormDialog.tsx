// components/FormDialog.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { contactSchema } from '@/schemas/project';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAppForm } from '@/components/form/hooks';
import { useState, useId } from 'react';

import { ReactNode } from 'react';
import { createProject } from '@/app/actions/project';

type FormData = z.infer<typeof contactSchema>;

type FieldRenderPropsType<TFormData, TName extends keyof TFormData> = {
  Input: (props: { label: string; type?: string }) => ReactNode;
  Textarea: (props: { label: string; description?: string }) => ReactNode;
};

export default function FormDialog() {
  const [open, setOpen] = useState(false);
  const dialogId = useId(); // Stable ID for DialogContent

  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      comment: '',
    } satisfies FormData as FormData,
    validators: {
      onSubmit: contactSchema,
    },
    onSubmit: async ({ value }: { value: FormData }) => {
      const res = await createProject(value);

      if (res.success) {
        form.reset();
        setOpen(false);
        toast.success('Contact submitted successfully!', {
          description: JSON.stringify(value, null, 2),
          className: 'whitespace-pre-wrap font-mono',
        });
      } else {
        toast.error('Failed to submit contact form.');
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Contact Us</Button>
      </DialogTrigger>
      <DialogContent
        id={`contact-dialog-${dialogId}`}
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>Please Get In Touch</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField name="name">
              {(field: FieldRenderPropsType<FormData, 'name'>) => (
                <field.Input label="Name" />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field: FieldRenderPropsType<FormData, 'email'>) => (
                <field.Input label="Email" type="email" />
              )}
            </form.AppField>
            <form.AppField name="comment">
              {(field: FieldRenderPropsType<FormData, 'comment'>) => (
                <field.Textarea
                  label="Comment"
                  description="Be as detailed as possible"
                />
              )}
            </form.AppField>
            {/* Optional: Add userId input if needed */}
            {/* <form.AppField name="userId">
              {(field: FieldRenderPropsType<FormData, "userId">) => (
                <field.Input label="User ID" />
              )}
            </form.AppField> */}

            <FieldSeparator />

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
