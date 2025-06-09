"use client"
import { useState, useEffect, ChangeEvent } from 'react';
import { Settings, Pause, Play, RotateCcw } from 'lucide-react';

export default function TimerAndChance() {
  return (
    <div className="p-4 space-y-10">
      <TimerComponent />
      <ChanceComponent />
    </div>
  );
}

function TimerComponent() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputTimeStr, setInputTimeStr] = useState("000100");

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const parseTime = (str: string): number => {
    const padded = str.padStart(6, '0');
    const hours = parseInt(padded.slice(0, 2), 10);
    const minutes = parseInt(padded.slice(2, 4), 10);
    const seconds = parseInt(padded.slice(4, 6), 10);
    return hours * 3600 + minutes * 60 + seconds;
  };

  const reset = () => {
    const parsed = parseTime(inputTimeStr);
    setTimeLeft(parsed);
    setIsRunning(false);
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-center border p-4 rounded-2xl shadow-lg">
      <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
        <Settings />
      </div>
      {showSettings && (
        <div className="mb-4">
          <label className="block text-black text-left mb-1 font-medium">Enter time as HHMMSS (e.g., 013000 = 1 hr 30 min):</label>
          <input
            type="text"
            value={inputTimeStr}
            onChange={(e) => setInputTimeStr(e.target.value)}
            className="border rounded p-2 w-full text-black"
            placeholder="HHMMSS"
          />
        </div>
      )}
      <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
      <div className="flex justify-center space-x-4">
        <button onClick={() => setIsRunning(!isRunning)} className="p-2 bg-blue-500 text-white rounded-full">
          {isRunning ? <Pause /> : <Play />}
        </button>
        <button onClick={reset} className="p-2 bg-red-500 text-white rounded-full">
          <RotateCcw />
        </button>
      </div>
    </div>
  );
}

function ChanceComponent(): JSX.Element {
  type Choice = { name: string; chance: number };
  const [choices, setChoices] = useState<Choice[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [newChoice, setNewChoice] = useState<string>('');
  const [newChance, setNewChance] = useState<string>('');

  const spin = (): void => {
    const total = choices.reduce((sum, c) => sum + c.chance, 0);
    if (total <= 0) return;
    const rand = Math.random() * total;
    let cumulative = 0;
    for (const choice of choices) {
      cumulative += choice.chance;
      if (rand <= cumulative) {
        setResult(choice.name);
        break;
      }
    }
  };

  const addChoice = (): void => {
    const chanceNum = Number(newChance);
    if (
      newChoice &&
      newChance &&
      !isNaN(chanceNum) &&
      chanceNum > 0
    ) {
      setChoices([...choices, { name: newChoice, chance: chanceNum }]);
      setNewChoice('');
      setNewChance('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center border p-4 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Chance Spinner</h2>
      <div className="mb-2">{result ? <p className="text-2xl font-semibold">Result: {result}</p> : 'Click Spin to try your luck!'}</div>
      <button onClick={spin} className="bg-green-500 text-white px-4 py-2 rounded mb-4">Spin</button>
      <div className="space-y-2">
        {choices.map((choice, idx) => (
          <div key={idx} className="flex justify-between items-center text-left">
            <span>{choice.name}</span>
            <span>{choice.chance}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={newChoice}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewChoice(e.target.value)}
          placeholder="Choice name"
          className="border p-2 rounded w-1/2"
        />
        <input
          value={newChance}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewChance(e.target.value)}
          placeholder="% Chance"
          type="number"
          className="border p-2 rounded w-1/2"
        />
      </div>
      <button onClick={addChoice} className="mt-2 bg-blue-500 text-white px-4 py-1 rounded">Add Choice</button>
    </div>
  );
}
