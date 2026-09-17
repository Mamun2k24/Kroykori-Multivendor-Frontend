import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_APP_SERVER_URL?.replace(/\/$/, "");

export default function AdminChatbotQuestions() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    icon: "MessageCircle",
    sortOrder: 0,
    showAsQuickReply: true,
    isActive: true,
  });

  const fetchItems = async () => {
    const res = await fetch(`${API_BASE}/api/chatbot-questions`);
    const data = await res.json();
    setItems(data?.items || []);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      question: "",
      answer: "",
      icon: "MessageCircle",
      sortOrder: 0,
      showAsQuickReply: true,
      isActive: true,
    });
  };

  const submitForm = async (e) => {
    e.preventDefault();

    const url = editing
      ? `${API_BASE}/api/chatbot-questions/${editing}`
      : `${API_BASE}/api/chatbot-questions`;

    const method = editing ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    resetForm();
    fetchItems();
  };

  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({
      question: item.question || "",
      answer: item.answer || "",
      icon: item.icon || "MessageCircle",
      sortOrder: item.sortOrder || 0,
      showAsQuickReply: item.showAsQuickReply ?? true,
      isActive: item.isActive ?? true,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;

    await fetch(`${API_BASE}/api/chatbot-questions/${id}`, {
      method: "DELETE",
    });

    fetchItems();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">
          Chatbot Questions
        </h1>
        <p className="text-sm text-slate-500">
          Add, edit and manage chatbot reserved questions.
        </p>
      </div>

      <form
        onSubmit={submitForm}
        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="Question"
            className="border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            required
          />

          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm({ ...form, sortOrder: Number(e.target.value) })
            }
            placeholder="Sort order"
            className="border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
          />

          <textarea
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            placeholder="Answer"
            rows={4}
            className="md:col-span-2 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            required
          />

          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={form.showAsQuickReply}
              onChange={(e) =>
                setForm({ ...form, showAsQuickReply: e.target.checked })
              }
            />
            Show as quick reply
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
          >
            {editing ? <Save size={16} /> : <Plus size={16} />}
            {editing ? "Update Question" : "Add Question"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200"
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-slate-800">Question List</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left p-3">Question</th>
                <th className="text-left p-3">Answer</th>
                <th className="text-center p-3">Quick</th>
                <th className="text-center p-3">Active</th>
                <th className="text-center p-3">Sort</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-3 font-semibold text-slate-700">
                    {item.question}
                  </td>
                  <td className="p-3 text-slate-500 max-w-md">
                    {item.answer}
                  </td>
                  <td className="p-3 text-center">
                    {item.showAsQuickReply ? "Yes" : "No"}
                  </td>
                  <td className="p-3 text-center">
                    {item.isActive ? "Active" : "Inactive"}
                  </td>
                  <td className="p-3 text-center">{item.sortOrder}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No questions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}