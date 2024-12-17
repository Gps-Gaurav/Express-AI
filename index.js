const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');

const appendMessage = (text, sender) => {
    const message = document.createElement('div');
    message.className = `message ${sender}`;
    message.textContent = text;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

const fetchBotResponse = async (question) => {
    try {
        const response = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.result || "Sorry, I couldn't understand that.";
        } else {
            throw new Error("Failed to fetch response");
        }
    } catch (error) {
        console.error(error);
        return "An error occurred while fetching the response.";
    }
};

// Speak Functionality

let textToSpeechEnabled = true; // Initial state: Text-to-Speech is enabled
let isPaused = false; // Tracks if speech is paused
let currentUtterance = null; // Holds the current speech instance
const speak = (text) => {
    if (!textToSpeechEnabled) return; // Do not speak if TTS is disabled

    // If speech is paused and we have a current utterance, resume speech
    if (isPaused && currentUtterance) {
        window.speechSynthesis.resume();
        isPaused = false;
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create a new speech instance
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = "hi-IN";
    currentUtterance.pitch = 1;
    currentUtterance.rate = 1;

    // Reset pause state when speech ends
    currentUtterance.onend = () => {
        isPaused = false;
        currentUtterance = null;
    };

    // Start speaking
    window.speechSynthesis.speak(currentUtterance);
};

// Toggle Play/Pause Functionality
const togglePlayPause = () => {
    const playPauseButton = document.getElementById("play-pause-btn");

    if (window.speechSynthesis.speaking && !isPaused) {
        // Pause Speech
        window.speechSynthesis.pause();
        isPaused = true;
        playPauseButton.innerHTML = "🔊"; // Update button to Play
        playPauseButton.classList.replace("bg-green-500", "bg-yellow-500");
    } else if (isPaused) {
        // Resume Speech
        window.speechSynthesis.resume();
        isPaused = false;
        playPauseButton.innerHTML = "🔇"; // Update button to Pause
        playPauseButton.classList.replace("bg-yellow-500", "bg-green-500");
    } else {
        // Start New Speech
        speak("Hi, how can I help you today");
        isPaused = true;
        playPauseButton.innerHTML = "🔊"; // Update button to Pause
        playPauseButton.classList.replace("bg-yellow-500", "bg-green-500");
    }
};

// Event Listeners
sendButton.addEventListener("click", async () => {
    const userText = userInput.value.trim();
    if (userText) {
        appendMessage(userText, "user");
        userInput.value = "";

        appendMessage("Typing...", "bot");
        const botMessage = await fetchBotResponse(userText);
        messagesContainer.querySelector(".bot:last-child").remove();
        appendMessage(botMessage, "bot");

        // Convert bot's message to speech
        speak(botMessage);
    }
});

// Handle "Enter" key press
userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendButton.click();
    }
});


// Speech Recognition (for the 'record-btn' button)

let recognition;
let silenceTimeout;
const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser.');
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // Stops automatically on silence
    recognition.interimResults = true;

    // When a result is detected
    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        userInput.value = transcript;

        // Reset the silence timer
        clearTimeout(silenceTimeout);
        silenceTimeout = setTimeout(() => {
            recognition.stop();
            console.log('Silence detected. Stopping recognition.');
        }, 2000); // Stop after 2 seconds of silence
    };

    // Stop automatically when silence is detected
    recognition.onspeechend = () => {
        console.log('Speech ended. Stopping recognition.');
        recognition.stop();
    };

    // Handle errors
    recognition.onerror = (event) => {
        console.error(event.error);
        alert('There was an error with speech recognition.');
    };

    recognition.start();
    console.log('Speech recognition started...');
};

   // Typewriter function
   function typeWriter(elementId, text, speed) {
    let i = 0;
    let element = document.getElementById(elementId);
    element.textContent = '';  // Ensure it's empty before starting

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Start the typewriter effect
window.onload = function () {
    typeWriter('typewriter-head', "Welcome to Express AI", 150)
    typeWriter('typewriter-text', 'Hi, how can I help you today?', 100); // Speed is 100ms per character
};