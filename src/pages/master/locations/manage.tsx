import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Select, Icon } from "../../../components";
import { countriesMockData } from "../../../mockData";

/**
 * Manage Location modal
 * props:
 *  - isOpen
 *  - initialData?: LocationItem
 *  - onSave: (loc) => void
 *  - onClose
 */

export type LocationItem = {
  id: string;
  title: string;
  country?: number | string;
};

type Props = {
  isOpen: boolean;
  initialData?: LocationItem;
  onSave: (l: LocationItem) => void;
  onClose: () => void;
};

const ManageLocation: React.FC<Props> = ({ isOpen, initialData, onSave, onClose }) => {
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState<string>("");

  const [errors, setErrors] = useState<{ title?: string; country?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setCountry(initialData?.country ? String(initialData.country) : "");
      setErrors({});
    }
  }, [isOpen, initialData]);

  const countryOptions = countriesMockData.map((c) => ({ value: String(c.id), label: c.title }));

  const validate = () => {
    const e: { title?: string; country?: string } = {};
    if (!title.trim()) e.title = "Location name is required";
    if (!country) e.country = "Country is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: LocationItem = {
      id: initialData?.id ?? `LOC-${Date.now()}`,
      title: title.trim(),
      country: country ? (isNaN(Number(country)) ? country : Number(country)) : undefined,
    };
    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Location" : "Add Location"}
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
          label="Location name *"
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
      </div>
    </Modal>
  );
};

export default ManageLocation;
