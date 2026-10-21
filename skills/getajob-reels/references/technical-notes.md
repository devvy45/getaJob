# Media implementation notes

Read these when implementing or revising an edit, not as additional mandatory visual effects.

## Runtime and portability

Use an available FFmpeg/video editor and a working transcription engine. The pilot used local FFmpeg, Python/Pillow, faster-whisper small.en, ASS word reveals, and generated graphics/audio. Those libraries originally lived in a temporary directory; do not assume `/tmp/reel-analysis` exists in another session. Discover or provision an appropriate runtime before promising an automated render.

Discover available tools before rendering. Keep input media local unless the user authorizes a service that needs uploads.

Fonts are DM Sans, Instrument Serif (regular/italic), and DM Mono. Obtain missing fonts from their official Google Fonts sources in `assets/brand.json`; preserve the font licenses if redistributing font files. The provided transparent logos can be used without rerendering the wordmark.

## Voice processing

The approved original-pitch narration treatment is a modest starting preset:

1. High-pass around 80 Hz, low-pass around 12.5 kHz.
2. Gentle FFT denoise, roughly 8 dB reduction, with a conservative noise floor.
3. Match source speech levels.
4. Pitch-preserving tempo adjustment for the chosen hook/question rates.
5. For both user narration clips, reduce boxiness slightly around 250 Hz, add a small presence lift near 3.2 kHz, then light compression, a small gain boost, and limiting.
6. Mix the quiet bed/effects, then inspect final integrated loudness and encoded true peak.

Do not apply an `asetrate`/resampling pitch shift to make the user's voice deeper. A tempo filter such as `atempo` changes duration while preserving pitch. Chain supported tempo stages when the required rate exceeds a filter's supported range.

The pilot hook/question rate was 1.9×; the trait list was 0.9× and the two short follow-up questions 0.94×. Compute appropriate rates for other recordings rather than blindly assigning these values.

## Timing and rendering invariants

- Keep source in/out, output start, playback rate, and word source times in an edit-decision map.
- Use one shared mapping for audio, visible lips, text reveals, highlights, and transition timing.
- Quantize final segment durations to the selected frame grid and keep the corresponding audio sample counts consistent. At 30 fps / 48 kHz there are exactly 1,600 audio samples per frame.
- When removing a pause or shortening a question, shift the later video, captions, audio, and music placement together.
- Assemble exact sample-timed speech or lossless intermediates rather than accumulating AAC priming/padding on many tiny clips.
- Uniform dimensions, sample aspect ratio, frame rate, colour metadata, and timestamps avoid filter reinitialization and gaps when mixing generated cards with screen recordings. The pilot required constant-frame-rate output and consistent colour metadata.
- A frame count in a container is not proof of continuous timestamps. Inspect end time and unexpected PTS gaps, especially at card/footage boundaries.
- If using `tpad` after a `setpts` expression, restore a valid frame rate first. The pilot lost its intended outro padding until an explicit FPS stage was added. Verify the actual ending frames rather than assuming a hold exists.
- Use subtle edge fades to prevent clicks when cutting audio. Do not cut through the start/end consonants of a word.
- Recheck all overlays in the encoded output. In ASS, set alpha explicitly; do not assume an alpha byte inside a colour override gives the intended opacity.

## Revisions to approved media

Prefer keeping approved footage and mix outside the requested region. For an audio-only change with unchanged timing, copy the approved encoded video stream and replace only the needed audio windows; this can preserve the visuals exactly. If a section changes duration, retain the approved prefix/suffix and shift them by the exact frame delta.

Do not unintentionally regenerate a music bed with a different phase/progression underneath already-approved sections. Preserve the old mix or keep its timing consistent. Match levels and use short boundary fades for new inserts. Re-encoding the export is different from making a new creative edit; state accurately what was preserved.

## Verification record

Keep a small QA record with the output duration, dimensions, frame rate/frame count, audio sample rate, actual measured integrated loudness/true peak, input/output section ranges, speed/pitch settings, and whether the audio was auditioned. ASR can help verify wording but may confuse fast speech or homophones; do not rewrite a user's approved recording merely because a recognizer produced a different word.

Validate retimed word data against the export, including words near edits, not only the first word of a section. A positive validation result for a skill file is not a quality check on a video.
