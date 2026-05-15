import React, { useEffect, useState } from "react";
import { Button, Input, Modal, Select } from "../../../components";
import { locationsMockData } from "../../../mockData";

/**
 * ManageHub modal component
 * Hierarchy: Locations → Hubs
 *
 * Props:
 *  - isOpen
 *  - initialData?: HubItem
 *  - onSave: (hub) => void
 *  - onClose
 */

export type HubItem = {
  id: string;
  title: string;
  locationId: string;
};

type Props = {
  isOpen: boolean;
  initialData?: HubItem;
  onSave: (h: HubItem) => void;
  onClose: () => void;
};

const ManageHub: React.FC<Props> = ({ isOpen, initialData, onSave, onClose }) => {
  const [title, setTitle] = useState("");
  const [locationId, setLocationId] = useState<string>("");

  const [errors, setErrors] = useState<{ title?: string; location?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setLocationId(initialData?.locationId ?? "");
      setErrors({});
    }
  }, [isOpen, initialData]);

  const locationOpts = locationsMockData.map((l) => ({ value: l.id, label: l.title }));

  const validate = () => {
    const e: { title?: string; location?: string } = {};
    if (!title.trim()) e.title = "Hub name is required";
    if (!locationId) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: HubItem = {
      id: initialData?.id ?? `HUB-${Date.now()}`,
      title: title.trim(),
      locationId: locationId,
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
          label="Location *"
          options={locationOpts}
          value={locationId}
          onChange={(v) => { setLocationId(v); setErrors((p) => ({ ...p, location: undefined })); }}
          placeholder="Select location"
          searchable
          searchPlaceholder="Search locations…"
          errorMessage={errors.location}
        />
      </div>
    </Modal>
  );
};

export default ManageHub;
