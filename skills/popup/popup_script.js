var tempSkillsArray = new Array();
var isSaved = true;

/**
 *  Is executed every time after popup is opened and content script runs. 
 */
function myfunc() {
    browser.tabs.query({ active: true, currentWindow: true })
        .then(getCurrentSkills)//get skills from content script
        .then(loadExistingSkills)//get skills from storage
        .catch((e) => { console.log(e) }); //TODO check if this works.

    function buttonPress(tabs) {
        browser.tabs.sendMessage(tabs[0].id, {
            command: "getSkill"
        }).then(response => {
            //handle 'Add Skill' button press response
            addSkillToPopup(response.skill.skillName)
            isSaved = false;
            updateSaveStatus();
            let newStoredSkill = {
                'skill': response.skill.skillName.trim(),
                'uri': response.skill.uri,
                'date': response.skill.date
            }
            tempSkillsArray.push(newStoredSkill);
        });
    }

    function buttonSavePress(tabs) {
        //TODO emtpy array got sent to localstorage
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

    //Add handling for cusotm skils button
    function addCustomSkill(tabs) {
        let customSkill = document.getElementById('skills-text').value;
        currentURL = tabs[0].url;
        addSkillToPopup(customSkill);
        isSaved = false;
        updateSaveStatus();
        let newStoredSkill = {
            'skill': customSkill.trim(),
            'uri': tabs[0].url,
            'date': Date()
        }
        tempSkillsArray.push(newStoredSkill);
    }

    function saveSuccess(tabs) {
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
        if (e.target.classList.contains("skills-button")) {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(buttonPress)
                .catch(reportError);
        }
        else if (e.target.classList.contains("skills-save-button")) {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(buttonSavePress)
                .catch(reportError);
        }
        else if (e.target.id === "stats-button") {
            //Add handler for stats page
            console.log('stats button pressed');
            let createData = {
                url: "../stats_page/stats.html",
            };
            let creating = browser.tabs.create(createData);
        }
        else if (e.target.id === 'add-custom-skill') {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(addCustomSkill)
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
function loadExistingSkills(tabs) {
    currentURL = tabs[0].url;
    console.log('Loading data from storage');
    console.log('currentURL: ' + currentURL);
    browser.storage.local.get('skills')
        .then((skillsLoaded) => {
            console.log('Got folowwing data from storage:');
            console.log(skillsLoaded);
            if (skillsLoaded.skills === undefined)
                return;
            tempSkillsArray = tempSkillsArray.concat(skillsLoaded.skills);
            console.log('tempSkillsArray after skillsLoaded was added to it:  ');
            console.log(tempSkillsArray);

            //This should display previously saved skills on current page, but not working at the moment 
            for (var i = 0; i < skillsLoaded.skills.length; i++) {
                console.log('skillsArray[i].uri: ' + skillsLoaded.skills[i].uri + ', currentURL:' + currentURL);
                if (skillsLoaded.skills[i].uri == currentURL)
                    addSkillToPopup(skillsLoaded.skills[i].skill);
            }

        }).catch((e) => {
            console.log('No saved array found' + e);
            tempSkillsArray = new Array();
        });
}

/**
 * Display skill on popup * 
 * @param {string} skill 
 */
function addSkillToPopup(skill) {
    let curSkillContainer = document.getElementById('current-page-skills');
    let newSkill = document.createElement('li');
    newSkill.innerText = skill;
    curSkillContainer.append(newSkill);
}

/**
 * Is executed every time popup is opened and content script runs.
 * Update skills visible on popup using skills in contentscript.
 * Also sets isSaved state.
 */
function getCurrentSkills(tabs) {
    try {
        browser.tabs.sendMessage(tabs[0].id, {
            command: "getCurrentSkills"
        }).then(response => {
            for (var i = 0; i < response.currentPageSkills.skillsArray.length; i++) {
                addSkillToPopup(response.currentPageSkills.skillsArray[i].skillName);
                //Add to tempSkillsArray but not localstorage, it gets saved to storage on "Save" button press;
                let newStoredSkill = {
                    'skill': response.currentPageSkills.skillsArray[i].skillName,
                    'uri': response.currentPageSkills.skillsArray[i].uri,
                    'date': response.currentPageSkills.skillsArray[i].date
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
        return (tabs); //pass further down the chain
    }
    catch (e) {
        console.log('Error getting current skills from content script ' + e);
    }
}

browser.tabs.executeScript({ file: "/content_scripts/content_script.js" })
    .then(myfunc).catch(reportExecuteScriptError);

//Get active tab url, to show only skills from this url
/*
browser.tabs.query({active: true, currentWindow: true})
.then(tabs => {
    let tabURL = tabs[0].url;
    loadExistingSkills(tabURL);

}).catch(reportExecuteScriptError);
*/

function updateSaveStatus() {
    if (isSaved) {
        document.getElementById('save-status').innerText = '';
    }
    else {
        document.getElementById('save-status').innerText = '*not  saved';
    }
}



