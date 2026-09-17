import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";

const SERVER_URL = (
  import.meta.env.VITE_APP_SERVER_URL ||
  "http://localhost:5000/"
).replace(/\/+$/, "");

const apiUrl = (path) => `${SERVER_URL}/api${path}`;

const getFileUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const statusStyle = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const AdminSellerApplications = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [rejectApplication, setRejectApplication] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const token = localStorage.getItem("token");

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        apiUrl(`/seller/verification/${activeTab}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load seller applications",
        );
      }

      setApplications(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      toast.error(error.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return applications;

    return applications.filter((item) => {
      const searchableText = [
        item.businessName,
        item.contactEmail,
        item.contactPhone,
        item.userId?.name,
        item.userId?.email,
        item.userId?.mobile,
        item.shop?.shopName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [applications, search]);

  const approveSeller = async (application) => {
    const confirmed = window.confirm(
      `Approve ${application.businessName} as a seller?`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(application._id);

      const response = await fetch(
        apiUrl(
          `/seller/verification/${application._id}/approve`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to approve seller");
      }

      toast.success(data.message || "Seller approved successfully");
      setSelectedApplication(null);
      await loadApplications();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const submitRejection = async () => {
    const reason = rejectionReason.trim();

    if (!reason) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setProcessingId(rejectApplication._id);

      const response = await fetch(
        apiUrl(
          `/seller/verification/${rejectApplication._id}/reject`,
        ),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to reject seller");
      }

      toast.success(data.message || "Seller application rejected");
      setRejectApplication(null);
      setSelectedApplication(null);
      setRejectionReason("");
      await loadApplications();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seller Applications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review and manage marketplace seller applications.
          </p>
        </div>

        <button
          type="button"
          onClick={loadApplications}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {["pending", "approved", "rejected"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search seller or shop..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <FiRefreshCw className="animate-spin text-3xl text-orange-500" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
            <FiFileText className="mb-3 text-5xl text-slate-300" />
            <h3 className="font-semibold text-slate-700">
              No {activeTab} applications found
            </h3>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {item.userId?.name || "Unnamed user"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.userId?.email || item.userId?.mobile}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {item.businessName}
                        </p>

                        {item.shop?.slug && (
                          <p className="text-xs text-slate-500">
                            /shop/{item.shop.slug}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p>{item.contactEmail || "—"}</p>
                        <p>{item.contactPhone || "—"}</p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            statusStyle[item.status]
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedApplication(item)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                            title="View details"
                          >
                            <FiEye />
                          </button>

                          {item.status === "pending" && (
                            <>
                              <button
                                onClick={() => approveSeller(item)}
                                disabled={processingId === item._id}
                                className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                                title="Approve"
                              >
                                <FiCheck />
                              </button>

                              <button
                                onClick={() => setRejectApplication(item)}
                                className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                                title="Reject"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 p-4 md:hidden">
              {filteredApplications.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        {item.businessName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {item.userId?.name}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-1 text-xs ${
                        statusStyle[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedApplication(item)}
                    className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium"
                  >
                    View application
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedApplication.businessName}
                </h2>
                <p className="text-sm text-slate-500">
                  Seller application details
                </p>
              </div>

              <button
                onClick={() => setSelectedApplication(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <p>
                  <span className="block text-xs text-slate-500">
                    Applicant
                  </span>
                  {selectedApplication.userId?.name || "—"}
                </p>

                <p>
                  <span className="block text-xs text-slate-500">
                    Account email
                  </span>
                  {selectedApplication.userId?.email || "—"}
                </p>

                <p>
                  <span className="block text-xs text-slate-500">
                    Business email
                  </span>
                  {selectedApplication.contactEmail || "—"}
                </p>

                <p>
                  <span className="block text-xs text-slate-500">
                    Business phone
                  </span>
                  {selectedApplication.contactPhone || "—"}
                </p>
              </div>

              {selectedApplication.status === "rejected" &&
                selectedApplication.adminNote && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase text-red-500">
                      Rejection reason
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {selectedApplication.adminNote}
                    </p>

                    {selectedApplication.decidedBy && (
                      <p className="mt-2 text-xs text-red-500">
                        Rejected by:{" "}
                        {selectedApplication.decidedBy.name ||
                          selectedApplication.decidedBy.email}
                      </p>
                    )}
                  </div>
                )}

              <div>
                <h3 className="mb-3 font-semibold text-slate-800">
                  Verification documents
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedApplication.documents?.map((document, index) => (
                    <a
                      key={document._id || index}
                      href={getFileUrl(document.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-slate-200 hover:border-orange-400"
                    >
                      <img
                        src={getFileUrl(document.url)}
                        alt={document.kind}
                        className="h-48 w-full bg-slate-100 object-contain"
                      />

                      <div className="p-3">
                        <p className="font-medium capitalize text-slate-700">
                          {document.kind?.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {document.note || "No note"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {selectedApplication.status === "pending" && (
                <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <button
                    onClick={() =>
                      setRejectApplication(selectedApplication)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-2.5 font-medium text-red-600 hover:bg-red-50"
                  >
                    <FiUserX />
                    Reject
                  </button>

                  <button
                    onClick={() => approveSeller(selectedApplication)}
                    disabled={
                      processingId === selectedApplication._id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <FiUserCheck />
                    Approve seller
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {rejectApplication && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Reject seller application
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Explain why {rejectApplication.businessName} was rejected.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(event) =>
                setRejectionReason(event.target.value)
              }
              rows={5}
              placeholder="Enter rejection reason..."
              className="mt-5 w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectApplication(null);
                  setRejectionReason("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={submitRejection}
                disabled={processingId === rejectApplication._id}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerApplications;