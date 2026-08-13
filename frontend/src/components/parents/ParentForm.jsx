import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createParent, updateParent } from "../../api/admin";
import Input from "../common/Input";
import Spinner from "../common/Spinner";

const ParentForm = ({ parent, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    if (parent) {
      setFormData({
        first_name: parent.first_name || "",
        last_name: parent.last_name || "",
        phone: parent.phone || "",
        email: parent.email || "",
        password: ""
      });
    }
  }, [parent]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.first_name.trim()) nextErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) nextErrors.last_name = "Last name is required";
    if (!formData.phone.trim()) nextErrors.phone = "Phone is required";
    if (!parent && !formData.password.trim()) nextErrors.password = "Password is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    setLoading(true);
    try {
      if (parent) {
        await updateParent(parent.id, payload);
        toast.success("Parent updated successfully");
      } else {
        await createParent(payload);
        toast.success("Parent created successfully");
      }
      onSuccess?.();
    } catch (error) {
      const message = error.response?.data?.detail || "Failed to save parent";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          error={errors.first_name}
          required
        />
        <Input
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          error={errors.last_name}
          required
        />
      </div>

      <Input
        label="Phone"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />
      <Input
        label={parent ? "New Password" : "Password"}
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        required={!parent}
      />

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="btn-outline" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" />
              Saving...
            </>
          ) : parent ? (
            "Update Parent"
          ) : (
            "Create Parent"
          )}
        </button>
      </div>
    </form>
  );
};

export default ParentForm;
