import React, { useMemo, useState } from "react";
import { Button,Input,Modal } from "../components";
import { Icon } from "../utils/icons";
import { useModal } from "../hooks/useModal";

type Manager = {
  id: string;
  fullname: string;
  username: string;
  password: string;
  city: string;
};

const initialManagers: Manager[] = [
  { id: "m1", fullname: "Rohit Mehra", username: "rohit.m", password: "*****", city: "Hyderabad" },
  { id: "m2", fullname: "Anita Sharma", username: "anita.s", password: "*****", city: "Bengaluru" },
];

const FleetManagers: React.FC = () => {
  // data
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [cities, setCities] = useState<string[]>(["Hyderabad", "Bengaluru", "Chennai", "Mumbai", "Delhi"]);

  // modal state (add/edit)
  const { isOpen, openModal, closeModal } = useModal(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");

  // errors (page-driven, components only display)
  const [fullnameErr, setFullnameErr] = useState("");
  const [usernameErr, setUsernameErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [cityErr, setCityErr] = useState("");

  // delete confirmation
  const confirm = useModal(false);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const resetForm = () => {
    setEditingId(null);
    setFullname("");
    setUsername("");
    setPassword("");
    setCity("");
    setFullnameErr("");
    setUsernameErr("");
    setPasswordErr("");
    setCityErr("");
  };

  const openAdd = () => {
    resetForm();
    openModal();
  };

  const openEdit = (row: Manager) => {
    setEditingId(row.id);
    setFullname(row.fullname);
    setUsername(row.username);
    setPassword(row.password);
    setCity(row.city);
    openModal();
  };

  const validate = () => {
    let bad = false;
    setFullnameErr("");
    setUsernameErr("");
    setPasswordErr("");
    setCityErr("");

    if (!fullname.trim()) (bad = true, setFullnameErr("Fullname is required"));
    if (!username.trim()) (bad = true, setUsernameErr("Username is required"));
    if (!password.trim()) (bad = true, setPasswordErr("Password is required"));
    if (!city.trim()) (bad = true, setCityErr("City is required"));

    return !bad;
  };

  const save = () => {
    if (!validate()) return;

    if (isEditing) {
      setManagers((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, fullname, username, password, city } : m
        )
      );
    } else {
      setManagers((prev) => [
        ...prev,
        {
          id: `m_${Date.now()}`,
          fullname,
          username,
          password,
          city,
        },
      ]);
    }
    closeModal();
    resetForm();
  };

  const askDelete = (id: string) => {
    setToDeleteId(id);
    confirm.openModal();
  };

  const doDelete = () => {
    if (toDeleteId) setManagers((prev) => prev.filter((m) => m.id !== toDeleteId));
    confirm.closeModal();
    setToDeleteId(null);
  };

  const addCity = (newCity: string) => {
    setCities((prev) =>
      prev.includes(newCity) ? prev : [...prev, newCity].sort((a, b) => a.localeCompare(b))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Fleet Managers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage managers and their cities.</p>
        </div>

        <Button
          variant="solid"
          tone="primary"
          size="md"
          leadingIcon={<Icon name="plus" className="h-4 w-4" />}
          onClick={openAdd}
        >
          Add Manager
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Fullname
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Password
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                City
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {managers.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">{m.fullname}</td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">{m.username}</td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">{m.password}</td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-100">{m.city}</td>
                <td className="px-4 py-3">
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

            {managers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No managers yet. Click <strong>Add Manager</strong> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          closeModal();
          resetForm();
        }}
        title={isEditing ? "Edit Manager" : "Add Manager"}
        size="lg"
        dismissible
        showCloseIcon
        footer={
          <>
            <Button variant="outline" tone="neutral" onClick={() => { closeModal(); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="solid" tone="primary" onClick={save}>
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Fullname *"
            value={fullname}
            onValueChange={setFullname}
            placeholder="Enter full name"
            errorMessage={fullnameErr}
          />
          <Input
            label="Username *"
            value={username}
            onValueChange={setUsername}
            placeholder="Enter username"
            errorMessage={usernameErr}
          />
          <Input
            label="Password *"
            type="password"
            value={password}
            onValueChange={setPassword}
            placeholder="Enter password"
            errorMessage={passwordErr}
          />
          {/* <CitySelect
            cities={cities}
            value={city}
            onChange={setCity}
            onAddCity={addCity}
            errorMessage={cityErr}
            label="City"
            placeholder="Select or add city"
          /> */}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={confirm.isOpen}
        onClose={confirm.closeModal}
        title="Delete Manager"
        size="sm"
        dismissible
        showCloseIcon
        footer={
          <>
            <Button variant="outline" tone="neutral" onClick={confirm.closeModal}>
              Cancel
            </Button>
            <Button variant="solid" tone="danger" onClick={doDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this manager? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default FleetManagers;
