const { useState, useEffect, useRef } = React;

function TypingGame() {
    const TROLL_MESSAGES = ["CRITICAL ERROR: Typing speed too high", "Updating Brain... 1%", "Are you sure that's a word?", "KICKED FOR SPAM (Just kidding)", "PLEASE WAIT: Calibrating Keyboard"];
    const AUTOCORRECT_MAP = { "the": "teh", "and": "adn", "with": "wiht", "from": "form", "this": "tihs" };
    
    const [wordBank] = useState("small real in consider while about against or still head many between a open would form seem each of problem day she more first number thing year home one state can here right hold general again lead way of last well find consider".split(" "));
    const [words, setWords] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [typedHistory, setTypedHistory] = useState([]); 
    const [activeWordIndex, setActiveWordIndex] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [seconds, setSeconds] = useState(30);
    const [isFinished, setIsFinished] = useState(false);
    const [results, setResults] = useState({ wpm: 0, acc: 0 });
    
    // THE ANNOYANCE STATE
    const [trollMsg, setTrollMsg] = useState("");
    const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
    const [progress, setProgress] = useState(0);
    const [isGlitching, setIsGlitching] = useState(false);
    const [showSystemUpdate, setShowSystemUpdate] = useState(false);

    const inputRef = useRef(null);

    useEffect(() => {
        const shuffled = [...wordBank].sort(() => 0.5 - Math.random()).slice(0, 60);
        setWords(shuffled);
    }, []);

    useEffect(() => {
        let interval;
        if (startTime && seconds > 0 && !isFinished) {
            interval = setInterval(() => {
                setSeconds(s => s - 1);
                
                // Randomly trigger "System Update" overlay
                if (seconds === 15 || seconds === 5) {
                    setShowSystemUpdate(true);
                    setTimeout(() => setShowSystemUpdate(false), 2000);
                }

                // Progress bar goes wild
                setProgress(p => (p > 90 ? 10 : p + Math.random() * 15));
            }, 1000);
        } else if (seconds === 0 && !isFinished) {
            finishGame();
        }
        return () => clearInterval(interval);
    }, [startTime, seconds, isFinished]);

    const handleInput = (e) => {
        if (isFinished || showSystemUpdate) return;
        let val = e.target.value;
        if (!startTime) setStartTime(Date.now());

        // 1. Screen Shake on fast typing
        if (val.length > userInput.length) {
            setIsGlitching(true);
            setTimeout(() => setIsGlitching(false), 50);
        }

        // 2. High Deletion (6% chance)
        if (val.length > userInput.length && Math.random() > 0.94) {
            val = val.slice(0, -1);
        }

        if (val.endsWith(" ")) {
            let wordToSubmit = val.trim();
            // 3. Heavy Autocorrect
            if (AUTOCORRECT_MAP[wordToSubmit] && Math.random() > 0.6) {
                wordToSubmit = AUTOCORRECT_MAP[wordToSubmit];
            }
            
            if (wordToSubmit.length > 0) {
                setTypedHistory(prev => [...prev, wordToSubmit]);
                setActiveWordIndex(prev => prev + 1);
                setUserInput("");
                
                // 4. BIG POPUPS
                if (Math.random() > 0.85) {
                    setTrollMsg(TROLL_MESSAGES[Math.floor(Math.random() * TROLL_MESSAGES.length)]);
                    setTimeout(() => setTrollMsg(""), 2500);
                }
            }
            return;
        }
        setUserInput(val);
    };

    const finishGame = () => {
        setIsFinished(true);
        setResults({ wpm: Math.floor(Math.random() * 20), acc: Math.floor(Math.random() * 40) });
    };

    const moveButton = () => {
        setBtnPos({ x: Math.random() * 500 - 250, y: Math.random() * 200 - 100 });
    };

    return (
        <div className={`game-container ${isGlitching ? 'shake-effect' : ''}`} onClick={() => inputRef.current.focus()}>
            
            {/* FAKE SYSTEM UPDATE OVERLAY */}
            {showSystemUpdate && (
                <div className="system-update-overlay">
                    <div className="update-box">
                        <h3>Windows is Updating</h3>
                        <p>Please do not turn off your PC. This will take a while...</p>
                        <div className="spinner"></div>
                    </div>
                </div>
            )}

            <div className="timer">Time Remaining: {seconds} (Approx)</div>
            
            <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            {trollMsg && <div className="big-troll-popup">{trollMsg}</div>}
            
            <input ref={inputRef} type="text" className="hidden-input" value={userInput} onChange={handleInput} autoFocus />

            <div className={`word-grid ${isFinished ? 'fade' : ''}`}>
                {words.map((word, wIdx) => {
                    const isActive = wIdx === activeWordIndex;
                    const content = wIdx < activeWordIndex ? typedHistory[wIdx] : (isActive ? userInput : "");
                    return (
                        <div key={wIdx} className="word">
                            {word.split("").map((char, cIdx) => (
                                <span key={cIdx} className={`char ${cIdx < content.length ? (content[cIdx] === char ? "correct" : "wrong") : ""}`}>
                                    {isActive && cIdx === userInput.length && (
                                        <div className="triple-caret-container">
                                            <div className="caret real-caret" />
                                            <div className="caret ghost-caret-1" />
                                            <div className="caret ghost-caret-2" />
                                        </div>
                                    )}
                                    {char}
                                </span>
                            ))}
                        </div>
                    );
                })}
            </div>

            {isFinished && (
                <div className="results-screen">
                    <div className="res-box"><span className="res-label">wpm</span><span className="res-value">{results.wpm}</span></div>
                    <button 
                        className="restart-btn" 
                        onMouseEnter={moveButton}
                        onClick={() => window.location.reload()}
                        style={{ transform: `translate(${btnPos.x}px, ${btnPos.y}px)`, position: 'absolute' }}
                    >
                        SUBMIT RESULTS
                    </button>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TypingGame />);