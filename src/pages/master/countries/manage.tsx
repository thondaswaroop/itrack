import React, { useEffect, useState } from "react";
import { Button, Input, Modal } from "../../../components";

/**
 * Manage - Add / Edit modal component
 *
 * Props:
 * - isOpen: boolean
 * - initialData?: Country (if editing)
 * - onSave: (country: Country) => void
 * - onClose: () => void
 *
 * Exports type for list consumer (shared)
 */

export type Country = { id: string; title: string };

type Props = {
  isOpen: boolean;
  initialData?: Country;
  onSave: (c: Country) => void;
  onClose: () => void;
};

const CountriesManage: React.FC<Props> = ({ isOpen, initialData, onSave, onClose }) => {
  const [title, setTitle] = useState("");
  const [titleErr, setTitleErr] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title ?? "");
      setTitleErr("");
    }
  }, [isOpen, initialData]);

  const validate = () => {
    setTitleErr("");
    if (!title.trim()) {
      setTitleErr("Country name is required");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: Country = {
      id: initialData?.id ?? `CNT-${Date.now()}`,
      title: title.trim(),
    };
    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Country" : "Add Country"}
      size="sm"
      dismissible
      showCloseIcon
      footer={
        <>
          <Button variant="outline" tone="neutral" onClick={onClose}>Cancel</Button>
          <Button variant="solid" tone="primary" onClick={handleSave}>{initialData ? "Save Changes" : "Create"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Country *"
          value={title}
          onValueChange={setTitle}
          placeholder="Enter country name"
          errorMessage={titleErr}
        />
      </div>
    </Modal>
  );
};

export default CountriesManage;
