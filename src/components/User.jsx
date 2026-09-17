import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiEdit2,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiLock,
  FiUnlock,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiPlus,
  FiUserPlus,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

const User = () => {
  const queryClient = useQueryClient();

  const baseUrl = (import.meta.env.VITE_APP_SERVER_URL || "").replace(/\/$/, "");
  const token = localStorage.getItem("token");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = loggedUser?.role === "superadmin";

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userForStatusChange, setUserForStatusChange] = useState(null);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userForRoleChange, setUserForRoleChange] = useState(null);
  const [newRole, setNewRole] = useState("user");

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/api/users`, {
        headers: authHeaders,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch users");
      }

      return result.users || [];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const createAdminMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch(`${baseUrl}/api/users/create-admin`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to create admin");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Admin created successfully");
      queryClient.invalidateQueries(["users"]);
      setShowCreateAdminModal(false);
      setAdminForm({
        name: "",
        email: "",
        username: "",
        password: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create admin");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`${baseUrl}/api/users/${userId}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries(["users"]);
      setShowDeleteModal(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }) => {
      const response = await fetch(`${baseUrl}/api/users/${userId}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user status");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.isActive ? "activated" : "deactivated"} successfully`);
      queryClient.invalidateQueries(["users"]);
      setShowStatusModal(false);
      setUserForStatusChange(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await fetch(`${baseUrl}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ role }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to update role");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries(["users"]);
      setShowRoleModal(false);
      setUserForRoleChange(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const filteredAndSortedUsers = users
    .filter((user) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search) ||
        user.mobile?.includes(searchTerm);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;

      return 0;
    });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredAndSortedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredAndSortedUsers.map((user) => user._id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      toast.warning("Please select users to delete");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)?`)) {
      selectedUsers.forEach((userId) => deleteMutation.mutate(userId));
      setSelectedUsers([]);
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const toggleUserStatus = (user) => {
    setUserForStatusChange(user);
    setShowStatusModal(true);
  };

  const openRoleModal = (user) => {
    setUserForRoleChange(user);
    setNewRole(user.role || "user");
    setShowRoleModal(true);
  };

  const handleCreateAdmin = (e) => {
    e.preventDefault();

    if (!adminForm.name || !adminForm.email || !adminForm.username || !adminForm.password) {
      toast.warning("All fields are required");
      return;
    }

    if (adminForm.password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    createAdminMutation.mutate({
      name: adminForm.name.trim(),
      email: adminForm.email.trim().toLowerCase(),
      username: adminForm.username.trim().toLowerCase(),
      password: adminForm.password,
    });
  };

  const getUserInitials = (name = "U U") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "superadmin":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "user":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-500 text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Users</h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-poppins">
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredAndSortedUsers.length} user
                {filteredAndSortedUsers.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {isSuperAdmin && (
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <FiPlus />
                  Create Admin
                </button>
              )}

              {selectedUsers.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <FiTrash2 /> Delete Selected ({selectedUsers.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, username, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === filteredAndSortedUsers.length &&
                      filteredAndSortedUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    User
                    {sortConfig.key === "name" &&
                      (sortConfig.direction === "asc" ? <FiChevronUp /> : <FiChevronDown />)}
                  </button>
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Contact Info
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Username
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  <button
                    onClick={() => handleSort("role")}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    Role
                    {sortConfig.key === "role" &&
                      (sortConfig.direction === "asc" ? <FiChevronUp /> : <FiChevronDown />)}
                  </button>
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <FiUser className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 text-lg">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className={`hover:bg-blue-50 ${
                      selectedUsers.includes(user._id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getUserInitials(user.name || "U U")}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <FiMail className="text-gray-400" />
                          {user.email || "No email"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FiPhone className="text-gray-400" />
                          {user.mobile || "No phone"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.username || "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                          user.role
                        )}`}
                      >
                        <FiShield className="mr-1.5" />
                        {user.role || "user"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <FiUnlock className="mr-1.5" /> Active
                          </>
                        ) : (
                          <>
                            <FiLock className="mr-1.5" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isSuperAdmin && (
                          <button
                            title="Edit Role"
                            onClick={() => openRoleModal(user)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => confirmDelete(user)}
                          title="Delete"
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAndSortedUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing 1 to {filteredAndSortedUsers.length} of {filteredAndSortedUsers.length} results
            </div>
          </div>
        )}
      </div>

      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mx-auto mb-4">
                <FiUserPlus className="w-6 h-6 text-indigo-600" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Create New Admin
              </h3>

              <p className="text-gray-500 text-center mb-6">
                Create dashboard admin account with email or username login.
              </p>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <input
                  type="text"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  placeholder="Username"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Password minimum 6 characters"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-12 outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-700">
                  Role will be automatically set as <b>admin</b>.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateAdminModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={createAdminMutation.isLoading}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                  >
                    {createAdminMutation.isLoading ? "Creating..." : "Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && userForRoleChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-4">
                <FiShield className="w-6 h-6 text-purple-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Change Role
              </h3>

              <p className="text-gray-600 text-center mb-6">
                Update role for <span className="font-semibold">{userForRoleChange.name}</span>
              </p>

              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-purple-500 outline-none mb-6"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    updateRoleMutation.mutate({
                      userId: userForRoleChange._id,
                      role: newRole,
                    })
                  }
                  disabled={updateRoleMutation.isLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                >
                  {updateRoleMutation.isLoading ? "Updating..." : "Update Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete User
              </h3>

              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{userToDelete.name}</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() => deleteMutation.mutate(userToDelete._id)}
                  disabled={deleteMutation.isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && userForStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4">
                {userForStatusChange.isActive ? (
                  <FiLock className="w-6 h-6 text-blue-600" />
                ) : (
                  <FiUnlock className="w-6 h-6 text-blue-600" />
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {userForStatusChange.isActive ? "Deactivate User" : "Activate User"}
              </h3>

              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to{" "}
                {userForStatusChange.isActive ? "deactivate" : "activate"}{" "}
                <span className="font-semibold">{userForStatusChange.name}</span>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    updateStatusMutation.mutate({
                      userId: userForStatusChange._id,
                      isActive: !userForStatusChange.isActive,
                    })
                  }
                  disabled={updateStatusMutation.isLoading}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 ${
                    userForStatusChange.isActive
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {updateStatusMutation.isLoading
                    ? "Updating..."
                    : userForStatusChange.isActive
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  );
};

export default User;