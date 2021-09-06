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
        const beforeUnloadListener = (event) => {
            event.preventDefault();
            return event.returnValue = "Are you sure you want to exit?";
        };

        window.hasRun = true;
        console.log('My content script from windows, built using webext');
        var currentPageSkills = {}
        currentPageSkills.skillsArray = [];
        currentPageSkills.isSaved = true;
        currentPageSkills.jobTitle = '';

        browser.runtime.onMessage.addListener((message) => {
            if (message.command === "getSkill") {
                //Popup opened. Return highlighted skill to popup script.
                console.log('"getSkill" message recieved');
                let exactText = window.getSelection().toString();
                let skill = {
                    skillName: exactText,
                    uri: document.documentURI,
                    date: Date(),
                    jobTitle: currentPageSkills.jobTitle
                }
                return Promise.resolve({ skill });
            }
            else if (message.command === "tempSaveSkill"){
                //Add skills button pressed, or skills received from storage.
                //Skill should be added to temp array.

                //show warning when closing page
                addEventListener("beforeunload", beforeUnloadListener, {capture: true}); 

                console.log('"tempSaveSkill" message recieved');
                let exactText = window.getSelection().toString();
                let skill = {
                    skillName: message.skillName,
                    uri: message.uri,
                    date: message.date,
                    jobTitle: message.jobTitle
                }
                currentPageSkills.skillsArray.push(skill);
                currentPageSkills.isSaved = false;
                return Promise.resolve({ skill }); 
            }
            else if (message.command === "buttonSave") {
                //don't show warning when closing page
                removeEventListener("beforeunload", beforeUnloadListener, {capture: true});
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
            else if (message.command === "saveJobTitle") {
                console.log('"saveJobTitle" command recieved');
                currentPageSkills.isSaved = false;
                currentPageSkills.jobTitle = message.jobTitle;
            }
        });
    } catch (e) {
        console.log('Caught error in content script');
        console.log(e);
    }
    //display warning if leaving page without saving added skills
    
      //addEventListener("beforeunload", beforeUnloadListener, {capture: true});
    /*
    if (!currentPageSkills.isSaved){
        addEventListener("beforeunload", beforeUnloadListener, {capture: true});
    }
    else{
        removeEventListener("beforeunload", beforeUnloadListener, {capture: true});
    }
    */
})();