(async () => {
    let volumeCallback = null;
    let volumeInterval = null;
    const volumeVisualizer = document.getElementById('volume-visualizer');
    const startButton = document.getElementById('start');
    const stopButton = document.getElementById('stop');
    // Initialize
    try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true
            }
        });
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.minDecibels = -127;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.4;
        audioSource.connect(analyser);
        const volumes = new Uint8Array(analyser.frequencyBinCount);
        volumeCallback = () => {
            analyser.getByteFrequencyData(volumes);
            let volumeSum = 0;
            for (const volume of volumes)
                volumeSum += volume;
            const averageVolume = volumeSum / volumes.length;
            // Value range: 127 = analyser.maxDecibels - analyser.minDecibels;
            volumeVisualizer.style.setProperty('--volume', (averageVolume * 100 / 127) + '%');
            loudnessAnalysis(averageVolume);
        };
    } catch (e) {
        console.error('Failed to initialize volume visualizer, simulating instead...', e);
        // Simulation
        //TODO remove in production!
        let lastVolume = 50;
        volumeCallback = () => {
            const volume = Math.min(Math.max(Math.random() * 100, 0.8 * lastVolume), 1.2 * lastVolume);
            lastVolume = volume;
            volumeVisualizer.style.setProperty('--volume', volume + '%');
        };
    }
    // Use
    startButton.addEventListener('click', () => {
        startSpeechRecognition();
        hideModal();
        startVideo();
        if (volumeCallback !== null && volumeInterval === null) {
            volumeInterval = setInterval(volumeCallback, 100);
            setReaction(0);
        }

    });
    // stopButton.addEventListener('click', () => {
    //     stopSpeechRecognition();
    //     showModal();
    //     if (volumeInterval !== null) {
    //         clearInterval(volumeInterval);
    //         volumeInterval = null;
    //     }
    // });
})();
let volRange = 0;
let timeAtVol = 0;
let timeAtDifVol = 0;

function hideModal() {
    document.getElementById('modal').style.opacity = 0;
    console.log('hide')
    setTimeout(() => {
        document.getElementById('modal').style.display = 'none'
    }, 2000);
}

function showModal() {
    document.getElementById('modal').style.opacity = 1;
    document.getElementById('modal').style.display = 'block'
}


function loudnessAnalysis(volume) {
    let curVolRange;
    if (volume < 20) {
        curVolRange = 0;
    } else if (volume < 40) {
        curVolRange = 1;
    } else if (volume < 60) {
        curVolRange = 2;
    } else if (volume < 80) {
        curVolRange = 3;
    } else {
        curVolRange = 4;
    }

    if (volRange != curVolRange) {
        if (timeAtDifVol > 10) {
            timeAtVol = 0;
            timeAtDifVol = 0;
            volRange = curVolRange;
            console.log(volume);
            setReaction(volRange);
        } else {
            timeAtDifVol++;
            timeAtVol
        }

    }
    timeAtVol++;
}


function setReaction(range) {
    console.log(range);
    const reactionBox = document.getElementById('reaction');
    if (range === 0) {
        reactionBox.innerHTML = "Thank you";
        // document.body.className = ""

    } else if (range === 1) {
        reactionBox.innerHTML = "Slightly quieter please";
        // document.body.className = ""
    } else if (range === 2) {
        reactionBox.innerHTML = "Too loud";
        // document.body.className = "lilShake";
    } else {
        reactionBox.innerHTML = "GET OUT PLEASE GET AWAY";
        document.body.style.animation = "";
        // document.body.className = "bigShake"
    }
}



try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
}
catch (e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
}

let noteContent = '';


/*-----------------------------
      Voice Recognition
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses.
recognition.continuous = true;

// This block is called every time the Speech APi captures a line.
recognition.onresult = function (event) {

    // event is a SpeechRecognitionEvent object.
    // It holds all the lines we have captured so far.
    // We only need the current one.
    var current = event.resultIndex;

    // Get a transcript of what was said.
    var transcript = event.results[current][0].transcript;



    // Add the current transcript to the contents of our Note.
    // There is a weird bug on mobile, where everything is repeated twice.
    // There is no official solution so far so we have to handle an edge case.
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

    if (!mobileRepeatBug) {
        createWordBubble(transcript);
    }
};

const output = document.getElementById('output')

function createWordBubble(text) {
    const bubble = document.createElement("div");
    bubble.className = "bubble"
    bubble.innerHTML = text;
    output.appendChild(bubble);
    console.log(text);
}

recognition.onstart = function () {
    console.log('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function () {
    console.log('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function (event) {
    if (event.error == 'no-speech') {
        console.log('No speech was detected. Try again.');
    };
}

function startSpeechRecognition() {
    if (noteContent.length) {
        noteContent += ' ';
    }
    recognition.start();
}

function stopSpeechRecognition() {
    recognition.stop();
    console.log('Voice recognition paused.');
}

/*
Video stuff:

1. sleeping video always playing #sleepVid
2. if quiet trigger and play quiet video #quietVid
3. if loud trigger loud video #loudVid
4. if louder trigger wake video #wakeVid

Overriding videos might be difficult need wait for a little while so stop 

*/
const sleepVid = document.getElementById("sleepVid");
const quietVid = document.getElementById("quietVid");
// const loudVid = document.getElementById("loudVid");
// const wakeVid = document.getElementById("WakeVid");
function startVideo() {
    sleepVid.play();
}

function startVid(vidName) {
    const vid = document.getElementById(vidName);
    vid.style.visibility = "unset";
    vid.play();
}