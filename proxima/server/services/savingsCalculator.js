export const calculateSavingsPlan = (goals, disposableIncome, currentSavings) => {
  // Sort goals by priority
  const sortedGoals = [...goals].sort((a, b) => a.priority - b.priority);
  
  // Calculate total savings needed across all goals
  const totalSavingsNeeded = sortedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  
  // Apply current savings to goals based on priority
  let remainingSavings = currentSavings;
  const totalAllocations = {};
  const savingsApplied = {};
  
  // First pass: Apply savings to each goal based on priority
  for (const goal of sortedGoals) {
    const amountToApply = Math.min(remainingSavings, goal.targetAmount);
    totalAllocations[goal.id] = amountToApply;
    savingsApplied[goal.id] = amountToApply;
    remainingSavings -= amountToApply;
  }

  // Calculate remaining amount needed for each goal after applying savings
  const amountLeft = {};
  for (const goal of sortedGoals) {
    amountLeft[goal.id] = goal.targetAmount - (totalAllocations[goal.id] || 0);
  }

  // Calculate total remaining amount needed
  const totalRemainingNeeded = Object.values(amountLeft).reduce((sum, amount) => sum + amount, 0);

  // Calculate monthly savings needed for each goal
  const monthlyAllocations = {};
  let totalMonthlyNeeded = 0;

  for (const goal of sortedGoals) {
    const monthsRemaining = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30));
    const monthlyAmount = amountLeft[goal.id] / monthsRemaining;
    monthlyAllocations[goal.id] = monthlyAmount;
    totalMonthlyNeeded += monthlyAmount;
  }

  // If disposable income is insufficient, distribute proportionally
  if (disposableIncome < totalMonthlyNeeded) {
    const ratio = disposableIncome / totalMonthlyNeeded;
    for (const goal of sortedGoals) {
      monthlyAllocations[goal.id] *= ratio;
    }
    totalMonthlyNeeded = disposableIncome;
  }

  return {
    monthlyAllocations,
    totalAllocations,
    totalMonthlyNeeded,
    totalSavingsNeeded,
    totalRemainingNeeded,
    savingsApplied,
    amountLeft
  };
}; 