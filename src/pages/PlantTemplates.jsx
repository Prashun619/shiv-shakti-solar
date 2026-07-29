import { useEffect, useState } from "react";

import PlantTemplateModal from "../components/PlantTemplateModal";

import {
  getPlantTemplates,
  deletePlantTemplate,
} from "../services/plantTemplateService";

export default function PlantTemplates() {
  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);

      const data = await getPlantTemplates();

      setTemplates(data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this template?")) return;

    try {
      await deletePlantTemplate(id);

      loadTemplates();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="p-6">

      {/* Header */}

      <div className="mb-6 rounded-3xl bg-gradient-to-r from-green-700 via-emerald-600 to-lime-500 p-6 shadow-2xl">

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-4xl font-bold text-white">
              Plant Templates
            </h1>

            <p className="text-green-100 mt-2">
              Configure standard material quantities
            </p>

          </div>

          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowModal(true);
            }}
            className="bg-white text-green-700 font-semibold px-6 py-3 rounded-xl hover:scale-105 transition"
          >
            + Create Template
          </button>

        </div>

      </div>

      {loading ? (

        <div className="text-center py-20">
          Loading...
        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {templates.length === 0 ? (

            <div className="col-span-full bg-white rounded-xl p-10 text-center shadow">

              No Plant Templates Found

            </div>

          ) : (

            templates.map((template) => (

              <div
                key={template.id}
                className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6"
              >

                <div className="flex justify-between">

                  <div>

                    <h2 className="text-2xl font-bold text-green-700">
                      {template.template_name}
                    </h2>

                    <p className="text-slate-600 mt-2">

                      Plant Size : {template.plant_size}

                    </p>

                    <p className="text-slate-500">

                      Total Items : {template.items?.length || 0}

                    </p>

                  </div>

                </div>

                <div className="flex gap-3 mt-6">

                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowModal(true);
                    }}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex-1 bg-red-600 text-white rounded-lg py-2"
                  >
                    Delete
                  </button>

                </div>

              </div>

            ))

          )}

        </div>

      )}

      <PlantTemplateModal
        open={showModal}
        template={editingTemplate}
        onClose={() => {
          setShowModal(false);
          setEditingTemplate(null);
        }}
        onSaved={() => {
          loadTemplates();
          setShowModal(false);
          setEditingTemplate(null);
        }}
      />

    </div>
  );
}