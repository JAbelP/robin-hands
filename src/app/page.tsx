"use client"
import { useState, useEffect, ChangeEvent, useRef } from 'react';
import { Settings, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function TimerAndChance() {
  return (
    <div className="p-4 space-y-10">
      <TimerComponent />
      <ChanceComponent />
      <BingoComponent />
    </div>
  );
}

function TimerComponent() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputTimeStr, setInputTimeStr] = useState("000000");
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('timerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeLeft === 'number') setTimeLeft(parsed.timeLeft);
        if (typeof parsed.isRunning === 'boolean') setIsRunning(parsed.isRunning);
        if (typeof parsed.inputTimeStr === 'string') setInputTimeStr(parsed.inputTimeStr);
      } catch {}
    }
  }, []);

  // Persist timer state to localStorage on change
  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify({ timeLeft, isRunning, inputTimeStr }));
  }, [timeLeft, isRunning, inputTimeStr]);

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

  // Update document title with time left
  useEffect(() => {
    document.title = formatTime(timeLeft);
    return () => {
      // Optionally reset title on unmount
      document.title = "Timer";
    };
  }, [timeLeft]);

  return (
    <div className="relative w-full max-w-md mx-auto text-center border p-4 rounded-2xl shadow-lg">
      <div className="absolute top-2 right-2 cursor-pointer" onClick={() => setShowSettings(!showSettings)}>
        <Settings />
      </div>
      {showSettings && (
        <div className="mb-4">
          <label className="block text-black text-left mb-1 font-medium">Enter time as HHMMSS (e.g., 013000 = 1 hr 30 min):</label>
          <input
            ref={inputRef}
            type="text"
            value={(() => {
              const padded = inputTimeStr.padStart(6, '0');
              const h = padded.slice(0,2);
              const m = padded.slice(2,4);
              const s = padded.slice(4,6);
              return `${h}:${m}:${s}`;
            })()}
            onChange={() => {}}
            onKeyDown={(e) => {
              if (e.key.match(/^[0-9]$/)) {
                e.preventDefault();
                const digits = (inputTimeStr + e.key).replace(/\D/g, '').slice(-6);
                setInputTimeStr(digits.padStart(6, '0'));
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.setSelectionRange(8, 8);
                  }
                }, 0);
              } else if (e.key === 'Backspace') {
                e.preventDefault();
                const digits = inputTimeStr.slice(0, -1);
                setInputTimeStr(digits.padStart(6, '0'));
                setTimeout(() => {
                  if (inputRef.current) {
                    inputRef.current.setSelectionRange(8, 8);
                  }
                }, 0);
              }
            }}
            className="border rounded p-2 w-full text-black mb-1 font-mono"
            placeholder="00:00:00"
            maxLength={8}
            inputMode="numeric"
          />
          <div className="text-gray-600 text-sm font-mono">
            {(() => {
              const padded = inputTimeStr.padStart(6, '0');
              const h = padded.slice(0,2);
              const m = padded.slice(2,4);
              const s = padded.slice(4,6);
              return `${h}:${m}:${s}`;
            })()}
          </div>
        </div>
      )}
      <div className="text-6xl font-bold mb-4">{formatTime(timeLeft)}</div>
      <div className="flex justify-center space-x-4">
        <button onClick={() => setIsRunning(!isRunning)} className={`${showSettings ? 'px-4 py-2' : 'p-2'} bg-blue-500 text-white rounded-full`}>
          {(isRunning ? <Pause /> : <Play />)}
        </button>
        <button onClick={reset} className={`${showSettings ? 'px-4 py-2' : 'p-2'} bg-red-500 text-white rounded-full`}>
          {showSettings ? 'Set Timer' : <RotateCcw />}
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
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);

  // Calculate even distribution if not in settings
  const displayedChoices = showSettings
    ? choices
    : choices.map((c, i, arr) => ({ ...c, chance: arr.length ? Math.round(100 / arr.length) : 0 }));

  const spin = (): void => {
    if (choices.length === 0) return;
    setSpinning(true);
    // Calculate which choice will win
    const total = displayedChoices.reduce((sum, c) => sum + c.chance, 0);
    if (total <= 0) {
      setResult(null);
      setSpinning(false);
      return;
    }
    const rand = Math.random() * total;
    let cumulative = 0;
    let winnerIdx = 0;
    for (let i = 0; i < displayedChoices.length; i++) {
      cumulative += displayedChoices[i].chance;
      if (rand <= cumulative) {
        winnerIdx = i;
        break;
      }
    }
    // Always do multiple full spins from current angle
    const segAngle = 360 / displayedChoices.length;
    const winnerOffset = 360 - (winnerIdx * segAngle + segAngle / 2);
    const fullSpins = 5; // number of full 360s
    const newAngle = spinAngle % 360; // normalize current angle
    const targetAngle = spinAngle + (360 * fullSpins) + (winnerOffset - newAngle);
    setSpinAngle(targetAngle);
    setTimeout(() => {
      setResult(displayedChoices[winnerIdx].name);
      setSpinning(false);
    }, 900);
  };

  const addChoice = (): void => {
    if (newChoice) {
      setChoices([...choices, { name: newChoice, chance: 0 }]);
      setNewChoice('');
      setNewChance('');
    }
  };

  const deleteChoice = (idx: number) => {
    setChoices(choices => choices.filter((_, i) => i !== idx));
  };

  const updateChance = (idx: number, value: string) => {
    const chanceNum = Number(value);
    if (!isNaN(chanceNum) && chanceNum >= 0) {
      setChoices(choices => choices.map((c, i) => i === idx ? { ...c, chance: chanceNum } : c));
    }
  };

  // Persist choices and result in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chanceSpinnerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.choices)) setChoices(parsed.choices);
        if (typeof parsed.result === 'string' || parsed.result === null) setResult(parsed.result);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chanceSpinnerState', JSON.stringify({ choices, result }));
  }, [choices, result]);

  return (
    <div className="w-full max-w-md mx-auto text-center border p-4 rounded-2xl shadow-lg relative">
      <div
        className="absolute top-2 right-2 cursor-pointer"
        onClick={() => setShowSettings(s => !s)}
        title="Settings"
      >
        <Settings />
      </div>
      <h2 className="text-xl font-bold mb-4">Chance Spinner</h2>
      <div className="mb-2 min-h-[2.5rem]">
        {result ? <p className="text-2xl font-semibold">Result: {result}</p> : 'Click Spin to try your luck!'}
      </div>
      <div className="flex flex-col items-center mb-4">
        <div className="relative" style={{ width: 300, height: 300 }}>
          <svg
            ref={wheelRef}
            width={300}
            height={300}
            viewBox="0 0 300 300"
            style={{ transition: spinning ? 'transform 1s cubic-bezier(.4,2.3,.3,1)' : undefined, transform: `rotate(${spinAngle}deg)` }}
          >
            {displayedChoices.map((choice, idx) => {
              const segAngle = 360 / displayedChoices.length;
              const startAngle = idx * segAngle;
              const endAngle = startAngle + segAngle;
              const largeArc = segAngle > 180 ? 1 : 0;
              const r = 140;
              const labelAngle = startAngle + segAngle / 2;
              const x = 150 + (r / 1.7) * Math.cos((Math.PI * (labelAngle - 90)) / 180);
              const y = 150 + (r / 1.7) * Math.sin((Math.PI * (labelAngle - 90)) / 180);
              // Keep text upright
              const textRotation = labelAngle > 180 ? labelAngle + 180 : labelAngle;
              return (
                <g key={idx}>
                  <path
                    d={`M150,150 L${150 + r * Math.cos((Math.PI * (startAngle - 90)) / 180)},${150 + r * Math.sin((Math.PI * (startAngle - 90)) / 180)} A${r},${r} 0 ${largeArc},1 ${150 + r * Math.cos((Math.PI * (endAngle - 90)) / 180)},${150 + r * Math.sin((Math.PI * (endAngle - 90)) / 180)} Z`}
                    fill={`hsl(${(idx * 360) / displayedChoices.length}, 70%, 70%)`}
                    stroke="#fff"
                    strokeWidth={2}
                    opacity={result === choice.name ? 1 : 0.8}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize={13}
                    fill="#222"
                    style={{ fontWeight: result === choice.name ? 'bold' : 'normal' }}
                    transform={`rotate(${-spinAngle + textRotation - 28} ${x} ${y})`}
                  >
                    {choice.name}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx={150} cy={150} r={55} fill="#fff" stroke="#ccc" strokeWidth={2} />
          </svg>
          {/* Pointer */}
          <div style={{ position: 'absolute', left: 145, top: -10, width: 10, height: 20 }}>
            <svg width={10} height={20}>
              <polygon points="5,0 10,20 0,20" fill="#f59e42" />
            </svg>
          </div>
        </div>
        <button
          type="button"
          onClick={!spinning && choices.length ? spin : undefined}
          disabled={spinning || choices.length === 0}
          className="bg-green-500 text-white px-4 py-2 z-0 rounded mt-4 flex items-center justify-center w-full max-w-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{ minWidth: 80 }}
        >
          <span className="pointer-events-none">Spin</span>
        </button>
      </div>
      <div className="space-y-2">
        {displayedChoices.map((choice, idx) => (
          <div key={idx} className="flex justify-between items-center text-left">
            <span>{choice.name}</span>
            <span className="flex items-center gap-2">
              {showSettings ? (
                <input
                  type="number"
                  value={choice.chance}
                  min={0}
                  onChange={e => updateChance(idx, e.target.value)}
                  className="border w-16 p-1 rounded text-black"
                />
              ) : (
                <span>{choice.chance}%</span>
              )}
              {showSettings && (
                <button
                  onClick={() => deleteChoice(idx)}
                  className="ml-2 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2 justify-center">
        <input
          value={newChoice}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewChoice(e.target.value)}
          placeholder="Choice name"
          className="border p-2 rounded w-1/2 text-black"
        />
        {showSettings && (
          <input
            value={newChance}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewChance(e.target.value)}
            placeholder="% Chance"
            type="number"
            className="border p-2 rounded w-1/2 text-black"
          />
        )}
      </div>
      <button onClick={addChoice} className="mt-2 bg-blue-500 text-white px-4 py-1 rounded">Add Choice</button>
    </div>
  );
}

function BingoComponent(): JSX.Element {
  const images = [
    'clothes.png', 'cold.png', 'craft.png', 'cry.png', 'darkness.png',
    'dirty.png', 'dishes.png', 'dive.png', 'fall.png', 'hands.png',
    'happy.png', 'help.png', 'hot.png', 'midnight.png', 'rain.png',
    'recycle.png', 'shiver.png', 'shower.png', 'sick.png', 'sleep.png',
    'Sun.png', 'wash.png', 'wind.png', 'winter.png'
  ];

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [shownImages, setShownImages] = useState<string[]>([]);
  const [availableImages, setAvailableImages] = useState<string[]>(images);

  const selectRandomImage = () => {
    if (availableImages.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    const selectedImage = availableImages[randomIndex];
    
    setCurrentImage(selectedImage);
    setShownImages([...shownImages, selectedImage]);
    setAvailableImages(availableImages.filter(img => img !== selectedImage));
  };

  const resetGame = () => {
    setCurrentImage(null);
    setShownImages([]);
    setAvailableImages(images);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center border p-4 rounded-2xl shadow-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4">BINGO</h2>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={selectRandomImage}
            disabled={availableImages.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400"
          >
            ROLL!
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            Reset
          </button>
        </div>
        {currentImage && (
          <div className="mb-4">
            <Image
              src={`/images/${currentImage}`}
              alt="Current BINGO"
              width={128}
              height={128}
              className="mx-auto object-contain"
            />
          </div>
        )}
      </div>
      <div>
        <h3 className="font-bold mb-2">Shown Images:</h3>
        <div className="grid grid-cols-3 gap-2">
          {shownImages.map((img, index) => (
            <div key={index} className="flex flex-col items-center">
              <Image
                src={`/images/${img}`}
                alt={`Shown ${index + 1}`}
                width={64}
                height={64}
                className="object-contain"
              />
              <span className="text-sm">{img.replace('.png', '')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
