"use client";

import { CheckCircle2, ExternalLink, MapPin, Pencil, Plus, Search, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import type { Location } from "@/types";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Field";
import { ConfirmDialog, Modal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { DemoNote } from "@/components/common/ui";
import { StatCard, Panel } from "@/components/dashboard/DashboardShell";
import { IconButton } from "@/components/dashboard/DataTable";
import { useStore } from "@/hooks/useStore";
import { CITIES } from "@/data/mock-cities";
import { logActivity } from "@/lib/admin";
import { insert, patch, removeWhere } from "@/lib/storage";
import { isCovered, normalisePostcode, outwardArea, UK_POSTCODE } from "@/lib/validation";
import { cn, uid } from "@/lib/utils";
import { Switch, slugify } from "./ServicesAdmin";

export function LocationsAdmin() {
  const locations = useStore("locations");
  const bookings = useStore("bookings");
  const { success } = useToast();
  const [editing, setEditing] = useState<Location | "new" | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [check, setCheck] = useState("");

  const bookingsIn = (l: Location) => bookings.filter((b) => l.postcodes.includes(outwardArea(b.address.postcode))).length;
  const active = locations.filter((l) => l.active);
  const valid = UK_POSTCODE.test(check.trim());
  const owner = valid ? locations.find((l) => l.postcodes.includes(outwardArea(check))) : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active locations" value={active.length} icon={MapPin} />
        <StatCard label="Postcode areas covered" value={new Set(active.flatMap((l) => l.postcodes)).size} icon={CheckCircle2} tone="mint" />
        <StatCard label="Paused locations" value={locations.length - active.length} icon={XCircle} tone="blush" />
      </div>

      <Panel title="Check a postcode">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative sm:w-72">
            <span className="sr-only">Postcode</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
            <input value={check} onChange={(e) => setCheck(e.target.value.toUpperCase())} placeholder="e.g. SW4 7AA" className="h-11 w-full rounded-full border-[1.5px] border-line bg-white pr-4 pl-10 text-sm uppercase focus:border-ink focus:outline-none" />
          </label>
          {valid && (
            <p className={cn("flex items-center gap-2 text-sm font-semibold", isCovered(check) ? "text-success" : "text-danger")}>
              {isCovered(check) ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
              {isCovered(check) ? `${normalisePostcode(check)} is covered (${owner?.name})` : owner ? `${outwardArea(check)} belongs to ${owner.name}, which is paused` : `${outwardArea(check)} is not covered by any location`}
            </p>
          )}
        </div>
        <DemoNote className="mt-4">Only active locations accept bookings — the website&apos;s postcode check and booking form use this list.</DemoNote>
      </Panel>

      <Panel title="Locations" action={<Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>Add location</Button>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((l) => {
            const page = CITIES.some((c) => c.slug === l.slug);
            return (
              <div key={l.id} className={cn("rounded-2xl border p-5 transition", l.active ? "border-line bg-white" : "border-dashed border-line bg-cream-2/60")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-lg font-extrabold">
                      <MapPin className="size-4 text-brand" /> {l.name}
                    </p>
                    <p className="text-sm text-muted">{l.region}</p>
                  </div>
                  <Switch
                    on={l.active}
                    label={`Toggle ${l.name}`}
                    onChange={() => {
                      patch("locations", (x) => x.id === l.id, { active: !l.active });
                      logActivity("Locations", l.active ? "Paused location" : "Activated location", l.name);
                      success(l.active ? `${l.name} paused` : `${l.name} is accepting bookings`);
                    }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {l.postcodes.map((p) => (
                    <span key={p} className="rounded-md bg-cream px-2 py-0.5 text-xs font-bold">
                      {p}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{bookingsIn(l)} bookings</span>
                  <span className="flex gap-1">
                    {page && (
                      <a href={`/cleaning/${l.slug}`} target="_blank" rel="noreferrer" aria-label={`Open ${l.name} page`} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-cream">
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <IconButton label="Edit location" onClick={() => setEditing(l)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton label="Delete location" tone="danger" onClick={() => setDeleting(l)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {editing && <LocationModal initial={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete location?"
        description={`Postcodes ${deleting?.postcodes.join(", ")} will no longer be covered.`}
        confirmLabel="Delete location"
        onConfirm={() => {
          if (!deleting) return;
          removeWhere("locations", (l) => l.id === deleting.id);
          logActivity("Locations", "Deleted location", deleting.name);
          success("Location deleted");
        }}
      />
    </div>
  );
}

function LocationModal({ initial, onClose }: { initial?: Location; onClose: () => void }) {
  const { success } = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [codes, setCodes] = useState(initial?.postcodes.join(", ") ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = () => {
    const postcodes = Array.from(new Set(codes.toUpperCase().split(/[\s,]+/).filter(Boolean)));
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter a name";
    if (!postcodes.length) e.codes = "Add at least one postcode area";
    else if (postcodes.some((p) => !/^[A-Z]{1,2}$/.test(p))) e.codes = "Use postcode areas only, e.g. SW, N, M, BS";
    setErrors(e);
    if (Object.keys(e).length) return;
    const data = { name: name.trim(), region: region.trim() || "United Kingdom", postcodes };
    if (initial) patch("locations", (l) => l.id === initial.id, data);
    else insert("locations", { ...data, id: uid("loc"), slug: slugify(name), active: true }, false);
    logActivity("Locations", initial ? "Edited location" : "Added location", data.name);
    success(initial ? "Location updated" : "Location added");
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? `Edit ${initial.name}` : "Add location"} footer={<Button onClick={save}>Save location</Button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="City / area name" name="loc-name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Region" name="loc-region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Greater London" />
        <Input label="Postcode areas" name="loc-codes" wrapClassName="sm:col-span-2" value={codes} onChange={(e) => setCodes(e.target.value)} placeholder="SW, SE, N, E" hint="The letters at the start of a postcode, separated by commas" error={errors.codes} />
      </div>
    </Modal>
  );
}
