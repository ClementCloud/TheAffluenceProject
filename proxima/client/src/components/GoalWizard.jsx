import React, { useState } from "react";

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

const prompts = [
  { key: "name", label: "What is your goal called?" },
  { key: "amount", label: "How much do you want to save? ($)" },
  { key: "deadlineOrDuration", label: "How do you want to set your goal's timeline?" },
  { key: "deadlineOrDurationInput", label: "" },
  { key: "priority", label: "What is the priority for this goal? (1 = highest)" },
];

const GoalWizard = ({ onAddGoal, onClose }) => {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ name: "", amount: "", deadline: "", duration: "", durationUnit: "months", useDuration: false, priority: 1 });

  const getPrompt = () => {
    if (step === 2) {
      return "How do you want to set your goal's timeline?";
    }
    if (step === 3) {
      if (values.useDuration) {
        return "How long do you want to save for this goal?";
      } else {
        return "By what date do you want to reach this goal?";
      }
    }
    return prompts[step].label;
  };

  const handleInput = (e) => {
    const { value } = e.target;
    if (step === 2) {
      setValues((prev) => ({ ...prev, useDuration: value === "duration" }));
    } else if (step === 3) {
      if (values.useDuration) {
        if (e.target.name === "duration") {
          setValues((prev) => ({ ...prev, duration: value }));
        } else if (e.target.name === "durationUnit") {
          setValues((prev) => ({ ...prev, durationUnit: value }));
        }
      } else {
        setValues((prev) => ({ ...prev, deadline: value }));
      }
    } else {
      setValues((prev) => ({ ...prev, [prompts[step].key]: value }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < prompts.length - 1) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleNext = () => {
    if (step < prompts.length - 1) setStep(step + 1);
  };

  const handleSubmit = () => {
    let finalDeadline = values.deadline;
    let months = 0;

    if (values.useDuration && values.duration) {
      finalDeadline = addDurationToDate(values.duration, values.durationUnit);
      if (values.durationUnit === "years") {
        months = Number(values.duration) * 12;
      } else if (values.durationUnit === "months") {
        months = Number(values.duration);
      } else {
        months = Math.ceil(Number(values.duration) / 30); // Approximate days to months
      }
    } else if (values.deadline) {
      months = getMonthsRemaining(values.deadline);
    }

    if (!values.name || !values.amount || !finalDeadline) return;
    onAddGoal({
      id: Date.now().toString(),
      name: values.name,
      amount: parseFloat(values.amount),
      deadline: finalDeadline,
      months: months,
      saved: 0,
      priority: Number(values.priority),
    });
    onClose();
  };

  const renderTimelineInput = () => {
    if (values.useDuration) {
      return (
        <div className="flex gap-2 w-full">
          <input
            className="w-full border rounded-full px-4 py-3 text-lg shadow focus:outline-none focus:ring-2 focus:ring-primary font-google"
            type="number"
            name="duration"
            placeholder="Duration"
            value={values.duration}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            min="1"
            autoFocus
          />
          <select
            name="durationUnit"
            className="border rounded-full px-2 py-2 text-lg font-google"
            value={values.durationUnit}
            onChange={handleInput}
          >
            <option value="days">Days</option>
            <option value="months">Months</option>
            <option value="years">Years</option>
          </select>
        </div>
      );
    } else {
      return (
        <input
          className="w-full border rounded-full px-4 py-3 text-lg shadow focus:outline-none focus:ring-2 focus:ring-primary font-google"
          type="date"
          value={values.deadline}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <button className="self-end text-gray-400 hover:text-red-500 mb-2" onClick={onClose}>&times;</button>
        <div className="mb-6 w-full text-center">
          <div className="text-2xl font-google font-semibold text-gray-800 mb-2">{getPrompt()}</div>
        </div>
        {step === 2 ? (
          <div className="flex gap-2 w-full justify-center">
            <button
              className={`px-4 py-2 rounded-full font-google text-lg ${!values.useDuration ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
              value="date"
              onClick={() => setValues((prev) => ({ ...prev, useDuration: false }))}
            >
              Date
            </button>
            <button
              className={`px-4 py-2 rounded-full font-google text-lg ${values.useDuration ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
              value="duration"
              onClick={() => setValues((prev) => ({ ...prev, useDuration: true }))}
            >
              Duration
            </button>
          </div>
        ) : step === 3 ? (
          renderTimelineInput()
        ) : (
          <input
            className="w-full border rounded-full px-4 py-3 text-lg shadow focus:outline-none focus:ring-2 focus:ring-primary mb-4 font-google"
            type={step === 1 ? "number" : step === 4 ? "number" : "text"}
            value={values[prompts[step].key]}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            min={step === 1 || step === 4 ? "1" : undefined}
            autoFocus
          />
        )}
        <div className="flex justify-between w-full mt-2">
          <button
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-medium"
            onClick={handlePrev}
            disabled={step === 0}
          >
            Back
          </button>
          {step < prompts.length - 1 ? (
            <button
              className="px-4 py-2 rounded bg-primary text-white font-semibold"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded bg-emerald-500 text-white font-semibold"
              onClick={handleSubmit}
            >
              Add Goal
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          {prompts.map((p, i) => (
            <div
              key={p.key}
              className={`w-3 h-3 rounded-full ${i === step ? "bg-primary" : "bg-gray-200"}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalWizard; 