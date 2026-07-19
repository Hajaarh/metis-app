import streamlit as st

import audio as audio_utils
import gladia
import mistral
import docs.mock_data as mock_data


def _reinitialiser():
    # En callback uniquement : supprimer une clé de widget dans le corps du script lève une exception
    for cle in [c for c in st.session_state if c.startswith("dicta_")]:
        del st.session_state[cle]


st.title("Mode dictaphone")
st.caption(
    "La capture audio, la transcription (Gladia) et le compte-rendu (Mistral) sont réels. "
    "En cas d'erreur d'API, des données d'exemple prennent le relais."
)

if any(c.startswith("dicta_") for c in st.session_state):
    st.button("Recommencer", on_click=_reinitialiser)

# --- Étape 1 : consentement des participants (bloquant) ---
if not st.session_state.get("dicta_consentement_ok"):
    st.subheader("Étape 1 : consentement des participants")
    st.info(mock_data.MENTION_RGPD)
    with st.expander("En savoir plus (analyse RGPD)"):
        st.markdown(
            "- L'enregistrement d'une réunion constitue un traitement de données personnelles "
            "(voix, propos tenus).\n"
            "- Le consentement doit être recueilli **avant** le démarrage de l'enregistrement, "
            "individuellement et librement.\n"
            "- L'audio est supprimé après transcription ; le compte-rendu est conservé 30 jours.\n"
            "- Tout participant peut retirer son consentement, ce qui interrompt l'enregistrement."
        )
    cases = [
        st.checkbox(f"{participant} consent à l'enregistrement de la réunion")
        for participant in mock_data.PARTICIPANTS_EXEMPLE
    ]
    cases.append(st.checkbox("En tant qu'organisateur, je confirme avoir informé tous les participants"))
    if st.button("Valider les consentements", type="primary", disabled=not all(cases)):
        st.session_state.dicta_consentement_ok = True
        st.rerun()
    st.stop()

st.success("Consentements recueillis")

# --- Étape 2 : rattachement client (sélection rapide, le placement avant/après réunion reste à trancher) ---
st.subheader("Étape 2 : rattachement client")
client = st.selectbox(
    "Client de la réunion",
    ["Nouveau client"] + mock_data.CLIENTS_EXEMPLE,
    index=None,
    placeholder="Rechercher un client connu",
)
if client == "Nouveau client":
    client = st.text_input("Nom du nouveau client")
if client:
    st.session_state.dicta_client = client

# --- Étape 3 : capture audio (réelle) ---
st.subheader("Étape 3 : enregistrement")
audio = st.audio_input("Enregistrez la réunion avec votre micro", key="dicta_audio")
if audio is None:
    st.stop()

if st.session_state.get("dicta_transcription") is None:
    if st.button("Transcrire", type="primary"):
        with st.spinner("Transcription en cours, cela peut prendre quelques minutes"):
            try:
                audio_bytes, audio_name = audio_utils.ensure_mono(audio.getvalue(), audio.name)
                st.session_state.dicta_transcription = gladia.transcribe(audio_bytes, audio_name)
                st.session_state.dicta_tr_source = "gladia"
            except Exception as e:
                st.warning(f"Transcription indisponible ({e}), affichage de la transcription d'exemple.")
                st.session_state.dicta_transcription = mock_data.TRANSCRIPTION_EXEMPLE
                st.session_state.dicta_tr_source = "secours"
    if st.session_state.get("dicta_transcription") is None:
        st.stop()

# --- Étape 4 : transcription ---
st.subheader("Étape 4 : transcription")
transcription = st.session_state.dicta_transcription
source = (
    "transcrit par Gladia"
    if st.session_state.get("dicta_tr_source") == "gladia"
    else "transcription d'exemple (secours)"
)
st.caption(
    f"Audio de {transcription['audio_duration_s']:.0f} s, langue : {transcription['language']}, {source}."
)
with st.container(border=True, height=300):
    for seg in transcription["segments"]:
        st.markdown(f"**{seg['speaker']}** {seg['text']}")

# --- Étape 5 : ton du compte-rendu + génération ---
st.subheader("Étape 5 : compte-rendu")
ton = st.selectbox("Ton du compte-rendu", list(mock_data.TONS))

if st.button("Générer le compte-rendu", type="primary"):
    with st.spinner("Appel à Mistral, génération du compte-rendu…"):
        try:
            compte_rendu = mistral.summarize(
                mock_data.transcription_en_texte(transcription),
                mock_data.TONS[ton],
            )
            st.session_state.dicta_cr_source = "mistral"
        except Exception as e:
            st.warning(f"Appel Mistral indisponible ({e}), affichage du compte-rendu de secours.")
            compte_rendu = mock_data.COMPTE_RENDU_SECOURS
            st.session_state.dicta_cr_source = "secours"
    st.session_state.dicta_compte_rendu = compte_rendu
    st.session_state.dicta_cr_ton = ton

# --- Résultat : affiché depuis la session pour survivre aux reruns ---
if st.session_state.get("dicta_compte_rendu"):
    st.markdown(f"### Compte-rendu ({st.session_state.dicta_cr_ton})")
    if st.session_state.get("dicta_client"):
        st.caption(f"Réunion rattachée au client : {st.session_state.dicta_client}")
    with st.container(border=True):
        st.markdown(st.session_state.dicta_compte_rendu)
    if st.session_state.dicta_cr_source == "mistral":
        st.caption(f"Généré par {mistral.CHAT_MODEL}")
    else:
        st.caption("Compte-rendu de secours (statique)")
    st.download_button(
        "Télécharger (.md)",
        st.session_state.dicta_compte_rendu,
        file_name="compte-rendu.md",
        mime="text/markdown",
    )
