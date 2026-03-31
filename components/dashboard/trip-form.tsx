"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
} from "@nextui-org/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { deleteBlobImage, uploadImagesAction } from "@/app/lib/actions/upload";
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
  mainImageUrl: string | null;
  galleryImageUrls: string[];
  tags: Tag[];
};

const tripFormSchema = z.object({
  title: z.string().trim().min(1, { message: "Toto pole je povinné" }),
  slug: z.string().trim().min(1, { message: "Toto pole je povinné" }),
  description: z.string().trim().min(1, { message: "Toto pole je povinné" }),
  content: z.string().min(1, { message: "Toto pole je povinné" }),
  mainImageUrl: z.string().optional(),
  galleryImageUrls: z.array(z.string()),
  tags: z.array(z.string()),
  publishDate: z.string().min(1, { message: "Toto pole je povinné" }),
  published: z.boolean(),
});

type FormValues = z.infer<typeof tripFormSchema>;

type TripFormProps = {
  mode: "create" | "edit";
  tripId?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const isValidHttpUrl = (value?: string | null) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const baseFieldClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-slate-900 outline-none transition-all duration-200 ease-in-out focus:ring-2 focus:ring-blue-600";

export function TripForm({ mode, tripId }: TripFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [lastAutoSlug, setLastAutoSlug] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mainImagePreviewUrl, setMainImagePreviewUrl] = useState<string | null>(null);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [urlsToDelete, setUrlsToDelete] = useState<string[]>([]);

  const tripQuery = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => fetchJson<Trip>(`/api/trips/${tripId}`),
    enabled: mode === "edit" && Boolean(tripId),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      content: "",
      mainImageUrl: "",
      galleryImageUrls: [],
      tags: [],
      publishDate: "",
      published: false,
    },
  });

  useEffect(() => {
    if (mode === "edit" && tripQuery.data) {
      reset({
        title: tripQuery.data.title,
        slug: tripQuery.data.slug,
        description: tripQuery.data.description,
        content: tripQuery.data.content,
        mainImageUrl: tripQuery.data.mainImageUrl ?? "",
        galleryImageUrls: tripQuery.data.galleryImageUrls ?? [],
        tags: tripQuery.data.tags.map((tag) => tag.name),
        publishDate: toLocalDateTimeInputValue(tripQuery.data.publishDate),
        published: tripQuery.data.published,
      });
      setTags(tripQuery.data.tags.map((tag) => tag.name));
      setTagInput("");
      setLastAutoSlug("");
      setMainImageFile(null);
      setGalleryFiles([]);
      setUrlsToDelete([]);
    }
  }, [mode, reset, tripQuery.data]);

  useEffect(() => {
    if (!mainImageFile) {
      setMainImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(mainImageFile);
    setMainImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [mainImageFile]);

  useEffect(() => {
    if (galleryFiles.length === 0) {
      setGalleryPreviewUrls([]);
      return;
    }

    const previewUrls = galleryFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviewUrls(previewUrls);

    return () => {
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [galleryFiles]);

  const titleValue = watch("title");
  const slugValue = watch("slug");
  const mainImageUrlValue = watch("mainImageUrl");
  const galleryImageUrlsValue = watch("galleryImageUrls");

  useEffect(() => {
    setValue("tags", tags, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [tags, setValue]);

  const addUrlToDeleteQueue = (url?: string | null) => {
    if (!url) {
      return;
    }

    setUrlsToDelete((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const generatedSlug = slugify(titleValue ?? "");
    const canAutoUpdate = !slugValue || slugValue === lastAutoSlug;

    if (canAutoUpdate && slugValue !== generatedSlug) {
      setValue("slug", generatedSlug, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setLastAutoSlug(generatedSlug);
    }
  }, [mode, titleValue, slugValue, lastAutoSlug, setValue]);

  const addTag = (rawTag: string) => {
    const normalizedTag = rawTag.trim();
    if (!normalizedTag) {
      return;
    }

    setTags((prev) => {
      const exists = prev.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase());
      return exists ? prev : [...prev, normalizedTag];
    });
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let nextUrlsToDelete = [...urlsToDelete];
      let nextMainImageUrl = values.mainImageUrl;
      let nextGalleryImageUrls = values.galleryImageUrls.filter((item) => item.trim().length > 0);
      const nextTags = tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (mainImageFile) {
        if (values.mainImageUrl) {
          nextUrlsToDelete = nextUrlsToDelete.includes(values.mainImageUrl)
            ? nextUrlsToDelete
            : [...nextUrlsToDelete, values.mainImageUrl];
        }

        const formData = new FormData();
        formData.append("files", mainImageFile);

        const uploadedMainImage = await uploadImagesAction(formData);
        nextMainImageUrl = uploadedMainImage.urls[0] ?? nextMainImageUrl;
      }

      if (galleryFiles.length > 0) {
        const formData = new FormData();
        galleryFiles.forEach((file) => formData.append("files", file));

        const uploadedGallery = await uploadImagesAction(formData);
        nextGalleryImageUrls = [...nextGalleryImageUrls, ...uploadedGallery.urls];
      }

      const payload = {
        ...values,
        mainImageUrl: nextMainImageUrl || undefined,
        galleryImageUrls: nextGalleryImageUrls,
        tags: nextTags,
        publishDate: new Date(values.publishDate),
      };

      const deleteQueue = Array.from(new Set(nextUrlsToDelete));

      if (mode === "edit" && tripId) {
        const updatedTrip = await fetchJson(`/api/trips/${tripId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (deleteQueue.length > 0) {
          await Promise.allSettled(deleteQueue.map((url) => deleteBlobImage(url)));
        }

        return updatedTrip;
      }

      const createdTrip = await fetchJson("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (deleteQueue.length > 0) {
        await Promise.allSettled(deleteQueue.map((url) => deleteBlobImage(url)));
      }

      return createdTrip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      if (tripId) {
        queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      }
      setMainImageFile(null);
      setGalleryFiles([]);
      setUrlsToDelete([]);
      toast.success("Cesta byla úspěšně uložena.");
      router.push("/dashboard/trips");
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nepodařilo se uložit cestu.");
    },
  });

  const onSubmit = (values: FormValues) => {
    saveMutation.mutate(values);
  };

  if (tripQuery.isLoading) {
    return <p className="text-sm text-slate-600">Načítám data cesty...</p>;
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardBody className="p-6 md:p-8">
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Název
            </label>
            <input
              id="title"
              placeholder="Název cesty"
              className={baseFieldClass}
              {...register("title")}
            />
            {errors.title?.message ? (
              <p className="text-xs text-danger">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="slug" className="text-sm font-semibold text-slate-700">
              URL adresa (slug)
            </label>
            <input
              id="slug"
              placeholder="napr-vikend-ve-stockholmu"
              className={baseFieldClass}
              {...register("slug")}
            />
            <p className="text-xs text-slate-500">
              Bude použito v adrese: /vikend-ve-stockholmu. Pokud nevyplníte, vygeneruje se automaticky z názvu.
            </p>
            {errors.slug?.message ? (
              <p className="text-xs text-danger">{errors.slug.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-semibold text-slate-700">
              Popis
            </label>
            <textarea
              id="description"
              placeholder="Krátký perex"
              className={baseFieldClass}
              rows={4}
              {...register("description")}
            />
            {errors.description?.message ? (
              <p className="text-xs text-danger">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="tag-input" className="text-sm font-semibold text-slate-700">
              Tagy / kategorie
            </label>
            <input
              id="tag-input"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Napiš tag a stiskni Enter nebo ,"
              className={baseFieldClass}
            />
            <p className="text-xs text-slate-500">Tag se přidá po stisku Enter nebo čárky.</p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-all duration-200 ease-in-out"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded px-1 text-slate-600 transition-all duration-200 ease-in-out hover:bg-slate-300 hover:text-slate-900"
                      aria-label={`Odstranit tag ${tag}`}
                    >
                      X
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">Hlavní obrázek</p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                setMainImageFile(event.target.files?.[0] ?? null);
              }}
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 ease-in-out file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-xs text-slate-500">Povolené jsou pouze obrázky do velikosti 4 MB.</p>
          </div>

          {mainImagePreviewUrl || isValidHttpUrl(mainImageUrlValue) ? (
            <Card shadow="sm" className="rounded-xl border border-slate-200 bg-white">
              <CardHeader className="flex items-center justify-between gap-2 pb-0 text-sm text-slate-600">
                <span>Náhled hlavního obrázku</span>
                {isValidHttpUrl(mainImageUrlValue) ? (
                  <Button
                    type="button"
                    size="sm"
                    color="danger"
                    variant="flat"
                    onClick={() => {
                      addUrlToDeleteQueue(mainImageUrlValue);
                      setValue("mainImageUrl", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    Odstranit hlavní obrázek
                  </Button>
                ) : null}
              </CardHeader>
              <CardBody>
                <img
                  src={mainImagePreviewUrl ?? mainImageUrlValue}
                  alt="Náhled hlavního obrázku"
                  className="h-44 w-full rounded-lg object-cover"
                />
              </CardBody>
            </Card>
          ) : null}

          <Card shadow="sm" className="rounded-xl border border-slate-200 bg-white">
            <CardHeader className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">Galerie obrázků</span>
            </CardHeader>
            <CardBody className="space-y-3">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  setGalleryFiles(Array.from(event.target.files ?? []));
                }}
                className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 ease-in-out file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-xs text-slate-500">Vyberte jeden nebo více obrázků pro galerii (max 4 MB / soubor).</p>

              {(galleryImageUrlsValue ?? []).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Aktuálně uložené obrázky</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {galleryImageUrlsValue.map((galleryUrl, index) => (
                      <div key={`${galleryUrl}-${index}`} className="relative">
                        <img
                          src={galleryUrl}
                          alt={`Uložená galerie ${index + 1}`}
                          className="h-28 w-full rounded-xl object-cover transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-lg"
                        />
                        <Button
                          type="button"
                          size="sm"
                          color="danger"
                          variant="solid"
                          className="absolute right-2 top-2 min-w-0 px-2"
                          onClick={() => {
                            addUrlToDeleteQueue(galleryUrl);
                            setValue(
                              "galleryImageUrls",
                              (galleryImageUrlsValue ?? []).filter((_, itemIndex) => itemIndex !== index),
                              {
                                shouldDirty: true,
                                shouldValidate: true,
                              },
                            );
                          }}
                        >
                          X
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {galleryPreviewUrls.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Náhled nových souborů</p>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {galleryPreviewUrls.map((previewUrl, index) => (
                      <img
                        key={`${previewUrl}-${index}`}
                        src={previewUrl}
                        alt={`Náhled galerie ${index + 1}`}
                        className="h-28 w-full rounded-xl object-cover transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-lg"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Obsah</label>
                <RichTextEditor value={field.value} onChange={field.onChange} />
                {errors.content?.message ? (
                  <p className="text-xs text-danger">{errors.content.message}</p>
                ) : null}
              </div>
            )}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="publishDate" className="text-sm font-semibold text-slate-700">
              Datum publikace
            </label>
            <input
              id="publishDate"
              type="datetime-local"
              className={baseFieldClass}
              {...register("publishDate")}
            />
            {errors.publishDate?.message ? (
              <p className="text-xs text-danger">{errors.publishDate.message}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              {...register("published")}
            />
            <label htmlFor="published" className="text-sm font-semibold text-slate-700">
              Publikováno
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              color="primary"
              type="submit"
              className="rounded-lg bg-blue-600 text-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              isLoading={isSubmitting || saveMutation.isPending}
            >
              Uložit
            </Button>
            <Button
              as={Link}
              href="/dashboard/trips"
              variant="flat"
              className="rounded-lg border border-gray-200 bg-white text-slate-700 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Zrušit
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
