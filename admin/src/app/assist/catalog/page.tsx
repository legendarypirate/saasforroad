"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import Shell from "@/components/Shell";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { RButton } from "@/components/r/RButton";
import { RInput, RTextarea } from "@/components/r/RInput";
import { RModal } from "@/components/r/RModal";
import { RBadge } from "@/components/r/RBadge";
import {
  api,
  assetUrl,
  AssistCategory,
  AssistServiceItem,
} from "@/lib/api";

type CategoryForm = {
  name: string;
  name_mn: string;
  icon: string;
  image: string;
  sort_order: number;
  is_active: boolean;
};

type ServiceForm = {
  category_id: number;
  name: string;
  name_mn: string;
  description: string;
  icon: string;
  image: string;
  sort_order: number;
  is_active: boolean;
};

const emptyCategory = (): CategoryForm => ({
  name: "",
  name_mn: "",
  icon: "",
  image: "",
  sort_order: 0,
  is_active: true,
});

const emptyService = (categoryId: number): ServiceForm => ({
  category_id: categoryId,
  name: "",
  name_mn: "",
  description: "",
  icon: "",
  image: "",
  sort_order: 0,
  is_active: true,
});

function ImagePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function onFile(file: File) {
    setUploading(true);
    setErr("");
    try {
      const res = await api.uploadAssistImage(file);
      onChange(res.data.url || res.data.path);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload алдаа");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{label}</div>
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition hover:border-primary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetUrl(value)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="size-6" />
              <span className="text-[10px] font-semibold">
                {uploading ? "..." : "Зураг"}
              </span>
            </div>
          )}
        </button>
        <div className="flex-1 space-y-2">
          <RInput
            label="Зураг URL (эсвэл upload)"
            value={value}
            onValueChange={onChange}
            placeholder="/assets/assist/..."
          />
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function AssistCatalogPage() {
  const [categories, setCategories] = useState<AssistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [catModal, setCatModal] = useState(false);
  const [catEditId, setCatEditId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategory());
  const [catSaving, setCatSaving] = useState(false);

  const [svcModal, setSvcModal] = useState(false);
  const [svcEditId, setSvcEditId] = useState<number | null>(null);
  const [svcForm, setSvcForm] = useState<ServiceForm>(emptyService(0));
  const [svcSaving, setSvcSaving] = useState(false);

  const selected = categories.find((c) => c.id === selectedId) ?? categories[0];

  const load = () => {
    setLoading(true);
    setError("");
    api
      .listAssistCatalog()
      .then((res) => {
        setCategories(res.data);
        if (!selectedId && res.data.length) setSelectedId(res.data[0].id);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Ачаалахад алдаа")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNewCategory() {
    setCatEditId(null);
    setCatForm(emptyCategory());
    setCatModal(true);
  }

  function openEditCategory(cat: AssistCategory) {
    setCatEditId(cat.id);
    setCatForm({
      name: cat.name,
      name_mn: cat.name_mn || "",
      icon: cat.icon || "",
      image: cat.image || "",
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setCatModal(true);
  }

  async function saveCategory() {
    setCatSaving(true);
    setError("");
    try {
      if (catEditId) {
        await api.updateAssistCategory(catEditId, catForm);
        setMessage("Төрөл шинэчлэгдлээ");
      } else {
        await api.createAssistCategory(catForm);
        setMessage("Төрөл нэмэгдлээ");
      }
      setCatModal(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалахад алдаа");
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm("Энэ төрөл болон доторх үйлчилгээг устгах уу?")) return;
    try {
      await api.deleteAssistCategory(id);
      setMessage("Устгалаа");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Устгахад алдаа");
    }
  }

  function openNewService() {
    if (!selected) return;
    setSvcEditId(null);
    setSvcForm(emptyService(selected.id));
    setSvcModal(true);
  }

  function openEditService(svc: AssistServiceItem) {
    setSvcEditId(svc.id);
    setSvcForm({
      category_id: svc.category_id,
      name: svc.name,
      name_mn: svc.name_mn || "",
      description: svc.description || "",
      icon: svc.icon || "",
      image: svc.image || "",
      sort_order: svc.sort_order,
      is_active: svc.is_active,
    });
    setSvcModal(true);
  }

  async function saveService() {
    setSvcSaving(true);
    setError("");
    try {
      if (svcEditId) {
        await api.updateAssistService(svcEditId, svcForm);
        setMessage("Үйлчилгээ шинэчлэгдлээ");
      } else {
        await api.createAssistService(svcForm);
        setMessage("Үйлчилгээ нэмэгдлээ");
      }
      setSvcModal(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалахад алдаа");
    } finally {
      setSvcSaving(false);
    }
  }

  async function deleteService(id: number) {
    if (!confirm("Үйлчилгээг устгах уу?")) return;
    try {
      await api.deleteAssistService(id);
      setMessage("Устгалаа");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Устгахад алдаа");
    }
  }

  const serviceCount = categories.reduce(
    (n, c) => n + (c.services?.length ?? 0),
    0
  );

  return (
    <Shell>
      <AdminListToolbar
        title="Үйлчилгээний каталог"
        description="Freelancer болон Service Man апп дээр харагдах төрөл, үйлчилгээ, зураг."
        onReload={load}
        onCreate={openNewCategory}
        createLabel="Төрөл нэмэх"
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Төрөл", value: loading ? "—" : categories.length },
          { label: "Үйлчилгээ", value: loading ? "—" : serviceCount },
          {
            label: "Идэвхтэй төрөл",
            value: loading
              ? "—"
              : categories.filter((c) => c.is_active).length,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-0.5 text-xl font-extrabold tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="error mb-3">{error}</p> : null}
      {message ? <p className="flash-ok mb-3">{message}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Үйлчилгээний төрөл
          </div>
          {categories.map((cat) => {
            const active = selected?.id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedId(cat.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {cat.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={assetUrl(cat.image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      {cat.icon || "—"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">
                    {cat.name_mn || cat.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cat.services?.length ?? 0} үйлчилгээ
                  </div>
                </div>
                <RBadge tone={cat.is_active ? "success" : "neutral"}>
                  {cat.is_active ? "ON" : "OFF"}
                </RBadge>
              </button>
            );
          })}
          {!loading && categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Төрөл байхгүй</p>
          ) : null}
        </div>

        <div>
          {selected ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">
                    {selected.name_mn || selected.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <RButton
                    variant="outline"
                    size="sm"
                    onClick={() => openEditCategory(selected)}
                  >
                    <Pencil className="mr-1 size-3.5" />
                    Төрөл засах
                  </RButton>
                  <RButton
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCategory(selected.id)}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Устгах
                  </RButton>
                  <RButton size="sm" onClick={openNewService}>
                    <Plus className="mr-1 size-3.5" />
                    Үйлчилгээ нэмэх
                  </RButton>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {(selected.services ?? []).map((svc) => (
                  <div
                    key={svc.id}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-muted">
                      {svc.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={assetUrl(svc.image)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                          Зураггүй
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">
                            {svc.name_mn || svc.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {svc.name}
                          </div>
                        </div>
                        <RBadge tone={svc.is_active ? "success" : "neutral"}>
                          {svc.is_active ? "ON" : "OFF"}
                        </RBadge>
                      </div>
                      {svc.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {svc.description}
                        </p>
                      ) : null}
                      <div className="flex gap-2">
                        <RButton
                          variant="outline"
                          size="sm"
                          block
                          onClick={() => openEditService(svc)}
                        >
                          Засах
                        </RButton>
                        <RButton
                          variant="outline"
                          size="sm"
                          onClick={() => deleteService(svc.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </RButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {(selected.services ?? []).length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Энэ төрөлд үйлчилгээ байхгүй. &quot;Үйлчилгээ нэмэх&quot; дарна уу.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Зүүн талаас төрөл сонгоно уу.</p>
          )}
        </div>
      </div>

      <RModal
        open={catModal}
        onClose={() => setCatModal(false)}
        title={catEditId ? "Төрөл засах" : "Шинэ төрөл"}
        onOk={() => void saveCategory()}
        confirmLoading={catSaving}
        okDisabled={!catForm.name.trim() || !catForm.name_mn.trim()}
        size="lg"
      >
        <div className="grid gap-3">
          <ImagePicker
            label="Төрлийн зураг"
            value={catForm.image}
            onChange={(image) => setCatForm((f) => ({ ...f, image }))}
          />
          <RInput
            label="Нэр (EN)"
            required
            value={catForm.name}
            onValueChange={(name) => setCatForm((f) => ({ ...f, name }))}
          />
          <RInput
            label="Нэр (MN)"
            required
            value={catForm.name_mn}
            onValueChange={(name_mn) => setCatForm((f) => ({ ...f, name_mn }))}
          />
          <RInput
            label="Icon key (optional)"
            value={catForm.icon}
            onValueChange={(icon) => setCatForm((f) => ({ ...f, icon }))}
            placeholder="tire, battery..."
          />
          <RInput
            label="Эрэмбэ"
            type="number"
            value={String(catForm.sort_order)}
            onValueChange={(v) =>
              setCatForm((f) => ({ ...f, sort_order: Number(v) || 0 }))
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={catForm.is_active}
              onChange={(e) =>
                setCatForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            Идэвхтэй
          </label>
        </div>
      </RModal>

      <RModal
        open={svcModal}
        onClose={() => setSvcModal(false)}
        title={svcEditId ? "Үйлчилгээ засах" : "Шинэ үйлчилгээ"}
        onOk={() => void saveService()}
        confirmLoading={svcSaving}
        okDisabled={!svcForm.name.trim() || !svcForm.name_mn.trim()}
        size="lg"
      >
        <div className="grid gap-3">
          <ImagePicker
            label="Үйлчилгээний зураг"
            value={svcForm.image}
            onChange={(image) => setSvcForm((f) => ({ ...f, image }))}
          />
          <RInput
            label="Нэр (EN)"
            required
            value={svcForm.name}
            onValueChange={(name) => setSvcForm((f) => ({ ...f, name }))}
          />
          <RInput
            label="Нэр (MN)"
            required
            value={svcForm.name_mn}
            onValueChange={(name_mn) => setSvcForm((f) => ({ ...f, name_mn }))}
          />
          <RTextarea
            label="Тайлбар"
            value={svcForm.description}
            onValueChange={(description) =>
              setSvcForm((f) => ({ ...f, description }))
            }
          />
          <RInput
            label="Icon key"
            value={svcForm.icon}
            onValueChange={(icon) => setSvcForm((f) => ({ ...f, icon }))}
          />
          <RInput
            label="Эрэмбэ"
            type="number"
            value={String(svcForm.sort_order)}
            onValueChange={(v) =>
              setSvcForm((f) => ({ ...f, sort_order: Number(v) || 0 }))
            }
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={svcForm.is_active}
              onChange={(e) =>
                setSvcForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            Идэвхтэй
          </label>
        </div>
      </RModal>
    </Shell>
  );
}
