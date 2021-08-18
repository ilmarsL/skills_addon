var tempSkillsArray = new Array();
var isSaved = true;

/**
 * Is executed every time popup is opened and content script runs.
 * Update skills visible on popup using skills in contentscript.
 * Also sets isSaved state.
 */
function getCurrentSkills(tabs){
   try{
      browser.tabs.sendMessage(tabs[0].id, {
         command: "getCurrentSkills"
      }).then(response =>{
         for (var i = 0; i < response.currentPageSkills.skillsArray.length; i++){
            addSkillToPopup(response.currentPageSkills.skillsArray[i].skillName);
            //Add to tempSkillsArray but not localstorage, it gets saved to storage on "Save" button press;
            let newStoredSkill = {
               'skill': response.currentPageSkills.skillsArray[i].skillName,
               'uri' : response.currentPageSkills.skillsArray[i].uri,
               'date' : response.currentPageSkills.skillsArray[i].date
            }
            console.log('Adding skill to temp array: ');
            console.log(newStoredSkill);
            tempSkillsArray.push(newStoredSkill);  
         }
         console.log('tempSkillsArray after adding skills: ');
         console.log(tempSkillsArray);
         isSaved = response.currentPageSkills.isSaved;
         updateSaveStatus();     
      });
   }
   catch(e){
      console.log('Error getting current skills from content script ' + e);
   }
}

/**
 * Is executed every time after popup is opened and content script runs. 
 */
function myfunc(){
   browser.tabs.query({active: true, currentWindow: true})
   .then(getCurrentSkills)//get skills from content script
   .then(loadExistingSkills)//get skills from storage
   .catch((e) =>{console.log(e)}); //TODO check if this works.

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
      function saveSuccess(tabs) {
         console.log('Sending "saved" message to content script');
         browser.tabs.sendMessage(tabs[0].id, {
            command: "buttonSave"
            });
      }

      function buttonPress(tabs){         
         browser.tabs.sendMessage(tabs[0].id, {
            command: "button"
            }).then(response =>{
               //handle 'Add Skill' button press response
               addSkillToPopup(response.skill.skillName)
               isSaved = false;
               updateSaveStatus();
               let newStoredSkill = {
                  'skill': response.skill.skillName,
                  'uri' : response.skill.uri,
                  'date' : response.skill.date
               }
               tempSkillsArray.push(newStoredSkill);                          
            });
      }

      function buttonSavePress(tabs){
         //TODO emtpy array got sent to localstorage
         isSaved = true;
         updateSaveStatus();
         //add data from popup to tempSkillsArray? But it should be loaded on open;
         
         //overwrites the whole array
         console.log('Saving following skills to local storage:');
         console.log(tempSkillsArray);
         browser.storage.local.set({'skills' : tempSkillsArray})
         .then(() => {
            browser.tabs.query({active: true, currentWindow: true})
            .then(saveSuccess)
            .catch(reportError);
         });        
      }

      /**
       * Just log the error to the console.
       */
      function reportError(error) {
         console.error(`Error happened: : ${error}`);
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
   console.error(`Failed to execute content script: ${error.message}`);
   myfunc();
}

/**
 * Loads data from local storage at the start of the script (Opening popup)
 */
function loadExistingSkills(currentURL){
   console.log('Loading data');
   browser.storage.local.get('skills')
   .then((skillsLoaded) => {
      console.log('Got folowwing data from storage:');
      console.log(skillsLoaded);
      tempSkillsArray.concat(skillsLoaded.skills);
      /*
      //This should display previously saved skills on current page, but not working at the moment 
      for (var i = 0; i < tempSkillsArray.length; i++){
         console.log('skillsArray[i].uri: ' + tempSkillsArray[i].uri + ', currentURL:' + currentURL);
         if (tempSkillsArray[i].uri == currentURL)
            addSkillToPopup(tempSkillsArray[i].skill);
      }
      */
   }).catch(() => {
      console.log('No saved array found');
      tempSkillsArray = new Array();
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

browser.tabs.executeScript({file: "/content_scripts/content_script.js"})
.then(myfunc).catch(reportExecuteScriptError);

//Get active tab url, to show only skills from this url
/*
browser.tabs.query({active: true, currentWindow: true})
.then(tabs => {
   let tabURL = tabs[0].url;
   loadExistingSkills(tabURL);

}).catch(reportExecuteScriptError);
*/

function updateSaveStatus(){
   if (isSaved) {
      document.getElementById('save-status').innerText = '';
   }
   else{
      document.getElementById('save-status').innerText = '*not  saved';
   }
}
