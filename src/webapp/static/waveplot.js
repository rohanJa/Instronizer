// Allow to execute when page is fully loaded
var wavesurfer;
$(function() {
    // Initialize error dialog
    var dialog = document.querySelector("dialog");
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }
    dialog.querySelector(".close-dialog").addEventListener("click", function() {
        dialog.close();
    });
    // Initialize Wavesurfer
    wavesurfer = initWavesurfer();
    //localStorage.setItem('wavesurferObject', JSON.stringify(wavesurfer));
    bindOnUploadChange(wavesurfer, dialog);
    initWaveformControls(wavesurfer);
    initZoomSlider(wavesurfer);
    initGetInstrumentButton(wavesurfer);
});

/**
 * Bind action when file input element has changed its value
 */
function bindOnUploadChange(wavesurfer, dialog) {
    $('#uploadFileInput').on('change', function() {
        var fileSize = this.files[0].size / 1024 / 1024;
        var fileType = this.files[0].type;
        var maxUploadSize = 200.0; // MB
        if (fileSize > maxUploadSize || !(fileType.match("audio/wav") || fileType.match("audio/flac") || fileType.match("audio/mp3"))) {
            // Animate "Waveform section" with FadeOut effect
            var waveform = $("#waveformSection");
            var currentOpacity = waveform.css("opacity");
            if (currentOpacity == 1.0) {
                waveform
                    .css({ opacity: currentOpacity, visibility: "visible" })
                    .animate({ opacity: 0.0 }, "slow");
            }

            // Animate "Result section" with FadeOut effect
            var results = $("#resultsSection");
            currentOpacity = results.css("opacity");
            if (currentOpacity == 1.0) {
                results
                    .css({ opacity: currentOpacity, visibility: "visible" })
                    .animate({ opacity: 0.0 }, "slow");
            }

            // When more than x MB, then show error dialog
            dialog.showModal();
        } else {
            // Animate "Result section" with FadeOut effect
            var results = $("#resultsSection");
            currentOpacity = results.css("opacity");
            if (currentOpacity == 1.0) {
                results
                    .css({ opacity: currentOpacity, visibility: "visible" })
                    .animate({ opacity: 0.0 }, "slow");
            }
            // Empty div content
            $("#results").empty();

            window.localStorage.removeItem("SavedFilePath");
            console.log("File path was removed from localStorage");

            // Show progress bar
            $("#processingProgress").show();

            // Put filename int readonly textfield, when file is chosen
            $("#uploadFileName").val(this.files[0].name);

            // Clean up regions
            wavesurfer.clearRegions();

            // Start uploading to the server
            var form_data = new FormData();
            form_data.append("file", this.files[0]);
            sendFileToServer(form_data);

            // Wavesurfer load audio
            fileUrl = URL.createObjectURL(this.files[0]);
            wavesurfer.load(fileUrl);
        }
    });
}

/**
 * Assign actions to player buttons
 */
function initWaveformControls(player) {
    $('#backward').click(function() {
        player.skipBackward();
    });
    $('#togglePlay').click(function() {
        player.playPause();
    });
    $('#forward').click(function() {
        player.skipForward();
    });
    $('#toggleMute').click(function() {
        player.toggleMute();
    });
}

/**
 * Build wavesurfer object with all necessary options
 * Add timeline and regions plugins
 */
function initWavesurfer() {
    var wavesurfer = WaveSurfer.create({
        container: '#waveform',
        barWidth: 3,
        height: 300,
        progressColor: '#512da8',
        skipLength: 30,
        fillParent: true
    });

    wavesurfer.on('ready', function() {
        // Hide Progress bar
        $('#processingProgress').hide();

        // Animate with FadeIn effect
        $('#waveformSection')
            .css({ opacity: 0.0, visibility: 'visible' })
            .animate({ opacity: 1.0 }, 'slow');

        // Add timeline
        var timeline = Object.create(WaveSurfer.Timeline);
        timeline.init({
            wavesurfer: wavesurfer,
            container: '#waveform-timeline',
            timeInterval: 5
        });
        // Draggable region
        wavesurfer.addRegion({
            id: 'startend',
            start: 0, // in seconds
            end: 3, // in seconds
            drag: true,
            resize: false,
            color: 'hsla(262, 52%, 47%, 0.48)'
        });

        wavesurfer.on("region-dblclick", function(region, event) {
            if (region.id != 'startend') {
                region.remove();
            } else {
                getInstrument();
            }
        });
    });
    return wavesurfer;
}

function initZoomSlider(player) {
    var slider = document.querySelector("#zoomSlider");

    slider.oninput = function() {
        var zoomLevel = Number(slider.value);
        player.zoom(zoomLevel);
    };
}

function getInstrument() {
    if (window.localStorage.getItem("SavedFilePath")) {
        var form_data = new FormData();
        var fileLocationOnServer = window.localStorage.getItem("SavedFilePath");
        var start = wavesurfer.regions.list["startend"].start;
        var end = wavesurfer.regions.list["startend"].end;

        form_data.append("file_path", fileLocationOnServer);
        form_data.append("start", start);
        form_data.append("end", end);

        sendRegionsToServer(form_data);
        $("#waitingForResultsProgress").show();
    } else {
        console.log("Cannot send regions because no was uploaded before");
    }
}

function initGetInstrumentButton(wavesurfer) {
    $("#getInstrumentNameButton").click(function() {
        getInstrument();
    });
}