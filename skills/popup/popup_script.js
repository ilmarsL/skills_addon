var tempSkillsArray = new Array(); //array conatining all saved skills, copy of what i stored in local storage.
var isSaved = true;
var highlightedSkill = new Object();
var currentJobTitle = '';
var currentURL = '';

/**
 *  Is executed every time after popup is opened. 
 */
function myfunc() {
    //clear contents of skill list to prevent duplicates;
    const currentPageSkills = document.getElementById("current-page-skills");
    currentPageSkills.innerHTML = '';

    browser.tabs.query({ active: true, currentWindow: true })
        .then(getSkillsFromContentScript)//get skills from content script
        .then(loadSkillsFromStorage)//get skills from storage
        .then(getSkill)//get highlighted skill from context script. 
        .catch((e) => { console.log(e) }); //TODO check if this works.

    //Get highlighted skill from content script. Store its parameters in 'highlightedSkill' and name in input field
    function getSkill(tabs) {
        console.log('getSkill() Started');       
        browser.tabs.sendMessage(tabs[0].id, {
            command: "getSkill"
        }).then(response => {
            document.getElementById('skills-text').value = response.skill.skillName.trim();
            highlightedSkill.uri = response.skill.uri;
            highlightedSkill.date = response.skill.date;
            currentURL = response.skill.uri;
        });       
    }

    
    /**
     * Handle 'Add Skill' button press.
     * Take skill name from input field and the rest from the 'highlightedSkill' variable.
     * Also send message to content script to store skill in temp array
     */
    function addSkill(){
        browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            browser.tabs.sendMessage(tabs[0].id, {
                command: "tempSaveSkill",
                skillName: document.getElementById('skills-text').value.trim(),
                uri: highlightedSkill.uri,
                date: highlightedSkill.date,
                jobTitle: document.getElementById('job-title').value.trim()
            }).then(response => {
                addSkillToPopup(response.skill.skillName, response.skill.jobTitle);
                isSaved = false;
                updateSaveStatus();
                let newStoredSkill = {
                    'skill': document.getElementById('skills-text').value.trim(),
                    'uri': highlightedSkill.uri,
                    'date': highlightedSkill.date,
                    'jobTitle': document.getElementById('job-title').value.trim()
                }
                tempSkillsArray.push(newStoredSkill);    
            });
        });       
    }

    function buttonSavePress(tabs) {
        //If there are skills that were added before job titile, set their job title
        for (var i = 0; i < tempSkillsArray.length; i++){
            console.log('Save button pressed, currentURL is: ' + currentURL);
            console.log('tempSkillsArray[i].uri is: ' + tempSkillsArray[i].uri);
            if(tempSkillsArray[i].uri === currentURL){
                console.log('Setting jobTtitle to: ' + currentJobTitle);
                tempSkillsArray[i].jobTitle = currentJobTitle;
            }
        }
        //overwrites the whole array
        console.log('Save button pressed, tempSkillsArray :');
        console.log(tempSkillsArray);
        browser.storage.local.set({ 'skills': tempSkillsArray })
            .then(() => {
                browser.tabs.query({ active: true, currentWindow: true })
                    .then(saveSuccess)
                    .catch(reportError);
            });
    }

    function saveSuccess(tabs) {
        console.log('saveSuccess(tabs) called');
        isSaved = true;
        updateSaveStatus();
        browser.tabs.sendMessage(tabs[0].id, {
            command: "buttonSave"
        });
    }    

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
        console.error(`Error happened: : ${error}`);
    }

    document.addEventListener("click", (e) => {
        //listeners for popup buttons
        if (e.target.id === 'add-skill-button') {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(addSkill)
                .catch(reportError);
        }
        else if (e.target.id === 'save-skills-button') {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(buttonSavePress)
                .catch(reportError);
        }
        else if (e.target.id === 'stats-button') {
            //Add handler for stats page
            console.log('stats button pressed');
            let createData = {
                url: "../stats_page/stats.html",
            };
            let creating = browser.tabs.create(createData);
        }
    });

    //change event for job title
    jobTtitleInput = document.getElementById('job-title');
    jobTtitleInput.addEventListener("change", (e) => {
        currentJobTitle = document.getElementById('job-title').value;
        isSaved = false;
        updateSaveStatus();
        //save entered value in content script
        browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            browser.tabs.sendMessage(tabs[0].id, {
                command: 'saveJobTitle',
                jobTitle: document.getElementById('job-title').value
            });
        });
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
 * Is executed every time popup is opened and content script runs.
 * Update skills visible on popup using skills in contentscript.
 * Also sets isSaved state.
 */
