import streamlit as st

st.title("Scribe : maquette du parcours")
st.markdown(
    "Cette maquette fige le parcours utilisateur et sécurise les choix produit. "
    "Dans le mode dictaphone, la capture audio, la transcription (Gladia) et le "
    "compte-rendu (Mistral) sont réels, avec repli sur des données d'exemple en cas d'erreur."
)
st.info(
    "Les deux parcours commencent par le recueil du **consentement des participants** "
    "(exigence RGPD) avant tout enregistrement."
)

dictaphone, visio = st.columns(2)

with dictaphone, st.container(border=True):
    st.markdown("### Mode dictaphone")
    st.markdown(
        "Enregistrement de la réunion depuis le micro du poste, "
        "transcription de l'audio capturé, puis compte-rendu "
        "avec choix du ton."
    )
    st.page_link("ui/page_dictaphone.py", label="Ouvrir le parcours dictaphone")

with visio, st.container(border=True):
    st.markdown("### Mode visio")
    st.markdown(
        "Réunion en ligne : une extension navigateur capte l'audio directement "
        "depuis l'onglet, pour la même chaîne de traitement que le dictaphone. "
        "Présenté au stade wireframe et flow diagram."
    )
    st.page_link("ui/page_visio.py", label="Ouvrir le parcours visio")
