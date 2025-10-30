import React, { useMemo, useState } from "react";
import { Button, Icon, Modal, Select } from "../../../components";
import { useModal } from "../../../hooks/useModal";
import ManageHub, { type LocationItem } from "./manage";
import { locationsMockData, hubsMockData, countriesMockData } from "../../../mockData";

/**
 * Hubs page (list + manage modal)
 *
 * - uses local state; replace setX calls with API calls when wiring backend
 */

type Hub = {
  id: string;
  title: string;
  country?: number | string;
  location?: string; // location id (from locationsMockData)
};

const Hubs: React.FC = () => {
  // local data (replace with API fetch)
  const [hubs, setHubs] = useState<Hub[]>(hubsMockData as Hub[]);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<LocationItem | null>(null);

  // delete confirmation
  const confirm = useModal(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setManageOpen(true);
  };

  const openEdit = (row: Hub) => {
    // convert Hub -> LocationItem (Manage expects id/title/country)
    setEditing({ id: row.id, title: row.title, country: row.country ?? "" });
    setManageOpen(true);
  };

  const saveHub = (loc: LocationItem & { locationId?: string }) => {
    // Manage modal returns { id, title, country } and optionally locationId
    const payload: Hub = {
      id: loc.id,
      title: loc.title,
      country: loc.country,
      location: (loc as any).locationId ?? undefined,
    };

    setHubs((prev) => {
      const exists = prev.some((p) => p.id === payload.id);
      if (exists) return prev.map((p) => (p.id === payload.id ? payload : p));
      return [payload, ...prev];
    });

    setManageOpen(false);
    setEditing(null);
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    confirm.openModal();
  };

  const doDelete = () => {
    if (toDeleteId) setHubs((prev) => prev.filter((m) => m.id !== toDeleteId));
    confirm.closeModal();
    setToDeleteId(null);
  };

  const getCountryLabel = (countryId?: number | string) => {
    if (countryId === undefined || countryId === null) return "—";
    const found = countriesMockData.find((c) => String(c.id) === String(countryId));
    return found?.title ?? "—";
  };

  const getLocationLabel = (locationId?: number | string) => {
    if (locationId === undefined || locationId === null) return "—";
    const found = locationsMockData.find((c) => String(c.id) === String(locationId));
    return found?.title ?? "—";
  };

  // optional: quick filter by country on the page (left as example)
  const countryOptions = countriesMockData.map((c) => ({ value: String(c.id), label: c.title }));
  const [filterCountry, setFilterCountry] = useState<string>("");

  const displayedHubs = useMemo(() => {
    if (!filterCountry) return hubs;
    return hubs.filter((h) => String(h.country) === filterCountry);
  }, [hubs, filterCountry]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Hubs</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage warehouses / hubs.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            options={[{ value: "", label: "All countries" }, ...countryOptions]}
            value={filterCountry}
            onChange={(v) => setFilterCountry(v)}
            searchable
            searchPlaceholder="Filter countries..."
            buttonClassName="w-48"
          />
          <Button
            variant="solid"
            tone="primary"
            size="md"
            leadingIcon={<Icon name="plus" className="h-4 w-4" />}
            onClick={openAdd}
          >
            Add Hub
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hub</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {displayedHubs.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--color-surfaceMuted)]">
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{m.title}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{getCountryLabel(m.country)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text)]">{getLocationLabel(m.location)}</td>
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

              {displayedHubs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--color-textMuted)]">
                    No Hubs yet. Click <strong>Add Hub</strong> to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage modal */}
      <ManageHub
        isOpen={manageOpen}
        initialData={editing ?? undefined}
        onClose={() => {
          setManageOpen(false);
          setEditing(null);
        }}
        onSave={(data) => {
          // ManageHub returns { id, title, country, locationId? }
          saveHub(data as any);
        }}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={confirm.isOpen}
        onClose={confirm.closeModal}
        title="Delete Hub"
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
          Are you sure you want to delete this Hub? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Hubs;
