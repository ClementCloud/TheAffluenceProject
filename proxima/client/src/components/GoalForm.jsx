import React, { useState, useEffect } from "react";

function getMonthsRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const yearDiff = end.getFullYear() - now.getFullYear();
  const monthDiff = end.getMonth() - now.getMonth();
  const months = yearDiff * 12 + monthDiff;
  return Math.max(1, months);
}

function addDurationToDate(duration, unit) {
  const now = new Date();
  if (unit === "days") {
    now.setDate(now.getDate() + Number(duration));
  } else if (unit === "months") {
    now.setMonth(now.getMonth() + Number(duration));
  } else if (unit === "years") {
    now.setFullYear(now.getFullYear() + Number(duration));
  }
  return now.toISOString().slice(0, 10);
}

const GoalForm = ({ onClose, onAddGoal, editGoal }) => {
  const [name, setName] = useState(editGoal ? editGoal.name : "");
  const [amount, setAmount] = useState(editGoal ? editGoal.amount : "");
  const [deadline, setDeadline] = useState(editGoal ? editGoal.deadline : "");
  const [priority, setPriority] = useState(editGoal ? editGoal.priority || 1 : 1);
  const [useDuration, setUseDuration] = useState(false);
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("months");

  useEffect(() => {
    if (editGoal) {
      setName(editGoal.name);
      setAmount(editGoal.amount);
      setDeadline(editGoal.deadline);
      setPriority(editGoal.priority || 1);
    }
  }, [editGoal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount || (!deadline && !duration)) return;
    let finalDeadline = deadline;
    let months = 0;

    if (useDuration && duration) {
      finalDeadline = addDurationToDate(duration, durationUnit);
      if (durationUnit === "years") {
        months = Number(duration) * 12;
      } else if (durationUnit === "months") {
        months = Number(duration);
      } else {
        months = Math.ceil(Number(duration) / 30); // Approximate days to months
      }
    } else if (deadline) {
      months = getMonthsRemaining(deadline);
    }

    onAddGoal({
      id: editGoal ? editGoal.id : Date.now().toString(),
      name,
      amount: parseFloat(amount),
      deadline: finalDeadline,
      months: months,
      saved: editGoal ? editGoal.saved : 0,
      priority: Number(priority),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-6">{editGoal ? 'Edit Goal' : 'Add New Goal'}</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Goal Name</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Amount ($)</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
        </div>
        <div className="mb-4 flex items-center gap-2">
          <label className="block text-sm font-medium">Set by:</label>
          <button type="button" className={`px-2 py-1 rounded ${!useDuration ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setUseDuration(false)}>Date</button>
          <button type="button" className={`px-2 py-1 rounded ${useDuration ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setUseDuration(true)}>Duration</button>
        </div>
        {!useDuration ? (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={deadline} onChange={e => setDeadline(e.target.value)} required={!useDuration} />
          </div>
        ) : (
          <div className="mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Duration</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={duration} onChange={e => setDuration(e.target.value)} min="1" required={useDuration} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select className="border rounded px-2 py-2" value={durationUnit} onChange={e => setDurationUnit(e.target.value)}>
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
        )}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Priority (1 = highest)</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={priority} onChange={e => setPriority(e.target.value)} min="1" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={onClose}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-primary text-white font-semibold">{editGoal ? 'Save Changes' : 'Add Goal'}</button>
        </div>
      </form>
    </div>
  );
};

export default GoalForm; 