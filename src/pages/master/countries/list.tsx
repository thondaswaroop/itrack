import React, { useMemo, useState } from "react";
import { Button, Icon, Modal } from "../../../components";
import { useModal } from "../../../hooks/useModal";
import CountriesManage, { type Country } from "./manage";
import { countriesMockData } from "../../../mockData";

const Countries: React.FC = () => {
  // data (replace with API fetch later)
  const [countries, setCountries] = useState<Country[]>(countriesMockData);

  // Manage modal (add/edit) state
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);

  // delete confirm modal
  const confirm = useModal(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setManageOpen(true);
  };

  const openEdit = (row: Country) => {
    setEditing(row);
    setManageOpen(true);
  };

  const saveCountry = (c: Country) => {
    if (editing) {
      // update
      setCountries((prev) => prev.map((p) => (p.id === c.id ? c : p)));
    } else {
      // add
      setCountries((prev) => [c, ...prev]);
    }
    setManageOpen(false);
    setEditing(null);
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    confirm.openModal();
  };

  const doDelete = () => {
    if (toDeleteId) setCountries((prev) => prev.filter((m) => m.id !== toDeleteId));
    confirm.closeModal();
    setToDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Countries</h1>
          <p className="text-sm text-[var(--color-textMuted)]">Manage Countries.</p>
        </div>

        <Button
          variant="solid"
          tone="primary"
          size="md"
          leadingIcon={<Icon name="plus" className="h-4 w-4" />}
          onClick={openAdd}
        >
          Add Country
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surfaceMuted)] text-[var(--color-textMuted)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Country</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
            {countries.map((m) => (
              <tr key={m.id} className="hover:bg-[var(--color-surfaceMuted)]">
                <td className="px-4 py-3 text-sm text-[var(--color-text)]">{m.title}</td>
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

            {countries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm text-[var(--color-textMuted)]">
                  No country yet. Click <strong>Add Country</strong> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manage modal (Add / Edit) */}
      <CountriesManage
        isOpen={manageOpen}
        initialData={editing ?? undefined}
        onClose={() => { setManageOpen(false); setEditing(null); }}
        onSave={saveCountry}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={confirm.isOpen}
        onClose={confirm.closeModal}
        title="Delete Country"
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
          Are you sure you want to delete this? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Countries;
