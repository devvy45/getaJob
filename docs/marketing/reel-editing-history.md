# Historical reel editing notes — superseded

These chronological notes contain rejected drafts. Use [the final production script](../../skills/getajob-reels/references/production-script.md) for current instructions.

# GetaJob Instagram reels — working direction

Status: draft for refinement through a pilot edit. Not yet an installed skill.
Primary reference: Video-99740.mp4 (121.48 seconds, 720 × 1280, 25 fps).
Secondary reference: Video-19287.mp4; use its explanatory graphics when relevant.
Analysis basis: frames sampled every two seconds across the primary reference, plus half-second samples of the opening. Audio was not auditioned. Voice delivery, music, sound effects, and audiovisual synchronization remain unverified.

## Purpose
Turn supplied podcast excerpts, founder interviews, hiring-manager conversations, and career advice into engaging vertical Instagram reels for GetaJob. Select and assemble a coherent story, rather than simply captioning a source clip. Preserve the speaker's meaning and attribution. Retention is an editing objective, not a guaranteed outcome.

## What the primary reference does
- Opens directly on a speaker and a loaded idea; no introductory logo bumper.
- Uses isolated speaker silhouettes on dark backgrounds, changing between medium and tight framing.
- Switches between close-ups and wide interview composites with supporting imagery above the interview table.
- Combines small white sentence captions with oversized yellow italic serif emphasis words and small sans-serif connecting phrases.
- Uses text behind the speaker's head, filled and outlined letters, scale changes, glows, and dark gradients to establish hierarchy.
- Replaces the speaker with illustrative cutaways: public figures, students, campuses, documents, classrooms, and career imagery.
- Uses red-tinted sequences for threat/uncertainty, with occasional green graphic accents.
- Includes explanatory graphics, including a notebook sequence that visually removes assumptions from a decision.
- Has more concentrated visual changes in the opening, with longer uninterrupted speaker passages later. Avoid treating every second identically.
- Includes blur/motion transitions and ends with the original show's brand card. GetaJob needs its own ending while retaining appropriate source attribution.

## Proposed GetaJob treatment
Existing website tokens from app/globals.css:
- Ink / dark background: #27211F
- Paper / main text and light cards: #F3EADC
- Ember / emphasis: #F36D45
- Light ember / secondary accent: #FF9674
- DM Sans: readable captions, labels, and supporting text.
- Instrument Serif: selective large editorial emphasis, including italic where appropriate.
- DM Mono: occasional statistics, source labels, and compact annotations.

Keep the reference's hierarchy and visual variety while adapting its accent colours to GetaJob. Use ember deliberately; use cream for the majority of reading text. Reserve warning colours for content that actually calls for them. These are website-derived starting choices, subject to pilot review.

## Editing workflow
1. Inspect all supplied clips and available transcripts. Identify speakers, timestamps, context, technical quality, and the useful claims.
2. Select the strongest self-contained takeaway. Draft several truthful hook options, choose the best, and build a beginning, development, and payoff.
3. Assemble a dialogue-first rough cut. Remove redundant setups and distracting pauses while preserving natural delivery. Reorder fragments only when context and meaning survive the change. Never fabricate a continuous quote from incompatible statements.
4. Prefer the original speaker's voice. Add a short separate narration bridge only when necessary for missing context or clarity. Do not clone the speaker's voice by default.
5. Reframe for 9:16. Follow the active speaker, maintain eye/head room, accommodate gestures and microphones, and move text away from faces. Use purposeful crop changes and keyframed movement rather than constant zooming. Keep multiple speakers visible when their interaction matters.
6. Add manually checked phrase captions. Use ordinary captions for comprehension and oversized typography for selected key ideas. Do not display competing copies of the same sentence. Check captions against the actual speech, especially names, numbers, and negations.
7. Add relevant cutaways, screenshots, diagrams, and graphics where they clarify or heighten the current idea. Use assets with suitable usage rights and keep a source record. Do not present illustrative footage as evidence of a specific event or person.
8. Animate to the idea: a rejection stamp, a contrast, a statistic, a short list, a process, or an annotated example. Use clean cuts as the default transition and reserve conspicuous motion for meaningful changes.
9. Clean dialogue and balance clip-to-clip levels. Add restrained music and selective impact/click/whoosh sounds that support the edit. Keep speech intelligible and avoid an effect on every word. Audition the final mix before claiming audio QA.
10. End on a useful payoff and a relevant GetaJob action: save, share, follow, or explore a relevant resource. Avoid an unrelated sales interruption.
11. Review the rendered video on a phone-sized canvas, with sound and muted. Check crop tracking, text readability, caption accuracy, UI overlap, continuity, audio, sources, and ending.

