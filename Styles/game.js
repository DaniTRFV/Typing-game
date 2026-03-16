const { useState, useEffect, useRef } = React;

function TypingGame() {
    // Word Bank
    const [wordBank] = useState("small real in consider while about against or still head many between a open would form seem each of problem day she more first number thing year home one state can here right hold general again lead way of last well find consider".split(" "));
    const [words, setWords] = useState([]);
    
    // State
    const [userInput, setUserInput] = useState("");
    const [typedHistory, setTypedHistory] = useState([]); // Stores what user submitted for each word
    const [activeWordIndex, setActiveWordIndex] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [seconds, setSeconds] = useState(30);
    const [isFinished, setIsFinished] = useState(false);
    const [results, setResults] = useState({ wpm: 0, acc: 0 });

    const inputRef = useRef(null);

    // 1. Initialize Game
    useEffect(() => {
        const shuffled = [...wordBank].sort(() => 0.5 - Math.random()).slice(0, 60);
        setWords(shuffled);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // 2. Timer Logic
    useEffect(() => {
        let interval;
        if (startTime && seconds > 0 && !isFinished) {
            interval = setInterval(() => setSeconds(s => s - 1), 1000);
        } else if (seconds === 0 && !isFinished) {
            finishGame();
        }
        return () => clearInterval(interval);
    }, [startTime, seconds, isFinished]);

    // 3. Handle Typing
    const handleInput = (e) => {
        if (isFinished) return;
        const value = e.target.value;
        if (!startTime) setStartTime(Date.now());

        if (value.endsWith(" ")) {
            // Spacebar logic: submit word
            if (userInput.length > 0) {
                setTypedHistory(prev => [...prev, userInput]);
                setActiveWordIndex(prev => prev + 1);
                setUserInput("");
            }
        } else {
            setUserInput(value);
        }
    };

    // 4. End Game & Calculate Real Stats
    const finishGame = () => {
        setIsFinished(true);
        
        let correctChars = 0;
        let totalCharsTyped = 0;

        typedHistory.forEach((typed, i) => {
            const original = words[i];
            totalCharsTyped += typed.length;
            // Check only characters that match the original word's position
            for (let j = 0; j < typed.length; j++) {
                if (typed[j] === original[j]) {
                    correctChars++;
                }
            }
        });

        const timeInMinutes = 0.5; // Since we have 30 seconds
        const wpm = Math.round((correctChars / 5) / timeInMinutes);
        const acc = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 0;

        setResults({ wpm, acc });

        // Post to your server
        fetch("/save-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wpm: wpm })
        });
    };

    return (
        <div className="game-container" onClick={() => inputRef.current.focus()}>
            <div className="timer">{seconds}s</div>
            
            <input 
                ref={inputRef}
                type="text"
                className="hidden-input"
                value={userInput}
                onChange={handleInput}
                autoFocus
                disabled={isFinished}
            />

            <div className={`word-grid ${isFinished ? 'fade' : ''}`}>
                {words.map((word, wIdx) => {
                    const isActive = wIdx === activeWordIndex;
                    const isPast = wIdx < activeWordIndex;
                    
                    // The magic: determine what string to compare against
                    const contentToCompare = isPast ? typedHistory[wIdx] : (isActive ? userInput : "");

                    return (
                        <div key={wIdx} className={`word ${isActive ? 'active' : ''}`}>
                            {word.split("").map((char, cIdx) => {
                                let status = ""; // pending

                                if (cIdx < contentToCompare.length) {
                                    // User typed this char -> check if correct
                                    status = contentToCompare[cIdx] === char ? "correct" : "wrong";
                                } else if (isPast) {
                                    // Word is in history but char was never typed
                                    status = "wrong";
                                }

                                return (
                                    <span key={cIdx} className={`char ${status}`}>
                                        {isActive && cIdx === userInput.length && <div className="caret" />}
                                        {char}
                                    </span>
                                );
                            })}
                            
                            {/* Handle "Extra" letters typed past the word length */}
                            {contentToCompare.length > word.length && (
                                contentToCompare.slice(word.length).split("").map((extraChar, eIdx) => (
                                    <span key={eIdx} className="char extra">{extraChar}</span>
                                ))
                            )}

                            {/* Caret if at the exact end of a word */}
                            {isActive && userInput.length >= word.length && (
                                <div className="caret" style={{ left: '100%' }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {isFinished && (
                <div className="results-screen">
                    <div className="res-box">
                        <span className="res-label">wpm</span>
                        <span className="res-value">{results.wpm}</span>
                    </div>
                    <div className="res-box">
                        <span className="res-label">acc</span>
                        <span className="res-value">{results.acc}%</span>
                    </div>
                    <button className="restart-btn" onClick={() => window.location.reload()}>
                        Next Test
                    </button>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TypingGame />);