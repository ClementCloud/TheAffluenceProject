import React, { useState, createContext, useContext } from "react";
import { Cog6ToothIcon, HomeIcon, FlagIcon, ChartBarIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { UserContext } from "./UserContext";
import FinancialInputs from "./FinancialInputs";

export const SectionContext = createContext();

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { logout } = useContext(UserContext);
  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col items-start p-4">
      <div className="w-full flex-1 flex flex-col items-start gap-2">
        <button
          onClick={() => setActiveSection("home")}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeSection === "home"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <HomeIcon className="h-6 w-6" />
          <span className="font-semibold">Overview</span>
        </button>
        <button
          onClick={() => setActiveSection("goals")}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeSection === "goals"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FlagIcon className="h-6 w-6" />
          <span className="font-semibold">Goals</span>
        </button>
        <button
          onClick={() => setActiveSection("analytics")}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeSection === "analytics"
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ChartBarIcon className="h-6 w-6" />
          <span className="font-semibold">Analytics</span>
        </button>
      </div>
      <button
        onClick={logout}
        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-all duration-200 mt-auto"
        title="Logout"
      >
        <ArrowRightOnRectangleIcon className="h-6 w-6" />
        <span className="font-semibold">Logout</span>
      </button>
    </aside>
  );
};

const Topbar = ({ income, setIncome, currentSavings, setCurrentSavings, effectiveSavings }) => {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Proxima</h1>
      <div className="flex items-center gap-6">
        <FinancialInputs 
          income={income} 
          onIncomeChange={(newIncome) => setIncome(newIncome)}
          currentSavings={currentSavings}
          onSavingsChange={setCurrentSavings}
          effectiveSavings={effectiveSavings}
        />
        <Cog6ToothIcon className="h-7 w-7 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200" />
      </div>
    </header>
  );
};

const Layout = ({ children, income, setIncome, currentSavings, setCurrentSavings, effectiveSavings }) => {
  const [activeSection, setActiveSection] = useState('home');

  return (
    <SectionContext.Provider value={{ activeSection, setActiveSection }}>
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="flex-1 flex flex-col">
          <Topbar 
            income={income} 
            setIncome={setIncome}
            currentSavings={currentSavings}
            setCurrentSavings={setCurrentSavings}
            effectiveSavings={effectiveSavings}
          />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SectionContext.Provider>
  );
};

export default Layout; 