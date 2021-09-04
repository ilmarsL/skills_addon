(function () {
    /**
    * Check and set a global guard variable.
    * If this content script is injected into the same page again,
    * it will do nothing next time.
    */
    try {
        if (window.hasRun) {
            console.log('has run detected!');
            return;
        }
        window.hasRun = true;
        console.log('My content script from windows, built using webext');
        var currentPageSkills = {}
        currentPageSkills.skillsArray = [];
        currentPageSkills.isSaved = true;

        browser.runtime.onMessage.addListener((message) => {
            if (message.command === "getSkill") {
                //Add-skill button pressed
                console.log('"getSkill" message recieved');
                let exactText = window.getSelection().toString();
                let skill = {
                    skillName: exactText,
                    uri: document.documentURI,
                    date: Date()
                }
                return Promise.resolve({ skill });
            }
            else if (message.command === "tempSaveSkill"){
                //Add skills button pressed, skill should be added to temp array
                console.log('"tempSaveSkill" message recieved');
                let exactText = window.getSelection().toString();
                let skill = {
                    skillName: message.skillName,
                    uri: message.uri,
                    date: message.date
                }
                currentPageSkills.skillsArray.push(skill);
                currentPageSkills.isSaved = false;
                return Promise.resolve({ skill }); 
            }
            else if (message.command === "buttonSave") {
                //TODO Check if this still needed
                //"Save" button pressed 
                console.log('"buttonSave" message recieved');
                console.log('currentPageSkills now is:');
                console.log(currentPageSkills);
                currentPageSkills.isSaved = true;
            }
            else if (message.command === "getCurrentSkills") {
                console.log('Returning current skills to popup: ');
                console.log(currentPageSkills);
                return Promise.resolve({ currentPageSkills });
            }
        });
    } catch (e) {
        console.log('Caught error in content script');
        console.log(e);
    }
})();