## Mobile layout and delivery
- Target master: 1080 × 1920, 9:16; select frame rate based on source and motion needs.
- Keep critical text and faces away from interface overlays, especially the right-hand controls and bottom caption area. Validate against the current placement preview rather than assuming a fixed universal safe zone.
- Use short caption phrases and usually one or two lines, sized to read at phone scale.
- Crop, speaker position, and text position should be designed together for each shot.
- Deliver a review MP4, cover image, post caption, and asset/source notes. Preserve editable project files and timestamped cut decisions for revisions.

## How to finalize this system
Make a short pilot from actual supplied source material. Refine hook intensity, caption size, typography, accent use, crop movement, sound density, B-roll frequency, and CTA with the user. Then encode the approved defaults and tested production tools in a reusable skill. Preserve per-video flexibility; do not freeze untested aesthetic or technical choices as requirements.

## Current limits
No finished GetaJob reel has been created or approved. The reference audio has not been heard in this session. Reliable transcription, audio audition, face tracking/masking, licensed asset sourcing, and final render QA must be available and tested before treating this as an unattended production pipeline.

## Pilot v1 feedback — user direction, supersedes earlier inferred styling

- Use the actual getajob wordmark: lowercase DM Sans 600, tight -0.07em spacing, light ember #FF9674. No pill, highlight, outline, or shadow behind/on the name.
- Give the hook a dedicated brand graphic and the user's own voiceover, then move to the interview. Do not compete with the founder's speech underneath.
- The five traits should appear on the brand background as each is spoken. The speaker's face is not required during this sequence.
- Give the curiosity question its own narrated graphic break. The user supplied both voiceovers on 17 October 2026; integrate these rather than placeholders.
- Use deliberate typographic hierarchy: large Instrument Serif headlines, orange italic emphasis, restrained DM Sans supporting lines.
- Match reveals to speech. Transform word timing whenever a source clip is slowed. Avoid text arriving late and random travelling text.
- Slow dense speech only where needed, preserving pitch and matching video speed for lip sync. Do not slow the entire reel to compensate for loose text timing.
- Create breathing room between ideas. One principal text block/visual idea at a time; avoid competing subtitles, callouts, speaker motion, and extra voices.
- Give the outro the same clean brand system. Do not reuse v1's generic overlay treatment.
- V2 is in outputs/reels/immad-hiring/v2/ and remains a review draft. Do not treat these pilots as a finalized installed skill.

## Direction accepted for pilot v3

Keep the established hook and ending typography. Make the middle visually continuous with the podcast: put the trait list over blurred/darkened moving footage, use a blurred curiosity question that clears into the interview, and replace the hour/discussion slides with brief accents on live footage. Avoid long full-frame explanation cards when the same point works as a short highlight. The hook may be moderately faster and slightly more prominent with light voice processing; preserve pitch and avoid heavy echo. Pilot v3 implements 112% hook speed with corresponding word timings. Its output is still pending user review.

## Final audio preference from pilot feedback

The user approved the v3 visual direction and requested a 2–3-second maximum hook, subtle voice pitch/level treatment, moderate noise cleanup, and a very quiet background bed or restrained effects. Pilot v4 uses exactly 2.70 seconds for the opening including its hold, with a shorter spoken line (“Five traits he looks for in every hire”) and the $5B founder context immediately visible, a subtle lower pitch on the supplied user voiceovers, gentle denoising, and an original ambient bed ducked below speech. Avoid adding a dense effect layer or changing the approved visual style during this audio pass.

## Latest hook correction — supersedes the shortened v4 line

The user explicitly requires the COMPLETE original hook narration, sped up more, and approves the rest of v4. Do not shorten the hook wording to only “Five traits he looks for in every hire.” V5 restores the complete user recording at 190% speed for a 3.00-second opening and retains the approved v4 body and mix. This correction takes precedence over the v4 shortened-line preference described above.

## Latest voice correction

Restore the user's original voice pitch. The artificial -1.5-semitone treatment from v4/v5 is no longer wanted. V6 removes that shift from both user voiceovers while retaining the full three-second hook, cleanup, levels, background bed, and approved visual edit. Original pitch is the preferred default going forward unless the user asks otherwise.

## Narrated transition consistency

The user wants “How does he test for curiosity?” to match the hook's fast delivery and voice treatment. V7 uses 190% speed and the same EQ/compression/level treatment for both user voiceovers, while retaining original pitch (no semitone shift). Word reveals and the visual handoff must follow that rate. Other approved material stays unchanged.
