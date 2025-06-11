import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

function getMonthsRemaining(deadline) {
  if (!deadline) return 1;
  const now = new Date();
  const end = new Date(deadline);
  
  // Handle invalid dates
  if (isNaN(end.getTime())) {
    return 1;
  }

  const yearDiff = end.getFullYear() - now.getFullYear();
  const monthDiff = end.getMonth() - now.getMonth();
  
  let months = yearDiff * 12 + monthDiff;

  // If deadline is in the same month, ensure at least 1 month is returned
  if (end > now && months <= 0) {
    return 1;
  }

  return Math.max(1, months);
}

// A new, self-contained Plan class
class Plan {
  constructor(goals, disposableIncome, currentSavings) {
    this.goals = goals || [];
    this.disposableIncome = disposableIncome || 0;
    this.currentSavings = currentSavings || 0;
    this.monthlyAllocations = {};
    this.totalAllocations = {};
    this.totalSavingsNeeded = 0;
    this.totalMonthlyNeeded = 0;
    this.calculate();
  }

  calculate() {
    // Exclude goals that are fully funded (saved >= amount)
    const activeGoals = this.goals.filter(g => ((g.amount || 0) - (g.saved || 0)) > 0);

    // Replace this.goals with only the active (unfunded/partially funded) ones for downstream use
    this.goals = activeGoals;

    const sortedGoals = [...activeGoals].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    let remainingIncome = this.disposableIncome;

    // Use the remaining balance on each goal, not the original target, for totals
    this.totalSavingsNeeded = activeGoals.reduce((sum, goal) => sum + Math.max((goal.amount || 0) - (goal.saved || 0), 0), 0);

    const currentSavingsNeeded = Math.max(0, this.totalSavingsNeeded - this.currentSavings);

    const totalGoalMonths = activeGoals.reduce((sum, goal) => {
      const months = Number(goal.months) > 0 ? Number(goal.months) : getMonthsRemaining(goal.deadline);
      return sum + months;
    }, 0);

    if (totalGoalMonths > 0) {
      this.totalMonthlyNeeded = currentSavingsNeeded / totalGoalMonths;
    } else {
      // If there are no months specified, the entire amount is needed immediately.
      this.totalMonthlyNeeded = currentSavingsNeeded;
    }

    // Allocate disposable income across active goals proportionally
    sortedGoals.forEach(goal => {
      const remainingAmount = Math.max((goal.amount || 0) - (goal.saved || 0), 0);
      const idealMonthlyForGoal = remainingAmount > 0 ? (remainingAmount / (Number(goal.months) > 0 ? Number(goal.months) : getMonthsRemaining(goal.deadline))) : 0;
      const allocation = Math.min(remainingIncome, idealMonthlyForGoal);

      if (goal && goal.id) {
        this.monthlyAllocations[goal.id] = allocation;
        this.totalAllocations[goal.id] = allocation * (Number(goal.months) > 0 ? Number(goal.months) : getMonthsRemaining(goal.deadline));
      }
      remainingIncome -= allocation;
    });
  }
}

export default function Overview({ goals = [], income = { monthlyDisposableIncome: 0 }, currentSavings = 0, effectiveSavings, fundedGoals = new Set() }) {
  // Apply funded overrides to saved amounts first (funded → saved = amount)
  const baseGoals = useMemo(() => {
    if (!fundedGoals || typeof fundedGoals.has !== 'function') return goals;
    return goals.map(g => fundedGoals.has(g.id) ? { ...g, saved: g.amount } : g);
  }, [goals, fundedGoals]);

  const savingsToUse = typeof effectiveSavings === 'number' ? effectiveSavings : currentSavings;

  // Distribute the user's total savings across the goals by priority so each goal gets an "appliedSaved" amount.
  const distributedGoals = useMemo(() => {
    const sorted = [...baseGoals].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    let remaining = savingsToUse;

    const distributed = sorted.map(g => {
      // If already fully funded (because of funded checkbox) keep full amount as saved
      if (fundedGoals.has(g.id)) {
        return { ...g, appliedSaved: g.amount };
      }

      const applied = Math.min(g.amount, remaining);
      remaining -= applied;
      return { ...g, appliedSaved: applied };
    });

    // Restore original order
    const mapById = Object.fromEntries(distributed.map(g => [g.id, g]));
    return baseGoals.map(g => mapById[g.id]);
  }, [baseGoals, savingsToUse, fundedGoals]);

  // Feed distributed goals into Plan (use appliedSaved as the saved field)
  const planGoals = useMemo(() => distributedGoals.map(g => ({ ...g, saved: g.appliedSaved })), [distributedGoals]);

  const plan = useMemo(() => new Plan(planGoals, income.monthlyDisposableIncome, savingsToUse), [planGoals, income, savingsToUse]);

  // Build chart data using the distributed savings so Remaining Amount reflects goal.target - appliedSaved
  const monthlySavingsData = useMemo(() => {
    return planGoals.map(goal => {
      const remaining = Math.max((goal.amount || 0) - (goal.saved || 0), 0);
      return {
        name: goal.name,
        'Remaining Amount': remaining,
        'Monthly Allocation': plan.monthlyAllocations[goal.id] || 0,
      };
    });
  }, [planGoals, plan]);

  const totalTargetAmount = plan.totalSavingsNeeded;
  const shortfall = Math.max(0, plan.totalMonthlyNeeded - plan.disposableIncome);
  const totalSaved = savingsToUse;
  const currentSavingsNeeded = Math.max(0, totalTargetAmount - totalSaved);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!goals.length) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          No goals found. Add some goals to see your savings plan.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Summary / KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-300 text-white shadow-lg p-6 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide opacity-80">Current Savings Needed</span>
          <span className="text-3xl font-bold drop-shadow-sm">${currentSavingsNeeded.toLocaleString()}</span>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-300 text-white shadow-lg p-6 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide opacity-80">Monthly Savings Needed</span>
          <span className="text-3xl font-bold drop-shadow-sm">${(plan.totalMonthlyNeeded || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-red-500 to-red-300 text-white shadow-lg p-6 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide opacity-80">Monthly Shortfall</span>
          <span className="text-3xl font-bold drop-shadow-sm">${shortfall.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-300 text-white shadow-lg p-6 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide opacity-80">Total Saved</span>
          <span className="text-3xl font-bold drop-shadow-sm">${totalSaved.toLocaleString()}</span>
        </div>
      </div>

      {/* Allocation chart */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-primary">Monthly Savings Allocation</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySavingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Remaining Amount" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Monthly Allocation" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 