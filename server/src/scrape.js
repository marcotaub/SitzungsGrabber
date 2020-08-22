const fetch = require('node-fetch');
const cheerio = require('cheerio');

const baseUrl = 'http://buergerinfo.bernhardswald.de/';
const ratMitgliederUrl = 'http://buergerinfo.bernhardswald.de/kp0040.asp?__kgrnr=1';
const ratSitzungenUrl = 'http://buergerinfo.bernhardswald.de/si0041.asp?__ctopic=gr&__kgrnr=1';

async function fetchRatMembers() {
  const response = await fetch(ratMitgliederUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  const membersContainer = $('tbody > tr');
  const members = [];
  for (let i = 0; i < membersContainer.length; i += 1) {
    const memberContainer = $(membersContainer[i]);
    const memberName = $(memberContainer).find('a').text();
    const memberParty = $(memberContainer).find('td.smc_td.smc_field_pepartei').text();
    const memberFunktion = $(memberContainer).find('td.smc_td.smc_field_mgfunk').text().trim();

    const memberProfileUrl = $(memberContainer).find('a').attr('href');
    const responseMemberProfile = await fetch(baseUrl + memberProfileUrl);
    const htmlMemberProfile = await responseMemberProfile.text();
    const b = cheerio.load(htmlMemberProfile);
    const memberProfilePicUrl = b('#smccontent').find('img.smcimgperson').attr('src');

    if (memberName !== '') {
      members.push({
        memberName,
        memberParty,
        memberFunktion,
        memberProfileUrl,
        memberProfilePicUrl,
      });
    }
  }

  console.log(members);
}

async function fetchRatSitzungen() {
  const response = await fetch(ratSitzungenUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  const sitzungenContainer = $('tbody > tr');
  const sitzungen = [];
  for (let i = 0; i < sitzungenContainer.length; i += 1) {
    const sitzungContainer = $(sitzungenContainer[i]);

    // ORT, Zeit
    const sitzungOrt = sitzungContainer.find('.smc_field_siort').text();
    const sitzungZeitpunkt = sitzungContainer.find('.smc_field_silink').text();
    const sitzungZeit = sitzungZeitpunkt.slice(10).trim();

    // Datum, isDone
    const sitzungDateArray = sitzungZeitpunkt.slice(0, 10).trim().split('.');
    let sitzungDatum = sitzungZeitpunkt.slice(0, 10).trim();
    let sitzungDone = false;
    if (sitzungDatum !== '') {
      const now = new Date();
      sitzungDatum = new Date(`${sitzungDateArray[2]}-${sitzungDateArray[1]}-${sitzungDateArray[0]} 21:30`);

      if (sitzungDatum < now) {
        sitzungDone = true;
      }
    }

    // Link
    const sitzungLink = sitzungContainer.find('td.smc_td.smc_field_silink > a').attr('href');

    // TOPS
    const tops = [];
    if (sitzungLink !== '') {
      const responseTop = await fetch(baseUrl + sitzungLink);
      const htmlTop = await responseTop.text();
      const t = cheerio.load(htmlTop);
      const topsContainer = t('#smc_page_to0040_contenttable1 > tbody > tr');

      for (let j = 0; j < topsContainer.length; j += 1) {
        const topsTrs = t(topsContainer[j]).find('td.smc_topht').text().trim();
        if (topsTrs !== '') {
          tops.push(topsTrs);
        }
      }
    }

    if (sitzungZeitpunkt !== '') {
      sitzungen.push({
        sitzungOrt,
        sitzungZeit,
        sitzungDatum,
        sitzungDone,
        sitzungLink,
        tops,
      });
    }
  }

  console.log(sitzungen);
}

fetchRatMembers();
fetchRatSitzungen();
