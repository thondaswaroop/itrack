import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select } from "../../../components";
import { countriesMockData, locationsMockData } from "../../../mockData";

/**
 * ManageHub modal component
 *
 * Props:
 *  - isOpen
 *  - initialData?: LocationItem
 *  - onSave: (loc) => void
 *  - onClose
 */

export type LocationItem = {
  id: string;
  title: string;
  country?: number | string;
  // optional locationId to reference an existing location that this hub maps to
  locationId?: string;
};

type Props = {
  isOpen: boolean;
  initialData?: LocationItem;
  onSave: (l: LocationItem) => void;
  onClose: () => void;
};

const ManageHub: React.FC<Props> = ({ isOpen, initialData, onSave, onClose }) => {
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");

  const [errors, setErrors] = useState<{ title?: string; country?: string; location?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setCountry(initialData?.country ? String(initialData.country) : "");
      setLocationId(initialData?.locationId ?? "");
      setErrors({});
    }
  }, [isOpen, initialData]);

  const countryOptions = countriesMockData.map((c) => ({ value: String(c.id), label: c.title }));

  // filter locations by chosen country
  const locationOpts = useMemo(() => {
    if (!country) return locationsMockData.map((l) => ({ value: l.id, label: l.title }));
    return locationsMockData
      .filter((l) => String(l.country) === String(country))
      .map((l) => ({ value: l.id, label: l.title }));
  }, [country]);

  const validate = () => {
    const e: { title?: string; country?: string; location?: string } = {};
    if (!title.trim()) e.title = "Hub name is required";
    if (!country) e.country = "Country is required";
    // location is optional, but if we want to require:
    // if (!locationId) e.location = "Select a location";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: LocationItem = {
      id: initialData?.id ?? `HUB-${Date.now()}`,
      title: title.trim(),
      country: country ? (isNaN(Number(country)) ? country : Number(country)) : undefined,
      locationId: locationId || undefined,
    };
    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Hub" : "Add Hub"}
      size="md"
      dismissible
      showCloseIcon
      footer={
        <>
          <Button variant="outline" tone="neutral" onClick={onClose}>Cancel</Button>
          <Button variant="solid" tone="primary" onClick={handleSave}>{initialData ? "Save" : "Create"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Hub name *"
          value={title}
          onValueChange={setTitle}
          placeholder="e.g. HYD-001 - Hyderabad Warehouse"
          errorMessage={errors.title}
        />

        <Select
          label="Country *"
          options={countryOptions}
          value={country}
          onChange={(v) => { setCountry(v); setErrors((p) => ({ ...p, country: undefined })); }}
          placeholder="Select country"
          searchable
          searchPlaceholder="Search countries…"
          errorMessage={errors.country}
        />

        <Select
          label="Linked Location (optional)"
          options={locationOpts}
          value={locationId}
          onChange={(v) => setLocationId(v)}
          placeholder="Select location"
          searchable
          searchPlaceholder="Search locations…"
        />
      </div>
    </Modal>
  );
};

export default ManageHub;
