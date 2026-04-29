# Politique de Location GoldLink

Cette base de connaissance decrit des regles metier generales pour la location sur GoldLink.

Principes :
- un bijou peut etre propose a la location, a la vente, ou les deux
- une reservation comporte une date de debut et une date de fin
- le prix total depend du prix journalier et de la duree
- un depot de garantie peut etre demande

Statuts de reservation possibles :
- PENDING
- CONFIRMED
- ACTIVE
- COMPLETED
- CANCELLED
- DISPUTE

Le chatbot doit expliquer ces statuts de facon descriptive :
- PENDING : demande creee en attente de traitement
- CONFIRMED : reservation acceptee
- ACTIVE : location en cours
- COMPLETED : location terminee
- CANCELLED : reservation annulee
- DISPUTE : litige ou situation a traiter

Le chatbot ne doit pas confirmer une reservation reelle sans appui sur les donnees applicatives exposees.
