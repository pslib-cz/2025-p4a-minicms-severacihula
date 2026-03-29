"use client";

import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@nextui-org/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createTripSchema } from "@/lib/validations/trip";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type Trip = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  publishDate: string;
  published: boolean;
  tags: Tag[];
};

type FormValues = {
  title: string;
  slug: string;
  description: string;
  content: string;
  publishDate: string;
  published: boolean;
  tagIds: string[];
};

type TripFormProps = {
  mode: "create" | "edit";
  tripId?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const toLocalDateTimeInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset() * 60_000;
  const localIso = new Date(date.getTime() - offset).toISOString();
  return localIso.slice(0, 16);
};

const fetchJson = async <T,>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Request failed");
  }
  return (await response.json()) as T;
};

export function TripForm({ mode, tripId }: TripFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => fetchJson<Tag[]>("/api/tags"),
  });

  const tripQuery = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => fetchJson<Trip>(`/api/trips/${tripId}`),
    enabled: mode === "edit" && Boolean(tripId),
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      createTripSchema.extend({
        publishDate: z.string().min(1),
      }),
    ),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      publishDate: "",
      published: false,
      tagIds: [],
    },
  });

  useEffect(() => {
    if (tripQuery.data) {
      setValue("title", tripQuery.data.title);
      setValue("slug", tripQuery.data.slug);
      setValue("description", tripQuery.data.description);
      setValue("content", tripQuery.data.content);
      setValue("publishDate", toLocalDateTimeInputValue(tripQuery.data.publishDate));
      setValue("published", tripQuery.data.published);
      setValue(
        "tagIds",
        tripQuery.data.tags.map((tag) => tag.id),
      );
    }
  }, [tripQuery.data, setValue]);

  const titleValue = watch("title");
  const slugValue = watch("slug");

  useEffect(() => {
    if (!slugValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugValue, setValue]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        publishDate: new Date(values.publishDate),
      };

      if (mode === "edit" && tripId) {
        return fetchJson(`/api/trips/${tripId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      return fetchJson("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      }
      toast.success("Cesta byla uspesne ulozena.");
      router.push("/dashboard/trips");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodarilo se ulozit cestu.");
    },
  });

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  if (tripQuery.isLoading) {
    return <p className="text-sm text-slate-600">Nacitam data cesty...</p>;
  }

  return (
    <Card>
      <CardBody>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Title"
            placeholder="Nazev cesty"
            {...register("title")}
            isInvalid={Boolean(errors.title)}
            errorMessage={errors.title?.message}
          />

          <Input
            label="Slug"
            placeholder="napr-vikend-v-rime"
            {...register("slug")}
            isInvalid={Boolean(errors.slug)}
            errorMessage={errors.slug?.message}
          />

          <Textarea
            label="Description"
            placeholder="Kratky perex"
            {...register("description")}
            isInvalid={Boolean(errors.description)}
            errorMessage={errors.description?.message}
          />

          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <div>
                <p className="mb-2 text-sm font-medium">Content</p>
                <RichTextEditor value={field.value} onChange={field.onChange} />
                {errors.content?.message ? (
                  <p className="mt-2 text-xs text-danger">{errors.content.message}</p>
                ) : null}
              </div>
            )}
          />

          <Input
            label="Publish Date"
            type="datetime-local"
            {...register("publishDate")}
            isInvalid={Boolean(errors.publishDate)}
            errorMessage={errors.publishDate?.message}
          />

          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <Switch isSelected={field.value} onValueChange={field.onChange}>
                Publikovano
              </Switch>
            )}
          />

          <Controller
            control={control}
            name="tagIds"
            render={({ field }) => (
              <Select
                label="Tags"
                selectionMode="multiple"
                selectedKeys={new Set(field.value)}
                onSelectionChange={(keys) => {
                  field.onChange(Array.from(keys).map(String));
                }}
                isLoading={tagsQuery.isLoading}
                isInvalid={Boolean(errors.tagIds)}
                errorMessage={errors.tagIds?.message as string | undefined}
              >
                {(tagsQuery.data ?? []).map((tag) => (
                  <SelectItem key={tag.id}>{tag.name}</SelectItem>
                ))}
              </Select>
            )}
          />

          <div className="flex gap-3">
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              Ulozit
            </Button>
            <Button as={Link} href="/dashboard/trips" variant="flat">
              Zrusit
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
