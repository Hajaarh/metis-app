import { Callout, Disclaimer, H2, LegalPage, PlainLi, SrcLi } from "@/app/legal/_helpers";

export default function OrganisateurPage() {
  return (
    <LegalPage
      title="Notice d'information et de consentement"
      subtitle="Destinée à l'organisateur, avant le démarrage de l'enregistrement Métis"
    >
      <H2>1. Ce que vous vous apprêtez à faire</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Vous êtes sur le point d&apos;enregistrer une réunion avec Métis. Avant de démarrer, vous devez prendre
        connaissance de ce qui suit et confirmer votre engagement.
      </p>
      <p className="text-[13px] text-foreground leading-relaxed">
        Concrètement, en démarrant l&apos;enregistrement :
      </p>
      <ul className="space-y-2.5">
        <PlainLi>L&apos;audio de la réunion sera capté.</PlainLi>
        <PlainLi>Il sera transcrit et attribué par locuteur, sans identification nominative automatique.</PlainLi>
        <PlainLi>Un compte rendu structuré sera généré (résumé, décisions, actions).</PlainLi>
        <PlainLi>L&apos;audio brut sera supprimé dès que ce compte rendu sera produit.</PlainLi>
      </ul>

      <H2>2. Vous êtes responsable de ce traitement</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        En tant qu&apos;organisateur qui déclenche l&apos;enregistrement, vous êtes,seul ou avec votre entreprise
        selon votre situation,responsable du traitement des données des participants (RGPD art. 4.7). Métis
        agit en qualité de sous-traitant : il traite les données pour votre compte, sur votre instruction
        (RGPD art. 4.8 et art. 28).
      </p>
      <p className="text-[12.5px] text-foreground/70 leading-relaxed">
        La déclaration ci-dessous (section 4) s&apos;applique lorsque la base légale retenue pour cette réunion
        est le consentement des participants. Si votre entreprise a retenu l&apos;intérêt légitime comme base
        légale, avec une analyse de mise en balance déjà réalisée, referez-vous à ses instructions internes.
      </p>

      <H2>3. Ce que vous devez avoir fait avant de cocher</H2>
      <ul className="space-y-2.5">
        <PlainLi>
          Informer les participants de la réunion : que l&apos;échange est enregistré, pourquoi, et combien de
          temps les données seront conservées.
        </PlainLi>
        <PlainLi>
          Leur avoir donné les moyens de refuser : via le lien envoyé en visio, ou oralement en présentiel.
        </PlainLi>
        <PlainLi>Vérifier qu&apos;aucun participant présent n&apos;a exprimé de refus.</PlainLi>
        <PlainLi>
          Si la réunion est interne à votre entreprise (collègues, salariés) : vous assurer que votre
          entreprise a validé cet usage,base légale, consultation du CSE, information générale des salariés.
        </PlainLi>
        <PlainLi>
          Si vous rattachez cette réunion à un client ou à une personne, et que vous centralisez son
          historique : avoir informé cette personne de cette finalité, distincte de la simple transcription.
        </PlainLi>
      </ul>

      <H2>4. Votre engagement</H2>
      <div className="rounded-xl border border-border p-5 space-y-3">
        <p className="text-[11px] uppercase tracking-widest font-medium text-foreground">
          Case à cocher obligatoire
        </p>
        <p className="text-[13px] text-foreground leading-relaxed italic">
          « Je certifie avoir informé l&apos;ensemble des participants de cet enregistrement, des modalités de
          traitement de leurs données, et de leur droit de s&apos;y opposer. Je confirme qu&apos;aucun participant
          présent n&apos;a refusé. Je comprends que je suis personnellement responsable de l&apos;exactitude de cette
          déclaration. »
        </p>
      </div>
      <Callout>Sans cette confirmation, l&apos;enregistrement ne peut pas démarrer.</Callout>

      <H2>5. Ce que vous risquez si cette déclaration est fausse</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Si vous cochez cette case sans avoir réellement informé vos participants, si vous enregistrez malgré
        un refus, ou si cette déclaration ne correspond pas à la réalité, c&apos;est vous qui êtes juridiquement
        responsable,pas Métis.
      </p>
      <ul className="space-y-2">
        <SrcLi
          src="Code pénal, article 226-1"
          desc="enregistrer les paroles d'une personne à titre privé sans son consentement est puni d'un an d'emprisonnement et 45 000 € d'amende. Un refus explicite d'un participant fait disparaître toute présomption de consentement pour cette personne."
        />
        <SrcLi
          src="RGPD, article 4.7"
          desc="en l'absence de validation par votre entreprise, vous devenez personnellement responsable de traitement, avec l'ensemble des obligations qui en découlent."
        />
        <SrcLi src="RGPD, article 6" desc="un enregistrement réalisé sans base légale valable est un traitement illicite." />
        <SrcLi
          src="Code du travail, article L1222-4"
          desc="dans un cadre professionnel, l'absence d'information des salariés expose le dispositif à être contesté, et les enregistrements à être écartés comme preuve."
        />
      </ul>

      <H2>6. Sources</H2>
      <ul className="space-y-1.5">
        <SrcLi src="RGPD art. 4.7" desc="définition du responsable de traitement." />
        <SrcLi src="RGPD art. 4.11" desc="définition du consentement : libre, spécifique, éclairé, univoque." />
        <SrcLi src="RGPD considérant 43" desc="le consentement n'est pas valable en cas de déséquilibre de pouvoir." />
        <SrcLi src="RGPD art. 5" desc="minimisation et limitation de la durée de conservation." />
        <SrcLi src="RGPD art. 6.1.a et 6.1.f" desc="consentement et intérêt légitime." />
        <SrcLi src="RGPD art. 7.1" desc="le responsable de traitement doit pouvoir prouver le consentement." />
        <SrcLi src="RGPD art. 12 à 14" desc="obligation d'information préalable des personnes concernées." />
        <SrcLi src="Code pénal art. 226-1" desc="sanction de l'enregistrement sans consentement ; consentement présumé si absence d'opposition possible, invalidé en cas de refus explicite." />
        <SrcLi src="RGPD art. 4.1, considérant 26 et CJUE Breyer C-582/14" desc="le rattachement d'une réunion à une personne, puis la centralisation de son historique, recrée une identification indirecte par croisement et crée une finalité nouvelle." />
        <SrcLi src="RGPD art. 4.8 et art. 28" desc="Métis intervient en qualité de sous-traitant." />
        <SrcLi src="RGPD art. 82 et art. 83" desc="réparation du préjudice et amendes administratives." />
        <SrcLi src="Code pénal art. 121-1" desc="la responsabilité pénale est personnelle et ne se transfère pas à votre employeur." />
        <SrcLi src="Code du travail art. L1222-4" desc="information préalable des salariés sur les dispositifs de contrôle." />
        <SrcLi src="Code du travail art. L2312-8 et L2312-38" desc="consultation préalable du CSE." />
      </ul>

      <Disclaimer>
        Cette notice constitue la preuve horodatée de votre engagement. Elle est conservée par Métis pour
        démontrer que l&apos;information requise vous a été communiquée avant le démarrage de l&apos;enregistrement.
      </Disclaimer>
    </LegalPage>
  );
}
