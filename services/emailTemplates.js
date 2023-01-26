let emailTemplates = {};

emailTemplates.activationEmail = (code) =>
`Ďakujeme za vašu registráciu.

Pre aktiváciu vášho konta prosím kliknite na nasledujúci link:

https://curator.touchtheculture.eu/activation/${code}

Prajeme veľa pozitívnych zážitkov zo vzdelávania.

S pozdravom tím touchtheculture.eu
`

emailTemplates.forgotSubject = (lng) => {
  if (lng == "SK") {
    return "Zmena hesla curator.touchtheculture.eu"
  } else if (lng == "CZ") {
    return "Změna hesla curator.touchtheculture.eu"
  } else if (lng == "PL") {
    return "Zmiana hasła curator.touchtheculture.eu"
  } else {
    return "Password change curator.touchtheculture.eu"
  }
}


emailTemplates.forgotEmail = (lng, token) => {
  let link = "https://curator.touchtheculture.eu/reset?token=" + token
  if (lng == "SK") {
    return emailTemplates.forgotEmailSK(link)
  } else if (lng == "CZ") {
    return emailTemplates.forgotEmailCZ(link)
  } else if (lng == "PL") {
    return emailTemplates.forgotEmailPL(link)
  } else {
    return emailTemplates.forgotEmailEN(link)
  }
}

emailTemplates.forgotEmailSK = (link) =>
`Dobrý deň,

na stránke curator.touchtheculture.eu ste zažiadali o zmenu hesla.

Kliknite prosím na nasledujúci link:

${link}

Ak ste o zmenu hesla nežiadali, tak tento email ignorujte.

S pozdravom tím touchtheculture.eu
`

emailTemplates.forgotEmailCZ = (link) =>
`Dobrý den,

na stránce curator.touchtheculture.eu jste zažádali o změnu hesla.

Klikněte prosím na následující link:

${link}

Pokud jste o změnu hesla nežádali, tak tento email ignorujte.

S pozdravem tým touchtheculture.eu
`

emailTemplates.forgotEmailPL = (link) =>
`Dobry dzień,

zażądałeś zmiany hasła na curator.touchtheculture.eu.

Proszę kliknąć na poniższy link:

${link}

Jeśli nie poprosiłeś o zmianę hasła, zignoruj ​​tę wiadomość e-mail.

Pozdrawiam, zespół touchtheculture.eu
`

emailTemplates.forgotEmailEN = (link) =>
`Dear Sir or Madam

you have requested a password change on curator.touchtheculture.eu.

Please click on the following link:

${link}

If you did not request a password change, please disregard this email.

Sincerely, touchtheculture.eu team
`
module.exports = emailTemplates;
