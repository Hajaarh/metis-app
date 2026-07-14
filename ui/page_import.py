import time
import uuid
from datetime import datetime, timezone

import streamlit as st

import audio as audio_utils
import gladia
import storage

st.title("Importer une réunion")

audio = st.file_uploader("Fichier audio", type=["mp3", "wav", "m4a", "ogg", "flac", "webm"])
titre = st.text_input("Titre (optionnel)")
nb_locuteurs = st.number_input(
    "Nombre de locuteurs (optionnel)",
    min_value=1,
    max_value=26,
    value=None,
    step=1,
    placeholder="Détection automatique",
)

if audio is not None and st.button("Transcrire", type="primary"):
    with st.spinner("Transcription en cours, cela peut prendre quelques minutes"):
        t0 = time.perf_counter()
        audio_bytes, audio_name = audio_utils.ensure_mono(audio.getvalue(), audio.name)
        duree_conversion = round(time.perf_counter() - t0, 2)
        t0 = time.perf_counter()
        try:
            transcript = gladia.transcribe(audio_bytes, audio_name, nb_locuteurs)
        except Exception as e:
            st.error(str(e))
            st.stop()
    duree = round(time.perf_counter() - t0, 2)

    meeting = {
        "id": uuid.uuid4().hex[:12],
        "titre": titre or audio.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "audio_duration_s": transcript["audio_duration_s"],
        "language": transcript["language"],
        "segments": transcript["segments"],
        "timings_s": {"conversion": duree_conversion, "transcription": duree},
    }
    storage.save_meeting(meeting)

    st.success(f"Transcription terminée en {duree} s (audio de {transcript['audio_duration_s']:.0f} s)")
    for seg in meeting["segments"]:
        st.markdown(f"**{seg['speaker']}** {seg['text']}")
