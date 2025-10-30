import React, { useState } from "react";
import { Button, Icon, Modal } from "../../../components";
import { useModal } from "../../../hooks/useModal";
import LocationsManage, { type LocationItem } from "./manage";
import { locationsMockData } from "../../../mockData"; // your locations mock
import { countriesMockData } from "../../../mockData"; // your countries mock

const LocationsList: React.FC = () => {
  // note: using local state (replace with API fetch/save later)
  const [locations, setLocations] = useState<LocationItem[]>(
    locationsMockData
  );

  // manage modal
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<LocationItem | null>(null);

  // delete confirm
  const confirm = useModal(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setManageOpen(true);
  };
  const openEdit = (row: LocationItem) => {
    setEditing(row);
    setManageOpen(true);
  };

  const saveLocation = (loc: LocationItem) => {
    if (editing) {
      setLocations((prev) => prev.map((p) => (p.id === loc.id ? loc : p)));
    } else {
      setLocations((prev) => [loc, ...prev]);
    }
    setManageOpen(false);
    setEditing(null);
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    confirm.openModal();
  };

  const doDelete = () => {
    if (toDeleteId) setLocations((prev) => prev.filter((m) => m.id !== toDeleteId));
    confirm.closeModal();
    setToDeleteId(null);
  };

  const getCountryLabel = (countryId?: number | string) => {
    if (countryId === undefined || countryId === null) return "—";
    const found = countriesMockData.find((c) => String(c.id) === String(countryId));
    return found?.title ?? "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Locations</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage Locations in a country.</p>
        </div>

        <Button
          variant="solid"
          tone="primary"
          size="md"
          leadingIcon={<Icon name="plus" className="h-4 w-4" />}
          onClick={openAdd}
        >
          Add Location
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {locations.map((m) => (
              <tr key={m.id} className="hover:bg-[var(--color-surfaceMuted)]">
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">{m.title}</td>
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">{getCountryLabel(m.country)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      tone="primary"
                      size="sm"
                      aria-label="Edit"
                      onClick={() => openEdit(m)}
                      leadingIcon={<Icon name="edit" className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      tone="danger"
                      size="sm"
                      aria-label="Delete"
                      onClick={() => askDelete(m.id)}
                      leadingIcon={<Icon name="trash" className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {locations.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--color-textMuted)]">
                  No locations yet. Click <strong>Add Location</strong> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manage modal */}
      <LocationsManage
        isOpen={manageOpen}
        initialData={editing ?? undefined}
        onClose={() => { setManageOpen(false); setEditing(null); }}
        onSave={saveLocation}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={confirm.isOpen}
        onClose={confirm.closeModal}
        title="Delete Location"
        size="sm"
        dismissible
        showCloseIcon
        footer={
          <>
            <Button variant="outline" tone="neutral" onClick={confirm.closeModal}>Cancel</Button>
            <Button variant="solid" tone="danger" onClick={doDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-textMuted)]">
          Are you sure you want to delete this location? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default LocationsList;
