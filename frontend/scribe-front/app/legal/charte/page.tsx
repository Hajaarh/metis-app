import { Callout, Disclaimer, H2, LegalPage, LegalTable, PlainLi, Src, SrcLi } from "@/app/legal/_helpers";

export default function ChartePage() {
  return (
    <LegalPage
      title="Charte d'engagement de l'utilisateur"
      subtitle="Métis,volet conformité et protection des données"
    >
      <H2>1. Ce que Métis fait</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Métis est un assistant de réunion. Il capte l&apos;audio d&apos;une réunion, en visioconférence ou en présentiel,
        le transcrit, distingue qui parle (sans chercher à identifier la personne par sa voix), puis produit un compte
        rendu structuré : résumé, décisions, actions à suivre.
      </p>
      <p className="text-[13px] text-foreground leading-relaxed">
        Métis restitue trois éléments à la fin de chaque réunion : la transcription complète, le compte rendu, et un
        tableau de bord.
      </p>
      <Callout>
        <strong>Rôle juridique de Métis : </strong> Métis intervient en qualité de sous-traitant au sens de
        l&apos;article 28 du RGPD. Il traite les données pour votre compte, sur votre instruction. C&apos;est vous,ou
        votre entreprise selon votre situation,qui êtes responsable de traitement au sens de l&apos;article 4.7.
      </Callout>

      <H2>2. Ce que Métis vous garantit</H2>
      <LegalTable
        headers={["Garantie", "Comment"]}
        rows={[
          [
            <strong key="g1">La purge de l&apos;audio</strong>,
            <span key="c1" className="text-foreground">L&apos;audio brut est supprimé dès que le compte rendu est produit.</span>,
          ],
          [
            <strong key="g2">La traçabilité de votre consentement</strong>,
            <span key="c2" className="text-foreground">Votre consentement, en tant qu&apos;utilisateur qui lance l&apos;enregistrement, est journalisé et horodaté.</span>,
          ],
          [
            <strong key="g3">Un outil de recueil du consentement des participants</strong>,
            <span key="c3" className="text-foreground">Un lien transmis avant la réunion (en visio) ou une information orale préalable (en présentiel) pour informer les participants et recueillir leur accord.</span>,
          ],
          [
            <strong key="g4">Le droit d&apos;accès, de rectification, d&apos;opposition et d&apos;effacement</strong>,
            <span key="c4" className="text-foreground">Pour vous, et pour toute personne concernée par une réunion que vous avez enregistrée.</span>,
          ],
          [
            <strong key="g5">La documentation de nos choix de conception</strong>,
            <span key="c5" className="text-foreground">Chaque garantie de cette charte est sourcée et vérifiable (voir section 8).</span>,
          ],
        ]}
      />

      <H2>3. Ce que Métis ne peut pas garantir à votre place</H2>
      <ul className="space-y-2.5">
        <PlainLi>
          Que vous ayez réellement informé et fait consentir vos participants,Métis met l&apos;outil à votre
          disposition, il ne peut pas vérifier ce qui se passe réellement dans votre réunion.
        </PlainLi>
        <PlainLi>
          Que votre usage s&apos;inscrive dans une gouvernance d&apos;entreprise si vous êtes salarié,cela reste de la
          responsabilité de votre employeur (voir section 5).
        </PlainLi>
        <PlainLi>
          Le consentement d&apos;un participant qui refuse mais que vous décidez d&apos;enregistrer quand même,rien ne
          bloque techniquement le démarrage dans ce cas. C&apos;est vous qui décidez.
        </PlainLi>
      </ul>

      <H2>4. Vos engagements en tant qu&apos;utilisateur</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        En utilisant Métis pour enregistrer une réunion, vous vous engagez à :
      </p>
      <ol className="space-y-3 list-decimal list-outside pl-5">
        {[
          "Informer les participants avant l'enregistrement : pourquoi la réunion est enregistrée, combien de temps les données seront conservées, et comment ils peuvent s'y opposer.",
          "Recueillir leur accord via le lien ou l'écran de consentement fourni par Métis, avant de démarrer.",
          "Ne pas démarrer l'enregistrement si un participant refuse explicitement.",
          "Si vous enregistrez dans un cadre professionnel avec des collègues ou des salariés : vérifier que votre entreprise a validé cet usage, avec la base légale et les démarches adaptées (voir section 5).",
          "Ne pas falsifier une preuve de consentement, ni cocher ou signer à la place d'un participant.",
          "Si vous rattachez vos réunions à un client ou à une personne, et que vous centralisez son historique : définir une durée de conservation et informer la personne concernée de cette finalité, distincte de la simple transcription.",
        ].map((item, i) => (
          <li key={i} className="text-[13px] text-foreground leading-relaxed">
            {item}
          </li>
        ))}
      </ol>

      <H2>5. Selon votre situation</H2>
      <LegalTable
        headers={["Vous êtes…", "Base légale", "Ce que ça implique"]}
        rows={[
          [
            <strong key="r1a">Indépendant / freelance / consultant</strong>,
            <span key="r1b" className="text-foreground">Consentement</span>,
            <span key="r1c" className="text-foreground">Vous n&apos;avez pas de lien de subordination avec vos clients : le consentement suffit, recueilli via le lien ou l&apos;écran fourni.</span>,
          ],
          [
            <strong key="r2a">Salarié utilisant Métis pour votre entreprise</strong>,
            <span key="r2b" className="text-foreground">Intérêt légitime</span>,
            <span key="r2c" className="text-foreground">C&apos;est à votre entreprise, et non à Métis, de documenter cet usage : test de mise en balance, consultation du CSE, information de tous les salariés. Voir la « Notice à destination des entreprises clientes ».</span>,
          ],
          [
            <strong key="r3a">Manager utilisant Métis sans validation de votre entreprise</strong>,
            <span key="r3b" className="text-foreground">Aucune,usage individuel</span>,
            <span key="r3c" className="text-foreground">Vous devenez personnellement responsable du traitement. Voir l&apos;avertissement section 7.</span>,
          ],
        ]}
      />

      <H2>6. Si vous rattachez vos réunions à un client</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Métis vous permet de rattacher une réunion à un client,raison sociale ou nom de personne,et de
        centraliser toutes ses réunions. Une transcription seule n&apos;identifie personne : elle distingue
        « Intervenant A » de « Intervenant B ». Mais regrouper l&apos;historique d&apos;une même personne recrée une
        identification indirecte, et crée une finalité nouvelle : suivre une personne dans le temps n&apos;est pas
        transcrire une réunion.
      </p>
      <Callout>
        Concrètement, cela vous impose de définir une durée de conservation propre à cette finalité, et
        d&apos;en informer la personne concernée.
      </Callout>
      <ul className="space-y-2">
        <SrcLi src="RGPD art. 4.1 et considérant 26" desc="l'identification indirecte, y compris par croisement de données, est couverte par le règlement." />
        <SrcLi src="CJUE, arrêt Breyer, C-582/14" desc="une donnée est personnelle dès lors qu'elle permet, par croisement, de remonter à une personne." />
        <SrcLi src="RGPD art. 4.2" desc="le simple stockage de ce lien est déjà un traitement." />
        <SrcLi src="RGPD art. 5.1.b" desc="chaque finalité doit être déterminée, explicite et légitime." />
        <SrcLi src="Référentiel CNIL,gestion des activités commerciales" desc="durées applicables : client (relation commerciale + 3 ans après le dernier contact), prospect (3 ans)." />
      </ul>

      <H2>7. Ce que vous risquez en cas de non-respect</H2>
      <p className="text-[13px] text-foreground leading-relaxed">
        Si vous n&apos;informez pas vos participants, si vous enregistrez malgré un refus, ou si vous falsifiez
        une preuve de consentement, c&apos;est vous, en tant qu&apos;utilisateur qui avez déclenché l&apos;enregistrement,
        qui êtes juridiquement responsable, pas Métis.
      </p>
      <ul className="space-y-2">
        <SrcLi
          src="Code pénal, article 226-1"
          desc="enregistrer les paroles d'une personne à titre privé, sans son consentement, est puni d'un an d'emprisonnement et 45 000 € d'amende. Un consentement présumé peut jouer si la personne a été informée et n'a pas pu s'y opposer,mais un refus explicite fait disparaître cette protection."
        />
        <SrcLi
          src="RGPD, article 4.7"
          desc="le responsable de traitement est celui qui décide pourquoi et comment les données sont traitées. Si vous utilisez Métis sans validation de votre entreprise, c'est vous qui endossez ce rôle, avec les obligations qui vont avec."
        />
        <SrcLi src="RGPD, article 6" desc="un traitement sans base légale valable (consentement ou intérêt légitime documenté) est un traitement illicite." />
        <SrcLi
          src="Code du travail, article L1222-4"
          desc="un employeur qui déploie Métis sans informer ses salariés s'expose à voir le dispositif contesté, et les preuves obtenues rejetées."
        />
      </ul>

      <H2>8. Sources</H2>
      <ul className="space-y-1.5">
        <SrcLi src="RGPD art. 4.7" desc="définition du responsable de traitement." />
        <SrcLi src="RGPD art. 4.11" desc="définition du consentement : libre, spécifique, éclairé, univoque." />
        <SrcLi src="RGPD considérant 43" desc="le consentement n'est pas valable en cas de déséquilibre de pouvoir." />
        <SrcLi src="RGPD art. 5" desc="minimisation et limitation de la durée de conservation." />
        <SrcLi src="RGPD art. 6.1.a et 6.1.f" desc="consentement et intérêt légitime." />
        <SrcLi src="RGPD art. 7.1" desc="le responsable de traitement doit pouvoir prouver le consentement." />
        <SrcLi src="RGPD art. 12 à 14" desc="obligation d'information préalable." />
        <SrcLi src="RGPD art. 12.3" desc="un mois pour répondre à une demande d'exercice des droits." />
        <SrcLi src="RGPD art. 17 et 21" desc="droit à l'effacement et droit d'opposition." />
        <SrcLi src="Code pénal art. 226-1" desc="sanction de l'enregistrement sans consentement ; consentement présumé si absence d'opposition possible." />
        <SrcLi src="Code du travail art. L1222-4" desc="information préalable des salariés sur les dispositifs de contrôle." />
        <SrcLi src="RGPD art. 4.1, considérant 26 et CJUE Breyer C-582/14" desc="identification indirecte par croisement de données." />
        <SrcLi src="RGPD art. 24 et art. 28" desc="obligations du responsable de traitement et du sous-traitant." />
        <SrcLi src="RGPD art. 82 et art. 83" desc="réparation du préjudice et amendes administratives (jusqu'à 4 % du chiffre d'affaires mondial)." />
        <SrcLi src="Code pénal art. 121-1" desc="la responsabilité pénale est personnelle." />
        <SrcLi src="Code du travail art. L2312-8 et L2312-38" desc="consultation du CSE avant l'introduction de nouvelles technologies et de moyens de contrôle de l'activité." />
        <SrcLi src="Référentiel CNIL,gestion des activités commerciales" desc="durées de conservation applicables aux données clients et prospects." />
      </ul>

      <Disclaimer>
        Ce document engage l&apos;utilisateur qui déclenche l&apos;enregistrement. Il ne remplace pas un conseil
        juridique : en cas de doute sur votre situation, consultez un DPO ou un avocat.
      </Disclaimer>
    </LegalPage>
  );
}
