// app/position-topics/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Search, Save, CheckSquare, ChevronDown, ChevronUp, Plus, Trash2, X, Eye } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/appConstants';
import { useSession } from 'next-auth/react';

export default function PositionTopicsPage() {
  const { data: session } = useSession();
  const [topics, setTopics] = useState([]);
  const [mappings, setMappings] = useState({});
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [dbPositions, setDbPositions] = useState([]);
  const [newPosName, setNewPosName] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // Card detail modal state
  const [cardModalPosition, setCardModalPosition] = useState(null); // posId for modal

  const isAdmin = session?.user?.role === 'admin';
  const isQaOfficer = session?.user?.role === 'qa-officer';
  const canEdit = isAdmin || isQaOfficer;
  const canAddDeletePosition = isAdmin || isQaOfficer;

  useEffect(() => {
    fetchTopics();
    fetchMappings();
    fetchDbPositions();
  }, []);

  const fetchDbPositions = async () => {
    const res = await fetch('/api/positions');
    const data = await res.json();
    if (data.success) setDbPositions(data.data);
  };

  const handleAddPosition = async () => {
    if (!newPosName.trim()) return;
    const res = await fetch('/api/positions', {
      method: 'POST',
      body: JSON.stringify({ name: newPosName }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      setNewPosName('');
      fetchDbPositions();
    }
  };

  const handleDeletePosition = async (id, name) => {
    if (!confirm(`Delete "${name}"? This won't delete the topic mappings but will remove the position.`)) return;
    await fetch('/api/positions', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (selectedPosition === id) setSelectedPosition('');
    fetchDbPositions();
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMappings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/position-topics');
      const data = await res.json();
      if (data.success) {
        const m = {};
        data.data.forEach((map) => {
          const posKey = map.position?._id?.toString() || map.position?.toString();
          if (!posKey) return;
          m[posKey] = map.topicIds.map((t) => (t._id || t).toString());
        });
        setMappings(m);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTopicIds = useMemo(
    () => (selectedPosition ? mappings[selectedPosition] || [] : []),
    [selectedPosition, mappings]
  );

  // Full topic objects for selected IDs
  const selectedTopicObjects = useMemo(
    () => topics.filter((t) => selectedTopicIds.includes(t._id.toString())),
    [topics, selectedTopicIds]
  );

  // Group selected topics by department for the preview panel
  const selectedTopicsGrouped = useMemo(() => {
    const groups = {};
    selectedTopicObjects.forEach((t) => {
      if (!groups[t.department]) groups[t.department] = [];
      groups[t.department].push(t);
    });
    return groups;
  }, [selectedTopicObjects]);

  const toggleTopic = (topicId) => {
    const tid = topicId.toString();
    setMappings((prev) => {
      const current = prev[selectedPosition] || [];
      const next = current.includes(tid)
        ? current.filter((id) => id !== tid)
        : [...current, tid];
      return { ...prev, [selectedPosition]: next };
    });
  };

  const selectAll = () => {
    const all = filteredTopics.map((t) => t._id.toString());
    setMappings((prev) => {
      const current = prev[selectedPosition] || [];
      const merged = [...new Set([...current, ...all])];
      return { ...prev, [selectedPosition]: merged };
    });
  };

  const clearAll = () => {
    setMappings((prev) => ({ ...prev, [selectedPosition]: [] }));
  };

  const saveMapping = async () => {
    if (!selectedPosition) return;
    try {
      setSaving(true);
      const posObj = dbPositions.find((p) => p._id.toString() === selectedPosition);
      const res = await fetch('/api/position-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: selectedPosition,
          topicIds: mappings[selectedPosition] || [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Mapping saved for "${posObj?.name || 'Position'}"`);
        await fetchMappings();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save mapping.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPositions = dbPositions.filter((p) =>
    p.name.toLowerCase().includes(positionSearch.toLowerCase())
  );

  const filteredTopics = useMemo(() => {
    let result = topics;
    if (deptFilter !== 'All') result = result.filter((t) => t.department === deptFilter);
    if (topicSearch) {
      const s = topicSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.topic.toLowerCase().includes(s) ||
          t.department.toLowerCase().includes(s)
      );
    }
    return result;
  }, [topics, deptFilter, topicSearch]);

  const groupedTopics = useMemo(() => {
    const groups = {};
    filteredTopics.forEach((t) => {
      if (!groups[t.department]) groups[t.department] = [];
      groups[t.department].push(t);
    });
    return groups;
  }, [filteredTopics]);

  const toggleDept = (dept) =>
    setExpandedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));

  const selectedCount = selectedTopicIds.length;
  const totalCount = filteredTopics.length;

  const getPositionName = (id) =>
    dbPositions.find((p) => p._id.toString() === id)?.name || id;

  // Topics for card detail modal
  const cardModalTopics = useMemo(() => {
    if (!cardModalPosition) return [];
    const ids = mappings[cardModalPosition] || [];
    return topics.filter((t) => ids.includes(t._id.toString()));
  }, [cardModalPosition, mappings, topics]);

  const cardModalTopicsGrouped = useMemo(() => {
    const groups = {};
    cardModalTopics.forEach((t) => {
      if (!groups[t.department]) groups[t.department] = [];
      groups[t.department].push(t);
    });
    return groups;
  }, [cardModalTopics]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Position → Training Topics</h1>
          <p className="text-gray-600 mt-1">
            Assign required training topics to each job position.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Position list */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold mb-3">Job Positions</h2>

            {canAddDeletePosition && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="New Position..."
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded text-sm"
                />
                <button
                  onClick={handleAddPosition}
                  className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search positions…"
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                className="w-full px-3 py-2 pl-8 border rounded-lg text-sm"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredPositions.map((pos) => {
                const posId = pos._id.toString();
                const count = (mappings[posId] || []).length;
                const isSelected = posId === selectedPosition;

                return (
                  <div key={posId} className="group flex items-center gap-1">
                    <button
                      onClick={() => setSelectedPosition(posId)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition flex justify-between items-center ${
                        isSelected ? 'bg-green-700 text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{pos.name}</span>
                      {count > 0 && (
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                    {canAddDeletePosition && (
                      <button
                        onClick={() => handleDeletePosition(posId, pos.name)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Topic assignment — now takes 2 cols, splits into assign + preview */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedPosition ? (
              <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center py-20 text-gray-400">
                <CheckSquare className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-lg font-medium">Select a position</p>
                <p className="text-sm mt-1">Choose a job position on the left to assign topics.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {/* Topic assignment panel — 3/5 width */}
                <div className="xl:col-span-3 bg-white rounded-xl shadow-md p-4">
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {getPositionName(selectedPosition)}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedCount} of {totalCount} topics selected
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {canEdit && (
                        <>
                          <button
                            onClick={selectAll}
                            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                          >
                            Select All
                          </button>
                          <button
                            onClick={clearAll}
                            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            Clear All
                          </button>
                          <button
                            onClick={saveMapping}
                            disabled={saving}
                            className="px-4 py-1.5 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 transition flex items-center gap-1 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4 flex-wrap">
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="All">All Departments</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="relative grow max-w-xs">
                      <input
                        type="text"
                        placeholder="Search topics…"
                        value={topicSearch}
                        onChange={(e) => setTopicSearch(e.target.value)}
                        className="w-full px-3 py-2 pl-8 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${totalCount > 0 ? (selectedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {Object.keys(groupedTopics).sort().map((dept) => {
                      const deptTopics = groupedTopics[dept];
                      const isExpanded = expandedDepts[dept] !== false;
                      const deptSelected = deptTopics.filter((t) =>
                        selectedTopicIds.includes(t._id.toString())
                      ).length;

                      return (
                        <div key={dept} className="border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleDept(dept)}
                            className="w-full flex justify-between items-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
                          >
                            <span>{dept}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {deptSelected}/{deptTopics.length} selected
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="divide-y divide-gray-100">
                              {deptTopics.map((topic) => {
                                const checked = selectedTopicIds.includes(topic._id.toString());
                                return (
                                  <label
                                    key={topic._id}
                                    className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-green-50 transition"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => canEdit && toggleTopic(topic._id)}
                                      disabled={!canEdit}
                                      className="w-4 h-4 mt-0.5 text-green-600 focus:ring-green-500 rounded shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{topic.topic}</p>
                                      <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                                        {topic.duration && <span>⏱ {topic.duration}</span>}
                                        {topic.trainer?.name && <span>👤 {topic.trainer.name}</span>}
                                      </div>
                                    </div>
                                    {checked && <span className="text-green-600 text-xs font-medium shrink-0">✓</span>}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredTopics.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        No topics found matching the current filters.
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected topics preview panel — 2/5 width */}
                <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-4 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-700">
                      Selected Topics
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                      {selectedCount} total
                    </span>
                  </div>

                  {selectedCount === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-8">
                      <p className="text-sm">No topics selected yet.</p>
                      <p className="text-xs mt-1">Check topics on the left to add them here.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-96 space-y-3 pr-1">
                      {Object.keys(selectedTopicsGrouped).sort().map((dept) => (
                        <div key={dept}>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 sticky top-0 bg-white py-0.5">
                            {dept}
                            <span className="ml-1 text-green-600">({selectedTopicsGrouped[dept].length})</span>
                          </p>
                          <div className="space-y-1">
                            {selectedTopicsGrouped[dept].map((topic) => (
                              <div
                                key={topic._id}
                                className="flex items-start justify-between gap-2 px-2 py-1.5 bg-green-50 rounded-lg border border-green-100"
                              >
                                <p className="text-xs text-green-900 leading-snug">{topic.topic}</p>
                                {canEdit && (
                                  <button
                                    onClick={() => toggleTopic(topic._id)}
                                    className="shrink-0 text-green-400 hover:text-red-500 transition"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dept breakdown footer */}
                  {selectedCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-2">By department</p>
                      <div className="space-y-1">
                        {Object.keys(selectedTopicsGrouped).sort().map((dept) => {
                          const count = selectedTopicsGrouped[dept].length;
                          const total = topics.filter((t) => t.department === dept).length;
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={dept} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-28 truncate">{dept}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(mappings)
            .filter(([, topicIds]) => topicIds.length > 0)
            .slice(0, 8)
            .map(([posId, topicIds]) => {
              const posName = getPositionName(posId);
              return (
                <div
                  key={posId}
                  className={`bg-white rounded-xl shadow-sm p-4 border-2 transition ${
                    selectedPosition === posId
                      ? 'border-green-500'
                      : 'border-transparent hover:border-green-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 truncate">{posName}</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{topicIds.length}</p>
                  <p className="text-xs text-gray-500 mb-3">topics assigned</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPosition(posId)}
                      className="flex-1 text-xs px-2 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setCardModalPosition(posId)}
                      className="flex-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Card detail modal */}
      {cardModalPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {getPositionName(cardModalPosition)}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {(mappings[cardModalPosition] || []).length} topics assigned
                </p>
              </div>
              <button
                onClick={() => setCardModalPosition(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {Object.keys(cardModalTopicsGrouped).sort().map((dept) => (
                <div key={dept}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {dept}
                    <span className="ml-1 normal-case text-green-600">
                      ({cardModalTopicsGrouped[dept].length})
                    </span>
                  </p>
                  <div className="space-y-1">
                    {cardModalTopicsGrouped[dept].map((topic) => (
                      <div
                        key={topic._id}
                        className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg border border-green-100"
                      >
                        <p className="text-sm text-green-900">{topic.topic}</p>
                        <div className="flex gap-3 text-xs text-gray-500 shrink-0 ml-2">
                          {topic.duration && <span>{topic.duration}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {cardModalTopics.length === 0 && (
                <p className="text-center text-gray-400 py-8">No topics assigned.</p>
              )}
            </div>

            <div className="p-4 border-t flex gap-3">
              {canEdit && (
                <button
                  onClick={() => {
                    setSelectedPosition(cardModalPosition);
                    setCardModalPosition(null);
                  }}
                  className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition text-sm"
                >
                  Edit Mapping
                </button>
              )}
              <button
                onClick={() => setCardModalPosition(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}