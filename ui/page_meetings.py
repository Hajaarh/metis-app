import streamlit as st

import storage

st.title("Réunions")

meetings = storage.list_meetings()
if not meetings:
    st.write("Aucune réunion pour le moment.")
    st.stop()

labels = {f"{m['titre']} ({m['created_at'][:16].replace('T', ' ')})": m for m in meetings}
choix = st.selectbox("Réunion", list(labels))
meeting = labels[choix]

st.caption(
    f"Audio de {meeting['audio_duration_s']:.0f} s, "
    f"transcrit en {meeting['timings_s']['transcription']} s"
)
for seg in meeting["segments"]:
    st.markdown(f"**{seg['speaker']}** {seg['text']}")
