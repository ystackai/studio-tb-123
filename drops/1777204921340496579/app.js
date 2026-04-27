(function () {
    'use strict';

    /* ── Audio Context & Global Nodes ── */
    var audioCtx = null;
    var masterGain = null;
    var tapeSaturator = null;
    var lfo = null;
    var lfoGain = null;
    var isLfoConnected = false;

    var state = {
        playing: false,
        recording: false,
        currentStep: -1,
        bpm: 120,
        mode: 'drum',
        waveform: 'saw',
        cutoff: 2000,
        resonance: 1,
        attack: 0.01,
        decay: 0.3,
        kickDecay: 0.3,
        snareDecay: 0.15,
        grid: Array.from({ length: 4 }, function () {
            return new Array(16).fill(false);
        }),
    };

    /* Default patterns */
    state.grid[0][0] = true;
    state.grid[0][4] = true;
    state.grid[0][8] = true;
    state.grid[0][12] = true;
    state.grid[1][4] = true;
    state.grid[1][12] = true;
    for (var i = 0; i < 16; i++) {
        state.grid[2][i] = true;
    }
    state.grid[3][0] = true;
    state.grid[3][3] = true;
    state.grid[3][6] = true;
    state.grid[3][10] = true;
    state.grid[3][12] = true;

    /* ── Scheduler State ── */
    var timerID = null;
    var nextStepTime = 0;
    var currentStepAudio = 0;
    var scheduleAheadTime = 0.1;
    var lookahead = 25;

    /* ── Tape Saturation (Waveshaper) ── */
    function buildTapeCurve() {
        var oversample = 44100;
        var curve = new Float32Array(oversample);
        for (var i = 0; i < oversample; i++) {
            var x = (i * 2) / oversample - 1;
            curve[i] = Math.tanh(x * 2.2) * 0.95;
        }
        return curve;
    }

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.7;

        tapeSaturator = audioCtx.createWaveShaper();
        tapeSaturator.curve = buildTapeCurve();
        tapeSaturator.oversample = '4x';

        tapeSaturator.connect(masterGain);
        masterGain.connect(audioCtx.destination);
    }

    function getSixteenthDuration() {
        return 60.0 / state.bpm / 4;
    }

    /* ── LFO Breathing ── */
    function startLFO() {
        if (lfo) return;
        lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 300;
        lfo.connect(lfoGain);
        lfo.start();
    }

    function stopLFO() {
        if (lfo) {
            try { lfo.stop(); } catch (e) { }
            try { lfo.disconnect(); } catch (e) { }
            try { lfoGain.disconnect(); } catch (e) { }
            lfo = null;
            lfoGain = null;
            isLfoConnected = false;
        }
    }

    function connectLfoToFilter(filter) {
        if (lfoGain && !isLfoConnected) {
            lfoGain.connect(filter.frequency);
            isLfoConnected = true;
        }
    }

    function disconnectLfoFromFilter(filter) {
        if (lfoGain && isLfoConnected) {
            try { lfoGain.disconnect(); } catch (e) { }
            isLfoConnected = false;
        }
    }

    /* ── Drum Synthesis ── */

    function playKick(time, decay) {
        var d = decay || state.kickDecay;
        var osc = audioCtx.createOscillator();
        var env = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

        env.gain.setValueAtTime(1, time);
        env.gain.exponentialRampToValueAtTime(0.001, time + d);

        osc.connect(env);
        env.connect(tapeSaturator);

        osc.start(time);
        osc.stop(time + d + 0.05);
    }

    function playSnare(time, decay) {
        var d = decay || state.snareDecay;

        // Noise body
        var noiseLen = audioCtx.sampleRate * Math.max(d, 0.01);
        var noiseBuffer = audioCtx.createBuffer(1, parseInt(noiseLen), audioCtx.sampleRate);
        var data = noiseBuffer.getChannelData(0);
        for (var i = 0; i < noiseLen; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        var noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        var noiseEnv = audioCtx.createGain();
        noiseEnv.gain.setValueAtTime(0.6, time);
        noiseEnv.gain.exponentialRampToValueAtTime(0.001, time + d);

        var noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1500;

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseEnv);
        noiseEnv.connect(tapeSaturator);
        noiseSource.start(time);
        noiseSource.stop(time + d + 0.01);

        // Tone body
        var osc = audioCtx.createOscillator();
        var toneEnv = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 200;
        toneEnv.gain.setValueAtTime(0.5, time);
        toneEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.connect(toneEnv);
        toneEnv.connect(tapeSaturator);
        osc.start(time);
        osc.stop(time + 0.12);
    }

    function playHiHat(time) {
        var d = 0.06;

        // Noise hiss
        var noiseLen = audioCtx.sampleRate * 0.1;
        var noiseBuffer = audioCtx.createBuffer(1, parseInt(noiseLen), audioCtx.sampleRate);
        var data = noiseBuffer.getChannelData(0);
        for (var i = 0; i < noiseLen; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        var noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        // Highpass
        var hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7500;
        hp.Q.value = 1.2;

        // Bandpass for metallic ring
        var bp = audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 10000;
        bp.Q.value = 0.8;

        var env = audioCtx.createGain();
        env.gain.setValueAtTime(0.3, time);
        env.gain.exponentialRampToValueAtTime(0.001, time + d);

        noiseSource.connect(hp);
        hp.connect(bp);
        bp.connect(env);
        env.connect(tapeSaturator);

        noiseSource.start(time);
        noiseSource.stop(time + d + 0.02);

        // Metallic tonal click
        var osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 8600;

        var oscEnv = audioCtx.createGain();
        oscEnv.gain.setValueAtTime(0.08, time);
        oscEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        var oscFilter = audioCtx.createBiquadFilter();
        oscFilter.type = 'highpass';
        oscFilter.frequency.value = 6000;

        osc.connect(oscFilter);
        oscFilter.connect(oscEnv);
        oscEnv.connect(tapeSaturator);

        osc.start(time);
        osc.stop(time + 0.03);
    }

    /* ── Monophonic Subtractive Synth ── */
    /* 16 bass notes mapped to steps */
    var noteFrequencies = [
        55.00, 55.00, 55.00,
        65.41, 65.41, 65.41,
        73.42, 73.42,
        55.00, 55.00,
        82.41, 73.42,
        65.41, 55.00, 55.00, 55.00
    ];

    var activeSynthNodes = null;
    var synthReleaseTimeout = null;

    function stopSynthNote(now) {
        if (!activeSynthNodes) return;
        var t = now || audioCtx.currentTime;

        try {
            activeSynthNodes.env.gain.cancelScheduledValues(t);
            activeSynthNodes.env.gain.setValueAtTime(
                Math.max(activeSynthNodes.env.gain.value, 0.001), t
            );
            activeSynthNodes.env.gain.linearRampToValueAtTime(0.0001, t + 0.04);
            activeSynthNodes.osc.stop(t + 0.06);
        } catch (e) { }

        disconnectLfoFromFilter(activeSynthNodes.filter);

        try { activeSynthNodes.osc.disconnect(); } catch (e) { }
        try { activeSynthNodes.filter.disconnect(); } catch (e) { }
        try { activeSynthNodes.env.disconnect(); } catch (e) { }

        activeSynthNodes = null;
        if (synthReleaseTimeout) {
            clearTimeout(synthReleaseTimeout);
            synthReleaseTimeout = null;
        }
    }

    function playSynth(time, stepIdx) {
        stopSynthNote(time);

        var freq = noteFrequencies[stepIdx % 16] || 55;

        var osc = audioCtx.createOscillator();
        var filter = audioCtx.createBiquadFilter();
        var env = audioCtx.createGain();

        osc.type = state.waveform;
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.Q.value = state.resonance;
        var baseCutoff = state.cutoff;
        filter.frequency.setValueAtTime(baseCutoff + 400, time);
        filter.frequency.exponentialRampToValueAtTime(
            Math.max(baseCutoff * 0.4, 50), time + state.decay * 0.8
        );

        connectLfoToFilter(filter);

        // ADSR
        var atk = Math.max(state.attack, 0.002);
        var dec = state.decay;
        env.gain.setValueAtTime(0.0001, time);
        env.gain.linearRampToValueAtTime(0.55, time + atk);
        env.gain.exponentialRampToValueAtTime(0.0001, time + atk + dec);

        osc.connect(filter);
        filter.connect(env);
        env.connect(tapeSaturator);

        osc.start(time);
        var totalDur = atk + dec + 0.05;
        osc.stop(time + totalDur);

        activeSynthNodes = { osc: osc, filter: filter, env: env };

        synthReleaseTimeout = setTimeout(function () {
            try { stopSynthNote(); } catch (e) { }
        }, totalDur * 1500);
    }

    /* ── Scheduler ── */

    function scheduleStep(step, time) {
        if (state.grid[0][step]) playKick(time);
        if (state.grid[1][step]) playSnare(time);
        if (state.grid[2][step]) playHiHat(time);
        if (state.grid[3][step]) playSynth(time, step);

        // Sync visual playhead
        var delay = Math.max(0, (time - audioCtx.currentTime) * 1000);
        setTimeout(function () {
            updatePlayhead(step);
        }, delay);
    }

    function scheduler() {
        while (nextStepTime < audioCtx.currentTime + scheduleAheadTime) {
            scheduleStep(currentStepAudio, nextStepTime);
            nextStepTime += getSixteenthDuration();
            currentStepAudio = (currentStepAudio + 1) % 16;
        }
        if (state.playing) {
            timerID = setTimeout(scheduler, lookahead);
        }
    }

    function startSequencer() {
        if (state.playing) return;
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        state.playing = true;
        currentStepAudio = 0;
        nextStepTime = Math.max(audioCtx.currentTime + 0.02, nextStepTime);
        startLFO();
        scheduler();

        document.getElementById('btn-play').classList.add('active');
    }

    function stopSequencer() {
        state.playing = false;
        if (timerID) {
            clearTimeout(timerID);
            timerID = null;
        }
        stopLFO();
        stopSynthNote();
        currentStepAudio = 0;
        clearPlayheadVisuals();
        document.getElementById('btn-play').classList.remove('active');
    }

    function togglePlay() {
        if (state.playing) {
            stopSequencer();
        } else {
            startSequencer();
        }
    }

    /* ── Recording ── */

    var capturedAudio = null;
    var recordingMediaDest = null;
    var mediaRecorder = null;
    var recordingChunks = [];

    function startAudioRecording() {
        if (!audioCtx) return;
        recordingChunks = [];

        // Create a parallel recording path
        recordingMediaDest = audioCtx.createMediaStreamDestination();
        masterGain.connect(recordingMediaDest);

        mediaRecorder = new MediaRecorder(recordingMediaDest.stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        mediaRecorder.ondataavailable = function (e) {
            if (e.data.size > 0) recordingChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
            try { masterGain.disconnect(recordingMediaDest); } catch (e) { }
            recordingMediaDest = null;
        };
        mediaRecorder.start();
    }

    function stopAudioRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }

    /* ── WAV Export (OfflineAudioContext) ── */

    function exportWav() {
        initAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        var bars = 4;
        var stepsPerBar = 16;
        var totalSteps = bars * stepsPerBar;
        var dur16 = getSixteenthDuration();
        var totalDuration = totalSteps * dur16 + 1;

        var offlineCtx = new OfflineAudioContext(1, parseInt(offlineCtx.sampleRate * totalDuration), offlineCtx.sampleRate);

        var offMaster = offlineCtx.createGain();
        offMaster.gain.value = 0.7;

        var offTape = offlineCtx.createWaveShaper();
        offTape.curve = buildTapeCurve();
        offTape.oversample = '4x';
        offTape.connect(offMaster);
        offMaster.connect(offlineCtx.destination);

        // Schedule all steps
        for (var step = 0; step < totalSteps; step++) {
            var t = step * dur16;
            if (state.grid[0][step % 16]) playKickOffline(offlineCtx, offTape, t, state.kickDecay);
            if (state.grid[1][step % 16]) playSnareOffline(offlineCtx, offTape, t, state.snareDecay);
            if (state.grid[2][step % 16]) playHiHatOffline(offlineCtx, offTape, t);
            if (state.grid[3][step % 16]) playSynthOffline(offlineCtx, offTape, t, step % 16);
        }

        offlineCtx.startRendering().then(function (buffer) {
            var wav = encodeWav(buffer);
            var blob = new Blob([wav], { type: 'audio/wav' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'tb123-export.wav';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
        });
    }

    /* Standalone drum/synth functions that accept a custom context and destination */
    function playKickOffline(ctx, dest, time, decay) {
        var d = decay || state.kickDecay;
        var osc = ctx.createOscillator();
        var env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
        env.gain.setValueAtTime(1, time);
        env.gain.exponentialRampToValueAtTime(0.001, time + d);
        osc.connect(env);
        env.connect(dest);
        osc.start(time);
        osc.stop(time + d + 0.05);
    }

    function playSnareOffline(ctx, dest, time, decay) {
        var d = decay || state.snareDecay;
        var noiseLen = ctx.sampleRate * Math.max(d, 0.01);
        var buffer = ctx.createBuffer(1, parseInt(noiseLen), ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
        var ns = ctx.createBufferSource();
        ns.buffer = buffer;
        var ne = ctx.createGain();
        ne.gain.setValueAtTime(0.6, time);
        ne.gain.exponentialRampToValueAtTime(0.001, time + d);
        var nf = ctx.createBiquadFilter();
        nf.type = 'highpass';
        nf.frequency.value = 1500;
        ns.connect(nf);
        nf.connect(ne);
        ne.connect(dest);
        ns.start(time);
        ns.stop(time + d + 0.01);

        var osc = ctx.createOscillator();
        var te = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 200;
        te.gain.setValueAtTime(0.5, time);
        te.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        osc.connect(te);
        te.connect(dest);
        osc.start(time);
        osc.stop(time + 0.12);
    }

    function playHiHatOffline(ctx, dest, time) {
        var d = 0.06;
        var noiseLen = ctx.sampleRate * 0.1;
        var buffer = ctx.createBuffer(1, parseInt(noiseLen), ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;
        var ns = ctx.createBufferSource();
        ns.buffer = buffer;
        var hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7500;
        hp.Q.value = 1.2;
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 10000;
        bp.Q.value = 0.8;
        var env = ctx.createGain();
        env.gain.setValueAtTime(0.3, time);
        env.gain.exponentialRampToValueAtTime(0.001, time + d);
        ns.connect(hp);
        hp.connect(bp);
        bp.connect(env);
        env.connect(dest);
        ns.start(time);
        ns.stop(time + d + 0.02);

        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 8600;
        var oscEnv = ctx.createGain();
        oscEnv.gain.setValueAtTime(0.08, time);
        oscEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        var oscFilt = ctx.createBiquadFilter();
        oscFilt.type = 'highpass';
        oscFilt.frequency.value = 6000;
        osc.connect(oscFilt);
        oscFilt.connect(oscEnv);
        oscEnv.connect(dest);
        osc.start(time);
        osc.stop(time + 0.03);
    }

    function playSynthOffline(ctx, dest, time, stepIdx) {
        var freq = noteFrequencies[stepIdx % 16] || 55;
        var osc = ctx.createOscillator();
        var filter = ctx.createBiquadFilter();
        var env = ctx.createGain();

        osc.type = state.waveform;
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.Q.value = state.resonance;
        var baseCutoff = state.cutoff;
        filter.frequency.setValueAtTime(baseCutoff + 400, time);
        filter.frequency.exponentialRampToValueAtTime(
            Math.max(baseCutoff * 0.4, 50), time + state.decay * 0.8
        );

        var atk = Math.max(state.attack, 0.002);
        var dec = state.decay;
        env.gain.setValueAtTime(0.0001, time);
        env.gain.linearRampToValueAtTime(0.55, time + atk);
        env.gain.exponentialRampToValueAtTime(0.0001, time + atk + dec);

        osc.connect(filter);
        filter.connect(env);
        env.connect(dest);

        osc.start(time);
        var totalDur = atk + dec + 0.05;
        osc.stop(time + totalDur);
    }

    /* Minimal WAV encoder — no external deps */
    function encodeWav(buffer) {
        var numChan = buffer.numberOfChannels;
        var sr = buffer.sampleRate;
        var bits = 16;
        var bytesPerSample = bits / 8;
        var blockAlign = numChan * bytesPerSample;

        var channels = [];
        for (var ch = 0; ch < numChan; ch++) {
            channels.push(buffer.getChannelData(ch));
        }

        var dataLen = channels[0].length * blockAlign;
        var headerLen = 44;
        var ab = new ArrayBuffer(headerLen + dataLen);
        var view = new DataView(ab);

        function writeStr(o, s) { for (var i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); }

        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + dataLen, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChan, true);
        view.setUint32(24, sr, true);
        view.setUint32(28, sr * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bits, true);
        writeStr(36, 'data');
        view.setUint32(40, dataLen, true);

        var offset = 44;
        for (var i = 0; i < channels[0].length; i++) {
            for (var ch = 0; ch < numChan; ch++) {
                var s = Math.max(-1, Math.min(1, channels[ch][i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                offset += 2;
            }
        }
        return ab;
    }

    /* ── UI: Grid Rendering ── */

    function buildGrid() {
        var rows = document.querySelectorAll('.cells');
        rows.forEach(function (rowEl) {
            var rowIdx = parseInt(rowEl.getAttribute('data-row'));
            rowEl.innerHTML = '';
            for (var s = 0; s < 16; s++) {
                var cell = document.createElement('div');
                cell.className = 'cell' + (state.grid[rowIdx][s] ? ' on' : '');
                cell.setAttribute('data-row', rowIdx);
                cell.setAttribute('data-step', s);
                if (s % 4 === 0) cell.classList.add('cell-lead');
                rowEl.appendChild(cell);
            }
        });
    }

    function redrawGrid() {
        var cells = document.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            var r = parseInt(cell.getAttribute('data-row'));
            var s = parseInt(cell.getAttribute('data-step'));
            cell.classList.toggle('on', !!state.grid[r][s]);
        });
    }

    function toggleCell(row, step) {
        initAudio();
        state.grid[row][step] = !state.grid[row][step];
        if (state.grid[row][step]) {
            triggerSound(row, step);
        }
        redrawGrid();
    }

    function triggerSound(row, step) {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        switch (row) {
            case 0: playKick(now); break;
            case 1: playSnare(now); break;
            case 2: playHiHat(now); break;
            case 3: playSynth(now, step); break;
        }
    }

    /* ── UI: Playhead ── */

    function updatePlayhead(step) {
        state.currentStep = step;
        var cells = document.querySelectorAll('.cell');
        cells.forEach(function (cell) {
            var s = parseInt(cell.getAttribute('data-step'));
            cell.classList.toggle('playing', s === step);
        });
    }

    function clearPlayheadVisuals() {
        var playing = document.querySelectorAll('.cell.playing');
        playing.forEach(function (c) { c.classList.remove('playing'); });
        state.currentStep = -1;
    }

    /* ── UI: Controls Wiring ── */

    // BPM
    var bpmSlider = document.getElementById('bpm-slider');
    var bpmDisplay = document.getElementById('bpm-display');
    bpmSlider.addEventListener('input', function () {
        state.bpm = parseInt(this.value);
        bpmDisplay.textContent = state.bpm;
    });

    // Mode toggle
    var modeDrum = document.getElementById('mode-drum');
    var modeSynth = document.getElementById('mode-synth');
    modeDrum.addEventListener('click', function () {
        state.mode = 'drum';
        modeDrum.classList.add('active');
        modeSynth.classList.remove('active');
        document.getElementById('drum-controls').classList.remove('hidden');
        document.getElementById('synth-controls').classList.add('hidden');
    });
    modeSynth.addEventListener('click', function () {
        state.mode = 'synth';
        modeSynth.classList.add('active');
        modeDrum.classList.remove('active');
        document.getElementById('synth-controls').classList.remove('hidden');
        document.getElementById('drum-controls').classList.add('hidden');
    });

    // Waveform
    document.querySelectorAll('.wave-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.wave-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            state.waveform = this.getAttribute('data-wave');
        });
    });

    // Cutoff
    var ctrlCutoff = document.getElementById('ctrl-cutoff');
    var valCutoff = document.getElementById('val-cutoff');
    ctrlCutoff.addEventListener('input', function () {
        state.cutoff = parseFloat(this.value);
        valCutoff.textContent = state.cutoff + ' Hz';
    });

    // Resonance
    var ctrlRes = document.getElementById('ctrl-res');
    var valRes = document.getElementById('val-res');
    ctrlRes.addEventListener('input', function () {
        state.resonance = parseFloat(this.value);
        valRes.textContent = parseFloat(state.resonance).toFixed(1);
    });

    // Attack
    var ctrlAttack = document.getElementById('ctrl-attack');
    var valAtk = document.getElementById('val-atk');
    ctrlAttack.addEventListener('input', function () {
        state.attack = parseFloat(this.value);
        valAtk.textContent = state.attack.toFixed(2) + 's';
    });

    // Decay
    var ctrlDecay = document.getElementById('ctrl-decay');
    var valDec = document.getElementById('val-dec');
    ctrlDecay.addEventListener('input', function () {
        state.decay = parseFloat(this.value);
        valDec.textContent = state.decay.toFixed(2) + 's';
    });

    // Kick decay
    var ctrlKickDecay = document.getElementById('ctrl-kick-decay');
    var valKickDec = document.getElementById('val-kick-dec');
    ctrlKickDecay.addEventListener('input', function () {
        state.kickDecay = parseFloat(this.value);
        valKickDec.textContent = state.kickDecay.toFixed(2) + 's';
    });

    // Snare decay
    var ctrlSnareDecay = document.getElementById('ctrl-snare-decay');
    var valSnareDec = document.getElementById('val-snare-dec');
    ctrlSnareDecay.addEventListener('input', function () {
        state.snareDecay = parseFloat(this.value);
        valSnareDec.textContent = state.snareDecay.toFixed(2) + 's';
    });

    /* ── Grid Click (delegation) ── */
    document.getElementById('grid').addEventListener('click', function (e) {
        var cell = e.target.closest('.cell');
        if (!cell) return;
        var row = parseInt(cell.getAttribute('data-row'));
        var step = parseInt(cell.getAttribute('data-step'));
        toggleCell(row, step);
    });

    /* ── Transport Buttons ── */
    document.getElementById('btn-play').addEventListener('click', togglePlay);
    document.getElementById('btn-stop').addEventListener('click', function () {
        if (state.playing) stopSequencer();
    });
    document.getElementById('btn-record').addEventListener('click', function () {
        if (state.recording) {
            stopAudioRecording();
            state.recording = false;
            this.classList.remove('active');
        } else {
            if (!state.playing) startSequencer();
            startAudioRecording();
            state.recording = true;
            this.classList.add('active');
        }
    });

    // Export button
    var btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', function () {
            if (state.recording && recordingChunks.length > 0) {
                // Export captured audio as blob
                var type = recordingChunks[0] && recordingChunks[0].type || 'audio/webm';
                var blob = new Blob(recordingChunks, { type: type });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'tb123-recording.webm';
                document.body.appendChild(a);
                a.click();
                setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
            } else {
                exportWav();
            }
        });
    }

    /* ── Keyboard Input ── */
    var keyMap = {
        '1': function () { initAudio(); playKick(audioCtx.currentTime); flashRow(0); },
        '2': function () { initAudio(); playSnare(audioCtx.currentTime); flashRow(1); },
        '3': function () { initAudio(); playHiHat(audioCtx.currentTime); flashRow(2); },
        '4': function () { initAudio(); playSynth(audioCtx.currentTime, 0); flashRow(3); },
    };

    function flashRow(row) {
        var cells = document.querySelectorAll('.cells[data-row="' + row + '"] .cell');
        cells.forEach(function (c) {
            c.classList.add('playing');
            setTimeout(function () { c.classList.remove('playing'); }, 150);
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.target.tagName === 'INPUT') return;
        var k = e.key.toLowerCase();
        if (keyMap[k]) { e.preventDefault(); keyMap[k](); return; }
        if (k === ' ') { e.preventDefault(); togglePlay(); return; }
        if (k === 'r') { e.preventDefault();
            if (state.recording) {
                stopAudioRecording();
                state.recording = false;
                document.getElementById('btn-record').classList.remove('active');
            } else {
                if (!state.playing) startSequencer();
                startAudioRecording();
                state.recording = true;
                document.getElementById('btn-record').classList.add('active');
            }
            return;
        }
        if (k === 'e') {
            e.preventDefault();
            var btn = document.getElementById('btn-export');
            if (btn) btn.click();
            return;
        }
    });

    /* ── Init ── */
    buildGrid();

})();
