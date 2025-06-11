import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";

const COLORS = ["#3b82f6", "#e5e7eb"];

function getMonthsRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  return Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

const GoalCard = ({ goal, onRemove, onEdit, isOnTrack, income, totalGoals, monthlySavingsNeeded, fundedChecked, onToggleFunded }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const percent = Math.min((goal.saved / goal.amount) * 100, 100);
  const data = [
    { name: "Saved", value: percent },
    { name: "Remaining", value: 100 - percent },
  ];

  const amountLeft = Math.max(goal.amount - (goal.saved || 0), 0);

  // Use goal.monthlySavings if provided, else derive from deadline/months
  const monthlySavings = goal.monthlySavings && goal.monthlySavings > 0
    ? goal.monthlySavings
    : (amountLeft === 0 ? 0 : +(amountLeft / (goal.months || getMonthsRemaining(goal.deadline))).toFixed(2));

  // Months remaining: 0 if fully funded, otherwise derive from savings rate or deadline.
  let months;
  if (amountLeft === 0) {
    months = 0;
  } else if (monthlySavings > 0) {
    months = Math.max(1, Math.ceil(amountLeft / monthlySavings));
  } else {
    months = getMonthsRemaining(goal.deadline);
  }

  // Determine if the goal is treated as funded based on checkbox state
  const isFunded = fundedChecked;

  // Calculate proportional share of disposable income for this goal
  let goalShortfall = 0;
  if (!isFunded && typeof monthlySavingsNeeded === 'number' && monthlySavingsNeeded > 0) {
    const incomeShare = income * (monthlySavings / monthlySavingsNeeded);
    goalShortfall = Math.max(monthlySavings - incomeShare, 0);
  } else {
    // Fallback to even split if total not provided
    goalShortfall = Math.max(monthlySavings - (income / totalGoals), 0);
  }

  return (
    <div 
      className={`rounded-2xl shadow-md p-4 flex flex-col items-center relative border w-full max-w-lg transition-all duration-300 ${
        isFunded ? 'bg-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-blue-100 via-white to-emerald-100 border-blue-50'
      } ${isHovered ? 'shadow-xl -translate-y-1' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow z-10">
        Priority #{goal.priority}
      </div>

      <div className="absolute top-2 right-2 flex gap-2">
        <button
          className="text-gray-400 hover:text-primary transition-colors duration-200"
          onClick={() => onEdit(goal)}
          title="Edit Goal"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
        <button
          className="text-gray-400 hover:text-red-500 transition-colors duration-200"
          onClick={() => onRemove(goal.id)}
          title="Remove Goal"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="w-24 h-24 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={40}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-lg font-semibold mb-1 text-primary drop-shadow text-center truncate w-full">
        {goal.name}
      </div>

      <div className="text-sm text-emerald-700 mb-2">
        Due by {formatDate(goal.deadline)}
      </div>

      <div className="w-full mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-blue-700">${goal.saved.toLocaleString()} saved</span>
          <span className="text-emerald-700">${goal.amount.toLocaleString()} target</span>
        </div>
        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full text-sm">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="text-xs text-blue-600">Monthly Savings</div>
          <div className="font-semibold text-primary">${monthlySavings.toLocaleString()}</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-2 text-center">
          <div className="text-xs text-emerald-600">Months Remaining</div>
          <div className="font-semibold text-emerald-700">{months}</div>
        </div>
      </div>

      {!isFunded && goalShortfall > 0 && (
        <div className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">
          Shortfall: ${goalShortfall.toLocaleString()} per month
        </div>
      )}

      {!isFunded && !isOnTrack && (
        <div className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full">
          Not enough monthly income
        </div>
      )}

      {(amountLeft === 0 || fundedChecked) && (
        <label className="flex items-center mt-2 text-xs text-emerald-700">
          <input
            type="checkbox"
            className="mr-1 h-3 w-3"
            checked={fundedChecked}
            onChange={(e) => onToggleFunded(goal, e.target.checked)}
          />
          Mark as funded
        </label>
      )}
    </div>
  );
};

export default GoalCard; 