async function getSkillsFromContentScript(tabs){
    console.log('getSkillsFromContentScript() started');
    try {
        await browser.tabs.sendMessage(tabs[0].id, {
            command: "getCurrentSkills"
        }).then(response => {
            for (var i = 0; i < response.currentPageSkills.skillsArray.length; i++) {
                currentJobTitle = response.currentPageSkills.skillsArray[i].jobTitle;
                addSkillToPopup(response.currentPageSkills.skillsArray[i].skillName, response.currentPageSkills.jobTitle);
                //Add to tempSkillsArray but not localstorage, it gets saved to storage on "Save" button press;
                let newStoredSkill = {
                    'skill': response.currentPageSkills.skillsArray[i].skillName,
                    'uri': response.currentPageSkills.skillsArray[i].uri,
                    'date': response.currentPageSkills.skillsArray[i].date,
                    'jobTitle': response.currentPageSkills.skillsArray[i].jobTitle
                }
                console.log('Adding skill to temp array: ');
                console.log(newStoredSkill);
                tempSkillsArray.push(newStoredSkill);
            }
            isSaved = response.currentPageSkills.isSaved;
            updateSaveStatus();
        });
        return tabs;
    }
    catch (e) {
        console.log('Error getting current skills from content script ' + e);
    }
}

/**
 * Loads data from local storage at the start of the script (Opening popup)
 */
async function loadSkillsFromStorage(tabs) {
    console.log('loadSkillsFromStorage() Started; ');
    //check if tempSkillsArray already has skill. 
    //If it does, skills for current page are already lodaded into content script. No need to load from storage again
    if (tempSkillsArray.length > 0){
        return tabs;
    }
    currentURL = tabs[0].url;
    await browser.storage.local.get('skills')
        .then((skillsLoaded) => {
            console.log('Got folowwing data from storage:');
            console.log(skillsLoaded);
            if (skillsLoaded.skills === undefined){
                //no data from storage
                //TODO figure out what to do here
                console.log('Return from loadSkillsFromStorage 1');
                return 
            }
            tempSkillsArray = tempSkillsArray.concat(skillsLoaded.skills);
            for (var i = 0; i < skillsLoaded.skills.length; i++) {
                console.log('skillsArray[i].uri: ' + skillsLoaded.skills[i].uri + ', currentURL:' + currentURL);
                if (skillsLoaded.skills[i].uri == currentURL){
                    //found skill with matching url, add to popup and to conent scripts temparray
                    console.log('URL match, adding skill to popup and sending to content script');
                    addSkillToPopup(skillsLoaded.skills[i].skill, skillsLoaded.skills[i].jobTitle);
                    browser.tabs.sendMessage(tabs[0].id, {
                        command: "tempSaveSkill",
                        skillName: skillsLoaded.skills[i].skill,
                        uri: skillsLoaded.skills[i].uri,
                        date: skillsLoaded.skills[i].date,
                        jobTitle: skillsLoaded.skills[i].jobTitle
                    }).then();
                }
            }
        }).catch((e) => {
            console.log('No saved array found' + e);
            tempSkillsArray = new Array();
        });
        return tabs;
}

/**
 * Display skills and jobTtitle on popup skills list
 * @param {string} skill 
 */
function addSkillToPopup(skill, jobTitle) {
    console.log('addSkillToPopup() called');
    console.log('jobTitle: ' + jobTitle);
    let curSkillContainer = document.getElementById('current-page-skills');
    let newSkill = document.createElement('li');
    newSkill.innerText = skill;
    curSkillContainer.append(newSkill);

    //set job title
    document.getElementById('job-title').value = "";
    document.getElementById('job-title').value = jobTitle; 
}



/**
 * Gets highlighted skill from content script and insert it into the input field
 */
function getHighlightedSkill(tabs){
    try {
        browser.tabs.sendMessage(tabs[0].id, {
            command: "getCurrentSkills"
        }).then(response => {

        });
    }
    catch(e) {
        console.log('Error getting current skills from content script ' + e);
    }
}

browser.tabs.executeScript({ file: "/content_scripts/content_script.js" })
    .then(myfunc).catch(reportExecuteScriptError);

function updateSaveStatus() {
    if (isSaved) {
        document.getElementById('save-status').innerText = '';
    }
    else {
        document.getElementById('save-status').innerText = '*not  saved';
    }
}



