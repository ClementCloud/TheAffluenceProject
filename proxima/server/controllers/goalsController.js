import db, { initializeDB } from "../db.js";

initializeDB().catch(console.error);

export const getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const userGoals = db.data.goals.filter(goal => goal.userId === userId);
    res.json(userGoals);
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

export const addGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, amount, deadline, priority, months } = req.body;

    if (!name || !amount || !deadline) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newGoal = {
      id: Date.now().toString(),
      userId,
      name,
      amount: parseFloat(amount),
      deadline: new Date(deadline).toISOString(),
      priority: parseInt(priority) || 0,
      months: parseInt(months) || 0,
      saved: 0,
      createdAt: new Date().toISOString()
    };

    db.data.goals.push(newGoal);
    await db.write();
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ error: 'Failed to add goal' });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, amount, deadline, priority, saved, months } = req.body;

    const goalIndex = db.data.goals.findIndex(goal => goal.id === id && goal.userId === userId);
    if (goalIndex === -1) return res.status(404).json({ error: "Goal not found" });

    const updatedGoal = {
      ...db.data.goals[goalIndex],
      ...(name && { name }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(deadline && { deadline: new Date(deadline).toISOString() }),
      ...(priority !== undefined && { priority: parseInt(priority) }),
      ...(saved !== undefined && { saved: parseFloat(saved) }),
      ...(months !== undefined && { months: parseInt(months) }),
      updatedAt: new Date().toISOString()
    };

    db.data.goals[goalIndex] = updatedGoal;
    await db.write();
    res.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const goalIndex = db.data.goals.findIndex(goal => goal.id === id && goal.userId === userId);
    if (goalIndex === -1) return res.status(404).json({ error: "Goal not found" });

    db.data.goals.splice(goalIndex, 1);
    await db.write();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
}; 