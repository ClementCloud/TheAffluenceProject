import React, { useState } from "react";
import { createPortal } from "react-dom";

const steps = [
  {
    title: "Welcome to Proxima!",
    body: "Let's take a quick tour so you know where everything is."
  },
  {
    title: "Sidebar Navigation",
    body: "Use the buttons on the left to switch between your Overview, Goals, and Analytics pages."
  },
  {
    title: "Add & Manage Goals",
    body: "On the Goals page you can create new financial goals, edit them, and mark them as funded."
  },
  {
    title: "Analytics Dashboard",
    body: "The Analytics page shows summaries and charts based on your active goals."
  },
  {
    title: "Financial Info",
    body: "Use the panel in the top-right to enter your income and current savings at any time."
  }
];

const TutorialOverlay = ({ onFinish }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  // Render overlay via portal to body so it sits above everything
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">{steps[stepIndex].title}</h2>
        <p className="text-gray-700 mb-6 leading-relaxed">{steps[stepIndex].body}</p>
        <div className="flex justify-between gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            {stepIndex === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TutorialOverlay; 