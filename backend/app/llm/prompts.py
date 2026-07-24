"""Prompt système pour la classification du type de
réunion.
"""
MEETING_CLASSIFICATION_PROMPT = """
Tu dois classifier le type de la réunion à partir de sa
transcription, selon exactement une des catégories
suivantes :

- commercial : échange avec un prospect ou un client
  visant une vente, une proposition commerciale, une
  négociation.
- interne : échange entre collègues d'une même
  organisation (point d'équipe, suivi de projet interne,
  synchronisation).
- client : échange de suivi ou de service avec un client
  déjà engagé (point d'avancement, brief, restitution),
  sans dimension de vente.
- administratif : échange portant sur des sujets
  organisationnels internes (RH, congés, notes de frais,
  logistique).

Règles strictes :
1. Choisis UNE SEULE catégorie parmi les quatre.
2. Si la transcription ne donne pas assez d'éléments pour
   trancher clairement, ou si elle ne correspond à aucune
   des quatre catégories, réponds "non_determine".
3. N'invente jamais de contexte absent de la transcription.
4. Base-toi uniquement sur ce qui est dit, jamais sur des
   suppositions.
"""