window.onload = function () {
    var voiceInput = document.getElementById("voice");
    var modelInput = document.getElementById("model");

    document.getElementById("startConversationBtn").addEventListener("click", function () {
      document.getElementById("startContainer").style.display = "none";
      document.getElementById("blobCanvas").style.display = "flex";
      document.getElementById("buttonContainer").style.display = "flex";
      document.getElementById("instructionsContainer").style.display = "flex";

      var voice = voiceInput.options[voiceInput.selectedIndex].value;
      var providerAndModel = modelInput.options[modelInput.selectedIndex].value.split("+");

      var ws = new WebSocket("wss://sts.sandbox.deepgram.com/demo/agent");

      // Blob animation setup
      var targetAudioLevel = 0;
      var audioLevel = 0;

      // Global audio context
      var audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({ latencyHint: "interactive" });

      // Configuration settings for the agent
      var config_settings = {
        type: "SettingsConfiguration",
        audio: {
          input: {
            encoding: "linear32",
            sample_rate: 48000
          },
          output: {
            encoding: "linear16",
            sample_rate: 48000,
            container: "none",
            buffer_size: 250,
          }
        },
        agent: {
          listen: {
            model: "nova-2"
          },
          think: {
            provider: providerAndModel[0],
            model: providerAndModel[1],
            instructions: "You are a helpful assistant who responds in 1-2 sentences at most each time."
          },
          speak: {
            model: voice
          }
        }
      };

      // Update the text area to match the initial instructions
      document.getElementById("instructionsInput").value =
        config_settings.agent.think.instructions;

        // button selection code
      var voice_selection = voice; // Default selection
      document.getElementById(voice_selection).classList.add("selected");

      document.querySelectorAll(".circle-button").forEach((button) => {
        button.addEventListener("click", function () {
          document
            .querySelector(".circle-button.selected")
            .classList.remove("selected");
          this.classList.add("selected");
          var voice_selection = this.id;
          console.log("Voice selection changed to:", voice_selection);

          ws.send(JSON.stringify({
            "type": "UpdateSpeak",
            "model": voice_selection
          }));
        });
      });

      // Update the instructions when a button is clicked
      document
        .getElementById("updateInstructionsBtn")
        .addEventListener("click", function () {
          var instructions =
            document.getElementById("instructionsInput").value;
          ws.send(JSON.stringify({
            "type": "UpdateInstructions",
            "instructions": instructions
          }))
        });

      function updateBlobSize(level) {
        targetAudioLevel = level; // Set the new target level
      }

      function animateBlob() {
        var canvas = document.getElementById("blobCanvas");
        var ctx = canvas.getContext("2d");
        var time = performance.now() * 0.001;
        // Smoothing the transition by moving audioLevel towards targetAudioLevel
        audioLevel += (targetAudioLevel - audioLevel) * 0.05;
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var baseSize = 200 + audioLevel * 100; // Adjust base size based on audio level
        // Create a gradient from deep teal to lighter teal
        var gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          baseSize * 0.00005,
          centerX,
          centerY,
          baseSize
        );
        gradient.addColorStop(0, "#005f73"); // Deep teal
        gradient.addColorStop(1, "#005f73 "); // Lighter teal

        canvas.width = canvas.width; // Clear canvas for new frame
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        // Create a rounded, flowing shape by varying the radius subtly

        for (let angle = 0; angle <= Math.PI * 2; angle += 0.01) {
          let smoothRandom =
            Math.sin(angle * (3 + Math.random() * 0.005) + time) * 5 +
            Math.cos(angle * (5 + Math.random() * 0.005) + time) * 5;
          let radius = baseSize + smoothRandom; // Incorporate the smoothed random factor
          let x = centerX + radius * Math.cos(angle);
          let y = centerY + radius * Math.sin(angle);
          ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Gradually decrease audioLevel to return to normal size
        audioLevel *= 0.95;

        requestAnimationFrame(animateBlob);
      }

      ws.binaryType = 'arraybuffer';

      ws.onopen = function () {
        console.log("WebSocket connection established.");
        ws.send(JSON.stringify(config_settings)); // Send initial config on connection
        startStreaming();
      };

      ws.onerror = function (error) {
        console.error("WebSocket error:", error);
      };

      ws.onmessage = function (event) {
        // console.log("receiving message?");
        if (typeof event.data === "string") {
          console.log("Text message received:", event.data);
          // Handle text messages here
        } else if (
          event.data instanceof ArrayBuffer
        ) {
          // update blob animation size based on audio level
          var simulatedVolumeLevel = 0.05; // This should be replaced with real analysis
          updateBlobSize(simulatedVolumeLevel * 5); // Adjust scale as needed

          feedAudioData(event.data);
        } else {
          console.error("Unsupported message format.");
        }
      };

      var audioContextOut = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive", sampleRate: 48000 });
      var startTime = -1;

      function feedAudioData(audioData) {
        // See https://stackoverflow.com/a/61481513 for tips on smooth playback

        var audioDataView = new Int16Array(audioData);

        if (audioDataView.length === 0) {
          console.error("Received audio data is empty.");
          return;
        }

        var audioBuffer = audioContextOut.createBuffer(
          1,
          audioDataView.length,
          48000
        ); // 1 channel, 48 kHz sample rate
        var audioBufferChannel = audioBuffer.getChannelData(0);

        // Copy audio data to the buffer
        for (var i = 0; i < audioDataView.length; i++) {
          audioBufferChannel[i] = audioDataView[i] / 32768; // Convert linear16 PCM to float [-1, 1]
        }

        var source = audioContextOut.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextOut.destination);

        if (startTime < audioContextOut.currentTime) {
          startTime = audioContextOut.currentTime;
        }
        source.start(startTime);
        startTime += audioBuffer.duration;
      }

      function startStreaming() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error("getUserMedia is not supported in this browser.");
          return;
        }

        // In the browser, run `navigator.mediaDevices.getSupportedConstraints()` to see your
        // options here.
        var constraints = {
          audio: {
            sampleRate: 48000,
            channelCount: 1,
            echoCancellation: true,
            autoGainControl: true,
            voiceIsolation: true,
            noiseSuppression: false,
            latency: 0,
          },
        };

        navigator.mediaDevices
          .getUserMedia(constraints)
          .then(function (stream) {
            var audioContext = new AudioContext();
            var microphone = audioContext.createMediaStreamSource(stream);
            var processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = function (event) {
              // console.log("sending audio data?");
              var inputData = event.inputBuffer.getChannelData(0);
              // update blob size based on audio level
              var rms = Math.sqrt(
                inputData.reduce((sum, value) => sum + value * value, 0) /
                  inputData.length
              );
              updateBlobSize(rms * 5); // Scale RMS value to control size

              ws.send(inputData);
            };

        microphone.connect(processor);
        processor.connect(audioContext.destination);
      })
      .catch(function (error) {
        console.error("Error accessing microphone:", error);
      });
  }

  animateBlob(); // Start the blob animation
});
};