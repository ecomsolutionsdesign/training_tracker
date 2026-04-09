'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Search, Save, CheckSquare, Square, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { DEPARTMENTS } from '@/constants/appConstants';

export default function PositionTopicsPage() {
  const [topics, setTopics] = useState([]);
  const [mappings, setMappings] = useState({}); // { positionId: [topicId, ...] }
  // FIX: selectedPosition stores the _id (string), not the name
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positionSearch, setPositionSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [dbPositions, setDbPositions] = useState([]);
  const [newPosName, setNewPosName] = useState('');

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
    // FIX: if the deleted position was selected, clear selection
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
          // FIX: key is always the position _id string
          const posKey = (map.position._id || map.position).toString();
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

  // FIX: compare topic IDs as strings consistently
  const selectedTopicIds = useMemo(
    () => (selectedPosition ? mappings[selectedPosition] || [] : []),
    [selectedPosition, mappings]
  );

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
          position: selectedPosition, // ObjectId string
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

  // FIX: helper to get position name from id
  const getPositionName = (id) =>
    dbPositions.find((p) => p._id.toString() === id)?.name || id;

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

            <div className="space-y-1 max-h-130 overflow-y-auto">
              {filteredPositions.map((pos) => {
                const posId = pos._id.toString();
                const count = (mappings[posId] || []).length;
                // FIX: compare by id, not name
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
                    <button
                      onClick={() => handleDeletePosition(posId, pos.name)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Topic assignment */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4">
            {!selectedPosition ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                <CheckSquare className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-lg font-medium">Select a position</p>
                <p className="text-sm mt-1">Choose a job position on the left to assign topics.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                  <div>
                    {/* FIX: display the name, not the raw id */}
                    <h2 className="text-lg font-bold text-gray-900">
                      {getPositionName(selectedPosition)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedCount} of {totalCount} topics selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition">
                      Select All
                    </button>
                    <button onClick={clearAll} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
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

                <div className="space-y-2 max-h-107 overflow-y-auto pr-1">
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
                                    onChange={() => toggleTopic(topic._id)}
                                    className="w-4 h-4 mt-0.5 text-green-600 focus:ring-green-500 rounded shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{topic.topic}</p>
                                    <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                                      {topic.duration && <span>⏱ {topic.duration}</span>}
                                      {topic.trainerName && <span>👤 {topic.trainerName}</span>}
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
              </>
            )}
          </div>
        </div>

        {/* Summary cards — FIX: show position name, click sets by id */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(mappings)
            .filter(([, topics]) => topics.length > 0)
            .slice(0, 8)
            .map(([posId, topicIds]) => {
              const posName = getPositionName(posId);
              return (
                <div
                  key={posId}
                  onClick={() => setSelectedPosition(posId)}
                  className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer border-2 transition ${
                    selectedPosition === posId
                      ? 'border-green-500'
                      : 'border-transparent hover:border-green-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700 truncate">{posName}</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{topicIds.length}</p>
                  <p className="text-xs text-gray-500">topics assigned</p>
                </div>
              );
            })}
        </div>
      </div>
    </Layout>
  );
}