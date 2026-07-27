"use client";

import { FormEvent, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import Shell from "@/components/Shell";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { RButton } from "@/components/r/RButton";
import { RInput } from "@/components/r/RInput";
import { RCard } from "@/components/r/RCard";
import { RBadge } from "@/components/r/RBadge";
import { api, SmartcarInspectionInfo, SmartcarVehicleInfo } from "@/lib/api";

const FIELD_LABELS: { key: keyof SmartcarVehicleInfo; label: string }[] = [
  { key: "plateNumber", label: "Улсын дугаар" },
  { key: "cabinNumber", label: "Арлын дугаар" },
  { key: "markName", label: "Марк" },
  { key: "modelName", label: "Загвар" },
  { key: "buildYear", label: "Үйлдвэрлэсэн он" },
  { key: "colorName", label: "Өнгө" },
  { key: "type", label: "Төрөл" },
  { key: "className", label: "Ангилал" },
  { key: "fuelType", label: "Түлш" },
  { key: "countryName", label: "Улс" },
  { key: "ownerType", label: "Эзэмшлийн хэлбэр" },
  { key: "intent", label: "Зориулалт" },
  { key: "motorNumber", label: "Хөдөлгүүрийн дугаар" },
  { key: "importDate", label: "Импортын огноо" },
  { key: "manCount", label: "Суудлын тоо" },
  { key: "axleCount", label: "Тэнхлэгийн тоо" },
  { key: "capacity", label: "Багтаамж (см³)" },
  { key: "mass", label: "Жин (кг)" },
  { key: "weight", label: "Ачаа (кг)" },
  { key: "length", label: "Урт (мм)" },
  { key: "width", label: "Өргөн (мм)" },
  { key: "height", label: "Өндөр (мм)" },
  { key: "transmission", label: "Хурдны хайрцаг" },
  { key: "wheelPosition", label: "Жолооны байрлал" },
  { key: "rfid", label: "RFID" },
];

const INSPECTION_FIELDS: { key: keyof SmartcarInspectionInfo; label: string }[] = [
  { key: "vehicleNumber", label: "Улсын дугаар" },
  { key: "cabinNumber", label: "Арлын дугаар" },
  { key: "checkDate", label: "Оношилгоонд орсон огноо" },
  { key: "expireDate", label: "Дахин үзлэгт орох огноо" },
  { key: "passed", label: "Тэнцсэн эсэх" },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value);
}

/** Inspection expiry is the last valid day, so the next check-up is the day after. */
function formatNextInspectionDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatValue(value);
  }
  const next = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(next.getTime())) return formatValue(value);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export default function SmartcarLookupPage() {
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SmartcarVehicleInfo | null>(null);
  const [inspection, setInspection] = useState<SmartcarInspectionInfo | null>(
    null
  );
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const plateNumber = plate.trim();
    if (!plateNumber) return;

    setError("");
    setData(null);
    setInspection(null);
    setInspectionError("");
    setLoading(true);
    try {
      const res = await api.getVehicleInfo(plateNumber);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хайлт амжилтгүй");
    } finally {
      setLoading(false);
    }
  }

  async function onCheckInspection() {
    const cabin = data?.cabinNumber;
    if (!cabin) return;

    setInspectionError("");
    setInspection(null);
    setInspectionLoading(true);
    try {
      const res = await api.getVehicleInspection(String(cabin));
      setInspection(res.data);
    } catch (err) {
      setInspectionError(
        err instanceof Error ? err.message : "Оношилгооны хайлт амжилтгүй"
      );
    } finally {
      setInspectionLoading(false);
    }
  }

  return (
    <Shell>
      <AdminListToolbar
        title="Дугаараар шалгах"
        description="Улсын дугаараар SmartCar бүртгэлийн мэдээлэл харна."
      />

      <form
        onSubmit={onSubmit}
        className="mb-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
      >
        <RInput
          label="Улсын дугаар"
          required
          value={plate}
          onValueChange={setPlate}
          placeholder="6590УБХ"
          allowClear
          containerClassName="flex-1"
          autoComplete="off"
        />
        <RButton
          type="submit"
          loading={loading}
          disabled={!plate.trim()}
          iconLeft={<Search size={16} />}
        >
          Шалгах
        </RButton>
      </form>

      {error ? <p className="error mb-4">{error}</p> : null}

      {data ? (
        <RCard
          title={
            [data.markName, data.modelName].filter(Boolean).join(" ") ||
            data.plateNumber ||
            "Үр дүн"
          }
          description={
            data.plateNumber
              ? `Улсын дугаар: ${data.plateNumber}`
              : undefined
          }
          action={
            data.cabinNumber ? (
              <RButton
                variant="outline"
                size="sm"
                loading={inspectionLoading}
                onClick={onCheckInspection}
                iconLeft={<ClipboardCheck size={16} />}
              >
                Оношилгоо шалгах
              </RButton>
            ) : undefined
          }
        >
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem 1.25rem",
              margin: 0,
            }}
          >
            {FIELD_LABELS.map(({ key, label }) => (
              <div key={String(key)}>
                <dt
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--muted)",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    wordBreak: "break-word",
                  }}
                >
                  {formatValue(data[key])}
                </dd>
              </div>
            ))}
          </dl>
        </RCard>
      ) : null}

      {inspectionError ? (
        <p className="error" style={{ marginTop: "1rem" }}>
          {inspectionError}
        </p>
      ) : null}

      {inspection ? (
        <RCard
          title="Оношилгоо"
          description={
            inspection.vehicleNumber
              ? `Улсын дугаар: ${inspection.vehicleNumber}`
              : undefined
          }
          action={
            <RBadge tone={inspection.passed ? "success" : "danger"} dot>
              {inspection.passed ? "Тэнцсэн" : "Тэнцээгүй"}
            </RBadge>
          }
          style={{ marginTop: "1.25rem" }}
        >
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem 1.25rem",
              margin: 0,
            }}
          >
            {INSPECTION_FIELDS.map(({ key, label }) => (
              <div key={String(key)}>
                <dt
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--muted)",
                    marginBottom: "0.25rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {label}
                </dt>
                <dd
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "var(--foreground)",
                    wordBreak: "break-word",
                  }}
                >
                  {key === "passed"
                    ? inspection.passed
                      ? "Тийм"
                      : "Үгүй"
                    : key === "expireDate"
                      ? formatNextInspectionDate(inspection[key])
                      : formatValue(inspection[key])}
                </dd>
              </div>
            ))}
          </dl>
        </RCard>
      ) : null}
    </Shell>
  );
}
