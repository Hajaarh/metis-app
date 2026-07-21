import streamlit as st

FLOW_DOT = """
digraph {
    rankdir=LR;
    node [shape=box, style=rounded, fontname="sans-serif"];
    "Réunion\\nen ligne" -> "Consentement\\nparticipants" -> "Extension navigateur\\n(audio de l'onglet)";
    "Extension navigateur\\n(audio de l'onglet)" -> "Transcription\\net diarisation";
    "Transcription\\net diarisation" -> "Nommage des intervenants\\n(liste des participants)" -> "Compte rendu\\nstructuré";
    "Transcription\\net diarisation" -> "Suppression\\nde l'audio" [style=dashed];
}
"""

st.title("Mode visio")

st.subheader("Parcours cible")
st.caption(
    "L'audio de la réunion en ligne est capté par une extension navigateur directement "
    "depuis l'onglet, puis rejoint la même chaîne de traitement que le mode dictaphone. "
    "La liste des participants permet de nommer les intervenants (via l'email par exemple)."
)
st.graphviz_chart(FLOW_DOT, width="stretch")

st.subheader("Wireframe de la salle")
principale, laterale = st.columns([3, 1])

with principale:
    participants = ["Alice Martin", "Bruno Diallo", "Chloé Petit", "Vous"]
    lignes = [participants[:2], participants[2:]]
    for ligne in lignes:
        colonnes = st.columns(len(ligne))
        for col, nom in zip(colonnes, ligne):
            with col, st.container(border=True):
                st.markdown(
                    "<div style='text-align:center;padding:2rem 0;color:grey'>Flux vidéo</div>",
                    unsafe_allow_html=True,
                )
                st.markdown(f"<div style='text-align:center'>{nom}</div>", unsafe_allow_html=True)

    # Barre de contrôles factice
    controles = st.columns(5)
    for col, libelle in zip(controles, ["Micro", "Caméra", "Partage", "Main levée", "Quitter"]):
        col.button(libelle, disabled=True, width="stretch")

with laterale:
    st.markdown("**Transcription en direct**")
    with st.container(border=True):
        st.markdown(
            "<span style='color:grey'>Alice : … on valide le planning du trimestre …</span><br>"
            "<span style='color:grey'>Bruno : … la brique de transcription est prête …</span><br>"
            "<span style='color:grey'>Chloé : … attention au coût par minute …</span>",
            unsafe_allow_html=True,
        )
    st.caption("Extension Scribe : capture de l'onglet en cours (simulé), consentements recueillis")
