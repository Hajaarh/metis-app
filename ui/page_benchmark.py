import time

import streamlit as st

import audio as audio_utils
import gladia
import mistral

PROVIDERS = {
    "Gladia": gladia.transcribe,
    "Mistral (Voxtral)": mistral.transcribe,
}

st.title("Benchmark")
st.caption("Compare les fournisseurs de transcription sur un même fichier audio.")

audio = st.file_uploader("Fichier audio", type=["mp3", "wav", "m4a", "ogg", "flac", "webm"])
nb_locuteurs = st.number_input(
    "Nombre de locuteurs (optionnel, utilisé par Gladia)",
    min_value=1,
    max_value=26,
    value=None,
    step=1,
    placeholder="Détection automatique",
)

if audio is not None and st.button("Lancer le benchmark", type="primary"):
    with st.spinner("Conversion en mono"):
        audio_bytes, audio_name = audio_utils.ensure_mono(audio.getvalue(), audio.name)

    resultats = {}
    for nom, transcribe in PROVIDERS.items():
        with st.spinner(f"Transcription {nom} en cours"):
            t0 = time.perf_counter()
            try:
                transcript = transcribe(audio_bytes, audio_name, nb_locuteurs)
            except Exception as e:
                st.error(f"{nom} : {e}")
                continue
            transcript["duree_s"] = round(time.perf_counter() - t0, 2)
            resultats[nom] = transcript

    if not resultats:
        st.stop()

    st.subheader("Métriques")
    st.table(
        [
            {
                "Fournisseur": nom,
                "Temps (s)": t["duree_s"],
                "Vitesse (× temps réel)": round(t["audio_duration_s"] / t["duree_s"], 1)
                if t["audio_duration_s"] and t["duree_s"]
                else None,
                "Intervenants": len({s["speaker"] for s in t["segments"]}),
                "Segments": len(t["segments"]),
                "Langue": t["language"],
            }
            for nom, t in resultats.items()
        ]
    )

    st.subheader("Transcripts")
    colonnes = st.columns(len(resultats))
    for col, (nom, t) in zip(colonnes, resultats.items()):
        with col:
            st.markdown(f"### {nom}")
            for seg in t["segments"]:
                st.markdown(f"**{seg['speaker']}** {seg['text']}")
