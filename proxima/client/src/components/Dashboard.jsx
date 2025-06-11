import React, { useState, useContext, useEffect } from "react";
import GoalCard from "./GoalCard";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { UserContext } from "./UserContext";

function getMonthsRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  const yearDiff = end.getFullYear() - now.getFullYear();
  const monthDiff = end.getMonth() - now.getMonth();
  const months = yearDiff * 12 + monthDiff;
  return Math.max(1, months);
}

const BulkAddGoals = ({ onAddGoals, onClose }) => {
  const [goals, setGoals] = useState([
    { name: "", amount: "", deadline: "", priority: 1 },
  ]);

  const handleChange = (idx, field, value) => {
    setGoals((prev) => prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));
  };

  const addRow = () => {
    setGoals((prev) => [...prev, { name: "", amount: "", deadline: "", priority: 1 }]);
  };

  const removeRow = (idx) => {
    setGoals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validGoals = goals.filter(g => g.name && g.amount && g.deadline);
    if (validGoals.length) {
      try {
        const goalsToAdd = validGoals.map(g => ({
          name: g.name,
          amount: parseFloat(g.amount),
          deadline: g.deadline,
          months: getMonthsRemaining(g.deadline),
          saved: 0,
          priority: Number(g.priority),
        }));
        await onAddGoals(goalsToAdd);
        onClose();
      } catch (error) {
        console.error('Error adding goals:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">Bulk Add Goals</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {goals.map((g, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Name</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={g.name} onChange={e => handleChange(idx, "name", e.target.value)} required />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium mb-1">Amount</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={g.amount} onChange={e => handleChange(idx, "amount", e.target.value)} required min="1" />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium mb-1">Deadline</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={g.deadline} onChange={e => handleChange(idx, "deadline", e.target.value)} required />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium mb-1">Priority</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={g.priority} onChange={e => handleChange(idx, "priority", e.target.value)} min="1" />
              </div>
              <button type="button" className="text-red-500 text-lg font-bold px-2" onClick={() => removeRow(idx)} title="Remove">×</button>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-6">
          <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={addRow}>+ Add Another</button>
          <div className="flex gap-2">
            <button type="button" className="px-4 py-2 rounded bg-gray-100" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-primary text-white font-semibold">Add Goals</button>
          </div>
        </div>
      </form>
    </div>
  );
};

const Dashboard = ({ goals, income, currentSavings = 0, totalMonthlyNeeded, onShowGoalForm, onShowGoalWizard, onRemoveGoal, onEditGoal, sortBy, setSortBy, onAdjustedSavingsChange, onFundedGoalsChange, fundedGoals: fundedGoalsProp = new Set() }) => {
  const { token } = useContext(UserContext);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localGoals, setLocalGoals] = useState(goals);
  const [fundedGoals, setFundedGoals] = useState(new Set(fundedGoalsProp));

  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  // keep local fundedGoals in sync with prop (e.g., when navigating back to Goals page)
  useEffect(() => {
    setFundedGoals(new Set(fundedGoalsProp));
  }, [fundedGoalsProp]);

  const handleToggleFunded = (goal, isChecked) => {
    setFundedGoals(prev => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(goal.id);
      } else {
        next.delete(goal.id);
      }
      return next;
    });
  };

  // Notify parent when fundedGoals changes
  useEffect(() => {
    if (typeof onFundedGoalsChange === 'function') {
      onFundedGoalsChange(fundedGoals);
    }
  }, [fundedGoals, onFundedGoalsChange]);

  // Distribute the user's total current savings across goals by priority (1 = highest)
  const distributedGoals = React.useMemo(() => {
    // sort by priority then original order to keep stable
    const sorted = [...localGoals].sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // Treat fully funded goals as already consuming their full amount from savings
    const fundedAmountsPool = sorted.reduce((sum, g) => fundedGoals.has(g.id) ? sum + g.amount : sum, 0);

    let remaining = currentSavings - fundedAmountsPool;

    const distributed = sorted.map(g => {
      // If goal is fully funded & marked, keep its existing saved amount
      if (fundedGoals.has(g.id)) {
        return { ...g, saved: g.amount };
      }

      const applied = Math.min(g.amount, remaining);
      remaining -= applied;
      return { ...g, saved: applied };
    });
    // restore original ordering in UI (localGoals order)
    const mapById = Object.fromEntries(distributed.map(g => [g.id, g]));
    return localGoals.map(g => mapById[g.id] || g);
  }, [localGoals, currentSavings, fundedGoals]);

  // Re-calculate the monthly savings still required **after** applying current savings
  const monthlySavingsNeeded = React.useMemo(() => {
    return distributedGoals.reduce((sum, g) => {
      if (fundedGoals.has(g.id)) return sum; // funded goals need no further savings
      // Remaining amount needed for this goal
      const remaining = Math.max((g.amount || 0) - (g.saved || 0), 0);
      // Fallback to helper if months was not persisted (for very old goals)
      const months = g.months || getMonthsRemaining(g.deadline);
      // Avoid division by 0
      const perMonth = months ? remaining / months : remaining;
      return sum + perMonth;
    }, 0);
  }, [distributedGoals, fundedGoals]);

  // Determine if the user is on track with their savings, using the updated value
  const isOnTrack = income >= monthlySavingsNeeded && distributedGoals.length > 0;

  // Adjust header metrics to reflect funded goals
  const fundedAmountsTotal = distributedGoals.reduce((sum, g) => fundedGoals.has(g.id) ? sum + g.amount : sum, 0);
  const fundedSavedTotal = fundedAmountsTotal; // since saved equals amount for fully funded goals

  const adjustedSavingsGoal = Math.max(0, distributedGoals.reduce((sum, g) => sum + g.amount, 0) - fundedAmountsTotal);
  const adjustedCurrentSavings = Math.max(0, currentSavings - fundedSavedTotal);

  // Inform parent of adjusted savings whenever it changes
  useEffect(() => {
    if (typeof onAdjustedSavingsChange === 'function') {
      onAdjustedSavingsChange(adjustedCurrentSavings);
    }
  }, [adjustedCurrentSavings, onAdjustedSavingsChange]);

  const handleDragEnd = async (result) => {
    setIsDragging(false);
    if (!result.destination) return;

    const reordered = Array.from(localGoals);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Update priorities
    const updated = reordered.map((g, idx) => ({ ...g, priority: idx + 1 }));

    try {
      // Update all goals with new priorities
      await Promise.all(updated.map(goal => 
        fetch(`/api/goals/${goal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(goal),
        })
      ));

      setLocalGoals(updated);
    } catch (error) {
      console.error('Error updating goal priorities:', error);
      // Revert to original order if update fails
      setLocalGoals(goals);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleBulkAdd = async (newGoals) => {
    try {
      const responses = await Promise.all(
        newGoals.map(goal =>
          fetch('/api/goals', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(goal),
          })
        )
      );

      const addedGoals = await Promise.all(responses.map(res => res.json()));
      setLocalGoals(prev => [...prev, ...addedGoals]);
    } catch (error) {
      console.error('Error adding goals in bulk:', error);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div className="bg-gradient-to-r from-blue-200 via-white to-emerald-100 rounded-lg px-6 py-4 shadow">
          <div className="text-lg font-semibold text-blue-900">Total Savings Goal</div>
          <div className="text-2xl font-bold text-primary">${adjustedSavingsGoal.toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-emerald-100 via-white to-blue-100 rounded-lg px-4 py-2 shadow text-sm">
            <span className="font-semibold text-emerald-700">Monthly Disposable Income:</span> <span className="text-blue-900">${income.toLocaleString()}</span>
          </div>
          <button
            className="bg-gradient-to-r from-primary to-emerald-400 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-600"
            onClick={onShowGoalForm}
          >
            + Add Goal (Form)
          </button>
          <button
            className="bg-gradient-to-r from-emerald-400 to-primary text-white px-4 py-2 rounded font-semibold shadow hover:bg-emerald-600"
            onClick={onShowGoalWizard}
          >
            + Add Goal (Step-by-step)
          </button>
          <button
            className="bg-gradient-to-r from-blue-400 to-primary text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700"
            onClick={() => setShowBulkAdd(true)}
          >
            + Bulk Add
          </button>
        </div>
      </div>
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <h2 className="text-2xl font-bold text-primary tracking-tight">Your Goals</h2>
        <div className="flex items-center gap-2">
          <label className="font-medium text-blue-900">Sort by:</label>
          <select
            className="border rounded px-2 py-1 text-blue-900 bg-white shadow-sm focus:ring-2 focus:ring-primary"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            disabled={isDragging}
          >
            <option value="priority">Priority</option>
            <option value="deadline-soonest">Deadline (soonest -&gt; furthest)</option>
            <option value="deadline-furthest">Deadline (furthest -&gt; soonest)</option>
          </select>
        </div>
      </div>
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 via-white to-emerald-50 rounded-lg p-4 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm font-medium">Total Saved: <span className="text-primary font-bold">${adjustedCurrentSavings.toLocaleString()}</span></div>
          <div className="text-sm font-medium">Progress: <span className="text-primary font-bold">{localGoals.length ? Math.round((adjustedCurrentSavings) / (adjustedSavingsGoal || 1) * 100) : 0}%</span></div>
          <div className="text-sm font-medium">Monthly Savings Needed: <span className="text-primary font-bold">${monthlySavingsNeeded ? Math.round(monthlySavingsNeeded).toLocaleString() : 0}</span></div>
          <div className={`text-sm font-medium ${isOnTrack ? 'text-green-600' : 'text-red-500'}`}>Savings vs Income: <span className="font-bold">{isOnTrack ? 'On track' : 'Not enough income'}</span></div>
        </div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable droppableId="goals">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {distributedGoals.map((goal, index) => (
                <Draggable
                  key={goal.id}
                  draggableId={goal.id}
                  index={index}
                  isDragDisabled={isDragging}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <GoalCard
                        goal={goal}
                        onRemove={onRemoveGoal}
                        onEdit={onEditGoal}
                        isOnTrack={isOnTrack}
                        income={income}
                        totalGoals={goals.length}
                        monthlySavingsNeeded={monthlySavingsNeeded}
                        fundedChecked={fundedGoals.has(goal.id)}
                        onToggleFunded={handleToggleFunded}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {showBulkAdd && (
        <BulkAddGoals
          onAddGoals={handleBulkAdd}
          onClose={() => setShowBulkAdd(false)}
        />
      )}
    </div>
  );
};

export default Dashboard; 