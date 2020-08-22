const fetch = require('node-fetch');
const cheerio = require('cheerio');

const base_url = "http://buergerinfo.bernhardswald.de/";
const rat_mitglieder_url = "http://buergerinfo.bernhardswald.de/kp0040.asp?__kgrnr=1";
const rat_sitzungen_url = "http://buergerinfo.bernhardswald.de/si0041.asp?__ctopic=gr&__kgrnr=1";

async function fetchRatMembers(){
  const response = await fetch(rat_mitglieder_url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const members_container = $('tbody > tr');
  let members = [];
  for(let i = 0; i< members_container.length; i++){
    const member_container = $(members_container[i]);
    const member_name = $(member_container).find('a').text();
    const member_party = $(member_container).find('td.smc_td.smc_field_pepartei').text();
    const member_funktion = $(member_container).find('td.smc_td.smc_field_mgfunk').text().trim();

    const member_profile_url = $(member_container).find('a').attr('href');
    const response_member_profile = await fetch(base_url+member_profile_url);
    const html_member_profile = await response_member_profile.text();
    const b = cheerio.load(html_member_profile);
    const member_profile_pic_url = b('#smccontent').find('img.smcimgperson').attr('src');

    if(member_name != ''){
      members.push({
        member_name,
        member_party,
        member_funktion,
        member_profile_url,
        member_profile_pic_url,
      });
    }
  }

  console.log(members);
}

async function fetchRatSitzungen(){
  const response = await fetch(rat_sitzungen_url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const sitzungenContainer = $('tbody > tr');
  let sitzungen = [];
  for (let i = 0; i < sitzungenContainer.length; i++) {
    const sitzungContainer = $(sitzungenContainer[i]); 
    
    //ORT, Zeit
    const sitzungOrt = sitzungContainer.find('.smc_field_siort').text();
    const sitzungZeitpunkt = sitzungContainer.find('.smc_field_silink').text();
    const sitzungZeit = sitzungZeitpunkt.slice(10).trim();
    
    //Datum, isDone
    const sitzungDateArray = sitzungZeitpunkt.slice(0,10).trim().split('.');
    let sitzungDatum = sitzungZeitpunkt.slice(0,10).trim();
    let sitzungDone = false;
    if(sitzungDateArray != ''){
      const now = new Date();
      console.log(sitzungDateArray);
      sitzungDatum = new Date(sitzungDateArray[2]+"-"+sitzungDateArray[1]+"-"+sitzungDateArray[0]+" 21:30");
      
      if(sitzungDatum < now){
        sitzungDone = true;
      }
    }
    
    //Link
    const sitzungLink = sitzungContainer.find('td.smc_td.smc_field_silink > a').attr('href');

    //TOPS
    let tops = [];
    if(sitzungLink != ""){
      const response_top = await fetch(base_url+sitzungLink);
      const html_top = await response_top.text();
      const t = cheerio.load(html_top);
      const tops_container = $('tbody > tr');

      for (let j = 0; j < tops_container.length; j++) {
        const onetop = tops_container.find('td.smcrow1.smc_topht.smc_topht1').text();

        tops.push({
          onetop,
        })
      }
    }  


    if(sitzungZeitpunkt != ''){
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
//fetchRatMembers();
fetchRatSitzungen();
