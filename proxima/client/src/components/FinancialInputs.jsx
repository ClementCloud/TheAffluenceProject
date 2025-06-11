import { useState, useEffect } from "react";
import { BanknotesIcon, WalletIcon, PencilIcon } from '@heroicons/react/24/outline';

const FinancialInputs = ({ income, currentSavings, effectiveSavings, onIncomeChange, onSavingsChange }) => {
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [tempIncome, setTempIncome] = useState(income?.monthlyDisposableIncome || 0);
  const [tempSavings, setTempSavings] = useState(currentSavings || 0);

  useEffect(() => {
    setTempIncome(income?.monthlyDisposableIncome || 0);
  }, [income]);

  useEffect(() => {
    setTempSavings(currentSavings || 0);
  }, [currentSavings]);

  const handleIncomeSave = () => {
    onIncomeChange({ monthlyDisposableIncome: Number(tempIncome) });
    setIsEditingIncome(false);
  };

  const handleSavingsSave = () => {
    onSavingsChange(Number(tempSavings));
    setIsEditingSavings(false);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold text-primary mb-4">Financial Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-emerald-900">Monthly Disposable Income</label>
            {!isEditingIncome && (
              <button
                onClick={() => setIsEditingIncome(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {isEditingIncome ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={tempIncome}
                onChange={(e) => setTempIncome(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter monthly income"
              />
              <button
                onClick={handleIncomeSave}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="text-2xl font-bold text-emerald-700">
              ${(income?.monthlyDisposableIncome || 0).toLocaleString()}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-medium text-emerald-900">Total Saved</label>
            {!isEditingSavings && (
              <button
                onClick={() => setIsEditingSavings(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {isEditingSavings ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={tempSavings}
                onChange={(e) => setTempSavings(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter total saved"
              />
              <button
                onClick={handleSavingsSave}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="text-2xl font-bold text-emerald-700">
              ${((typeof effectiveSavings === 'number' ? effectiveSavings : currentSavings) || 0).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialInputs; 