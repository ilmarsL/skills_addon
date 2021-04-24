var skillsArray = [];

function myfunc(){
   console.log('test');
   console.log('Adding istener to stats button');
   document.getElementById('stats-button').addEventListener("click", (e) =>{
      console.log('stats button pressed');
      let createData = {
         url: "../stats_page/stats.html",
       };
       let creating = browser.tabs.create(createData);
   });

   console.log('Added event listener');
   document.addEventListener("click", (e) => {
      //load data at start
     

      function setItem() {
         console.log("Item set");
       }

      function buttonPress(tabs){
         
         browser.tabs.sendMessage(tabs[0].id, {
            command: "button"
            }).then(response =>{
               addSkillToPopup(response.skill.skillName)
               console.log('writing data to storage')
               let newStoredSkill = {
                  'skill': response.skill.skillName,
                  'uri' : response.skill.uri,
                  'date' : response.skill.date
               }
               skillsArray.push(newStoredSkill);
      
               browser.storage.local.set({'skills' : skillsArray})
               .then(setItem);
             
            });
      }

      function buttonSavePress(tabs){
         //console.log('sending save message');
         //browser.tabs.sendMessage(tabs[0].id, {
         //   command: "buttonSave"
         //   });
      }

      /**
       * Just log the error to the console.
       */
      function reportError(error) {
         console.error(`Could not beastify: ${error}`);
      }


      if (e.target.classList.contains("skills-button")) {
         browser.tabs.query({active: true, currentWindow: true})
         .then(buttonPress)
         .catch(reportError);         
      }
      else if (e.target.classList.contains("skills-save-button")) {
         browser.tabs.query({active: true, currentWindow: true})
         .then(buttonSavePress)
         .catch(reportError);         
      }
   
   });
}
/**
* There was an error executing the script.
* Display the popup's error message, and hide the normal UI.
*/
function reportExecuteScriptError(error) {
   document.querySelector("#popup-content").classList.add("hidden");
   console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * Loads data from local storage at the start of the script
 */
function loadExistingSkills(currentURL){
   console.log('Loading data');
   browser.storage.local.get('skills')
   .then((skillsLoaded) => {
      console.log('Got folowwing data from storage:');
      console.log(skillsLoaded);
      skillsArray = skillsLoaded.skills;
      for (var i = 0; i < skillsArray.length; i++){
         //TODO comparing is incorrect, probably, currentURL is undefined
         console.log('skillsArray[i].uri: ' + skillsArray[i].uri + ', currentURL:' + currentURL);
         if (skillsArray[i].uri == currentURL)
            addSkillToPopup(skillsArray[i].skill);
      }
   }).catch(() => {
      console.log('No saved array found');
      skillsArray = new Array();
   });
}

/**
 * Display skill on popup * 
 * @param {string} skill 
 */
function addSkillToPopup(skill){
   let curSkillContainer = document.getElementById('current-page-skills');
   let newSkill = document.createElement('li');             
   newSkill.innerText = skill;
   curSkillContainer.append(newSkill);
}

browser.tabs.executeScript({file: "/content_scripts/find_skills.js"})
.then(myfunc).catch(reportExecuteScriptError);

//Get active tab url, to show only skills from this url
browser.tabs.query({active: true, currentWindow: true})
.then(tabs => {
   let tabURL = tabs[0].url;
   loadExistingSkills(tabURL);

}).catch(reportExecuteScriptError);

