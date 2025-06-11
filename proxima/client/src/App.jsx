import React, { useState, useContext, useEffect } from "react";
import Layout, { SectionContext } from "./components/Layout";
import Dashboard from "./components/Dashboard";
import GoalForm from "./components/GoalForm";
import Overview from "./components/Overview";
import Welcome from "./components/Welcome";
import GoalWizard from "./components/GoalWizard";
import ProfilePage from "./components/ProfilePage";
import { UserProvider, UserContext } from "./components/UserContext";
import LoginForm from "./components/LoginForm";
import FinancialInputs from "./components/FinancialInputs";
import TutorialOverlay from "./components/TutorialOverlay";
import NameAgePrompt from "./components/NameAgePrompt";

const API_URL = "http://localhost:3001/api";

function getMonthsRemaining(deadline) {
  const now = new Date();
  const end = new Date(deadline);
  return Math.max(
    1,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  );
}

function getMonthlySavings(goal) {
  if (goal.monthlySavings && goal.monthlySavings !== 0) return goal.monthlySavings;
  const months = getMonthsRemaining(goal.deadline);
  const amountLeft = Math.max(goal.amount - (goal.saved || 0), 0);
  return +(amountLeft / months).toFixed(2);
}

const AppContent = ({ user, logout, income, setIncome, currentSavings, setCurrentSavings, effectiveSavings, setEffectiveSavings }) => {
  const { activeSection, setActiveSection } = useContext(SectionContext);
  const [goals, setGoals] = useState([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showGoalWizard, setShowGoalWizard] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [sortBy, setSortBy] = useState("priority");
  const [fundedGoalsSet, setFundedGoalsSet] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load funded goals from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`fundedGoals_${user.id}`);
      if (saved) {
        try {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) {
            setFundedGoalsSet(new Set(arr));
          }
        } catch (_) {}
      }
    }
  }, [user?.id]);

  // Persist funded goals whenever they change
  useEffect(() => {
    if (user?.id) {
      const arr = Array.from(fundedGoalsSet);
      localStorage.setItem(`fundedGoals_${user.id}`, JSON.stringify(arr));
    }
  }, [fundedGoalsSet, user?.id]);

  // Fetch goals on component mount
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch(`${API_URL}/goals`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch goals');
        const data = await response.json();
        setGoals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

  // Calculate totalMonthlyNeeded for the currently displayed goals
  const totalMonthlyNeeded = goals.reduce((sum, g) => sum + getMonthlySavings(g), 0);

  useEffect(() => {
    if (goals.length === 0 || !income) {
      return;
    }

    const calculatePlan = async () => {
      try {
        const response = await fetch(`${API_URL}/plans/calculate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            goals, 
            disposableIncome: income.monthlyDisposableIncome, 
            currentSavings: currentSavings 
          }),
        });
        
        if (!response.ok) throw new Error('Failed to calculate plan');
        const data = await response.json();
      } catch (err) {
        console.error('Error calculating plan:', err);
      }
    };

    calculatePlan();
  }, [goals, income, currentSavings]);

  const addGoal = async (goal) => {
    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(goal)
      });

      if (!response.ok) throw new Error('Failed to add goal');
      const newGoal = await response.json();
      setGoals(prev => [...prev, newGoal]);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeGoal = async (id) => {
    try {
      const response = await fetch(`${API_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete goal');
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditGoal = (goal) => {
    setEditGoal(goal);
    setShowGoalForm(true);
  };

  const handleSaveGoal = async (goal) => {
    try {
      if (editGoal) {
        const response = await fetch(`${API_URL}/goals/${goal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(goal)
        });

        if (!response.ok) throw new Error('Failed to update goal');
        const updatedGoal = await response.json();
        setGoals(prev => prev.map(g => g.id === goal.id ? updatedGoal : g));
      } else {
        await addGoal(goal);
      }
      setEditGoal(null);
      setShowGoalForm(false);
      setShowGoalWizard(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Sort goals by priority, deadline soonest, or deadline furthest
  const sortedGoals = [...goals].sort((a, b) => {
    if (sortBy === "priority") {
      return (a.priority || 0) - (b.priority || 0);
    } else if (sortBy === "deadline-soonest") {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortBy === "deadline-furthest") {
      return new Date(b.deadline) - new Date(a.deadline);
    }
    return 0;
  });

  // ensure only one priority 1 etc.
  useEffect(() => {
    if (!goals.length) return;

    // sort by priority then creation order (assuming id increasing)
    const sorted = [...goals].sort((a, b) => (a.priority || 0) - (b.priority || 0));
    let changed = false;
    let expected = 1;
    const updatedGoals = sorted.map(g => {
      if ((g.priority || 0) !== expected) {
        changed = true;
        return { ...g, priority: expected++ };
      }
      expected++;
      return g;
    });

    if (changed) {
      setGoals(updatedGoals);

      // Persist changes to backend in background
      updatedGoals.forEach(g => {
        fetch(`${API_URL}/goals/${g.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(g)
        }).catch(() => {});
      });
    }
  }, [goals]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  let content;
  if (activeSection === "home") {
    content = <Welcome user={user} />;
  } else if (activeSection === "goals") {
    content = (
      <Dashboard
        goals={sortedGoals}
        income={income.monthlyDisposableIncome}
        totalMonthlyNeeded={totalMonthlyNeeded}
        currentSavings={currentSavings}
        effectiveSavings={effectiveSavings}
        onRemoveGoal={removeGoal}
        onShowGoalForm={() => setShowGoalForm(true)}
        onEditGoal={handleEditGoal}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onShowGoalWizard={() => setShowGoalWizard(true)}
        setGoals={setGoals}
        onAdjustedSavingsChange={setEffectiveSavings}
        onFundedGoalsChange={setFundedGoalsSet}
        fundedGoals={fundedGoalsSet}
      />
    );
  } else if (activeSection === "analytics") {
    content = (
      <Overview
        goals={sortedGoals}
        income={income}
        currentSavings={currentSavings}
        effectiveSavings={effectiveSavings}
        fundedGoals={fundedGoalsSet}
      />
    );
  } else if (activeSection === "profile") {
    content = <ProfilePage />;
  } else if (activeSection === "goalwizard") {
    content = (
      <GoalWizard
        onClose={() => setActiveSection("goals")}
        onAddGoal={handleSaveGoal}
      />
    );
  } else if (activeSection === "overview") {
    content = (
      <>
        <Overview
          goals={sortedGoals}
          income={income}
          currentSavings={currentSavings}
          effectiveSavings={effectiveSavings}
          fundedGoals={fundedGoalsSet}
        />
      </>
    );
  }

  return (
    <>
      {content}
      {showGoalForm && (
        <GoalForm
          onClose={() => {
            setShowGoalForm(false);
            setEditGoal(null);
          }}
          onAddGoal={handleSaveGoal}
          editGoal={editGoal}
        />
      )}
      {showGoalWizard && (
        <GoalWizard
          onClose={() => setShowGoalWizard(false)}
          onAddGoal={handleSaveGoal}
        />
      )}
    </>
  );
};

const AppWithAuth = () => {
  const { user, logout } = useContext(UserContext);
  const [income, setIncome] = useState({ monthlyDisposableIncome: 0 });
  const [currentSavings, setCurrentSavings] = useState(0);
  const [effectiveSavings, setEffectiveSavings] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Load saved values when user is available
  useEffect(() => {
    if (user?.id) {
      // Fetch profile to decide if name/age provided
      fetch(`/api/users/me`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && (!data.name || !data.age)) {
            setShowNamePrompt(true);
          }
        })
        .catch(()=>{});

      // Decide if we should show tutorial
      const tutorialDone = localStorage.getItem(`tutorialCompleted_${user.id}`) === "true";
      setShowTutorial(!tutorialDone);

      const savedIncome = localStorage.getItem(`income_${user.id}`);
      const savedSavings = localStorage.getItem(`currentSavings_${user.id}`);
      
      if (savedIncome) {
        setIncome(JSON.parse(savedIncome));
      } else {
        setIncome({ monthlyDisposableIncome: 0 });
      }

      if (savedSavings) {
        setCurrentSavings(parseFloat(savedSavings));
      } else {
        setCurrentSavings(0);
      }
    }
  }, [user?.id]);

  // Save income and savings to localStorage when they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`income_${user.id}`, JSON.stringify(income));
    }
  }, [income, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`currentSavings_${user.id}`, currentSavings.toString());
    }
  }, [currentSavings, user?.id]);

  // Keep effectiveSavings in sync with currentSavings by default
  useEffect(() => {
    setEffectiveSavings(currentSavings);
  }, [currentSavings]);

  if (!user) {
    return <LoginForm />;
  }

  return (
    <>
      <Layout 
        income={income} 
        setIncome={setIncome}
        currentSavings={currentSavings}
        setCurrentSavings={setCurrentSavings}
        effectiveSavings={effectiveSavings}
      >
        <AppContent 
          user={user}
          logout={logout}
          income={income} 
          setIncome={setIncome}
          currentSavings={currentSavings}
          setCurrentSavings={setCurrentSavings}
          effectiveSavings={effectiveSavings}
          setEffectiveSavings={setEffectiveSavings}
        />
      </Layout>
      {showTutorial && (
        <TutorialOverlay
          onFinish={() => {
            if (user?.id) {
              localStorage.setItem(`tutorialCompleted_${user.id}`, "true");
            }
            setShowTutorial(false);
          }}
        />
      )}
      {showNamePrompt && (
        <NameAgePrompt
          onSave={async ({name, age}) => {
            try {
              await fetch('/api/users/me', {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, age })
              });
            } catch(_){}
            setShowNamePrompt(false);
          }}
        />
      )}
    </>
  );
};

const App = () => (
  <UserProvider>
    <AppWithAuth />
  </UserProvider>
);

export default App; 